// Test setup script for FairWork project
const fs = require('fs');
const path = require('path');

console.log('Verifying FairWork project structure...');

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
  console.log(`${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('\nVerifying directory structure...');
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
  console.log(`${exists ? '✓' : '✗'} ${dir}`);
  if (!exists) allDirsExist = false;
});

// Test database connection setup
console.log('\nTesting database connection...');
try {
  const { Pool } = require('pg');
  require('dotenv').config();

  // Create a test pool for testing
  const testPool = new Pool({
    user: process.env.DB_USER || 'fairwork_user',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'fairwork',
    password: process.env.DB_PASSWORD || 'fairwork_password',
    port: process.env.DB_PORT || 5432,
  });

  console.log('✓ Database connection pool created successfully');

  // Test actual connectivity by running a simple query
  const testQuery = async () => {
    try {
      await testPool.query('SELECT 1');
      console.log('✓ Database connection verified successfully');
    } catch (queryError) {
      console.log('⚠ Warning: Could not verify database connectivity:', queryError.message);
    } finally {
      // Clean up the test pool
      testPool.end();
      console.log('✓ Test database pool cleaned up');
    }
  };

  testQuery();
} catch (error) {
  console.log('⚠ Warning: Could not create test database pool:', error.message);
}

if (allFilesExist && allDirsExist) {
  console.log('\n✅ All project files and directories created successfully!');
  console.log('You can now run: docker-compose up --build');
} else {
  console.log('\n❌ Some files or directories are missing');
  process.exit(1);
}

console.log('\n✅ Test setup verification complete');