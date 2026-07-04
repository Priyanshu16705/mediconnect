const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getPendingDoctors,
  verifyDoctor,
  getAllDoctors,
  toggleDoctorActive,
  getAllPatients,
  getAllAppointments,
  getRevenueAnalytics,
  deleteReview,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/doctors', getAllDoctors);
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/verify', verifyDoctor);
router.put('/doctors/:id/toggle', toggleDoctorActive);
router.get('/patients', getAllPatients);
router.get('/appointments', getAllAppointments);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
