const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// User login
exports.login = async (req, res) => {
  try {
    const { email, password_hash } = req.body;

    // Find user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password_hash, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fairwork_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password_hash, role, first_name, last_name, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

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

    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
      process.env.JWT_SECRET || 'fairwork_secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name,
        phone: result.rows[0].phone,
        address: result.rows[0].address
      }
    });
  } catch (error) {
    console.error('Error registering user:', error.message);
    if (error.code === '23505') {
      // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};