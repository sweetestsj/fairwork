# FairWork Architecture

## Overview
FairWork is a local-first home-services marketplace that runs entirely on Docker Compose.

## Project Structure
The project has a simple structure with:
- `frontend/` - React-based web frontend
- `backend/` - Node.js/Express API backend with PostgreSQL database
- `docker-compose.yml` - Docker configuration for local development

## Technology Stack
- Frontend: React 18 with create-react-app
- Backend: Node.js 18, Express.js web framework, PostgreSQL database
- Testing: Jest and Supertest

## Local Development Setup
1. Ensure Docker and Docker Compose are installed
2. Clone the repository
3. Run `docker-compose up --build` to start all services
4. Access frontend at http://localhost:3001
5. Access backend API at http://localhost:3000