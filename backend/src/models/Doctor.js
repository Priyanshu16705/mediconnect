const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const workingHoursSchema = new mongoose.Schema({
  day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'], required: true },
  isWorking: { type: Boolean, default: true },
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '17:00' },
  breakStart: { type: String, default: '' },
  breakEnd: { type: String, default: '' },
});

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your name'], trim: true },
  email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
  password: { type: String, required: [true, 'Please provide a password'], minlength: [8, 'Password must be at least 8 characters'], select: false },
  role: { type: String, default: 'doctor', immutable: true },
  phone: { type: String, required: [true, 'Phone number is required'], match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'] },
  avatar: { type: String, default: '' },
  specialization: { type: [String], required: [true, 'Specialization is required'] },
  qualifications: [{ degree: { type: String, required: true }, institution: { type: String, required: true }, year: Number }],
  experience: { type: Number, default: 0, min: 0 },
  licenseNumber: { type: String, required: [true, 'Medical license number is required'], unique: true },
  about: { type: String, maxlength: [1000, 'About section max 1000 chars'] },
  languages: [{ type: String }],
  clinicName: String,
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: String,
    coordinates: { lat: Number, lng: Number },
  },
  consultationFee: { type: Number, required: [true, 'Consultation fee is required'], min: [0, 'Fee cannot be negative'] },
  slotDurationMinutes: { type: Number, default: 20, enum: [10, 15, 20, 30, 45, 60] },
  maxPatientsPerSlot: { type: Number, default: 1, min: [1, 'Must allow at least 1 patient per slot'], max: [100, 'Max 100 patients per slot'] },
  workingHours: [workingHoursSchema],
  blockedDates: [{ date: { type: String }, reason: String }],
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  isActive: { type: Boolean, default: true },
  totalPatients: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Mongoose 9 compatible: async pre-save, no next param
doctorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

doctorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

doctorSchema.methods.getSignedJWT = function () {
  return jwt.sign({ id: this._id, role: 'doctor' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

doctorSchema.index({ 'address.city': 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
