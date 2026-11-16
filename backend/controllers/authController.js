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
    // Check for duplicate email error specifically
    if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

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

    res.json({
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
    // Handle database errors specifically
    if (error.message.includes('database')) {
      return res.status(500).json({
        error: 'Login failed',
        message: 'Database error occurred during login'
      });
    }

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