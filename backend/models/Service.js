// Service model for FairWork
const { query } = require('../config/database');

class Service {
  // Get all services with optional category filter
  static async getAllServices(category = null) {
    try {
      let sql = `
        SELECT id, name, description, category, estimated_duration, created_at
        FROM services
        ORDER BY created_at DESC
      `;

      let params = [];

      if (category) {
        sql = `
          SELECT id, name, description, category, estimated_duration, created_at
          FROM services
          WHERE category = $1
          ORDER BY created_at DESC
        `;
        params = [category];
      }

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch services: ${error.message}`);
    }
  }

  // Get a service by ID
  static async getServiceById(id) {
    try {
      const result = await query(
        'SELECT id, name, description, category, estimated_duration, created_at FROM services WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to fetch service: ${error.message}`);
    }
  }

  // Create a new service
  static async createService(serviceData) {
    const { name, description, category, estimated_duration } = serviceData;

    try {
      const result = await query(
        'INSERT INTO services (name, description, category, estimated_duration) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, category, estimated_duration]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  // Validate service data
  static validateServiceData(serviceData) {
    const { name, description, category, estimated_duration } = serviceData;

    if (!name || name.trim() === '') {
      throw new Error('Service name is required');
    }

    if (!description || description.trim() === '') {
      throw new Error('Service description is required');
    }

    if (!category || category.trim() === '') {
      throw new Error('Service category is required');
    }

    if (estimated_duration === undefined || estimated_duration === null) {
      throw new Error('Estimated duration is required');
    }

    // More robust validation for numeric fields
    // Check if it's a valid number and that the string representation converts back to the same value
    const duration = Number(estimated_duration);

    // Verify it's actually a number and not NaN or Infinity
    // Also check that the string representation converts back to the same value (handles '123abc' case)
    if (isNaN(duration) || !Number.isFinite(duration) || String(duration) !== String(estimated_duration)) {
      throw new Error('Estimated duration must be a valid number');
    }

    // Additional validation for data types
    if (typeof name !== 'string') {
      throw new Error('Service name must be a string');
    }

    if (typeof description !== 'string') {
      throw new Error('Service description must be a string');
    }

    if (typeof category !== 'string') {
      throw new Error('Service category must be a string');
    }
  }
}

module.exports = Service;