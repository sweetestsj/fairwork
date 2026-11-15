const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs.controller');

// Job routes
router.get('/', jobsController.getJobs);
router.get('/:id', jobsController.getJobById);
router.get('/homeowner/:homeowner_id', jobsController.getJobsByHomeowner);
router.get('/available', jobsController.getAvailableJobs);
router.post('/', jobsController.createJob);
router.put('/:id', jobsController.updateJob);
router.delete('/:id', jobsController.deleteJob);

module.exports = router;