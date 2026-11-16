// Comprehensive tests for jobController
const JobController = require('../controllers/jobController');
const Job = require('../models/job');

// Mock the database
jest.mock('../models/job');

describe('JobController', () => {
  let jobController;
  let mockDb;
  let req;
  let res;

  beforeEach(() => {
    mockDb = {
      query: jest.fn()
    };

    jobController = new JobController(mockDb);

    req = {
      params: {},
      query: {},
      body: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getAllJobs', () => {
    it('should return all jobs when no category is provided', async () => {
      const mockJobs = [
        { id: 1, title: 'Job 1', description: 'Description 1' },
        { id: 2, title: 'Job 2', description: 'Description 2' }
      ];

      Job.prototype.getAllJobs.mockResolvedValue(mockJobs);

      req.query = {};

      await jobController.getAllJobs(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockJobs
      });
    });

    it('should return jobs filtered by category', async () => {
      const mockJobs = [
        { id: 1, title: 'Job 1', description: 'Description 1' }
      ];

      Job.prototype.getAllJobs.mockResolvedValue(mockJobs);

      req.query = { category: 'plumbing' };

      await jobController.getAllJobs(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockJobs
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection failed';
      Job.prototype.getAllJobs.mockRejectedValue(new Error(errorMessage));

      await jobController.getAllJobs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });

    it('should handle undefined request gracefully', async () => {
      // Test with no req object (edge case)
      await jobController.getAllJobs(undefined, res);

      expect(res.status).toHaveBeenCalledWith(500);
      // The actual error handling in the controller will return a generic message
      // but we're testing that it handles the undefined case gracefully
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getJobsByCategory', () => {
    it('should return jobs by category when category is valid', async () => {
      const mockJobs = [
        { id: 1, title: 'Job 1', description: 'Description 1' }
      ];

      Job.prototype.getAllJobs.mockResolvedValue(mockJobs);

      req.params = { category: 'plumbing' };

      await jobController.getJobsByCategory(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockJobs
      });
    });

    it('should return 400 error when category is missing', async () => {
      req.params = {};

      await jobController.getJobsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category is required'
      });
    });

    it('should return 400 error when category is not a string', async () => {
      req.params = { category: 123 };

      await jobController.getJobsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category must be a string'
      });
    });

    it('should return 400 error when category is too long', async () => {
      req.params = { category: 'a'.repeat(101) };

      await jobController.getJobsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category is too long'
      });
    });

    it('should return 400 error when category is empty', async () => {
      req.params = { category: '   ' };

      await jobController.getJobsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category cannot be empty'
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      Job.prototype.getAllJobs.mockRejectedValue(new Error(errorMessage));

      req.params = { category: 'plumbing' };

      await jobController.getJobsByCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('getJobById', () => {
    it('should return a job by ID when found', async () => {
      const mockJob = { id: 1, title: 'Job 1', description: 'Description 1' };

      Job.prototype.getJobById.mockResolvedValue(mockJob);

      req.params = { id: '1' };

      await jobController.getJobById(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockJob
      });
    });

    it('should return 404 when job is not found', async () => {
      Job.prototype.getJobById.mockResolvedValue(null);

      req.params = { id: '999' };

      await jobController.getJobById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Job not found'
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      Job.prototype.getJobById.mockRejectedValue(new Error(errorMessage));

      req.params = { id: '1' };

      await jobController.getJobById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('createJob', () => {
    it('should create a new job with valid data', async () => {
      const mockJob = {
        id: 1,
        title: 'New Job',
        description: 'Description',
        serviceId: 1,
        homeownerId: 1
      };

      Job.prototype.createJob.mockResolvedValue(mockJob);

      req.body = {
        title: 'New Job',
        description: 'Description',
        serviceId: 1,
        homeownerId: 1
      };

      await jobController.createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockJob
      });
    });

    it('should return 400 error when required fields are missing', async () => {
      req.body = {
        title: 'New Job',
        description: 'Description'
        // Missing serviceId and homeownerId
      };

      await jobController.createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Title, description, serviceId, and homeownerId are required'
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      Job.prototype.createJob.mockRejectedValue(new Error(errorMessage));

      req.body = {
        title: 'New Job',
        description: 'Description',
        serviceId: 1,
        homeownerId: 1
      };

      await jobController.createJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('updateJob', () => {
    it('should update a job with valid data', async () => {
      const mockJob = {
        id: 1,
        title: 'Updated Job',
        description: 'Description',
        serviceId: 1
      };

      Job.prototype.updateJob.mockResolvedValue(mockJob);

      req.params = { id: '1' };
      req.body = {
        title: 'Updated Job',
        description: 'Description',
        serviceId: 1
      };

      await jobController.updateJob(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockJob
      });
    });

    it('should return 404 when job to update is not found', async () => {
      Job.prototype.updateJob.mockResolvedValue(null);

      req.params = { id: '999' };
      req.body = {
        title: 'Updated Job',
        description: 'Description',
        serviceId: 1
      };

      await jobController.updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Job not found'
      });
    });

    it('should return 400 error when required fields are missing', async () => {
      req.params = { id: '1' };
      req.body = {
        title: 'Updated Job',
        description: 'Description'
        // Missing serviceId
      };

      await jobController.updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Title, description, and serviceId are required'
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      Job.prototype.updateJob.mockRejectedValue(new Error(errorMessage));

      req.params = { id: '1' };
      req.body = {
        title: 'Updated Job',
        description: 'Description',
        serviceId: 1
      };

      await jobController.updateJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete a job successfully', async () => {
      Job.prototype.deleteJob.mockResolvedValue();

      req.params = { id: '1' };

      await jobController.deleteJob(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Job cancelled successfully'
      });
    });

    it('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      Job.prototype.deleteJob.mockRejectedValue(new Error(errorMessage));

      req.params = { id: '1' };

      await jobController.deleteJob(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });
});