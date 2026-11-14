# FairWork Architecture

## Overview
FairWork is a local-first home-services marketplace that runs entirely on Docker Compose. The system consists of:
- A React frontend for user interaction
- A Node.js/Express backend API
- PostgreSQL database for data persistence
- Object storage for file uploads (certificate of insurance, business registration)

## Project Structure

```
fairwork/
├── docker-compose.yml          # Docker configuration
├── README.md                   # Project documentation
├── .gitignore                  # Git ignore rules
├── frontend/                   # React frontend
│   ├── Dockerfile              # Frontend Dockerfile
│   ├── package.json            # Frontend dependencies
│   └── src/                    # Frontend source code
├── backend/                    # Node.js/Express backend
│   ├── Dockerfile              # Backend Dockerfile
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Main server file
│   ├── config/                 # Configuration files
│   │   └── database.js         # Database connection
│   ├── db/                     # Database schema and migrations
│   │   └── schema.md           # Database schema documentation
│   ├── controllers/            # Request handlers
│   ├── models/                 # Data models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   ├── middleware/             # Express middleware
│   └── tests/                  # Test files
└── .env                        # Environment variables (not committed)
```

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

## Local Development Setup

1. Ensure Docker and Docker Compose are installed
2. Clone the repository
3. Run `docker-compose up --build` to start all services
4. Access frontend at http://localhost:3001
5. Access backend API at http://localhost:3000

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory with:
- DB_USER=fairwork_user
- DB_NAME=fairwork
- DB_PASSWORD=fairwork_password
- DB_HOST=db
- DB_PORT=5432