const User = require('../models/User');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const sendToken = require('../utils/sendToken');
const { generateSlotsForDays } = require('../utils/slotGenerator');

// ─── PATIENT REGISTER ──────────────────────────────────────────────────────────
exports.registerPatient = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, gender, dateOfBirth } = req.body;

  const user = await User.create({ name, email, password, phone, gender, dateOfBirth, role: 'patient' });
  sendToken(user, 201, res, 'Registration successful! Welcome aboard.');
});

// ─── DOCTOR REGISTER ───────────────────────────────────────────────────────────
exports.registerDoctor = asyncHandler(async (req, res, next) => {
  const {
    name, email, password, phone,
    specialization, qualifications, experience, licenseNumber, about, languages,
    clinicName, address,
    consultationFee, slotDurationMinutes, maxPatientsPerSlot,
    workingHours,
  } = req.body;

  const doctor = await Doctor.create({
    name, email, password, phone,
    specialization: Array.isArray(specialization) ? specialization : [specialization],
    qualifications, experience, licenseNumber, about, languages,
    clinicName, address,
    consultationFee, slotDurationMinutes, maxPatientsPerSlot,
    workingHours: workingHours || defaultWorkingHours(),
    isVerified: false, // Requires admin approval
  });

  // Generate slots for next 7 days after registration
  try { await generateSlotsForDays(doctor, 7); } catch (e) { /* non-fatal */ }

  res.status(201).json({
    success: true,
    message: 'Doctor registered successfully! Your profile is pending verification by our admin team. You will be notified once approved.',
    doctor: sanitizeDoctor(doctor),
  });
});

// ─── LOGIN (both patients and doctors) ────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  let user;
  if (role === 'doctor') {
    user = await Doctor.findOne({ email }).select('+password');
  } else {
    user = await User.findOne({ email }).select('+password');
  }

  if (!user) return next(new AppError('Invalid credentials.', 401));
  if (!user.isActive) return next(new AppError('Your account has been deactivated. Contact support.', 403));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError('Invalid credentials.', 401));

  // Doctors must be verified before they can log in
  if (role === 'doctor' && !user.isVerified) {
    return next(new AppError('Your doctor profile is pending admin verification. Please wait for approval.', 403));
  }

  sendToken(user, 200, res, `Welcome back, ${user.name}!`);
});

// ─── LOGOUT ────────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET CURRENT USER ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// ─── UPDATE PASSWORD ───────────────────────────────────────────────────────────
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  let user;
  if (req.user.role === 'doctor') {
    user = await Doctor.findById(req.user._id).select('+password');
  } else {
    user = await User.findById(req.user._id).select('+password');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return next(new AppError('Current password is incorrect.', 401));

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, 'Password updated successfully.');
});

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const sanitizeDoctor = (doc) => {
  const obj = doc.toObject();
  delete obj.password;
  return obj;
};

const defaultWorkingHours = () => [
  { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00' },
  { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
  { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00' },
  { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00' },
  { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00' },
  { day: 'saturday', isWorking: false, startTime: '09:00', endTime: '13:00' },
  { day: 'sunday', isWorking: false, startTime: '09:00', endTime: '13:00' },
];
