# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p uploads/products && \
    chmod -R 755 uploads

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]

