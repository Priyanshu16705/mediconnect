const express = require('express');
const router = express.Router();
const {
  initiateBooking,
  verifyPayment,
  razorpayWebhook,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Razorpay webhook — raw body needed, no auth
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), razorpayWebhook);

// Patient routes
router.use(protect, authorize('patient'));
router.post('/book', initiateBooking);
router.post('/verify-payment', verifyPayment);
router.get('/my', getMyAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/cancel', cancelAppointment);

module.exports = router;
