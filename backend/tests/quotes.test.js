const request = require('supertest');
const app = require('../server');

describe('Quotes API', () => {
  // Test quotes endpoint (basic functionality)
  test('should handle quotes endpoint', async () => {
    const response = await request(app).get('/quotes');
    expect(response.status).toBe(200);
  });
});