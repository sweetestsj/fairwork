const { query } = require('../config/database');

// Get all services
exports.getServices = async (req, res) => {
  try {
    const result = await query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting services:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM services WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting service:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new service
exports.createService = async (req, res) => {
  try {
    const { name, description, category, estimated_duration } = req.body;

    const result = await query(
      'INSERT INTO services (name, description, category, estimated_duration) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, category, estimated_duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Service name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, estimated_duration } = req.body;

    const result = await query(
      'UPDATE services SET name = $1, description = $2, category = $3, estimated_duration = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, description, category, estimated_duration, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Service name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get launch services
exports.getLaunchServices = async (req, res) => {
  try {
    const result = await query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting launch services:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};