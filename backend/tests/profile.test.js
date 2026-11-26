const request = require('supertest');
const app = require('../server');
const { query } = require('../config/database');

describe('Profile Endpoints', () => {
  // Clean up test data after each test
  afterEach(async () => {
    try {
      await query('DELETE FROM users WHERE email = $1', ['testprofile@example.com']);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      const registerData = {
        name: 'Test User',
        email: 'testprofile@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register a user first
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      const token = registerResponse.body.token;

      // Get profile with valid token
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.body.user).toHaveProperty('name', registerData.name);
      expect(response.body.user).toHaveProperty('email', registerData.email);
    });
  });

  describe('PUT /auth/profile', () => {
    it('should update user profile when authenticated', async () => {
      const registerData = {
        name: 'Test User',
        email: 'testprofile@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register a user first
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      const token = registerResponse.body.token;

      // Update profile
      const updateData = {
        name: 'Updated Test User',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.user).toHaveProperty('name', updateData.name);
      expect(response.body.user).toHaveProperty('email', updateData.email);
    });

    it('should not update profile without required fields', async () => {
      const registerData = {
        name: 'Test User',
        email: 'testprofile@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register a user first
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      const token = registerResponse.body.token;

      // Try to update without any fields
      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'At least one of name or email must be provided for update');
    });
  });
});