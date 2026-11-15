const { Client } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fairwork_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Create a client for connecting to the database
const client = new Client(dbConfig);

/**
 * Initialize the database with required tables and data
 */
async function initDatabase() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Create tables
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) CHECK (role IN ('homeowner', 'pro')) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createProsTable = `
      CREATE TABLE IF NOT EXISTS pros (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        business_name VARCHAR(255),
        license_number VARCHAR(100),
        certificate_of_insurance TEXT,
        business_registration TEXT,
        verified BOOLEAN DEFAULT FALSE,
        rating NUMERIC(3,2) DEFAULT 0.00,
        completed_jobs INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createHomeownersTable = `
      CREATE TABLE IF NOT EXISTS homeowners (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        preferred_services JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createServicesTable = `
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        estimated_duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        homeowner_id UUID REFERENCES homeowners(user_id),
        service_id UUID REFERENCES services(id),
        title VARCHAR(255),
        description TEXT,
        budget_min NUMERIC(10,2),
        budget_max NUMERIC(10,2),
        location JSONB,
        status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createQuotesTable = `
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id),
        pro_id UUID REFERENCES pros(user_id),
        amount NUMERIC(10,2),
        description TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id),
        reviewer_id UUID REFERENCES users(id),
        reviewee_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Execute table creation queries
    await client.query(createUsersTable);
    await client.query(createProsTable);
    await client.query(createHomeownersTable);
    await client.query(createServicesTable);
    await client.query(createJobsTable);
    await client.query(createQuotesTable);
    await client.query(createReviewsTable);

    // Insert launch services if they don't exist
    const launchServices = [
      {
        name: 'Pressure washing',
        description: 'Professional pressure washing for driveways, patios, and siding',
        category: 'Cleaning',
        estimated_duration: 60
      },
      {
        name: 'Window cleaning',
        description: 'Interior and exterior window cleaning services',
        category: 'Cleaning',
        estimated_duration: 45
      },
      {
        name: 'Junk removal',
        description: 'Removal of household junk and debris',
        category: 'Removal',
        estimated_duration: 90
      },
      {
        name: 'Drywall patch/repair',
        description: 'Drywall repair and patching services',
        category: 'Repair',
        estimated_duration: 120
      },
      {
        name: 'Knob/lock install/replace',
        description: 'Installation or replacement of door knobs and locks',
        category: 'Installation',
        estimated_duration: 45
      },
      {
        name: 'Tree/bush trimming',
        description: 'Trimming and pruning of trees and bushes',
        category: 'Landscaping',
        estimated_duration: 90
      },
      {
        name: 'Gutter cleaning',
        description: 'Professional gutter cleaning and maintenance',
        category: 'Cleaning',
        estimated_duration: 60
      }
    ];

    for (const service of launchServices) {
      const checkServiceQuery = 'SELECT id FROM services WHERE name = $1';
      const checkResult = await client.query(checkServiceQuery, [service.name]);

      if (checkResult.rows.length === 0) {
        const insertServiceQuery = `
          INSERT INTO services (name, description, category, estimated_duration)
          VALUES ($1, $2, $3, $4)
        `;
        await client.query(insertServiceQuery, [
          service.name,
          service.description,
          service.category,
          service.estimated_duration
        ]);
        console.log(`Inserted service: ${service.name}`);
      }
    }

    console.log('Database initialized successfully');

    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the function for use in server.js
module.exports = { initDatabase };