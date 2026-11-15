const { query } = require('../config/database');

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
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get jobs by homeowner
exports.getJobsByHomeowner = async (req, res) => {
  try {
    const { homeowner_id } = req.params;
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

// Create a new job
exports.createJob = async (req, res) => {
  try {
    const { homeowner_id, service_id, title, description, budget_min, budget_max, location } = req.body;

    const result = await query(
      'INSERT INTO jobs (homeowner_id, service_id, title, description, budget_min, budget_max, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [homeowner_id, service_id, title, description, budget_min, budget_max, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeowner_id, service_id, title, description, budget_min, budget_max, location, status } = req.body;

    const result = await query(
      'UPDATE jobs SET homeowner_id = $1, service_id = $2, title = $3, description = $4, budget_min = $5, budget_max = $6, location = $7, status = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
      [homeowner_id, service_id, title, description, budget_min, budget_max, location, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};