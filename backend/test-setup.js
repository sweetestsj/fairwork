// Test setup script for FairWork project
const { Pool } = require('pg');
require('dotenv').config();

// Function to create a test database pool
const createTestPool = () => {
  return new Pool({
    user: process.env.DB_USER || 'fairwork_user',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'fairwork',
    password: process.env.DB_PASSWORD || 'fairwork_password',
    port: process.env.DB_PORT || 5432,
  });
};

// Export the function for use in tests
module.exports = {
  createTestPool
};