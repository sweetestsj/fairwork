// Job controller for FairWork marketplace

const Job = require('../models/job');

class JobController {
  constructor(db) {
    this.jobModel = new Job(db);
  }

  // Get all jobs with optional category filtering
  async getAllJobs(req, res) {
    try {
      const { category } = req.query;
      const jobs = await this.jobModel.getAllJobs(category);
      res.json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get jobs by category
  async getJobsByCategory(req, res) {
    try {
      const { category } = req.params;

      // Validate that category is provided and is a string
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }

      if (typeof category !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Category must be a string'
        });
      }

      // Check for potentially malicious input patterns
      if (category.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Category is too long'
        });
      }

      // Basic sanitization to prevent common injection patterns
      const sanitizedCategory = category.trim();
      if (sanitizedCategory === '') {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be empty'
        });
      }

      const jobs = await this.jobModel.getAllJobs(sanitizedCategory);
      res.json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      // Handle database errors specifically
      if (error && error.message && typeof error.message === 'string' && error.message.includes('invalid input')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category provided'
        });
      }

      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // Get job by ID
  async getJobById(req, res) {
    try {
      const { id } = req.params;
      const job = await this.jobModel.getJobById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create a new job
  async createJob(req, res) {
    try {
      const { title, description, serviceId, homeownerId } = req.body;

      // Validate required fields
      if (!title || !description || !serviceId || !homeownerId) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, serviceId, and homeownerId are required'
        });
      }

      const job = await this.jobModel.createJob({ title, description, serviceId, homeownerId });
      res.status(201).json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update a job
  async updateJob(req, res) {
    try {
      const { id } = req.params;
      const { title, description, serviceId } = req.body;

      // Validate required fields
      if (!title || !description || !serviceId) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and serviceId are required'
        });
      }

      const job = await this.jobModel.updateJob(id, { title, description, serviceId });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: job
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a job
  async deleteJob(req, res) {
    try {
      const { id } = req.params;
      await this.jobModel.deleteJob(id);

      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = JobController;