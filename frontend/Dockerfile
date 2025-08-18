# Build stage - optimized for production
FROM oven/bun:1.0-alpine AS builder

WORKDIR /app

# Copy package files for better caching
COPY package*.json bun.lock* ./

# Copy source code (but excluding problematic directories via .dockerignore)  
COPY . .

# Remove the problematic local eslint plugin dependency for Docker builds
RUN apk add --no-cache jq && \
    jq 'del(.devDependencies["eslint-plugin-component-registry"])' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    rm -f bun.lock && \
    apk del jq

# Install dependencies (dev dependencies needed for build)
RUN bun install

# Build the application with optimizations
RUN bun run build

# Development stage - optimized for dev workflow
FROM oven/bun:1.0-alpine AS development

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json bun.lock* ./

# Copy source code
COPY . .

# Remove the problematic local eslint plugin dependency for Docker builds
RUN apk add --no-cache jq && \
    jq 'del(.devDependencies["eslint-plugin-component-registry"])' package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    rm -f bun.lock && \
    apk del jq

# Install all dependencies for development
RUN bun install

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
CMD ["bun", "run", "dev"]

# Production stage - minimal nginx setup
FROM nginx:alpine AS production

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