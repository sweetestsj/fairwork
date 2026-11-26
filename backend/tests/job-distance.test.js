// Test for distance-based job filtering
const request = require('supertest');
const app = require('../server');
const db = require('../config/database');

describe('Job Distance Filtering', () => {
  // Mock database queries to avoid needing actual database connection
  beforeEach(() => {
    // Mock the database query function properly
    jest.spyOn(db, 'query').mockImplementation((sql, params) => {
      // Return mock data for distance-based queries
      if (sql.includes('3959 * acos')) {
        return Promise.resolve({
          rows: [
            {
              id: '1',
              title: 'Test Job 1',
              description: 'Test job description',
              category: 'Cleaning',
              created_at: new Date(),
              updated_at: new Date(),
              status: 'open',
              provider_name: 'John Doe',
              budget: 100,
              location: { lat: 40.7128, lng: -74.0060 }
            }
          ]
        });
      }

      // Return mock data for regular queries
      return Promise.resolve({
        rows: [
          {
            id: '1',
            title: 'Test Job 1',
            description: 'Test job description',
            category: 'Cleaning',
            created_at: new Date(),
            updated_at: new Date(),
            status: 'open',
            provider_name: 'John Doe',
            budget: 100
          }
        ]
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should return jobs within specified distance', async () => {
    const response = await request(app)
      .get('/api/jobs?distance=10&lat=40.7128&lng=-74.0060')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('data');
  });

  test('should return all jobs when no distance filter is provided', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('data');
  });

  test('should handle invalid distance parameters gracefully', async () => {
    const response = await request(app)
      .get('/api/jobs?distance=invalid&lat=40.7128&lng=-74.0060')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});