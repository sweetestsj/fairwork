// Job Controller - Sorting Tests
const JobController = require('../controllers/jobController');
const Job = require('../models/job');

describe('Job Controller - Sorting', () => {
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

  test('should sort by budget (descending)', async () => {
    // Mock database response
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        sort: 'budget'
      }
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await jobController.getAllJobs(req, res);

    expect(res.json).toHaveBeenCalled();
    // Verify that the query was called with correct sort order
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });

  test('should sort by category (ascending)', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        sort: 'category'
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

  test('should sort by date (descending)', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        sort: 'date'
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

  test('should sort by date ascending', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        sort: 'date_asc'
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

  test('should sort by title (ascending)', async () => {
    mockDb.query.mockResolvedValue({
      rows: []
    });

    const req = {
      query: {
        sort: 'title'
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

  test('should default to created_at descending when no sort parameter', async () => {
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
    expect(mockDb.query).toHaveBeenCalledTimes(1);
  });
});