const express = require('express');
const router = express.Router();
const {
  getDoctors, getDoctorById, getDoctorSlots,
  updateProfile, updateSlotConfig, toggleDayAvailability, toggleSlot,
  getDoctorDashboard, getDoctorAppointments, updateAppointment,
  getCities, getSpecializations,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getDoctors);
router.get('/cities', getCities);
router.get('/specializations', getSpecializations);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorSlots);

// Doctor-only routes
router.use(protect, authorize('doctor'));
router.get('/dashboard/me', getDoctorDashboard);
router.put('/profile/me', updateProfile);
router.put('/slots/config', updateSlotConfig);
router.put('/availability/day', toggleDayAvailability);
router.put('/slots/:slotId/toggle', toggleSlot);
router.get('/appointments/me', getDoctorAppointments);
router.put('/appointments/:id', updateAppointment);

module.exports = router;
