const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fairwork_secret_key',
    { expiresIn: '24h' }
  );
};

// Registration endpoint
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input data
    User.validateUserData({ name, email, password, role });

    // Create user
    const newUser = await User.createUser({ name, email, password, role });

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error); // Add logging for debugging

    // Handle PostgreSQL unique constraint violation (email already exists)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Handle validation errors
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        error: 'User already exists',
        message: error.message
      });
    }

    // Handle validation errors (from User.validateUserData)
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('format') || error.message.includes('length')) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }

    // Handle database connection errors (like ENOTFOUND)
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed'
      });
    }

    // Handle other database errors
    if (error.message.includes('database') || error.message.includes('DB')) {
      return res.status(500).json({
        error: 'Database error occurred during registration',
        message: error.message
      });
    }

    // Default to 400 for other errors (this should be rare)
    res.status(400).json({
      error: 'Registration failed',
      message: error.message
    });
  }
};

// Login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Validate credentials
    const user = await User.validateUserCredentials(email, password);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error); // Add logging for debugging

    // Handle database connection errors (like ENOTFOUND)
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed'
      });
    }

    // If it's a database-related error, return 500
    if (error.message.includes('database') || error.message.includes('DB')) {
      return res.status(500).json({
        error: 'Database error occurred during login',
        message: error.message
      });
    }

    // For other errors, return 500 as a fallback
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
};

// Logout endpoint (client-side token removal)
const logout = async (req, res) => {
  // For JWT tokens, logout is handled client-side by removing the token
  // This endpoint is mainly for API consistency
  res.json({
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  logout
};