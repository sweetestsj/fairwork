const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FairWork API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Service routes
const serviceRoutes = require('./routes/services');
app.use('/services', serviceRoutes);

// Jobs routes
const jobsRouter = require('./routes/jobs');
app.use('/api/jobs', jobsRouter);

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Profile routes
const profileRoutes = require('./routes/profile');
app.use('/auth', profileRoutes);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // Server startup logging is handled by process manager in production
  });
}

module.exports = app;