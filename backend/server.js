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

// User routes
const userRoutes = require('./routes/users.routes');
app.use('/users', userRoutes);

// Service routes
const serviceRoutes = require('./routes/services.routes');
app.use('/services', serviceRoutes);

// Job routes
const jobRoutes = require('./routes/jobs.routes');
app.use('/jobs', jobRoutes);

// Quote routes
const quoteRoutes = require('./routes/quotes.routes');
app.use('/quotes', quoteRoutes);

// Review routes
const reviewRoutes = require('./routes/reviews.routes');
app.use('/reviews', reviewRoutes);

// Pro routes
const proRoutes = require('./routes/pros.routes');
app.use('/pros', proRoutes);

// Initialize database and start server (only if not in test environment)
async function startServer() {
  try {
    // Only initialize database if we're not in a test environment
    if (process.env.NODE_ENV !== 'test') {
      const { initDatabase } = require('./db/init');
      await initDatabase();
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    // If we're in test environment and can't connect to database, just start server without DB init
    if (process.env.NODE_ENV === 'test') {
      console.log('Test environment detected - starting server without database initialization');
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } else {
      console.error('Failed to start server:', error.message);
      process.exit(1);
    }
  }
}

// Start server only if this file is executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;