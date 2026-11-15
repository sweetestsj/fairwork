// Job routes for FairWork marketplace

const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const { db } = require('../config/database');

// Initialize job controller with database connection
const jobController = new JobController(db);

// GET /api/jobs - Get all jobs (with optional category filter)
router.get('/', jobController.getAllJobs);

// GET /api/jobs/:id - Get job by ID
router.get('/:id', jobController.getJobById);

// POST /api/jobs - Create a new job
router.post('/', jobController.createJob);

// PUT /api/jobs/:id - Update a job
router.put('/:id', jobController.updateJob);

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', jobController.deleteJob);

module.exports = router;