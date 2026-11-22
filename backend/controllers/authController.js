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

// Helper function to validate request body
const validateRequestBody = (req, res, requiredFields) => {
  if (!req || !req.body) {
    return res.status(400).json({
      error: 'Request body is required'
    });
  }

  // Special handling for login endpoint - check if all required fields are missing
  if (requiredFields.length === 2 && requiredFields.includes('email') && requiredFields.includes('password')) {
    const emailMissing = !req.body.email;
    const passwordMissing = !req.body.password;

    if (emailMissing && passwordMissing) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }
  }

  // General validation for other endpoints
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        error: `${field} is required`
      });
    }
  }

  return null; // No error, validation passed
};

// Registration endpoint
const register = async (req, res) => {
  try {
    // Validate request body
    const validationError = validateRequestBody(req, res, ['name', 'email', 'password', 'role']);
    if (validationError) return validationError;

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

    // Handle database connection errors (like ENOTFOUND)
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed'
      });
    }

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
    // Validate request body
    const validationError = validateRequestBody(req, res, ['email', 'password']);
    if (validationError) return validationError;

    const { email, password } = req.body;

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

// Get user profile endpoint (protected route)
const getProfile = async (req, res) => {
  try {
    // The user is already authenticated via middleware
    const user = req.user;

    // Remove password hash from the user object if it exists
    const { password_hash, ...userWithoutHash } = user;

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: userWithoutHash
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

// Update user profile endpoint (protected route)
const updateProfile = async (req, res) => {
  try {
    // The user is already authenticated via middleware
    const userId = req.user.id;

    // Validate request body - only allow updating name and email for now
    const { name, email } = req.body;

    if (!name && !email) {
      return res.status(400).json({
        error: 'At least one of name or email must be provided to update profile'
      });
    }

    // Validate input data
    if (name && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({
        error: 'Name must be a non-empty string'
      });
    }

    if (email && (typeof email !== 'string' || email.trim() === '')) {
      return res.status(400).json({
        error: 'Email must be a non-empty string'
      });
    }

    // If email is provided, validate email format
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }
    }

    // Update user in database
    const result = await User.updateUser(userId, { name, email });

    // Remove password hash from the returned user object
    const { password_hash, ...userWithoutHash } = result.rows[0];

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutHash
    });
  } catch (error) {
    console.error('Profile update error:', error);

    // Handle database connection errors
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed'
      });
    }

    // Handle unique constraint violation (email already exists)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Email already in use',
        message: 'A user with this email already exists'
      });
    }

    // Handle validation errors
    if (error.message.includes('required') || error.message.includes('invalid') || error.message.includes('format') || error.message.includes('length')) {
      return res.status(400).json({
        error: 'Profile update failed',
        message: error.message
      });
    }

    // Handle other database errors
    if (error.message.includes('database') || error.message.includes('DB')) {
      return res.status(500).json({
        error: 'Database error occurred during profile update',
        message: error.message
      });
    }

    // Default to 400 for other errors
    res.status(400).json({
      error: 'Profile update failed',
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
  getProfile,
  updateProfile,
  logout
};