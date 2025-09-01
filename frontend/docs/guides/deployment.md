# Deployment Guide

## Overview

NeoForge uses Docker for all deployments, with separate configurations for development and production environments. This guide covers deployment procedures for both scenarios.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Access to deployment environment
- Required environment variables

## Development Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/neoforge.git
   cd neoforge
   ```

2. **Start development environment:**
   ```bash
   docker-compose up
   ```
   This will start:
   - Frontend dev server (http://localhost:3000)
   - API server (http://localhost:8000)
   - PostgreSQL database
   - Redis cache
   - Test runners in watch mode

3. **Run tests:**
   ```bash
   docker-compose run frontend_test
   docker-compose run api_test
   ```

## Production Deployment

1. **Build production images:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Set environment variables:**
   ```bash
   # Frontend
   export NODE_ENV=production
   export VITE_API_URL=https://api.your-domain.com

   # Backend
   export ENVIRONMENT=production
   export DATABASE_URL=postgresql://user:pass@db:5432/neoforge
   export REDIS_URL=redis://cache:6379/0
   ```

3. **Deploy to production:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify deployment:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

## Infrastructure Setup

### Digital Ocean Droplet
- Size: Basic Droplet ($10/month)
- Region: Choose closest to target users
- OS: Ubuntu 22.04 LTS

### Domain & SSL
1. **Configure Cloudflare:**
   - Add domain to Cloudflare
   - Enable HTTPS
   - Configure caching rules

2. **SSL Setup:**
   ```bash
   # Install certbot
   apt-get update
   apt-get install certbot

   # Generate certificate
   certbot certonly --standalone -d your-domain.com
   ```

### Monitoring
1. **Setup monitoring:**
   ```bash
   # Install monitoring tools
   apt-get install prometheus node-exporter

   # Configure Prometheus
   vim /etc/prometheus/prometheus.yml
   ```

2. **Configure alerts:**
   ```yaml
   alerting:
     alertmanagers:
       - static_configs:
           - targets: ['localhost:9093']
   ```

## CI/CD Pipeline

### GitHub Actions Setup
1. Add secrets to GitHub repository:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `DEPLOY_KEY`
   - `PRODUCTION_HOST`

2. Configure workflow:
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy to Production
           run: |
             echo "${{ secrets.DEPLOY_KEY }}" > deploy_key
             chmod 600 deploy_key
             ssh -i deploy_key user@${{ secrets.PRODUCTION_HOST }} "cd /app && git pull && docker-compose -f docker-compose.prod.yml up -d"
   ```

## Performance Optimization

1. **Enable Cloudflare caching:**
   - Configure page rules
   - Enable auto-minification
   - Setup edge caching

2. **Configure Nginx caching:**
   ```nginx
   # /etc/nginx/conf.d/default.conf
   location /assets/ {
       expires 1y;
       add_header Cache-Control "public, no-transform";
   }
   ```

3. **Enable Gzip compression:**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/javascript;
   gzip_min_length 1000;
   ```

## Backup & Recovery

1. **Database backups:**
   ```bash
   # Backup script
   #!/bin/bash
   docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres neoforge > backup.sql
   ```

2. **Setup automated backups:**
   ```bash
   # Add to crontab
   0 0 * * * /path/to/backup-script.sh
   ```

3. **Recovery procedure:**
   ```bash
   # Restore from backup
   docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres neoforge < backup.sql
   ```

## Troubleshooting

### Common Issues

1. **Container Health Checks Failing:**
   ```bash
   # Check container logs
   docker-compose -f docker-compose.prod.yml logs [service_name]

   # Verify network connectivity
   docker-compose -f docker-compose.prod.yml exec [service_name] ping [target_service]
   ```

2. **Performance Issues:**
   ```bash
   # Check resource usage
   docker stats

   # Monitor application metrics
   docker-compose -f docker-compose.prod.yml exec frontend npm run analyze
   ```

3. **Database Connection Issues:**
   ```bash
   # Verify database connection
   docker-compose -f docker-compose.prod.yml exec api python -c "from app.db import check_connection; check_connection()"
   ```

### Recovery Procedures

1. **Rollback to Previous Version:**
   ```bash
   # Get previous image
   docker-compose -f docker-compose.prod.yml pull

   # Rollback
   docker-compose -f docker-compose.prod.yml up -d --no-deps [service_name]
   ```

2. **Emergency Procedures:**
   ```bash
   # Stop all services
   docker-compose -f docker-compose.prod.yml down

   # Start essential services only
   docker-compose -f docker-compose.prod.yml up -d db cache
   docker-compose -f docker-compose.prod.yml up -d api frontend
   ```

## Security Considerations

1. **Container Security:**
   - Use non-root users
   - Implement resource limits
   - Regular security updates

2. **Application Security:**
   - Enable CSP headers
   - Configure CORS properly
   - Implement rate limiting

3. **Infrastructure Security:**
   - Configure firewall rules
   - Enable audit logging
   - Regular security scans

## Maintenance

1. **Regular Updates:**
   ```bash
   # Update containers
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Log Rotation:**
   ```bash
   # Configure logrotate
   vim /etc/logrotate.d/docker-logs
   ```

3. **Monitoring Checks:**
   ```bash
   # Check system resources
   docker system df
   docker system prune -a --volumes
   ```
