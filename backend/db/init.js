const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, 'init.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function initDatabase() {
  try {
    console.log('Initializing database schema...');

    // Execute the schema SQL
    await query(schemaSql);

    console.log('✅ Database schema initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    // Log more details for debugging
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };