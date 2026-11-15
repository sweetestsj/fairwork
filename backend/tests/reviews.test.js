const request = require('supertest');
const app = require('../server');

describe('Reviews API', () => {
  // Test reviews endpoint (basic functionality)
  test('should handle reviews endpoint', async () => {
    const response = await request(app).get('/reviews');
    expect(response.status).toBe(200);
  });
});