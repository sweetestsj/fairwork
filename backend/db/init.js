const { query } = require('../config/database');

const LAUNCH_SERVICES = [
  {
    name: 'Pressure Washing',
    description: 'High-pressure exterior cleaning for driveways, sidewalks, patios, decks, and siding.',
    category: 'Exterior Cleaning',
    estimated_duration: 120,
  },
  {
    name: 'Window Cleaning',
    description: 'Interior and exterior window washing, including screens and sills.',
    category: 'Exterior Cleaning',
    estimated_duration: 90,
  },
  {
    name: 'Junk Removal',
    description: 'Hauling and responsible disposal of unwanted furniture, appliances, yard waste, and household clutter.',
    category: 'Hauling & Cleanup',
    estimated_duration: 90,
  },
  {
    name: 'Drywall Patch & Repair',
    description: 'Patching, taping, mudding, and texture matching for drywall holes, cracks, and wall damage.',
    category: 'Interior Repair',
    estimated_duration: 120,
  },
  {
    name: 'Knob & Lock Install/Replace',
    description: 'Installation or replacement of door knobs, deadbolts, smart locks, and residential door hardware.',
    category: 'Handyman & Hardware',
    estimated_duration: 60,
  },
  {
    name: 'Tree & Bush Trimming',
    description: 'Pruning, shaping, and trimming of residential trees, shrubs, hedges, and bushes.',
    category: 'Lawn & Yard',
    estimated_duration: 120,
  },
  {
    name: 'Gutter Cleaning',
    description: 'Clearing leaves and debris from roof gutters and downspouts to ensure proper drainage.',
    category: 'Exterior Cleaning',
    estimated_duration: 90,
  },
];

/**
 * Initialize database tables and seed launch services idempotently.
 */
async function initializeDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
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

    // Ensure users.name exists on pre-existing databases
    await query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
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
        homeowner_id UUID REFERENCES users(id),
        service_id UUID REFERENCES services(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        budget NUMERIC(10,2),
        budget_min NUMERIC(10,2),
        budget_max NUMERIC(10,2),
        location JSONB,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure jobs.budget exists and homeowner_id references users(id) on pre-existing databases
    await query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2);
    `);

    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_class r ON c.confrelid = r.oid
          WHERE t.relname = 'jobs'
            AND c.conname = 'jobs_homeowner_id_fkey'
            AND r.relname = 'homeowners'
        ) THEN
          ALTER TABLE jobs DROP CONSTRAINT jobs_homeowner_id_fkey;
          ALTER TABLE jobs ADD CONSTRAINT jobs_homeowner_id_fkey FOREIGN KEY (homeowner_id) REFERENCES users(id);
        END IF;
      END $$;
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

    // Idempotently seed the 7 launch services from PRODUCT.md
    for (const service of LAUNCH_SERVICES) {
      await query(
        `
          INSERT INTO services (name, description, category, estimated_duration)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (name) DO NOTHING;
        `,
        [service.name, service.description, service.category, service.estimated_duration]
      );
    }

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

module.exports = { initializeDatabase, LAUNCH_SERVICES };