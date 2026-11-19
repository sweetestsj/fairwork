// Job routes for FairWork marketplace

const express = require('express');
const router = express.Router();
const JobController = require('../controllers/jobController');
const db = require('../config/database');

// Initialize job controller with database connection
const jobController = new JobController(db);

// GET /api/jobs - Get all jobs (with optional category filter)
router.get('/', (req, res) => jobController.getAllJobs(req, res));

// GET /api/jobs/:category - Get jobs by category
router.get('/:category', jobController.getJobsByCategory.bind(jobController));

// GET /api/jobs/:id - Get job by ID
router.get('/:id', (req, res) => jobController.getJobById(req, res));

// POST /api/jobs - Create a new job
router.post('/', (req, res) => jobController.createJob(req, res));

// PUT /api/jobs/:id - Update a job
router.put('/:id', (req, res) => jobController.updateJob(req, res));

// DELETE /api/jobs/:id - Delete a job
router.delete('/:id', (req, res) => jobController.deleteJob(req, res));

module.exports = router;