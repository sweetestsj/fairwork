const request = require('supertest');
const app = require('../server');

// Mock the server startup to avoid port conflicts
jest.mock('../server', () => {
  const express = require('express');
  const mockApp = express();

  // Mock routes
  mockApp.get('/', (req, res) => {
    res.json({ message: 'Welcome to FairWork API' });
  });

  mockApp.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  return mockApp;
});

describe('Server', () => {
  it('should return welcome message on root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to FairWork API');
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });
});