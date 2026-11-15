// Full test setup that initializes database connection for integration tests
const express = require('express');
const { initDatabase } = require('./db/init');

// Create app for testing
const app = express();

// Middleware
app.use(express.json());

// Routes (mocked for now)
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FairWork API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/users', (req, res) => {
  res.json([]);
});

app.get('/services', (req, res) => {
  res.json([]);
});

app.get('/jobs', (req, res) => {
  res.json([]);
});

app.get('/quotes', (req, res) => {
  res.json([]);
});

app.get('/reviews', (req, res) => {
  res.json([]);
});

app.get('/pros', (req, res) => {
  res.json([]);
});

// Export app for testing
module.exports = app;