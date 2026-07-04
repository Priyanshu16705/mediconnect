const express = require('express');
const router = express.Router();
const { createReview, getDoctorReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/doctor/:doctorId', getDoctorReviews);
router.post('/', protect, authorize('patient'), createReview);
router.put('/:id', protect, authorize('patient'), updateReview);
router.delete('/:id', protect, authorize('patient'), deleteReview);

module.exports = router;
