const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { format } = require('date-fns');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── STEP 1: Book slot + create Razorpay order ────────────────────────────────
exports.initiateBooking = asyncHandler(async (req, res, next) => {
  const { doctorId, slotId, date, patientDetails } = req.body;

  if (!doctorId || !slotId || !date || !patientDetails) {
    return next(new AppError('doctorId, slotId, date, and patientDetails are required.', 400));
  }

  // Use MongoDB session for atomic slot booking
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock and fetch slot within transaction
    const slot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        doctor: doctorId,
        date,
        isOpen: true,
        $expr: { $lt: ['$bookedCount', '$maxPatients'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true, session }
    );

    if (!slot) {
      await session.abortTransaction();
      return next(new AppError('This slot is no longer available. Please choose another slot.', 409));
    }

    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor || !doctor.isVerified || !doctor.isActive) {
      await session.abortTransaction();
      return next(new AppError('Doctor not found or unavailable.', 404));
    }

    // Create Razorpay order (amount in paise)
    const amountPaise = doctor.consultationFee * 100;
    const receiptId = `appt_${Date.now()}_${req.user._id.toString().slice(-6)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        doctorName: doctor.name,
        patientName: patientDetails.name || req.user.name,
        date,
        slotTime: `${slot.startTime} - ${slot.endTime}`,
      },
    });

    // Create appointment in pending_payment state
    const appointment = await Appointment.create(
      [
        {
          patient: req.user._id,
          doctor: doctorId,
          slot: slotId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          patientDetails: {
            name: patientDetails.name || req.user.name,
            phone: patientDetails.phone || req.user.phone,
            age: patientDetails.age,
            gender: patientDetails.gender,
            symptoms: patientDetails.symptoms,
          },
          status: 'pending_payment',
          payment: {
            amount: amountPaise,
            currency: 'INR',
            status: 'pending',
            razorpayOrderId: razorpayOrder.id,
          },
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Slot held. Complete payment to confirm appointment.',
      appointment: appointment[0],
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── STEP 2: Verify payment signature + confirm appointment ───────────────────
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, appointmentId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !appointmentId) {
    return next(new AppError('Payment verification data is incomplete.', 400));
  }

  // Verify signature — NEVER trust frontend amount
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    // Payment tampered — rollback slot count
    const appt = await Appointment.findById(appointmentId);
    if (appt) {
      await Slot.findByIdAndUpdate(appt.slot, { $inc: { bookedCount: -1 } });
      appt.status = 'cancelled';
      appt.payment.status = 'failed';
      appt.cancelledBy = 'system';
      appt.cancellationReason = 'Payment signature verification failed';
      await appt.save();
    }
    return next(new AppError('Payment verification failed. Please contact support.', 400));
  }

  // Confirm appointment
  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, patient: req.user._id, 'payment.razorpayOrderId': razorpayOrderId },
    {
      status: 'confirmed',
      'payment.status': 'paid',
      'payment.razorpayPaymentId': razorpayPaymentId,
      'payment.razorpaySignature': razorpaySignature,
      'payment.paidAt': new Date(),
    },
    { new: true }
  )
    .populate('doctor', 'name specialization address clinicName phone')
    .populate('slot', 'startTime endTime');

  if (!appointment) {
    return next(new AppError('Appointment not found or already processed.', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified! Your appointment is confirmed.',
    appointment,
  });
});

// ─── Razorpay Webhook (server-to-server) ──────────────────────────────────────
exports.razorpayWebhook = asyncHandler(async (req, res, next) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured') {
    const orderId = payload.payment.entity.order_id;
    await Appointment.findOneAndUpdate(
      { 'payment.razorpayOrderId': orderId, status: 'pending_payment' },
      { status: 'confirmed', 'payment.status': 'paid', 'payment.paidAt': new Date() }
    );
  }

  if (event === 'payment.failed') {
    const orderId = payload.payment.entity.order_id;
    const appt = await Appointment.findOne({ 'payment.razorpayOrderId': orderId });
    if (appt && appt.status === 'pending_payment') {
      await Slot.findByIdAndUpdate(appt.slot, { $inc: { bookedCount: -1 } });
      appt.status = 'cancelled';
      appt.payment.status = 'failed';
      appt.cancelledBy = 'system';
      appt.cancellationReason = 'Payment failed';
      await appt.save();
    }
  }

  res.status(200).json({ success: true });
});

// ─── PATIENT: Get my appointments ─────────────────────────────────────────────
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = { patient: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Appointment.countDocuments(query);

  const appointments = await Appointment.find(query)
    .populate('doctor', 'name specialization avatar address clinicName consultationFee')
    .populate('slot', 'startTime endTime')
    .sort('-date -startTime')
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, appointments });
});

// ─── PATIENT: Get single appointment ─────────────────────────────────────────
exports.getAppointmentById = asyncHandler(async (req, res, next) => {
  const appt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id })
    .populate('doctor', 'name specialization avatar address clinicName phone consultationFee')
    .populate('slot', 'startTime endTime');

  if (!appt) return next(new AppError('Appointment not found.', 404));
  res.status(200).json({ success: true, appointment: appt });
});

// ─── PATIENT: Cancel appointment + initiate refund ────────────────────────────
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const appt = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });

  if (!appt) return next(new AppError('Appointment not found.', 404));
  if (!['confirmed', 'pending_payment'].includes(appt.status)) {
    return next(new AppError(`Cannot cancel an appointment with status: ${appt.status}`, 400));
  }

  // Check cancellation window (e.g. > 2 hours before appointment)
  const apptDateTime = new Date(`${appt.date}T${appt.startTime}:00`);
  const hoursUntil = (apptDateTime - Date.now()) / (1000 * 60 * 60);

  let refundAmount = 0;
  let refundNote = 'No refund — cancelled too close to appointment time.';

  if (hoursUntil > 24) {
    refundAmount = appt.payment.amount; // Full refund
    refundNote = 'Full refund initiated.';
  } else if (hoursUntil > 2) {
    refundAmount = Math.floor(appt.payment.amount * 0.5); // 50% refund
    refundNote = '50% refund initiated (cancelled within 24 hours).';
  }

  // Initiate Razorpay refund if payment was made
  if (appt.payment.status === 'paid' && refundAmount > 0 && appt.payment.razorpayPaymentId) {
    try {
      const refund = await razorpay.payments.refund(appt.payment.razorpayPaymentId, {
        amount: refundAmount,
        notes: { reason: reason || 'Patient cancelled', appointmentId: appt._id.toString() },
      });
      appt.payment.refundId = refund.id;
      appt.payment.refundAmount = refundAmount;
      appt.payment.refundedAt = new Date();
      appt.payment.refundReason = reason || 'Patient cancelled';
      appt.payment.status = refundAmount === appt.payment.amount ? 'refunded' : 'partially_refunded';
    } catch (err) {
      // Log but don't fail — handle refund manually
      console.error('Razorpay refund error:', err.message);
      refundNote += ' (Refund processing — may take 5-7 days.)';
    }
  }

  // Release slot
  await Slot.findByIdAndUpdate(appt.slot, { $inc: { bookedCount: -1 } });

  appt.status = refundAmount > 0 ? 'refunded' : 'cancelled';
  appt.cancelledBy = 'patient';
  appt.cancellationReason = reason || 'Cancelled by patient';
  appt.cancelledAt = new Date();
  await appt.save();

  res.status(200).json({
    success: true,
    message: `Appointment cancelled. ${refundNote}`,
    appointment: appt,
  });
});
