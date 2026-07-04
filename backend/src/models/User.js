const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your name'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
  password: { type: String, required: [true, 'Please provide a password'], minlength: [8, 'Password must be at least 8 characters'], select: false },
  role: { type: String, enum: ['patient', 'admin'], default: 'patient' },
  phone: { type: String, match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'] },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: { street: String, city: String, state: String, pincode: String },
  avatar: { type: String, default: '' },
  medicalHistory: [{ condition: String, since: Date, notes: String }],
  savedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Mongoose 9 compatible: async pre-save, no next param
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJWT = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

module.exports = mongoose.model('User', userSchema);
