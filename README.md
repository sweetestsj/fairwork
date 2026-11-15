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
- `GET /health` - Health check endpoint

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create a new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Services
- `GET /services` - Get all services
- `GET /services/:id` - Get service by ID
- `POST /services` - Create a new service
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### Jobs
- `GET /jobs` - Get all jobs
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create a new job
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job
- `GET /jobs/homeowner/:homeowner_id` - Get jobs by homeowner
- `GET /jobs/available` - Get available/open jobs

### Quotes
- `GET /quotes` - Get all quotes
- `GET /quotes/:id` - Get quote by ID
- `POST /quotes` - Create a new quote
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote
- `GET /quotes/job/:job_id` - Get quotes by job
- `GET /quotes/pro/:pro_id` - Get quotes by pro

### Reviews
- `GET /reviews` - Get all reviews
- `GET /reviews/:id` - Get review by ID
- `POST /reviews` - Create a new review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `GET /reviews/job/:job_id` - Get reviews by job
- `GET /reviews/reviewer/:reviewer_id` - Get reviews by reviewer
- `GET /reviews/reviewee/:reviewee_id` - Get reviews by reviewee

## Database Schema

The database uses PostgreSQL and is configured with:
- User accounts (homeowners and pros)
- Service listings
- Job postings
- Reviews and ratings
- Pro credential verification

## Technology Stack

### Frontend
- React 18 with create-react-app
- Axios for HTTP requests
- React Router for navigation

### Backend
- Node.js 18
- Express.js web framework
- PostgreSQL database
- Jest for testing
- Supertest for API testing

### Infrastructure
- Docker Compose for local development
- PostgreSQL 15