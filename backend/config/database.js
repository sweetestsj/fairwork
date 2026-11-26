const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool using DATABASE_URL if provided, otherwise fall back to DB_* env vars
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'fairwork_user',
      host: process.env.DB_HOST || 'db',
      database: process.env.DB_NAME || 'fairwork',
      password: process.env.DB_PASSWORD || 'fairwork_password',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    };

const pool = new Pool(poolConfig);

// Export the pool wrapped in a query function for compatibility with existing models
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};