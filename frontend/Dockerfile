FROM node:22-alpine AS builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build Vite production bundle
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app/frontend

# Copy built Vite dist assets from builder stage
COPY --from=builder /app/frontend/dist ./dist

# Install serve for serving static SPA files
RUN npm install -g serve

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "3001"]