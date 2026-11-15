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
    console.error('Error getting pros by verification status:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new pro (this would be called during registration)
exports.createPro = async (req, res) => {
  const client = await query.getClient();

  try {
    await client.query('BEGIN');

    const {
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      address,
      business_name,
      license_number,
      certificate_of_insurance,
      business_registration
    } = req.body;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

    // Create user first
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role, first_name, last_name, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [email, hashedPassword, 'pro', first_name, last_name, phone, address]
    );

    const userId = userResult.rows[0].id;

    // Create pro entry
    await client.query(
      'INSERT INTO pros (user_id, business_name, license_number, certificate_of_insurance, business_registration) VALUES ($1, $2, $3, $4, $5)',
      [userId, business_name, license_number, certificate_of_insurance, business_registration]
    );

    await client.query('COMMIT');

    // Return the created pro with user details
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [userId]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating pro:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Update pro details
exports.updatePro = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      business_name,
      license_number,
      certificate_of_insurance,
      business_registration,
      verified
    } = req.body;

    // Get the existing user to verify ownership
    const userResult = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userResult.rows[0].role !== 'pro') {
      return res.status(400).json({ error: 'User is not a pro' });
    }

    const result = await query(
      `UPDATE pros SET business_name = $1, license_number = $2,
        certificate_of_insurance = $3, business_registration = $4, verified = $5, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $6 RETURNING *`,
      [business_name, license_number, certificate_of_insurance, business_registration, verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    // Return updated pro with user details
    const finalResult = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [id]);

    res.json(finalResult.rows[0]);
  } catch (error) {
    console.error('Error updating pro:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Business name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify pro (admin function)
exports.verifyPro = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const result = await query(
      'UPDATE pros SET verified = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
      [verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pro not found' });
    }

    // Return updated pro with user details
    const finalResult = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [id]);

    res.json(finalResult.rows[0]);
  } catch (error) {
    console.error('Error verifying pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete pro
exports.deletePro = async (req, res) => {
  const client = await query.getClient();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get the user's ID to verify they exist
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete from pros table first (foreign key constraint)
    await client.query('DELETE FROM pros WHERE user_id = $1', [id]);

    // Then delete from users table
    await client.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Pro deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting pro:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Get top-rated pros
exports.getTopRatedPros = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.verified = true
      ORDER BY p.rating DESC, p.completed_jobs DESC
      LIMIT $1
    `, [limit]);

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

    // This would require a more complex query to join with service categories or skills
    // For now, we'll return all verified pros (this is a simplified implementation)
    const result = await query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.phone, u.address
      FROM pros p
      JOIN users u ON p.user_id = u.id
      WHERE p.verified = true
      ORDER BY p.rating DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting pros by service:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};