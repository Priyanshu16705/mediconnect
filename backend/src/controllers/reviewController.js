const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// ─── Create review (only after completed appointment) ─────────────────────────
exports.createReview = asyncHandler(async (req, res, next) => {
  const { appointmentId, rating, comment } = req.body;

  const appt = await Appointment.findOne({
    _id: appointmentId,
    patient: req.user._id,
    status: 'completed',
  });

  if (!appt) {
    return next(new AppError('No completed appointment found. You can only review after your visit.', 403));
  }

  const existing = await Review.findOne({ appointment: appointmentId });
  if (existing) return next(new AppError('You have already reviewed this appointment.', 400));

  const review = await Review.create({
    patient: req.user._id,
    doctor: appt.doctor,
    appointment: appointmentId,
    rating,
    comment,
  });

  res.status(201).json({ success: true, message: 'Review submitted. Thank you!', review });
});

// ─── Get reviews for a doctor ─────────────────────────────────────────────────
exports.getDoctorReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Review.countDocuments({ doctor: req.params.doctorId });

  const reviews = await Review.find({ doctor: req.params.doctorId })
    .populate('patient', 'name avatar')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, reviews });
});

// ─── Patient update/delete own review ────────────────────────────────────────
exports.updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, patient: req.user._id });
  if (!review) return next(new AppError('Review not found.', 404));

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  res.status(200).json({ success: true, message: 'Review updated.', review });
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, patient: req.user._id });
  if (!review) return next(new AppError('Review not found.', 404));
  res.status(200).json({ success: true, message: 'Review deleted.' });
});
