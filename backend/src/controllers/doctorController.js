const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { generateSlotsForDate, generateSlotsForDays } = require('../utils/slotGenerator');
const { format, addDays } = require('date-fns');

// ─── PUBLIC: Search / list doctors ────────────────────────────────────────────
exports.getDoctors = asyncHandler(async (req, res) => {
  const {
    city, specialization, name, minFee, maxFee, minExp, minRating,
    page = 1, limit = 12, sort = '-rating',
  } = req.query;

  const query = { isVerified: true, isActive: true };

  if (city) query['address.city'] = { $regex: new RegExp(city, 'i') };
  if (specialization) query.specialization = { $elemMatch: { $regex: new RegExp(specialization, 'i') } };
  if (name) query.name = { $regex: new RegExp(name, 'i') };
  if (minFee || maxFee) {
    query.consultationFee = {};
    if (minFee) query.consultationFee.$gte = Number(minFee);
    if (maxFee) query.consultationFee.$lte = Number(maxFee);
  }
  if (minExp) query.experience = { $gte: Number(minExp) };
  if (minRating) query.rating = { $gte: Number(minRating) };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Doctor.countDocuments(query);

  const doctors = await Doctor.find(query)
    .select('-password -blockedDates -workingHours')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    doctors,
  });
});

// ─── PUBLIC: Get single doctor profile ────────────────────────────────────────
exports.getDoctorById = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ _id: req.params.id, isVerified: true, isActive: true })
    .select('-password');
  if (!doctor) return next(new AppError('Doctor not found.', 404));

  // Get recent reviews
  const reviews = await Review.find({ doctor: doctor._id })
    .populate('patient', 'name avatar')
    .sort('-createdAt')
    .limit(10);

  res.status(200).json({ success: true, doctor, reviews });
});

// ─── PUBLIC: Get available slots for a doctor on a date ───────────────────────
exports.getDoctorSlots = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  if (!date) return next(new AppError('Date is required (YYYY-MM-DD).', 400));

  const doctor = await Doctor.findById(id);
  if (!doctor || !doctor.isVerified) return next(new AppError('Doctor not found.', 404));

  // Auto-generate slots if they don't exist yet
  await generateSlotsForDate(doctor, date);

  const slots = await Slot.find({ doctor: id, date })
    .select('-__v')
    .sort('startTime');

  res.status(200).json({ success: true, date, slots });
});

// ─── DOCTOR: Update own profile ────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'name', 'phone', 'about', 'languages', 'clinicName',
    'address', 'specialization', 'qualifications', 'experience',
    'consultationFee', 'avatar',
  ];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const doctor = await Doctor.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({ success: true, message: 'Profile updated.', doctor });
});

// ─── DOCTOR: Update slot config + regenerate ──────────────────────────────────
exports.updateSlotConfig = asyncHandler(async (req, res) => {
  const { slotDurationMinutes, maxPatientsPerSlot, workingHours } = req.body;

  const updates = {};
  if (slotDurationMinutes) updates.slotDurationMinutes = slotDurationMinutes;
  if (maxPatientsPerSlot) updates.maxPatientsPerSlot = maxPatientsPerSlot;
  if (workingHours) updates.workingHours = workingHours;

  const doctor = await Doctor.findByIdAndUpdate(req.user._id, updates, { new: true });

  // Delete future unbooked slots and regenerate
  const today = format(new Date(), 'yyyy-MM-dd');
  await Slot.deleteMany({
    doctor: req.user._id,
    date: { $gte: today },
    bookedCount: 0,
  });

  await generateSlotsForDays(doctor, 14);

  res.status(200).json({
    success: true,
    message: 'Slot configuration updated and future slots regenerated.',
  });
});

// ─── DOCTOR: Toggle full day availability ─────────────────────────────────────
exports.toggleDayAvailability = asyncHandler(async (req, res) => {
  const { date, reason, block } = req.body; // block: true = mark unavailable

  const doctor = await Doctor.findById(req.user._id);

  if (block) {
    // Add to blocked dates
    const alreadyBlocked = doctor.blockedDates.some((b) => b.date === date);
    if (!alreadyBlocked) {
      doctor.blockedDates.push({ date, reason: reason || 'Unavailable' });
      await doctor.save();
    }

    // Close all open slots for that day
    await Slot.updateMany(
      { doctor: req.user._id, date, bookedCount: 0 },
      { isOpen: false, closedReason: 'Doctor unavailable' }
    );

    // Cancel all confirmed appointments for that day (should ideally notify patients)
    await Appointment.updateMany(
      { doctor: req.user._id, date, status: 'confirmed' },
      { status: 'cancelled', cancelledBy: 'doctor', cancellationReason: reason || 'Doctor unavailable', cancelledAt: new Date() }
    );
  } else {
    // Remove from blocked dates
    doctor.blockedDates = doctor.blockedDates.filter((b) => b.date !== date);
    await doctor.save();

    // Reopen all closed slots that had no bookings
    await Slot.updateMany(
      { doctor: req.user._id, date, bookedCount: 0 },
      { isOpen: true, closedReason: null }
    );
  }

  res.status(200).json({
    success: true,
    message: block ? `Marked ${date} as unavailable.` : `Marked ${date} as available.`,
  });
});

