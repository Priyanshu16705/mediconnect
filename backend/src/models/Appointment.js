const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  patientDetails: { name: String, phone: String, age: Number, gender: String, symptoms: String },
  status: {
    type: String,
    enum: ['pending_payment','confirmed','completed','cancelled','no_show','refunded'],
    default: 'pending_payment',
    index: true,
  },
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['patient','doctor','admin','system'] },
  cancelledAt: Date,
  doctorNotes: String,
  prescription: String,
  followUpDate: Date,
  payment: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending','paid','failed','refunded','partially_refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date,
    refundReason: String,
  },
  reminderSent: { type: Boolean, default: false },
  followUpSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Mongoose 9 compatible
appointmentSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ 'payment.razorpayOrderId': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
