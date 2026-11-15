const request = require('supertest');
const app = require('../test-setup-mock');

describe('Pros API', () => {
  // Test the pros endpoint
  test('should handle pros endpoint', async () => {
    const response = await request(app).get('/pros');
    expect(response.status).toBe(200);
  });

  // Test getting top-rated pros
  test('should handle top-rated pros endpoint', async () => {
    const response = await request(app).get('/pros/top-rated');
    expect(response.status).toBe(200);
  });

  // Test getting pros by verification status
  test('should handle verified pros endpoint', async () => {
    const response = await request(app).get('/pros/verified/true');
    expect(response.status).toBe(200);
  });
});