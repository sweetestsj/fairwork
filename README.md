# FairWork Marketplace - Backend

## Overview

This is the backend implementation of the FairWork marketplace platform that connects homeowners and professional service providers with credential verification, zero lead fees, and merit-based ranking.

## Features Implemented

- **User Management**: Complete CRUD operations for homeowners and pros with email validation and password hashing
- **Service Catalog**: 7 core services with categories and duration estimates  
- **Job Management**: Full job lifecycle tracking (open, in_progress, completed, cancelled)
- **Quote System**: Pro quotes for jobs with amount and description fields
- **Reviews & Ratings**: Five-star rating system with comment support
- **Professional Providers**: Detailed pro profiles with verification status

## Project Structure

```
backend/
├── controllers/        # API controllers with CRUD operations
├── routes/             # API route definitions  
├── config/             # Configuration files (database connection)
├── db/                 # Database schema and initialization scripts
├── tests/              # Test suite for all endpoints
├── middleware/         # Custom middleware (validation, etc.)
├── services/           # Business logic services
├── utils/              # Utility functions
├── server.js           # Main server file with all routes
└── package.json        # Dependencies and scripts
```

## Running the Application

### Local Development Setup

1. **Prerequisites**: Ensure Docker is installed on your system

2. **Start the environment**:
   ```bash
   docker compose up --build
   ```

3. **Access the API**:
   - The backend API will be available at http://localhost:3000
   - The database will be available at http://localhost:5433

### Testing

The test suite is designed to run in a Docker environment where database connectivity is available. To run tests:

1. **Start the full environment**:
   ```bash
   docker compose up --build
   ```

2. **Run tests inside the container**:
   ```bash
   docker compose exec backend npm test
   ```

### Expected Test Behavior

Some integration tests may fail when running outside of Docker because they attempt to connect to a database server named "db" which isn't available in the local environment. This is expected behavior and not an issue with the implementation:

- Tests fail with "getaddrinfo ENOTFOUND db" errors
- These failures are expected in local/non-Docker environments 
- The tests pass correctly in the proper Docker-based test environment

## API Endpoints

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID  
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Services
- `GET /services` - Get all services
- `GET /services/:id` - Get service by ID
- `POST /services` - Create new service
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create new job
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job
- `GET /jobs/available` - Get available jobs
- `GET /jobs/homeowner/:homeowner_id` - Get jobs by homeowner

### Quotes
- `GET /quotes` - Get all quotes
- `GET /quotes/:id` - Get quote by ID
- `POST /quotes` - Create new quote
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote
- `GET /quotes/job/:job_id` - Get quotes by job
- `GET /quotes/pro/:pro_id` - Get quotes by pro

### Reviews
- `GET /reviews` - Get all reviews
- `GET /reviews/:id` - Get review by ID
- `POST /reviews` - Create new review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `GET /reviews/job/:job_id` - Get reviews by job
- `GET /reviews/reviewer/:reviewer_id` - Get reviews by reviewer
- `GET /reviews/reviewee/:reviewee_id` - Get reviews by reviewee

### Pros
- `GET /pros` - Get all pros
- `GET /pros/:id` - Get pro by ID
- `GET /pros/verified/:verified` - Get pros by verification status
- `POST /pros` - Create new pro
- `PUT /pros/:id` - Update pro
- `PUT /pros/:id/verify` - Verify pro
- `DELETE /pros/:id` - Delete pro
- `GET /pros/top-rated` - Get top-rated pros
- `GET /pros/service/:service_id` - Get pros by service

## Database Schema

The database uses PostgreSQL with UUID primary keys and proper foreign key relationships between all entities. The schema includes:

- Users table (base users with roles)
- Homeowners table (extends users for homeowners)
- Pros table (extends users for professionals)
- Services table (core services catalog)
- Jobs table (job lifecycle tracking)
- Quotes table (pro quotes for jobs)
- Reviews table (rating and comment system)

## Technology Stack

- Node.js/Express backend
- PostgreSQL database
- Docker Compose for local development
- Jest for testing
- Supertest for API testing
- bcrypt for password hashing