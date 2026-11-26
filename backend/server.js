const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import database initialization
const { initializeDatabase } = require('./db/init');

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

// Service routes (canonical + legacy alias)
const serviceRoutes = require('./routes/services');
app.use('/api/services', serviceRoutes);
app.use('/services', serviceRoutes);

// Jobs routes (canonical)
const jobsRouter = require('./routes/jobs');
app.use('/api/jobs', jobsRouter);

// Profile routes (canonical + legacy alias)
const profileRoutes = require('./routes/profile');
app.use('/api/auth/profile', profileRoutes);
app.use('/auth/profile', profileRoutes);

// Authentication routes (canonical + legacy alias)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database tables if they don't exist
    await initializeDatabase();

    // Start server only if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        // Server startup logging is handled by process manager in production
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;