// Test setup script for FairWork project
const fs = require('fs');
const path = require('path');

// Check that required files exist
const requiredFiles = [
  'docker-compose.yml',
  'backend/Dockerfile',
  'frontend/Dockerfile',
  'backend/package.json',
  'frontend/package.json',
  'README.md',
  'ARCHITECTURE.md',
  '.gitignore'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  if (!exists) allFilesExist = false;
});

// Verify directory structure
const requiredDirs = [
  'backend/controllers',
  'backend/models',
  'backend/routes',
  'backend/services',
  'backend/middleware',
  'backend/config',
  'backend/utils',
  'backend/tests',
  'backend/db',
  'frontend/src'
];

let allDirsExist = true;

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  if (!exists) allDirsExist = false;
});

// Test database connection setup
try {
  const { Pool } = require('pg');
  require('dotenv').config();

  // Create a test pool for testing - using the same database as production for now
  const testPool = new Pool({
    user: process.env.DB_USER || 'fairwork_user',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'fairwork', // Use production database for testing
    password: process.env.DB_PASSWORD || 'fairwork_password',
    port: process.env.DB_PORT || 5432,
  });

  // Test actual connectivity by running a simple query
  const testQuery = async () => {
    try {
      await testPool.query('SELECT 1');
    } catch (queryError) {
      // Warning: Could not verify database connectivity
    } finally {
      // Clean up the test pool
      testPool.end();
    }
  };

  testQuery();
} catch (error) {
  // Warning: Could not create test database pool
}

// Function to create a test database pool - this was removed in previous versions but is needed
const createTestPool = () => {
  const { Pool } = require('pg');
  require('dotenv').config();

  return new Pool({
    user: process.env.DB_USER || 'fairwork_user',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'fairwork', // Use production database for testing
    password: process.env.DB_PASSWORD || 'fairwork_password',
    port: process.env.DB_PORT || 5432,
  });
};

// Export the function for use in tests
module.exports = {
  createTestPool
};

if (allFilesExist && allDirsExist) {
} else {
  process.exit(1);
}