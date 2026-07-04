const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { format, subDays, startOfMonth, endOfMonth } = require('date-fns');

// ─── GET DASHBOARD STATS ──────────────────────────────────────────────────────
exports.getAdminStats = asyncHandler(async (req, res) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const [
    totalDoctors,
    pendingDoctors,
    totalPatients,
    totalAppointments,
    todayAppointments,
    monthAppointments,
    revenueData,
    monthRevenue,
    recentAppointments,
  ] = await Promise.all([
    Doctor.countDocuments({ isVerified: true }),
    Doctor.countDocuments({ isVerified: false, isActive: true }),
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: today }),
    Appointment.countDocuments({ date: { $gte: monthStart, $lte: monthEnd } }),
    Appointment.aggregate([
      { $match: { 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]),
    Appointment.aggregate([
      { $match: { 'payment.status': 'paid', date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]),
    Appointment.find()
      .sort('-createdAt')
      .limit(10)
      .populate('patient', 'name')
      .populate('doctor', 'name specialization'),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      doctors: { total: totalDoctors, pending: pendingDoctors },
      patients: { total: totalPatients },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        thisMonth: monthAppointments,
      },
      revenue: {
        totalINR: revenueData[0] ? revenueData[0].total / 100 : 0,
        thisMonthINR: monthRevenue[0] ? monthRevenue[0].total / 100 : 0,
      },
      recentAppointments,
    },
  });
});

// ─── DOCTOR VERIFICATION ──────────────────────────────────────────────────────
exports.getPendingDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ isVerified: false, isActive: true })
    .select('-password')
    .sort('-createdAt');
  res.status(200).json({ success: true, count: doctors.length, doctors });
});

exports.verifyDoctor = asyncHandler(async (req, res, next) => {
  const { approve, rejectionReason } = req.body;
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) return next(new AppError('Doctor not found.', 404));

  if (approve) {
    doctor.isVerified = true;
    doctor.verifiedAt = new Date();
    doctor.verifiedBy = req.user._id;
    doctor.rejectionReason = undefined;
  } else {
    doctor.isActive = false;
    doctor.rejectionReason = rejectionReason || 'Application rejected by admin.';
  }

  await doctor.save();

  res.status(200).json({
    success: true,
    message: approve
      ? `Dr. ${doctor.name} has been verified and can now log in.`
      : `Dr. ${doctor.name}'s application has been rejected.`,
  });
});

// ─── ALL DOCTORS LIST ─────────────────────────────────────────────────────────
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const { verified, page = 1, limit = 20 } = req.query;
  const query = {};
  if (verified !== undefined) query.isVerified = verified === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Doctor.countDocuments(query);
  const doctors = await Doctor.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, doctors });
});

// ─── TOGGLE DOCTOR ACTIVE ─────────────────────────────────────────────────────
exports.toggleDoctorActive = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new AppError('Doctor not found.', 404));

  doctor.isActive = !doctor.isActive;
  await doctor.save();

  res.status(200).json({
    success: true,
    message: `Dr. ${doctor.name} is now ${doctor.isActive ? 'active' : 'deactivated'}.`,
  });
});

// ─── ALL PATIENTS LIST ────────────────────────────────────────────────────────
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments({ role: 'patient' });
  const patients = await User.find({ role: 'patient' })
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));
  res.status(200).json({ success: true, total, patients });
});

// ─── ALL APPOINTMENTS ─────────────────────────────────────────────────────────
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { status, date, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (date) query.date = date;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(query);
  const appointments = await Appointment.find(query)
    .populate('patient', 'name email phone')
    .populate('doctor', 'name specialization')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, appointments });
});

// ─── REVENUE ANALYTICS ───────────────────────────────────────────────────────
exports.getRevenueAnalytics = asyncHandler(async (req, res) => {
  // Last 7 days daily revenue
  const last7Days = await Appointment.aggregate([
    {
      $match: {
        'payment.status': 'paid',
        date: { $gte: format(subDays(new Date(), 6), 'yyyy-MM-dd') },
      },
    },
    {
      $group: {
        _id: '$date',
        revenue: { $sum: '$payment.amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top 5 doctors by revenue
  const topDoctors = await Appointment.aggregate([
    { $match: { 'payment.status': 'paid' } },
    { $group: { _id: '$doctor', revenue: { $sum: '$payment.amount' }, count: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
    { $unwind: '$doctor' },
    { $project: { 'doctor.name': 1, 'doctor.specialization': 1, revenue: 1, count: 1 } },
  ]);

  // Specialization breakdown
  const bySpec = await Appointment.aggregate([
    { $match: { 'payment.status': 'paid' } },
    {
      $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'doc' },
    },
    { $unwind: '$doc' },
    { $unwind: '$doc.specialization' },
    {
      $group: {
        _id: '$doc.specialization',
        revenue: { $sum: '$payment.amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      last7Days: last7Days.map((d) => ({ date: d._id, revenueINR: d.revenue / 100, appointments: d.count })),
      topDoctors: topDoctors.map((d) => ({
        name: d.doctor.name,
        specialization: d.doctor.specialization,
        revenueINR: d.revenue / 100,
        appointments: d.count,
      })),
      bySpecialization: bySpec.map((s) => ({
        specialization: s._id,
        revenueINR: s.revenue / 100,
        appointments: s.count,
      })),
    },
  });
});

// ─── DELETE REVIEW ────────────────────────────────────────────────────────────
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));
  res.status(200).json({ success: true, message: 'Review removed.' });
});
