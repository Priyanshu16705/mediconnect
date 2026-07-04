const { format } = require('date-fns');
const Slot = require('../models/Slot');

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const getSession = (timeStr) => {
  const mins = timeToMinutes(timeStr);
  if (mins < 12 * 60) return 'morning';
  if (mins < 17 * 60) return 'afternoon';
  if (mins < 20 * 60) return 'evening';
  return 'night';
};

const generateSlotsForDate = async (doctor, dateStr) => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayName = format(dateObj, 'EEEE').toLowerCase();

  const dayConfig = doctor.workingHours.find((wh) => wh.day === dayName);
  if (!dayConfig || !dayConfig.isWorking) return [];

  const isBlocked = doctor.blockedDates && doctor.blockedDates.some((b) => b.date === dateStr);
  if (isBlocked) return [];

  const slotDuration = doctor.slotDurationMinutes || 20;
  const maxPatientsPerSlot = doctor.maxPatientsPerSlot || 1;
  const startMins = timeToMinutes(dayConfig.startTime || '09:00');
  const endMins = timeToMinutes(dayConfig.endTime || '17:00');
  const breakStartMins = dayConfig.breakStart ? timeToMinutes(dayConfig.breakStart) : null;
  const breakEndMins = dayConfig.breakEnd ? timeToMinutes(dayConfig.breakEnd) : null;

  const slotsToCreate = [];
  let current = startMins;

  while (current + slotDuration <= endMins) {
    const slotEnd = current + slotDuration;

    // Skip slots overlapping with break
    if (breakStartMins && breakEndMins) {
      if (current < breakEndMins && slotEnd > breakStartMins) {
        current = breakEndMins;
        continue;
      }
    }

    slotsToCreate.push({
      doctor: doctor._id,
      date: dateStr,
      startTime: minutesToTime(current),
      endTime: minutesToTime(slotEnd),
      maxPatients: maxPatientsPerSlot,
      session: getSession(minutesToTime(current)),
      isOpen: true,
      bookedCount: 0,
    });

    current = slotEnd;
  }

  if (slotsToCreate.length === 0) return [];

  try {
    const inserted = await Slot.insertMany(slotsToCreate, { ordered: false });
    return inserted;
  } catch (err) {
    // Mongoose 9: duplicate key errors come back as BulkWriteError
    if (err.code === 11000 || err.name === 'MongoBulkWriteError' || (err.writeErrors && err.writeErrors.length)) {
      return err.insertedDocs || [];
    }
    throw err;
  }
};

const generateSlotsForDays = async (doctor, days = 7) => {
  const results = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = format(d, 'yyyy-MM-dd');
    try {
      const slots = await generateSlotsForDate(doctor, dateStr);
      results.push(...slots);
    } catch (e) {
      // Non-fatal: continue to next date
      console.error(`Slot gen error for ${dateStr}:`, e.message);
    }
  }
  return results;
};

module.exports = { generateSlotsForDate, generateSlotsForDays, timeToMinutes, minutesToTime };
