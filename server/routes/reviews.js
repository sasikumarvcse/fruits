const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/', auth, reviewController.createReview);
router.get('/:productId', reviewController.getReviewsForProduct);
router.put('/:reviewId', auth, reviewController.editReview);
router.delete('/:reviewId', auth, reviewController.deleteReview);

module.exports = router; 