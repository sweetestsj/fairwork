// This file is now only used to provide a connection pool - database initialization is handled by the migration scripts or via connection testing
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration - using environment variables from Docker compose
const pool = new Pool({
  user: process.env.DB_USER || 'fairwork_user',
  host: process.env.DB_HOST || 'db',  // Changed to 'db' to match Docker service name
  database: process.env.DB_NAME || 'fairwork',
  password: process.env.DB_PASSWORD || 'fairwork_password',
  port: process.env.DB_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};