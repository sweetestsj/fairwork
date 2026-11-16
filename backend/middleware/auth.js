const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Authorization header missing or invalid'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fairwork_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
    req.user = user;
    next();
  });
};

// Admin middleware (optional - for future use)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      message: 'Insufficient permissions'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};