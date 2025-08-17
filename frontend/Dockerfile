# Build stage - optimized for production
FROM node:20-alpine as builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Configure npm for optimization
RUN npm config set engine-strict false && \
    npm config set audit-level moderate && \
    npm config set fund false

# Install production dependencies only
RUN npm ci --only=production --no-audit --no-fund

# Install build dependencies
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the application with optimizations
RUN npm run build && \
    npm cache clean --force

# Development stage - optimized for dev workflow
FROM node:20-alpine as development

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm
RUN npm config set ignore-engines true

# Install all dependencies for development
RUN npm install --no-audit --no-fund && \
    npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose development port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# Production stage - minimal nginx setup
FROM nginx:alpine as production

# Install security updates
RUN apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    # Remove default nginx config
    rm -f /etc/nginx/conf.d/default.conf.bak && \
    # Create cache directories
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    # Remove unnecessary files
    rm -rf /usr/share/nginx/html/node_modules 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 