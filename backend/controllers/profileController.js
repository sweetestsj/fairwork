const User = require('../models/User');
const Service = require('../models/Service');

// Get user profile (protected route)
const getProfile = async (req, res) => {
  try {
    // The user is already authenticated via middleware
    const user = req.user;

    // Remove password hash from the user object if it exists
    const { password_hash, ...userWithoutHash } = user;

    // Get additional profile information based on user role
    let profileData = userWithoutHash;

    if (user.role === 'pro') {
      // For Pros, we might want to include additional info from pros table
      // This would require joining with pros table
      const proInfo = await User.getProInfo(user.id);
      if (proInfo) {
        profileData = { ...profileData, ...proInfo };
      }
    }

    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: profileData
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address, role } = req.body;

    // Validate input data
    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if email already exists for another user
    const existingUser = await User.findUserByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        error: 'Email already in use',
        message: 'A user with this email already exists'
      });
    }

    // Update user profile
    const result = await User.updateUserProfile(userId, { name, email, phone, address, role });

    if (!result) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not update profile'
      });
    }

    // Remove password hash from the user object if it exists
    const { password_hash, ...userWithoutHash } = result;

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

    // Handle PostgreSQL unique constraint violation (email already exists)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Email already in use',
        message: 'A user with this email already exists'
      });
    }

    // Handle other database errors
    if (error.message.includes('database') || error.message.includes('DB')) {
      return res.status(500).json({
        error: 'Database error occurred during profile update',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
};

// Get user service preferences (for homeowners)
const getServicePreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get service preferences for this user
    const preferences = await User.getServicePreferences(userId);

    res.status(200).json({
      message: 'Service preferences retrieved successfully',
      preferences
    });
  } catch (error) {
    console.error('Service preferences retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve service preferences',
      message: error.message
    });
  }
};

// Update user service preferences (for homeowners)
const updateServicePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { serviceIds } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds)) {
      return res.status(400).json({
        error: 'Service IDs are required and must be an array'
      });
    }

    // Validate that all service IDs exist
    for (const serviceId of serviceIds) {
      const service = await Service.getServiceById(serviceId);
      if (!service) {
        return res.status(400).json({
          error: `Service with ID ${serviceId} does not exist`
        });
      }
    }

    // Update service preferences
    const result = await User.updateServicePreferences(userId, serviceIds);

    res.status(200).json({
      message: 'Service preferences updated successfully',
      preferences: result
    });
  } catch (error) {
    console.error('Service preferences update error:', error);
    res.status(500).json({
      error: 'Failed to update service preferences',
      message: error.message
    });
  }
};

// Get user credentials (for pros)
const getCredentials = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get credential information for this pro
    const credentials = await User.getProCredentials(userId);

    res.status(200).json({
      message: 'Credentials retrieved successfully',
      credentials
    });
  } catch (error) {
    console.error('Credentials retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve credentials',
      message: error.message
    });
  }
};

// Update user credentials (for pros)
const updateCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, licenseNumber, insuranceDocuments } = req.body;

    // Validate input for pros
    if (!businessName || businessName.trim() === '') {
      return res.status(400).json({
        error: 'Business name is required'
      });
    }

    if (!licenseNumber || licenseNumber.trim() === '') {
      return res.status(400).json({
        error: 'License number is required'
      });
    }

    // Update credentials
    const result = await User.updateProCredentials(userId, { businessName, licenseNumber, insuranceDocuments });

    res.status(200).json({
      message: 'Credentials updated successfully',
      credentials: result
    });
  } catch (error) {
    console.error('Credentials update error:', error);

    // Handle database connection errors
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Database connection failed'
      });
    }

    // Handle other database errors
    if (error.message.includes('database') || error.message.includes('DB')) {
      return res.status(500).json({
        error: 'Database error occurred during credentials update',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update credentials',
      message: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getServicePreferences,
  updateServicePreferences,
  getCredentials,
  updateCredentials
};