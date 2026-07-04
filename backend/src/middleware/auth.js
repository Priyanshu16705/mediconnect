const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');

// Verify JWT and attach user to req
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in either User or Doctor collection based on role
    let currentUser;
    if (decoded.role === 'doctor') {
      currentUser = await Doctor.findById(decoded.id).select('+password');
    } else {
      currentUser = await User.findById(decoded.id).select('+password');
    }

    if (!currentUser || !currentUser.isActive) {
      return next(new AppError('User no longer exists or is deactivated.', 401));
    }

    req.user = currentUser;
    req.user.role = decoded.role;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    next(err);
  }
};

// Role-based access guard
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this route.`, 403)
      );
    }
    next();
  };
};

// Optional auth — doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'doctor') {
      req.user = await Doctor.findById(decoded.id);
    } else {
      req.user = await User.findById(decoded.id);
    }
    if (req.user) req.user.role = decoded.role;
    next();
  } catch {
    next();
  }
};
