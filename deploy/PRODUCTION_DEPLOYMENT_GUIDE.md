# NeoForge Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying NeoForge to production with optimized performance, cost-efficiency, and zero-downtime deployment capabilities.

## Prerequisites

### System Requirements

**Minimum VPS Specifications:**
- 2 vCPU cores
- 4GB RAM
- 80GB SSD storage
- 2TB bandwidth/month
- Ubuntu 20.04+ or Debian 11+

**Required Software:**
- Docker 24.0+
- Docker Compose 2.20+
- Git 2.30+
- curl, wget, jq
- SSL certificate (Let's Encrypt recommended)

### Environment Setup

1. **Update System:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq unzip
```

2. **Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

3. **Install Docker Compose:**
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Deployment Options

### Option 1: Standard Production Deployment

**Best for**: 100-1000 users, standard requirements

```bash
# Clone repository
git clone <repository-url>
cd neoforge-starter

# Set up environment
cp .env.example .env.production
nano .env.production  # Configure production values

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Blue-Green Deployment (Recommended)

**Best for**: Zero-downtime deployments, production environments

```bash
# Deploy with blue-green strategy
./deploy/scripts/deploy.sh

# Monitor deployment
docker-compose -f deploy/docker-compose.blue-green.yml logs -f
```

### Option 3: Monitoring Stack

**Best for**: Production observability and cost monitoring

```bash
# Start monitoring services
docker-compose -f deploy/docker-compose.monitoring.yml up -d

# Access dashboards
echo "Grafana: http://localhost:3000 (admin/admin)"
echo "Prometheus: http://localhost:9090"
echo "AlertManager: http://localhost:9093"
```

## Environment Configuration

### Production Environment Variables

Create `/home/deploy/neoforge/.env.production`:

```bash
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generate-random-32-char-string>
CORS_ORIGINS=["https://yourdomain.com"]

# Database
DATABASE_URL=postgresql://postgres:<password>@db:5432/neoforge
POSTGRES_PASSWORD=<generate-secure-password>

# Redis
REDIS_URL=redis://cache:6379/0
REDIS_PASSWORD=<generate-secure-password>

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=neoforge@yourdomain.com
SMTP_PASSWORD=<smtp-password>

# Frontend
VITE_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Monitoring
GRAFANA_PASSWORD=<generate-secure-password>
GRAFANA_ROOT_URL=https://grafana.yourdomain.com
ALERTMANAGER_URL=https://alerts.yourdomain.com

# SSL/TLS
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Security Configuration

1. **Generate Secure Secrets:**
```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate passwords
openssl rand -base64 32
```

2. **Set File Permissions:**
```bash
chmod 600 .env.production
chown deploy:deploy .env.production
```

3. **Configure Firewall:**
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable
```

## SSL/TLS Setup

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. **Obtain Certificate:**
```bash
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

3. **Configure Auto-Renewal:**
```bash
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontee -l - | sudo crontab -
```

### SSL Configuration for Docker

Update `docker-compose.prod.yml` to include SSL:

```yaml
  nginx-proxy:
    image: nginxproxy/nginx-proxy:1.4
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - /etc/letsencrypt:/etc/nginx/certs:ro
      - nginx_vhosts:/etc/nginx/vhost.d
      - nginx_html:/usr/share/nginx/html
    environment:
      - DEFAULT_HOST=yourdomain.com
    restart: unless-stopped
```

## Database Setup

### Initial Database Setup

1. **Run Migrations:**
```bash
docker-compose -f docker-compose.prod.yml run --rm api alembic upgrade head
```

2. **Create Admin User:**
```bash
docker-compose -f docker-compose.prod.yml run --rm api python -c "
from app.db.init_db import init_db
init_db()
"
```

### Database Backup Strategy

1. **Automated Backups:**
```bash
#!/bin/bash
# /home/deploy/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR

docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres neoforge > $BACKUP_DIR/neoforge_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "neoforge_*.sql" -mtime +7 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/neoforge_$DATE.sql s3://your-bucket/backups/
```

2. **Schedule Backups:**
```bash
echo "0 2 * * * /home/deploy/scripts/backup-db.sh" | crontab -
```

## Monitoring & Alerting

### Health Check Endpoints

- **Frontend**: `http://localhost:80/health`
- **API**: `http://localhost:8000/health`
- **Database**: PostgreSQL connection test
- **Cache**: Redis ping test

### Grafana Dashboard Setup

1. **Access Grafana:**
   - URL: `http://localhost:3000`
   - Login: admin / (see GRAFANA_PASSWORD)

2. **Import Dashboards:**
   - API Overview: `deploy/grafana/dashboards/api-overview.json`
   - System Metrics: `deploy/grafana/dashboards/system-metrics.json`
   - Cost Monitoring: `deploy/grafana/dashboards/email-metrics.json`

### Alert Configuration

Key alerts configured in `deploy/prometheus/rules/alerts.yml`:

- High CPU usage (>80% for 5 minutes)
- High memory usage (>90% for 2 minutes)
- API response time >500ms
- Database connection issues
- Disk space <10% free
- High 5xx error rate

## Deployment Procedures

### Standard Deployment

1. **Prepare Deployment:**
```bash
# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build

# Run tests
docker-compose -f docker-compose.prod.yml run --rm api_test pytest -q
```

2. **Deploy:**
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
./deploy/scripts/health-check.sh
```

### Zero-Downtime Deployment

1. **Automated Deployment:**
```bash
# Deploy new version
./deploy/scripts/deploy.sh

# Monitor deployment
./deploy/scripts/deploy.sh --dry-run  # Preview changes
```

2. **Manual Blue-Green Deployment:**
```bash
# Start monitoring
docker-compose -f deploy/docker-compose.monitoring.yml up -d

# Deploy to green slot
./deploy/scripts/deploy.sh --target green

# Verify green slot
curl -f http://localhost:8080/health

# Switch traffic
./deploy/scripts/deploy.sh --switch-traffic

# Verify production
curl -f http://yourdomain.com/health
```

### Rollback Procedure

1. **Automatic Rollback:**
```bash
./deploy/scripts/deploy.sh --rollback
```

2. **Manual Rollback:**
```bash
# Switch back to blue slot
docker-compose -f deploy/docker-compose.blue-green.yml \
  exec traefik curl -X PUT localhost:8080/api/http/routers/frontend-blue

# Scale up blue, down green
docker-compose -f deploy/docker-compose.blue-green.yml \
  up -d --scale frontend-blue=2 --scale frontend-green=0
```

## Performance Optimization

### Database Optimization

1. **Index Analysis:**
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;

-- Analyze slow queries
SELECT query, total_time, calls, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

2. **Connection Pooling:**
   - Configure in `deploy/postgres/postgresql.conf`
   - Monitor connection usage in Grafana

### Cache Optimization

1. **Redis Configuration:**
   - Memory limit: 200MB (configured)
   - Eviction policy: allkeys-lru (configured)
   - Persistence: Optimized for small deployments

2. **Application Caching:**
   - API response caching
   - Database query caching
   - Static asset caching

### Frontend Optimization

1. **Nginx Configuration:**
   - Gzip compression enabled
   - Static asset caching (1 year)
   - Security headers configured

2. **Build Optimization:**
   - Tree shaking enabled
   - Code splitting configured
   - Asset minification

## Troubleshooting

### Common Issues

1. **Container Won't Start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check resource usage
docker stats

# Check disk space
df -h
```

2. **Database Connection Issues:**
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

3. **High Memory Usage:**
```bash
# Check memory usage by service
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Restart memory-heavy services
docker-compose -f docker-compose.prod.yml restart service-name
```

### Log Analysis

1. **Centralized Logging:**
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f api

# Search logs
docker-compose -f docker-compose.prod.yml logs | grep ERROR
```

2. **Log Rotation:**
   - Configured in docker-compose files
   - Max size: 10-50MB per service
   - Max files: 3 per service

## Security Hardening

### Container Security

1. **Security Scanning:**
```bash
# Scan images for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image neoforge-api:latest
```

2. **Runtime Security:**
   - All containers run as non-root users
   - Read-only file systems where possible
   - Security contexts configured

### Network Security

1. **Firewall Configuration:**
```bash
# Restrict access to specific services
sudo ufw allow from <trusted-ip> to any port 3000  # Grafana
sudo ufw allow from <trusted-ip> to any port 9090  # Prometheus
```

2. **Network Isolation:**
   - Services run in isolated Docker networks
   - Internal communication only where needed
   - External access restricted to necessary ports

## Maintenance Tasks

### Daily Tasks (Automated)

- Health checks
- Log rotation
- Backup verification
- Resource monitoring

### Weekly Tasks

- Security updates
- Performance review
- Cost analysis
- Backup testing

### Monthly Tasks

- Dependency updates
- Security audit
- Performance optimization
- Capacity planning

## Disaster Recovery

### Backup Strategy

1. **Database Backups:**
   - Automated daily backups
   - Off-site storage (S3 or equivalent)
   - Point-in-time recovery capability

2. **Application Backups:**
   - Git repository (source code)
   - Docker images (registry)
   - Configuration files

### Recovery Procedures

1. **Complete System Recovery:**
```bash
# Restore from backup
./deploy/scripts/restore.sh --date 2024-01-15

# Verify restoration
./deploy/scripts/health-check.sh
```

2. **Partial Recovery:**
   - Database restoration: `pg_restore`
   - Application rollback: Blue-green deployment
   - Configuration recovery: Git checkout

## Cost Monitoring

### Resource Tracking

1. **Automated Cost Reporting:**
   - Daily resource usage reports
   - Monthly cost projections
   - Alert on budget overruns

2. **Optimization Opportunities:**
   - Identify underutilized resources
   - Right-size container limits
   - Optimize storage usage

### Scaling Triggers

- CPU usage >80% for 10 minutes: Scale up
- Memory usage >90% for 5 minutes: Scale up
- Response time >500ms: Investigate/scale
- Cost >$15/month: Review and optimize

## Support & Escalation

### Monitoring Alerts

1. **Critical Alerts (Immediate Action):**
   - Service down
   - Database unavailable
   - High error rate (>5%)

2. **Warning Alerts (24h Response):**
   - High resource usage
   - Slow response times
   - Security vulnerabilities

3. **Info Alerts (Weekly Review):**
   - Performance trends
   - Cost tracking
   - Capacity planning

### Escalation Procedures

1. **Level 1**: Automated recovery attempts
2. **Level 2**: Manual intervention required
3. **Level 3**: Expert consultation needed

For support, check:
- Application logs
- System metrics
- Health check endpoints
- This documentation

---

**Last Updated**: 2025-08-14
**Version**: 1.0
**Maintained By**: NeoForge DevOps Team
