FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of npm ci as requested in the issue
RUN npm install

# Copy source code
COPY . .

EXPOSE 3001

CMD ["npm", "start"]