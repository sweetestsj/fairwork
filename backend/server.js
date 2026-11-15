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

// Export app for testing without starting server in tests
const startServer = () => {
  return app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };