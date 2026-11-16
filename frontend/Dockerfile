FROM node:18-alpine as builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app/frontend

# Copy built files from builder stage
COPY --from=builder /app/frontend/build ./build

# Install serve for serving static files
RUN npm install -g serve

# Expose port
EXPOSE 3001

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3001"]