const mongoose = require('mongoose');
const Doctor = require('./Doctor');

const reviewSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
  rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
  comment: { type: String, maxlength: [500, 'Review cannot exceed 500 characters'] },
  isVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

reviewSchema.statics.calcAverageRating = async function (doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    { $group: { _id: '$doctor', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }
};

// Mongoose 9: post hooks don't need next
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.doctor);
});

// Mongoose 9: pre with async, no next
reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.model.findOne(this.getFilter());
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) await this.r.constructor.calcAverageRating(this.r.doctor);
});

module.exports = mongoose.model('Review', reviewSchema);
