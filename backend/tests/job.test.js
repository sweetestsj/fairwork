const request = require('supertest');
const app = require('../server');

// Mock database for testing purposes
jest.mock('../config/database', () => ({
  db: {
    query: jest.fn()
  }
}));

describe('Jobs API', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should create a new job', async () => {
    const mockJob = {
      id: '1',
      title: 'Test Job - Pressure Washing',
      description: 'Pressure washing service for residential property',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Mock the database query response
    require('../config/database').db.query.mockResolvedValueOnce({
      rows: [mockJob]
    });

    const jobData = {
      title: 'Test Job - Pressure Washing',
      description: 'Pressure washing service for residential property',
      serviceId: 'service-123',
      homeownerId: 'homeowner-456'
    };

    const response = await request(app)
      .post('/api/jobs')
      .send(jobData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(jobData.title);
  });

  it('should get all jobs', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        description: 'Test description',
        category: 'pressure_washing',
        created_at: new Date(),
        updated_at: new Date(),
        status: 'open',
        provider_name: 'Test Provider'
      }
    ];

    // Mock the database query response
    require('../config/database').db.query.mockResolvedValueOnce({
      rows: mockJobs
    });

    const response = await request(app)
      .get('/api/jobs')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });

  it('should get jobs filtered by category', async () => {
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        description: 'Test description',
        category: 'pressure_washing',
        created_at: new Date(),
        updated_at: new Date(),
        status: 'open',
        provider_name: 'Test Provider'
      }
    ];

    // Mock the database query response
    require('../config/database').db.query.mockResolvedValueOnce({
      rows: mockJobs
    });

    const response = await request(app)
      .get('/api/jobs?category=pressure_washing')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.count).toBeGreaterThan(0);
  });

  it('should get a job by ID', async () => {
    const mockJob = {
      id: '1',
      title: 'Test Job',
      description: 'Test description',
      category: 'pressure_washing',
      created_at: new Date(),
      updated_at: new Date(),
      status: 'open',
      provider_name: 'Test Provider'
    };

    // Mock the database query response
    require('../config/database').db.query.mockResolvedValueOnce({
      rows: [mockJob]
    });

    const response = await request(app)
      .get('/api/jobs/1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('1');
  });
});