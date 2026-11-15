-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('homeowner', 'pro')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pros table
CREATE TABLE IF NOT EXISTS pros (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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

-- Create homeowners table
CREATE TABLE IF NOT EXISTS homeowners (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_services JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(100),
    estimated_duration INTEGER, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homeowner_id UUID REFERENCES homeowners(user_id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget_min NUMERIC(10,2),
    budget_max NUMERIC(10,2),
    location JSONB,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    pro_id UUID REFERENCES pros(user_id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_pros_user_id ON pros(user_id);
CREATE INDEX IF NOT EXISTS idx_pros_verified ON pros(verified);
CREATE INDEX IF NOT EXISTS idx_homeowners_user_id ON homeowners(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_homeowner_id ON jobs(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_service_id ON jobs(service_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_quotes_job_id ON quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_quotes_pro_id ON quotes(pro_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- Insert launch services (7 core services)
INSERT INTO services (name, description, category, estimated_duration) VALUES
('Pressure washing', 'Cleaning of surfaces using high-pressure water', 'Cleaning', 60),
('Window cleaning', 'Interior and exterior window cleaning', 'Cleaning', 45),
('Junk removal', 'Removal of household items and debris', 'Removal', 90),
('Drywall patch/repair', 'Repairing holes and damage in drywall', 'Repair', 120),
('Knob/lock install/replace', 'Installation or replacement of door hardware', 'Installation', 60),
('Tree/bush trimming', 'Pruning and trimming of trees and bushes', 'Landscaping', 90),
('Gutter cleaning', 'Cleaning of gutters and downspouts', 'Maintenance', 60)
ON CONFLICT (name) DO NOTHING;