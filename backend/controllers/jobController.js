// Job controller for FairWork marketplace

const Job = require('../models/job');

class JobController {
  constructor(db) {
    this.jobModel = new Job(db);
  }

  // Get all jobs with optional filtering and sorting
  async getAllJobs(req, res) {
    try {
      // Ensure req and req.query exist to prevent "Cannot read properties of undefined (reading 'query')"
      const request = req || {};
      const query = (request && request.query) || {};
      const { category, minPrice, maxPrice, datePosted, sort, status, distance } = query;

      // Build filter object for the database query
      const filters = {};
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (datePosted) filters.datePosted = datePosted;
      if (status) filters.status = status;
      if (distance) filters.distance = parseFloat(distance);

      // Determine sort order with enhanced sorting options
      let sortOrder = 'j.created_at DESC';
      if (sort === 'budget') {
        sortOrder = 'j.budget DESC';
      } else if (sort === 'category') {
        sortOrder = 's.category ASC';
      } else if (sort === 'date') {
        sortOrder = 'j.created_at DESC';
      } else if (sort === 'date_asc') {
        sortOrder = 'j.created_at ASC';
      } else if (sort === 'title') {
        sortOrder = 'j.title ASC';
      }

      const jobs = await this.jobModel.getAllJobs(filters, sortOrder);
      res.json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // Get jobs by category
  async getJobsByCategory(req, res) {
    try {
      // Ensure req exists to prevent "Cannot read properties of undefined (reading 'params')"
      const request = req || {};
      const { category } = request.params;

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

      // Pass filters as an object instead of a string to getAllJobs
      const jobs = await this.jobModel.getAllJobs({ category: sanitizedCategory }, 'j.created_at DESC');
      res.json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      // Handle database errors specifically - make sure error.message is a string before using .includes()
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
      // Ensure req exists to prevent "Cannot read properties of undefined (reading 'params')"
      const request = req || {};
      const { id } = request.params;
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
      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // Create a new job
  async createJob(req, res) {
    try {
      // Ensure req exists to prevent "Cannot read properties of undefined (reading 'body')"
      const request = req || {};
      const { title, description, serviceId, homeownerId } = request.body;

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
      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // Update a job
  async updateJob(req, res) {
    try {
      // Ensure req exists to prevent "Cannot read properties of undefined (reading 'params')"
      const request = req || {};
      const { id } = request.params;
      const { title, description, serviceId } = request.body;

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
      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }

  // Delete a job
  async deleteJob(req, res) {
    try {
      // Ensure req exists to prevent "Cannot read properties of undefined (reading 'params')"
      const request = req || {};
      const { id } = request.params;
      await this.jobModel.deleteJob(id);

      res.json({
        success: true,
        message: 'Job cancelled successfully'
      });
    } catch (error) {
      // Ensure error.message is properly handled to prevent null reference
      const errorMessage = error && typeof error.message === 'string' ? error.message : 'An unknown error occurred';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  }
}

module.exports = JobController;