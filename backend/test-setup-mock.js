// Mock test setup to avoid server startup issues during tests

const express = require('express');

// Create a minimal app for testing without starting the full server
const app = express();

// Mock middleware
app.use(express.json());

// Mock routes - just return success for now
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

module.exports = app;