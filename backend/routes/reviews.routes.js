const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');

// Review routes
router.get('/', reviewsController.getReviews);
router.get('/job/:job_id', reviewsController.getReviewsByJob);
router.get('/reviewer/:reviewer_id', reviewsController.getReviewsByReviewer);
router.get('/reviewee/:reviewee_id', reviewsController.getReviewsByReviewee);
router.post('/job/:job_id/reviewer/:reviewer_id/reviewee/:reviewee_id', reviewsController.submitReview);
router.put('/:id', reviewsController.updateReview);
router.delete('/:id', reviewsController.deleteReview);

module.exports = router;