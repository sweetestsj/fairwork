// Job Controller - Filtering Tests
const JobController = require('../controllers/jobController');
const Job = require('../models/job');

describe('Job Controller - Filtering', () => {
  let jobController;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };

    jobController = new JobController(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle filtering by category, minPrice, maxPrice and datePosted', async () => {
    // Mock database response
    mockDb.query.mockResolvedValue({
      rows: [
        {
          id: '1',
          title: 'Test Job',
          description: 'Test Description',
          category: 'Cleaning',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          status: 'open',
          provider_name: 'Test User',
          budget: 100
        }
      ]
    });

    const req = {
      query: {
        category: 'Cleaning',
        minPrice: '50',
        maxPrice: '150',
        datePosted: '2023-01-01'
      }
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await jobController.getAllJobs(req, res);

    expect(res.json).toHaveBeenCalled();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  test('should handle filtering by category only', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        category: 'Cleaning'
      }
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await jobController.getAllJobs(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('should handle filtering by price range only', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        minPrice: '50',
        maxPrice: '150'
      }
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await jobController.getAllJobs(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('should handle no filters', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {}
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await jobController.getAllJobs(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});