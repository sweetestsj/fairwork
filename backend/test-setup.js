// Simple test script to verify setup
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

if (allFilesExist && allDirsExist) {
  console.log('\n✅ All project files and directories created successfully!');
  console.log('You can now run: docker-compose up --build');
} else {
  console.log('\n❌ Some files or directories are missing');
  process.exit(1);
}