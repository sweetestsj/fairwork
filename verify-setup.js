#!/usr/bin/env node

// Simple verification script to check if FairWork project is properly set up
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying FairWork project setup...\n');

// Check core files exist
const coreFiles = [
  'README.md',
  'ARCHITECTURE.md',
  'docker-compose.yml',
  'backend/server.js',
  'backend/package.json'
];

let allFilesExist = true;
coreFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('');

// Check backend structure
const backendDirs = [
  'backend/controllers',
  'backend/routes',
  'backend/tests',
  'backend/config'
];

let allDirsExist = true;
backendDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allDirsExist = false;
});

console.log('');

// Check that controllers exist
const controllerFiles = [
  'backend/controllers/users.controller.js',
  'backend/controllers/services.controller.js',
  'backend/controllers/jobs.controller.js',
  'backend/controllers/quotes.controller.js',
  'backend/controllers/reviews.controller.js'
];

let allControllersExist = true;
controllerFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allControllersExist = false;
});

console.log('');

// Check that routes exist
const routeFiles = [
  'backend/routes/users.routes.js',
  'backend/routes/services.routes.js',
  'backend/routes/jobs.routes.js',
  'backend/routes/quotes.routes.js',
  'backend/routes/reviews.routes.js'
];

let allRoutesExist = true;
routeFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allRoutesExist = false;
});

console.log('');

if (allFilesExist && allDirsExist && allControllersExist && allRoutesExist) {
  console.log('🎉 All FairWork project components are properly set up!');
  console.log('You can now run: docker-compose up --build');
} else {
  console.log('❌ Some files or directories are missing. Please check the setup.');
  process.exit(1);
}

console.log('\n📋 Project structure verification complete.');