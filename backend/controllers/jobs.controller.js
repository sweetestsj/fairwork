const { query } = require('../config/database');
const { getJobByIdWithValidation } = require('../utils/database-helpers');

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const result = await query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting jobs:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that the job exists and get its details
    const job = await getJobByIdWithValidation(query, id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error getting job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get jobs by homeowner
exports.getJobsByHomeowner = async (req, res) => {
  try {
    const { homeowner_id } = req.params;

    // Validate that the user is a homeowner
    const result = await query('SELECT * FROM jobs WHERE homeowner_id = $1 ORDER BY created_at DESC', [homeowner_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting jobs by homeowner:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available/open jobs
exports.getAvailableJobs = async (req, res) => {
  try {
    const result = await query("SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting available jobs:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get jobs by pro (quotes submitted)
exports.getJobsByPro = async (req, res) => {
  try {
    const { pro_id } = req.params;

    // Get all jobs where this pro has submitted a quote
    const result = await query(`
      SELECT DISTINCT j.*, u.first_name as homeowner_first_name, u.last_name as homeowner_last_name
      FROM jobs j
      JOIN quotes q ON j.id = q.job_id
      JOIN homeowners h ON j.homeowner_id = h.user_id
      JOIN users u ON h.user_id = u.id
      WHERE q.pro_id = $1
      ORDER BY j.created_at DESC
    `, [pro_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting jobs by pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const { homeowner_id, service_id, title, description, budget_min, budget_max, location } = req.body;

    // Validate required fields
    if (!homeowner_id || !service_id || !title) {
      return res.status(400).json({ error: 'Homeowner ID, service ID, and title are required' });
    }

    const result = await query(
      'INSERT INTO jobs (homeowner_id, service_id, title, description, budget_min, budget_max, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [homeowner_id, service_id, title, description, budget_min, budget_max, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job:', error.message);
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid homeowner or service ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update job status (for marking as completed)
exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open, in_progress, completed, or cancelled' });
    }

    const result = await query(
      'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job status:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update job details
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeowner_id, service_id, title, description, budget_min, budget_max, location, status } = req.body;

    // If status is being updated, use the dedicated endpoint
    if (status !== undefined) {
      return res.status(400).json({ error: 'Use PUT /jobs/:id/status to update job status' });
    }

    const result = await query(
      'UPDATE jobs SET homeowner_id = $1, service_id = $2, title = $3, description = $4, budget_min = $5, budget_max = $6, location = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [homeowner_id, service_id, title, description, budget_min, budget_max, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job:', error.message);
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ error: 'Invalid homeowner or service ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists
    const checkResult = await query('SELECT id FROM jobs WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};