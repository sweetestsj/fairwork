const { query } = require('../config/database');

/**
 * Initialize database tables if they don't exist
 */
async function initializeDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pros table
    await query(`
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
    `);

    // Create homeowners table
    await query(`
      CREATE TABLE IF NOT EXISTS homeowners (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        preferred_services JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(100),
        estimated_duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create jobs table
    await query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        homeowner_id UUID REFERENCES homeowners(user_id),
        service_id UUID REFERENCES services(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        budget_min NUMERIC(10,2),
        budget_max NUMERIC(10,2),
        location JSONB,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create quotes table
    await query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id),
        pro_id UUID REFERENCES pros(user_id),
        amount NUMERIC(10,2) NOT NULL,
        description TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES jobs(id),
        reviewer_id UUID REFERENCES users(id),
        reviewee_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    // If the database connection fails, we still want to continue for staging environments
    // where the initialization might be handled by other processes
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      console.warn('Database not accessible - continuing without initialization. This is expected in test/staging environments.');
      return;
    }
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = { initializeDatabase };