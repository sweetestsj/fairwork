const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'fairwork_user',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'fairwork',
  password: process.env.DB_PASSWORD || 'fairwork_password',
  port: process.env.DB_PORT || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};