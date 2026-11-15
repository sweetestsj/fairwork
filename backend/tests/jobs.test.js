const request = require('supertest');
const app = require('../server');

describe('Jobs API', () => {
  // Test jobs endpoint (basic functionality)
  test('should handle jobs endpoint', async () => {
    const response = await request(app).get('/jobs');
    expect(response.status).toBe(200);
  });

  // Test available jobs endpoint
  test('should handle available jobs endpoint', async () => {
    const response = await request(app).get('/jobs/available');
    expect(response.status).toBe(200);
  });
});