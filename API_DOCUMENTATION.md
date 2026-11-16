# FairWork API Documentation

## Overview
This document describes the RESTful API endpoints for FairWork, a local-first home-services marketplace.

## Base URL
All endpoints are relative to the base URL:
```
http://localhost:3000/api
```

## Authentication
Authentication is handled through JWT tokens. All protected routes require a valid `Authorization` header with the format:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### Health Check
**GET /** 
- Returns a welcome message
- Response: `{"message": "Welcome to FairWork API"}`

### Services
**GET /services**
- Retrieve all active services
- Response: 
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "id": 1,
      "name": "Pressure washing",
      "description": "Professional pressure washing services",
      "category": "cleaning",
      "is_active": true
    }
  ]
}
```

**GET /services/:id**
- Retrieve a specific service by ID
- Response: Same as GET /services but for one service

### Jobs
**GET /jobs**
- Get all jobs (with optional category filtering)
- Query Parameters:
  - `category` (optional): Filter jobs by service category
- Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "title": "Kitchen Sink Repair",
      "description": "Fix leaky kitchen sink",
      "service_id": 1,
      "homeowner_id": 1,
      "pro_id": null,
      "status": "open",
      "budget_min": 100.00,
      "budget_max": 200.00,
      "location": "Denton County",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

**GET /jobs/category/:category**
- Get all jobs by category
- Response: Same as GET /jobs

**GET /jobs/:id**
- Get a specific job by ID
- Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Kitchen Sink Repair",
    "description": "Fix leaky kitchen sink",
    "service_id": 1,
    "homeowner_id": 1,
    "pro_id": null,
    "status": "open",
    "budget_min": 100.00,
    "budget_max": 200.00,
    "location": "Denton County",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

**POST /jobs**
- Create a new job
- Request Body:
```json
{
  "title": "Kitchen Sink Repair",
  "description": "Fix leaky kitchen sink",
  "service_id": 1,
  "homeowner_id": 1,
  "budget_min": 100.00,
  "budget_max": 200.00,
  "location": "Denton County"
}
```
- Response: 
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Kitchen Sink Repair",
    "description": "Fix leaky kitchen sink",
    "service_id": 1,
    "homeowner_id": 1,
    "pro_id": null,
    "status": "open",
    "budget_min": 100.00,
    "budget_max": 200.00,
    "location": "Denton County",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

**PUT /jobs/:id**
- Update a job
- Request Body:
```json
{
  "title": "Updated Kitchen Sink Repair",
  "description": "Fix leaky kitchen sink and replace faucet",
  "service_id": 1,
  "budget_min": 150.00,
  "budget_max": 250.00
}
```
- Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Kitchen Sink Repair",
    "description": "Fix leaky kitchen sink and replace faucet",
    "service_id": 1,
    "homeowner_id": 1,
    "pro_id": null,
    "status": "open",
    "budget_min": 150.00,
    "budget_max": 250.00,
    "location": "Denton County",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

**DELETE /jobs/:id**
- Cancel a job
- Response:
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed

### Development Setup
1. Clone the repository
2. Run `docker-compose up --build` to start all services
3. The frontend will be available at http://localhost:3001
4. The backend API will be available at http://localhost:3000

## Testing
Run tests with:
```bash
cd backend && npm test
```

The project includes comprehensive tests for controllers, models, and routes.