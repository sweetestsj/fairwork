const { query } = require('../config/database');
const { getJobByIdWithValidation, getUserByIdWithRole } = require('../utils/database-helpers');

// Get all quotes
exports.getQuotes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM quotes ORDER BY submitted_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quotes by job
exports.getQuotesByJob = async (req, res) => {
  try {
    const { job_id } = req.params;

    // Validate that the job exists
    const job = await getJobByIdWithValidation(query, job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await query(
      'SELECT q.*, u.first_name, u.last_name FROM quotes q JOIN pros p ON q.pro_id = p.user_id JOIN users u ON p.user_id = u.id WHERE q.job_id = $1 ORDER BY q.submitted_at DESC',
      [job_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes by job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get quotes by pro
exports.getQuotesByPro = async (req, res) => {
  try {
    const { pro_id } = req.params;

    // Validate that the pro exists
    const pro = await getUserByIdWithRole(query, pro_id, 'pro');
    if (!pro) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    const result = await query(
      'SELECT q.*, j.title as job_title FROM quotes q JOIN jobs j ON q.job_id = j.id WHERE q.pro_id = $1 ORDER BY q.submitted_at DESC',
      [pro_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting quotes by pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit a quote for a job
exports.submitQuote = async (req, res) => {
  try {
    const { job_id, pro_id } = req.params;
    const { amount, description } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
    }

    // Validate that the job exists and belongs to the homeowner
    const job = await getJobByIdWithValidation(query, job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Validate that the pro exists and is actually a pro
    const pro = await getUserByIdWithRole(query, pro_id, 'pro');
    if (!pro) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    // Check if pro has already submitted a quote for this job
    const existingQuote = await query(
      'SELECT id FROM quotes WHERE job_id = $1 AND pro_id = $2',
      [job_id, pro_id]
    );

    if (existingQuote.rows.length > 0) {
      return res.status(400).json({ error: 'Pro has already submitted a quote for this job' });
    }

    // Check if the job is still open
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Cannot submit quote for a non-open job' });
    }

    const result = await query(
      'INSERT INTO quotes (job_id, pro_id, amount, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [job_id, pro_id, amount, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting quote:', error.message);
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid job or pro ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a quote
exports.updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
    }

    // Check if quote exists
    const checkResult = await query('SELECT id FROM quotes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const result = await query(
      'UPDATE quotes SET amount = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [amount, description, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating quote:', error.message);
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid job or pro ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a quote
exports.deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quote exists
    const checkResult = await query('SELECT id FROM quotes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    const result = await query('DELETE FROM quotes WHERE id = $1 RETURNING *', [id]);

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};