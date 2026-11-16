// Mock the database connection for testing
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const request = require('supertest');
const express = require('express');

// Create a minimal app instance without starting server
const app = express();
app.use(express.json());

// Import our routes directly to test them
const serviceRoutes = require('../routes/services');
app.use('/services', serviceRoutes);

describe('Service API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /services', () => {
    it('should return all services', async () => {
      // Mock the database response
      const mockQuery = require('../config/database').query;
      mockQuery.mockResolvedValue({
        rows: []
      });

      const response = await request(app)
        .get('/services')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return services with category filter', async () => {
      // Mock the database response
      const mockQuery = require('../config/database').query;
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: '12345678-1234-1234-1234-123456789012',
            name: 'Test Service',
            description: 'A test service',
            category: 'Cleaning',
            estimated_duration: 60,
            created_at: new Date()
          }
        ]
      });

      const response = await request(app)
        .get('/services?category=Cleaning')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('category', 'Cleaning');
    });
  });

  describe('GET /services/:id', () => {
    it('should return a service by ID', async () => {
      // Mock the database response
      const mockQuery = require('../config/database').query;
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: '12345678-1234-1234-1234-123456789012',
            name: 'Test Service',
            description: 'A test service',
            category: 'Cleaning',
            estimated_duration: 60,
            created_at: new Date()
          }
        ]
      });

      const response = await request(app)
        .get('/services/12345678-1234-1234-1234-123456789012')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test Service');
    });

    it('should return 404 for non-existent service', async () => {
      // Mock the database response for not found
      const mockQuery = require('../config/database').query;
      mockQuery.mockResolvedValue({
        rows: []
      });

      const response = await request(app)
        .get('/services/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /services', () => {
    it('should create a new service', async () => {
      // Mock the database response
      const mockQuery = require('../config/database').query;
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: '12345678-1234-1234-1234-123456789012',
            name: 'Test Service',
            description: 'A test service for testing',
            category: 'Cleaning',
            estimated_duration: 60,
            created_at: new Date()
          }
        ]
      });

      const serviceData = {
        name: 'Test Service',
        description: 'A test service for testing',
        category: 'Cleaning',
        estimated_duration: 60
      };

      const response = await request(app)
        .post('/services')
        .send(serviceData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test Service');
      expect(response.body.data).toHaveProperty('category', 'Cleaning');
    });

    it('should return error for invalid service data', async () => {
      const serviceData = {
        name: '',
        description: 'A test service',
        category: 'Cleaning',
        estimated_duration: 60
      };

      const response = await request(app)
        .post('/services')
        .send(serviceData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});