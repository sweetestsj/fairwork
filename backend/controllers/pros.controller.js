const { query } = require('../config/database');

// Get all pros
exports.getPros = async (req, res) => {
  try {
    const result = await query('SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address, p.business_name, p.license_number, p.certificate_of_insurance, p.business_registration, p.verified, p.rating, p.completed_jobs FROM users u JOIN pros p ON u.id = p.user_id ORDER BY p.created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pros:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pro by ID
exports.getProById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address, p.business_name, p.license_number, p.certificate_of_insurance, p.business_registration, p.verified, p.rating, p.completed_jobs FROM users u JOIN pros p ON u.id = p.user_id WHERE u.id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pro by user ID
exports.getProByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await query('SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.address, p.business_name, p.license_number, p.certificate_of_insurance, p.business_registration, p.verified, p.rating, p.completed_jobs FROM users u JOIN pros p ON u.id = p.user_id WHERE u.id = $1', [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting pro by user ID:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new pro (this would be called during user creation)
exports.createPro = async (req, res) => {
  try {
    const { user_id, business_name, license_number, certificate_of_insurance, business_registration } = req.body;

    const result = await query(
      'INSERT INTO pros (user_id, business_name, license_number, certificate_of_insurance, business_registration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, business_name, license_number, certificate_of_insurance, business_registration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update pro
exports.updatePro = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { business_name, license_number, certificate_of_insurance, business_registration, verified, rating, completed_jobs } = req.body;

    const result = await query(
      'UPDATE pros SET business_name = $1, license_number = $2, certificate_of_insurance = $3, business_registration = $4, verified = $5, rating = $6, completed_jobs = $7, updated_at = CURRENT_TIMESTAMP WHERE user_id = $8 RETURNING *',
      [business_name, license_number, certificate_of_insurance, business_registration, verified, rating, completed_jobs, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify a pro
exports.verifyPro = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await query(
      'UPDATE pros SET verified = true WHERE user_id = $1 RETURNING *',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete pro
exports.deletePro = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await query('DELETE FROM pros WHERE user_id = $1 RETURNING *', [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json({ message: 'Pro deleted successfully' });
  } catch (error) {
    console.error('Error deleting pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};