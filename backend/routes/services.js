// Service routes for FairWork
const express = require('express');
const router = express.Router();
const { getAllServices, getServiceById, createService } = require('../controllers/serviceController');

// Get all services
router.get('/', getAllServices);

// Get a specific service by ID
router.get('/:id', getServiceById);

// Create a new service
router.post('/', createService);

module.exports = router;