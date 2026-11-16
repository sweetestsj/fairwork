# FairWork

A local-first home-services marketplace for Denton County homeowners and Dallas-Fort Worth (DFW) Pros where ranking is earned through completed work and verified reviews—never ad spend or lead fees.

## Project Structure

- `frontend/` - React-based web frontend
- `backend/` - Node.js/Express API backend with PostgreSQL database
- `docker-compose.yml` - Docker configuration for local development

## Getting Started

### Prerequisites

- Docker and Docker Compose installed

### Development Setup

1. Clone the repository
2. Run `docker-compose up --build` to start all services
3. The frontend will be available at http://localhost:3001
4. The backend API will be available at http://localhost:3000

## Features

- Local self-hosted stack (Docker Compose)
- Two-sided accounts: homeowners and pros
- Seven launch services
- Pro credential verification
- Zero lead fees & quote comparison
- Merit-based ranking system
- Verified reviews only

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Services
- `GET /api/services` - Get all active services
- `GET /api/services/:id` - Get a specific service

### Jobs
- `GET /api/jobs` - Get all jobs (with optional category filtering)
- `GET /api/jobs/category/:category` - Get jobs by category
- `GET /api/jobs/:id` - Get a specific job
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Cancel a job

## Database Schema

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete database schema documentation.

## Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Database Schema](DATABASE_SCHEMA.md)

## Testing

Run tests with:
```bash
cd backend && npm test
```

The project includes comprehensive tests for controllers, models, and routes.

## Project Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system architecture documentation.