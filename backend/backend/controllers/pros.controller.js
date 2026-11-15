const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Get all pros
exports.getPros = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
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
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pros by verification status
exports.getProsByVerification = async (req, res) => {
  try {
    const { verified } = req.params;
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.verified = $1
      ORDER BY p.created_at DESC
    `, [verified === 'true']);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pros by verification:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new pro
exports.createPro = async (req, res) => {
  try {
    const { user_id, business_name, license_number, certificate_of_insurance, business_registration } = req.body;

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await query(
      'INSERT INTO pros (user_id, business_name, license_number, certificate_of_insurance, business_registration) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, business_name, license_number, certificate_of_insurance, business_registration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pro:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Pro already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update pro
exports.updatePro = async (req, res) => {
  try {
    const { id } = req.params;
    const { business_name, license_number, certificate_of_insurance, business_registration, verified, rating, completed_jobs } = req.body;

    const result = await query(
      'UPDATE pros SET business_name = $1, license_number = $2, certificate_of_insurance = $3, business_registration = $4, verified = $5, rating = $6, completed_jobs = $7, updated_at = CURRENT_TIMESTAMP WHERE user_id = $8 RETURNING *',
      [business_name, license_number, certificate_of_insurance, business_registration, verified, rating, completed_jobs, id]
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
    const { id } = req.params;

    const result = await query(
      'UPDATE pros SET verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
      [id]
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
    const { id } = req.params;
    const result = await query('DELETE FROM pros WHERE user_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    res.json({ message: 'Pro deleted successfully' });
  } catch (error) {
    console.error('Error deleting pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top-rated pros
exports.getTopRatedPros = async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.verified = TRUE
      ORDER BY p.rating DESC, p.completed_jobs DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting top-rated pros:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pros by service
exports.getProsByService = async (req, res) => {
  try {
    const { service_id } = req.params;

    // This would need to be implemented based on how services are linked to pros
    // For now, we'll return all verified pros (simplified implementation)
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.verified = TRUE
      ORDER BY p.rating DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pros by service:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};