// ─── DOCTOR: Toggle individual slot open/close ────────────────────────────────
exports.toggleSlot = asyncHandler(async (req, res, next) => {
  const { slotId } = req.params;
  const { isOpen, reason } = req.body;

  const slot = await Slot.findOne({ _id: slotId, doctor: req.user._id });
  if (!slot) return next(new AppError('Slot not found.', 404));

  slot.isOpen = isOpen;
  if (!isOpen) slot.closedReason = reason || 'Closed by doctor';
  else slot.closedReason = null;
  await slot.save();

  res.status(200).json({ success: true, message: `Slot ${isOpen ? 'opened' : 'closed'}.`, slot });
});

// ─── DOCTOR: Dashboard stats ───────────────────────────────────────────────────
exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const [
    todayAppointments,
    pendingCount,
    completedCount,
    totalRevenue,
    todaySlots,
  ] = await Promise.all([
    Appointment.find({ doctor: doctorId, date: today, status: { $in: ['confirmed', 'completed'] } })
      .populate('patient', 'name phone')
      .populate('slot', 'startTime endTime')
      .sort('startTime'),
    Appointment.countDocuments({ doctor: doctorId, status: 'confirmed' }),
    Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
    Appointment.aggregate([
      { $match: { doctor: doctorId, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]),
    Slot.find({ doctor: doctorId, date: today }).sort('startTime'),
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      today: format(new Date(), 'yyyy-MM-dd'),
      todayAppointments,
      todaySlots,
      stats: {
        pendingAppointments: pendingCount,
        completedAppointments: completedCount,
        totalRevenueINR: totalRevenue[0] ? totalRevenue[0].total / 100 : 0,
        rating: req.user.rating,
        totalReviews: req.user.totalReviews,
      },
    },
  });
});

// ─── DOCTOR: Appointment list ─────────────────────────────────────────────────
exports.getDoctorAppointments = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query;

  const query = { doctor: req.user._id };
  if (status) query.status = status;
  if (date) query.date = date;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(query);

  const appointments = await Appointment.find(query)
    .populate('patient', 'name phone avatar')
    .populate('slot', 'startTime endTime')
    .sort('-date -startTime')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, appointments });
});

// ─── DOCTOR: Update appointment (notes, complete, no-show) ────────────────────
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, doctorNotes, prescription, followUpDate } = req.body;

  const appt = await Appointment.findOne({ _id: id, doctor: req.user._id });
  if (!appt) return next(new AppError('Appointment not found.', 404));

  if (status) appt.status = status;
  if (doctorNotes) appt.doctorNotes = doctorNotes;
  if (prescription) appt.prescription = prescription;
  if (followUpDate) appt.followUpDate = followUpDate;

  await appt.save();

  // If completed, increment doctor total patients
  if (status === 'completed') {
    await Doctor.findByIdAndUpdate(req.user._id, { $inc: { totalPatients: 1 } });
  }

  res.status(200).json({ success: true, message: 'Appointment updated.', appointment: appt });
});

// ─── PUBLIC: Get all cities with doctors ─────────────────────────────────────
exports.getCities = asyncHandler(async (req, res) => {
  const cities = await Doctor.distinct('address.city', { isVerified: true, isActive: true });
  res.status(200).json({ success: true, cities: cities.sort() });
});

// ─── PUBLIC: Get all specializations ─────────────────────────────────────────
exports.getSpecializations = asyncHandler(async (req, res) => {
  const specs = await Doctor.aggregate([
    { $match: { isVerified: true } },
    { $unwind: '$specialization' },
    { $group: { _id: '$specialization' } },
    { $sort: { _id: 1 } },
  ]);
  res.status(200).json({ success: true, specializations: specs.map((s) => s._id) });
});
