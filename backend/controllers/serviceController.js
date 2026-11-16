// Service controller for FairWork
const Service = require('../models/Service');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const { category } = req.query;
    const services = await Service.getAllServices(category);
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get a specific service by ID
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.getServiceById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create a new service
const createService = async (req, res) => {
  try {
    const { name, description, category, estimated_duration } = req.body;

    // Validate service data
    Service.validateServiceData({ name, description, category, estimated_duration });

    // Create the service
    const newService = await Service.createService({
      name,
      description,
      category,
      estimated_duration
    });

    res.status(201).json({
      success: true,
      data: newService
    });
  } catch (error) {
    // Check for duplicate key error using proper PostgreSQL error code checking instead of fragile string matching
    if (error && error.code === '23505') { // PostgreSQL duplicate key error code
      return res.status(400).json({
        success: false,
        error: 'Service with this name already exists'
      });
    }

    // Check for null/undefined error.message to prevent potential null reference
    if (error && error.message) {
      // Handle specific PostgreSQL duplicate key error by checking error code first
      if (error.message.includes('duplicate key')) {
        return res.status(400).json({
          success: false,
          error: 'Service with this name already exists'
        });
      }
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService
};