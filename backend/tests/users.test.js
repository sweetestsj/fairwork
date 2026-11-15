const request = require('supertest');
const app = require('../test-setup-mock');

describe('Users API', () => {
  // Test the root endpoint
  test('should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to FairWork API');
  });

  // Test health check endpoint
  test('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  // Test users endpoint (basic functionality)
  test('should handle users endpoint', async () => {
    const response = await request(app).get('/users');
    expect(response.status).toBe(200);
  });
});