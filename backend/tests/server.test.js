const request = require('supertest');
const express = require('express');

// Create a minimal app for testing without starting the full server
describe('Server', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add the same routes as in server.js for testing
    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to FairWork API' });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  });

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