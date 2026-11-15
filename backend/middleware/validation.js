// Validation middleware for API requests

const validateUUID = (req, res, next) => {
  const { id } = req.params;

  // Simple UUID validation regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (id && !uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid UUID format' });
  }

  next();
};

const validateUser = (req, res, next) => {
  const { email, password_hash, role, first_name, last_name } = req.body;

  if (!email || !password_hash || !role || !first_name || !last_name) {
    return res.status(400).json({
      error: 'Missing required fields: email, password_hash, role, first_name, last_name'
    });
  }

  // Validate role
  if (!['homeowner', 'pro'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be either "homeowner" or "pro"' });
  }

  next();
};

const validateService = (req, res, next) => {
  const { name, description, category } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' });
  }

  next();
};

const validateJob = (req, res, next) => {
  const { homeowner_id, service_id, title, description } = req.body;

  if (!homeowner_id || !service_id || !title || !description) {
    return res.status(400).json({
      error: 'Missing required fields: homeowner_id, service_id, title, description'
    });
  }

  next();
};

const validateQuote = (req, res, next) => {
  const { job_id, pro_id, amount } = req.body;

  if (!job_id || !pro_id || !amount) {
    return res.status(400).json({
      error: 'Missing required fields: job_id, pro_id, amount'
    });
  }

  next();
};

const validateReview = (req, res, next) => {
  const { job_id, reviewer_id, reviewee_id, rating } = req.body;

  if (!job_id || !reviewer_id || !reviewee_id || !rating) {
    return res.status(400).json({
      error: 'Missing required fields: job_id, reviewer_id, reviewee_id, rating'
    });
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  next();
};

module.exports = {
  validateUUID,
  validateUser,
  validateService,
  validateJob,
  validateQuote,
  validateReview
};