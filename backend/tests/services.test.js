const request = require('supertest');
const app = require('../server');

describe('Services API', () => {
  // Test services endpoint (basic functionality)
  test('should handle services endpoint', async () => {
    const response = await request(app).get('/services');
    expect(response.status).toBe(200);
  });

  // Test launch services endpoint
  test('should handle launch services endpoint', async () => {
    const response = await request(app).get('/services/launch');
    expect(response.status).toBe(200);
  });
});