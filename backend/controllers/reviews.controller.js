const { query } = require('../config/database');
const { getJobByIdWithValidation, getUserByIdWithRole } = require('../utils/database-helpers');

// Get all reviews
exports.getReviews = async (req, res) => {
  try {
    const result = await query('SELECT * FROM reviews ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by job
exports.getReviewsByJob = async (req, res) => {
  try {
    const { job_id } = req.params;

    // Validate that the job exists
    const job = await getJobByIdWithValidation(query, job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await query(
      'SELECT r.*, u.first_name, u.last_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.job_id = $1 ORDER BY r.created_at DESC',
      [job_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews by job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by reviewer
exports.getReviewsByReviewer = async (req, res) => {
  try {
    const { reviewer_id } = req.params;

    // Validate that the user exists and is a homeowner or pro
    const user = await getUserByIdWithRole(query, reviewer_id, 'homeowner');
    if (!user) {
      // Also check if it's a pro
      const proUser = await getUserByIdWithRole(query, reviewer_id, 'pro');
      if (!proUser) {
        return res.status(404).json({ error: 'Reviewer not found' });
      }
    }

    const result = await query(
      'SELECT r.*, j.title as job_title FROM reviews r JOIN jobs j ON r.job_id = j.id WHERE r.reviewer_id = $1 ORDER BY r.created_at DESC',
      [reviewer_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews by reviewer:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by reviewee (the person being reviewed)
exports.getReviewsByReviewee = async (req, res) => {
  try {
    const { reviewee_id } = req.params;

    // Validate that the user exists and is a pro
    const user = await getUserByIdWithRole(query, reviewee_id, 'pro');
    if (!user) {
      return res.status(404).json({ error: 'Reviewee not found' });
    }

    const result = await query(
      'SELECT r.*, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC',
      [reviewee_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews by reviewee:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit a new review
exports.submitReview = async (req, res) => {
  try {
    const { job_id, reviewer_id, reviewee_id } = req.params;
    const { rating, comment } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
    }

    // Validate that the job exists
    const job = await getJobByIdWithValidation(query, job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Validate that the job is completed
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Reviews can only be submitted for completed jobs' });
    }

    // Validate that the reviewer exists and is either a homeowner or pro
    const reviewer = await getUserByIdWithRole(query, reviewer_id, 'homeowner');
    if (!reviewer) {
      // Also check if it's a pro
      const proReviewer = await getUserByIdWithRole(query, reviewer_id, 'pro');
      if (!proReviewer) {
        return res.status(404).json({ error: 'Reviewer not found' });
      }
    }

    // Validate that the reviewee exists and is a pro
    const reviewee = await getUserByIdWithRole(query, reviewee_id, 'pro');
    if (!reviewee) {
      return res.status(404).json({ error: 'Reviewee not found' });
    }

    // Check if this user has already reviewed this job (only one review per job per user)
    const existingReview = await query(
      'SELECT id FROM reviews WHERE job_id = $1 AND reviewer_id = $2',
      [job_id, reviewer_id]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'User has already reviewed this job' });
    }

    // Check if the reviewer was involved in this job
    // The reviewer must have either been the homeowner or a pro who worked on it
    const isHomeowner = await query(
      'SELECT id FROM jobs WHERE id = $1 AND homeowner_id = $2',
      [job_id, reviewer_id]
    );

    let isPro = false;
    if (isHomeowner.rows.length === 0) {
      // Check if the reviewer was a pro who worked on this job
      const quoteResult = await query(
        'SELECT id FROM quotes WHERE job_id = $1 AND pro_id = $2',
        [job_id, reviewer_id]
      );
      isPro = quoteResult.rows.length > 0;
    }

    if (isHomeowner.rows.length === 0 && !isPro) {
      return res.status(400).json({ error: 'Reviewer was not involved in this job' });
    }

    // Submit the review
    const result = await query(
      'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [job_id, reviewer_id, reviewee_id, rating, comment]
    );

    // Update the reviewee's rating
    await updateRevieweeRating(query, reviewee_id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting review:', error.message);
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid job, reviewer, or reviewee ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a review (only allowed for the reviewer)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating is required and must be between 1 and 5' });
    }

    // Check if review exists
    const checkResult = await query('SELECT id, reviewer_id FROM reviews WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = checkResult.rows[0];

    // Update the review
    const result = await query(
      'UPDATE reviews SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [rating, comment, id]
    );

    // If the rating changed, update the reviewee's rating
    if (review.rating !== rating) {
      const revieweeId = await query('SELECT reviewee_id FROM reviews WHERE id = $1', [id]);
      if (revieweeId.rows.length > 0) {
        await updateRevieweeRating(query, revieweeId.rows[0].reviewee_id);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if review exists
    const checkResult = await query('SELECT id, reviewee_id FROM reviews WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const revieweeId = checkResult.rows[0].reviewee_id;

    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);

    // Update the reviewee's rating after deletion
    await updateRevieweeRating(query, revieweeId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update a pro's average rating
async function updateRevieweeRating(query, revieweeId) {
  try {
    const result = await query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE reviewee_id = $1',
      [revieweeId]
    );

    if (result.rows.length > 0) {
      const avgRating = result.rows[0].avg_rating || 0;
      const totalReviews = result.rows[0].total_reviews || 0;

      await query(
        'UPDATE pros SET rating = $1, completed_jobs = $2 WHERE user_id = $3',
        [avgRating, totalReviews, revieweeId]
      );
    }
  } catch (error) {
    console.error('Error updating reviewee rating:', error.message);
  }
}