const { query } = require('../config/database');

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

// Get review by ID
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM reviews WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by job
exports.getReviewsByJob = async (req, res) => {
  try {
    const { job_id } = req.params;
    const result = await query('SELECT * FROM reviews WHERE job_id = $1 ORDER BY created_at DESC', [job_id]);
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
    const result = await query('SELECT * FROM reviews WHERE reviewer_id = $1 ORDER BY created_at DESC', [reviewer_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews by reviewer:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get reviews by reviewee
exports.getReviewsByReviewee = async (req, res) => {
  try {
    const { reviewee_id } = req.params;
    const result = await query('SELECT * FROM reviews WHERE reviewee_id = $1 ORDER BY created_at DESC', [reviewee_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting reviews by reviewee:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { job_id, reviewer_id, reviewee_id, rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await query(
      'INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [job_id, reviewer_id, reviewee_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { job_id, reviewer_id, reviewee_id, rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await query(
      'UPDATE reviews SET job_id = $1, reviewer_id = $2, reviewee_id = $3, rating = $4, comment = $5, created_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [job_id, reviewer_id, reviewee_id, rating, comment, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};