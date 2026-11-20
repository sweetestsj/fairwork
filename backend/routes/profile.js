// Profile routes for FairWork

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Get user profile (protected route)
router.get('/profile', authenticateToken, profileController.getProfile);

// Update user profile (protected route)
router.put('/profile', authenticateToken, profileController.updateProfile);

// Get service preferences (for homeowners) - protected route
router.get('/profile/service-preferences', authenticateToken, profileController.getServicePreferences);

// Update service preferences (for homeowners) - protected route
router.put('/profile/service-preferences', authenticateToken, profileController.updateServicePreferences);

// Get credentials (for pros) - protected route
router.get('/profile/credentials', authenticateToken, profileController.getCredentials);

// Update credentials (for pros) - protected route
router.put('/profile/credentials', authenticateToken, profileController.updateCredentials);

module.exports = router;