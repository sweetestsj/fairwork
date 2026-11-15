#!/bin/bash

# Start the Docker containers
echo "Starting Docker containers..."
docker compose -p fairwork-swe up -d db backend

# Wait for the database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run tests
echo "Running tests..."
cd backend
npm test

# Stop containers
echo "Stopping containers..."
docker compose -p fairwork-swe down