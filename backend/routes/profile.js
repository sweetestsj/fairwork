// Profile routes for FairWork

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Get user profile (protected route)
router.get('/', authenticateToken, authController.getProfile);

// Update user profile (protected route)
router.put('/', authenticateToken, authController.updateProfile);

module.exports = router;