const request = require('supertest');
const app = require('../server');
const { query } = require('../config/database');

describe('Authentication Endpoints', () => {
  // Clean up test data after each test
  afterEach(async () => {
    try {
      await query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('role', userData.role);
      expect(response.body).toHaveProperty('token');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register first user
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should not register user with invalid data', async () => {
      const invalidUserData = {
        name: '',
        email: 'invalid-email',
        password: '123',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Registration failed');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'homeowner'
      };

      // Register a user first
      await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', registerData.email);
      expect(response.body).toHaveProperty('token');
    });

    it('should not login user with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login user without required fields', async () => {
      const loginData = {
        email: '',
        password: ''
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('POST /auth/logout', () => {
    it('should handle logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });
  });
});