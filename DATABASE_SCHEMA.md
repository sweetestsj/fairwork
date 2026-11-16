# FairWork Database Schema

## Overview
This document describes the PostgreSQL database schema for FairWork, a local-first home-services marketplace. The schema supports two-sided accounts (homeowners and pros), service listings, job postings, reviews, and credential verification.

## Tables

### 1. users
Stores information about both homeowners and pros.
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('homeowner', 'pro')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. services
Lists the seven launch services offered by FairWork.
```sql
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. jobs
Represents job postings from homeowners.
```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    homeowner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pro_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 4. reviews
Stores verified reviews for completed jobs.
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. credentials
Stores pro credential verification documents.
```sql
CREATE TABLE credentials (
    id SERIAL PRIMARY KEY,
    pro_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    certificate_of_insurance_url VARCHAR(500),
    business_registration_url VARCHAR(500),
    government_id_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);
```

### 6. job_applications
Tracks pro applications for jobs.
```sql
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    pro_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quote DECIMAL(10,2),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Relationships

- Users can be either homeowners or pros (`user_type` field)
- Jobs are associated with a service and a homeowner
- Pro applications for jobs are tracked separately
- Reviews are between users who participated in a job
- Credentials store verification documents for pros

## Indexes

```sql
-- Indexes for performance
CREATE INDEX idx_jobs_service_id ON jobs(service_id);
CREATE INDEX idx_jobs_homeowner_id ON jobs(homeowner_id);
CREATE INDEX idx_jobs_pro_id ON jobs(pro_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_credentials_pro_id ON credentials(pro_id);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_pro_id ON job_applications(pro_id);
```