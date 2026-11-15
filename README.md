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

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Database Schema

The database uses PostgreSQL and is configured with:
- User accounts (homeowners and pros)
- Service listings
- Job postings
- Reviews and ratings
- Pro credential verification