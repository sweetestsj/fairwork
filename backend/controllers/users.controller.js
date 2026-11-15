const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { email, password_hash, role, first_name, last_name, phone, address } = req.body;

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password_hash, saltRounds);

    const result = await query(
      'INSERT INTO users (email, password_hash, role, first_name, last_name, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [email, hashedPassword, role, first_name, last_name, phone, address]
    );

    // If user is a pro, also create entry in pros table
    if (role === 'pro') {
      await query(
        'INSERT INTO pros (user_id, business_name) VALUES ($1, $2)',
        [result.rows[0].id, req.body.business_name || '']
      );
    }

    // If user is a homeowner, also create entry in homeowners table
    if (role === 'homeowner') {
      await query(
        'INSERT INTO homeowners (user_id) VALUES ($1)',
        [result.rows[0].id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, first_name, last_name, phone, address } = req.body;

    const result = await query(
      'UPDATE users SET email = $1, role = $2, first_name = $3, last_name = $4, phone = $5, address = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [email, role, first_name, last_name, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};