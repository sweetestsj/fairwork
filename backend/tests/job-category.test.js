// Test for job category filtering functionality

const JobController = require('../controllers/jobController');
const Job = require('../models/job');

describe('Job Controller - Category Filtering', () => {
  let controller;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };
    controller = new JobController(mockDb);
  });

  it('should have the controller method for category filtering', () => {
    expect(controller.getJobsByCategory).toBeDefined();
  });

  it('should return 400 when no category is provided', async () => {
    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category is required'
    });
  });

  it('should return jobs for a valid category', async () => {
    const req = { params: { category: 'plumbing' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const mockJobs = [
      { id: 1, title: 'Test Job 1', category: 'plumbing' },
      { id: 2, title: 'Test Job 2', category: 'plumbing' }
    ];

    mockDb.query.mockResolvedValue({ rows: mockJobs });

    await controller.getJobsByCategory(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      data: mockJobs
    });
  });

  it('should handle database errors gracefully', async () => {
    const req = { params: { category: 'plumbing' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockDb.query.mockRejectedValue(new Error('Database error'));

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error fetching jobs: Database error'
    });
  });

  it('should return 400 when category is not a string', async () => {
    const req = { params: { category: 123 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category must be a string'
    });
  });

  it('should return 400 when category is too long', async () => {
    const longCategory = 'a'.repeat(101); // 101 characters
    const req = { params: { category: longCategory } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category is too long'
    });
  });

  it('should return 400 when category is an empty string', async () => {
    const req = { params: { category: '' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    // The empty string check happens in the first validation, so it will be "Category is required"
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category is required'
    });
  });

  it('should handle whitespace-only category properly', async () => {
    const req = { params: { category: '   ' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockDb.query.mockResolvedValue({ rows: [] });

    await controller.getJobsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Category cannot be empty'
    });
  });
});