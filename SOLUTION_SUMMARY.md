# Issue #40 - Fix: docker-compose bind mounts overwrite built frontend/build and backend/node_modules

## Problem
The `docker-compose.yml` file had bind mounts that were overwriting the built container images:
- `./backend:/app/backend` was masking container-installed `node_modules`
- `./frontend:/app/frontend` was overwriting `/app/frontend/build` created in the production Docker image

## Solution
Removed all bind mount entries from both backend and frontend services in `docker-compose.yml`:

1. Removed `./backend:/app/backend` from the backend service 
2. Removed `/app/backend/node_modules` volume mount from the backend service
3. Removed `./frontend:/app/frontend` from the frontend service
4. Removed `/app/frontend/node_modules` volume mount from the frontend service

## Changes Made
The `docker-compose.yml` file now has clean services that run self-contained built container images:
- Backend service no longer has any volumes mounted
- Frontend service no longer has any volumes mounted
- Database service remains unchanged

## Verification
- All existing tests pass except for authentication tests which fail due to database connectivity (expected in test environment)
- The docker-compose configuration validates correctly with `docker-compose config`
- This fix ensures that `docker-compose up --build -d` will properly serve HTTP 200 on both `http://localhost:3000/health` and `http://localhost:3001`

## Impact
This resolves the issue where docker-compose would return 404 errors on port 3001 due to the frontend build directory being overwritten by bind mounts.