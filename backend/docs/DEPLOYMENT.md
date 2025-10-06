# Production Deployment Guide

This guide covers deploying the NeoForge backend to production environments.

## Prerequisites

### Required Software
- **Python**: 3.11+ (tested with 3.11 and 3.13)
- **PostgreSQL**: 15+ (for database)
- **Redis**: 7+ (for caching and session management)
- **Docker** (optional but recommended): Latest stable version

### System Requirements
- **RAM**: Minimum 2GB, recommended 4GB+
- **CPU**: 2+ cores recommended for production
- **Storage**: Minimum 10GB available (for logs, database, etc.)

## Environment Variables

### Critical Security Variables (REQUIRED)

```bash
# JWT Authentication Secret
# IMPORTANT: Must be at least 32 characters, cryptographically random
# Generate with: openssl rand -base64 32
SECRET_KEY=your-production-secret-key-min-32-chars

# Refresh Token Expiration (in days)
REFRESH_TOKEN_EXPIRE_DAYS=30

# Access Token Expiration (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=15
```

### Database Configuration (REQUIRED)

```bash
# PostgreSQL Database URL
# Format: postgresql+asyncpg://user:password@host:port/database
DATABASE_URL=postgresql+asyncpg://neoforge_user:secure_password@localhost:5432/neoforge_production

# Database Connection Pool Settings
DB_POOL_SIZE=20                  # Number of permanent connections
DB_MAX_OVERFLOW=10               # Maximum overflow connections
DB_POOL_TIMEOUT=30               # Connection timeout in seconds
DB_POOL_RECYCLE=3600            # Recycle connections after 1 hour
```

### Redis Configuration (REQUIRED)

```bash
# Redis URL for caching and session management
REDIS_URL=redis://localhost:6379/0

# Redis connection settings
REDIS_MAX_CONNECTIONS=50         # Maximum connection pool size
REDIS_SOCKET_TIMEOUT=5           # Socket timeout in seconds
REDIS_SOCKET_CONNECT_TIMEOUT=5   # Connection timeout in seconds
```

### Email Configuration (REQUIRED for notifications)

```bash
# SMTP Server Settings
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@example.com

# Email Template Settings
EMAIL_TEMPLATES_DIR=app/email-templates

# Email Provider Options
# Supported: smtp, sendgrid, ses, mailgun
EMAIL_PROVIDER=smtp
```

### External Service Integrations (OPTIONAL)

#### Stripe Payment Processing
```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Webhook endpoint
STRIPE_WEBHOOK_PATH=/api/v1/billing/stripe-webhook
```

#### OpenAI Integration
```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORG_ID=org-your-organization-id  # Optional
OPENAI_MODEL=gpt-4                       # Default model
```

### SAML SSO Configuration (OPTIONAL)

```bash
# SAML Identity Provider Certificate
# Base64 encoded X.509 certificate
SAML_IDP_CERTIFICATE=MIIDXTCCAkWgAwIBAgIJAK...

# SAML Metadata URL
SAML_IDP_METADATA_URL=https://idp.example.com/metadata

# SAML Entity ID
SAML_SP_ENTITY_ID=https://your-app.com/saml/metadata

# SAML ACS URL
SAML_ACS_URL=https://your-app.com/api/v1/auth/saml/acs

# SAML Security Settings
SAML_REQUIRE_SIGNED_ASSERTIONS=true
SAML_REQUIRE_ENCRYPTED_ASSERTIONS=false
SAML_SIGNATURE_ALGORITHM=RSA_SHA256
```

### Application Configuration

```bash
# Application Name
APP_NAME=NeoForge

# Environment
ENVIRONMENT=production           # Options: development, staging, production

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=NeoForge API
VERSION=1.0.0

# CORS Settings
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-domain.com

# Backend CORS - allow credentials
BACKEND_CORS_ALLOW_CREDENTIALS=true
```

### Monitoring and Logging

```bash
# Sentry Error Tracking (OPTIONAL)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1   # Sample 10% of transactions

# Logging Configuration
LOG_LEVEL=INFO                   # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json                  # Options: json, text
LOG_FILE=/var/log/neoforge/app.log

# Prometheus Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
```

### Feature Flags

```bash
# AI Features
AI_WORKFLOWS_ENABLED=true
AI_SMART_SUGGESTIONS_ENABLED=true

# Growth Features
GROWTH_ANALYTICS_ENABLED=true
AB_TESTING_ENABLED=true

# Multi-tenancy
MULTI_TENANT_ENABLED=true
```

## Deployment Steps

### Option 1: Docker Deployment (Recommended)

#### 1. Build the Docker Image

```bash
cd /path/to/backend
docker build -t neoforge-backend:latest .
```

#### 2. Run with Docker Compose

```bash
# Start all services (backend, postgres, redis)
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

#### 3. Run Database Migrations

```bash
# Run migrations in Docker container
docker-compose exec backend alembic upgrade head

# Or use docker run if not using compose
docker run --rm \
  --env-file .env.production \
  neoforge-backend:latest \
  alembic upgrade head
```

### Option 2: Manual Deployment

#### 1. Install Dependencies

```bash
cd /path/to/backend

# Install uv package manager (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies using uv
uv sync --frozen
```

#### 2. Run Database Migrations

```bash
# Activate virtual environment
source .venv/bin/activate

# Run migrations
alembic upgrade head

# Verify migration status
alembic current
```

#### 3. Start the Application

```bash
# Production deployment with Gunicorn + Uvicorn workers
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --loop uvloop \
  --log-level info \
  --access-log \
  --proxy-headers

# Or with Gunicorn (recommended for production)
gunicorn app.main:app \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --access-logfile - \
  --error-logfile - \
  --log-level info
```

### Option 3: Systemd Service (Linux)

#### 1. Create Systemd Service File

```bash
sudo nano /etc/systemd/system/neoforge-backend.service
```

```ini
[Unit]
Description=NeoForge Backend API
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=neoforge
Group=neoforge
WorkingDirectory=/opt/neoforge/backend
Environment="PATH=/opt/neoforge/backend/.venv/bin"
EnvironmentFile=/opt/neoforge/backend/.env.production
ExecStart=/opt/neoforge/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2. Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable neoforge-backend

# Start service
sudo systemctl start neoforge-backend

# Check status
sudo systemctl status neoforge-backend

# View logs
sudo journalctl -u neoforge-backend -f
```

## Health Checks

### Basic Health Check

```bash
# Check if application is running
curl http://localhost:8000/api/v1/health

# Expected response:
# {"status": "healthy"}
```

### Detailed System Health Check

```bash
# Requires authentication
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8000/api/v1/monitoring/health/system

# Expected response includes:
# - Database connectivity
# - Redis connectivity
# - Disk space
# - Memory usage
# - CPU usage
```

### Database Health Check

```bash
# Check database connection
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:8000/api/v1/monitoring/health/database

# Verify migration status
alembic current
alembic heads
```

## Post-Deployment Verification

### 1. Verify Environment Variables

```bash
# Create validation script (if not already created)
python scripts/validate_config.py
```

### 2. Run Health Checks

```bash
# Test all health endpoints
./scripts/health_check.sh
```

### 3. Verify Database Migrations

```bash
# Check current migration version
alembic current

# Should show: 20250919_1500_add_saml_sso_models (head)

# Verify all migrations applied
alembic history | grep -c "->.*head"  # Should return 1
```

### 4. Test API Endpoints

```bash
# Test user registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'
```

## Rollback Procedure

### Rolling Back Migrations

```bash
# Rollback to previous migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>

# Rollback all migrations (DANGER)
alembic downgrade base
```

### Rolling Back Application Version

#### Docker Deployment
```bash
# Stop current version
docker-compose down

# Deploy previous version
docker pull neoforge-backend:previous-tag
docker-compose up -d
```

#### Systemd Deployment
```bash
# Stop service
sudo systemctl stop neoforge-backend

# Restore previous code version (from backup or git)
cd /opt/neoforge/backend
git checkout previous-stable-tag

# Restart service
sudo systemctl start neoforge-backend
```

## Monitoring

### Prometheus Metrics

Access metrics endpoint:
```bash
curl http://localhost:8000/api/v1/monitoring/metrics/prometheus
```

Key metrics to monitor:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `db_pool_size` - Database connection pool usage
- `redis_operations_total` - Redis operation counts
- `active_users` - Currently active users

### Application Logs

```bash
# Docker logs
docker-compose logs -f backend

# Systemd logs
journalctl -u neoforge-backend -f

# File-based logs
tail -f /var/log/neoforge/app.log
```

### Database Performance

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check database size
SELECT pg_size_pretty(pg_database_size('neoforge_production'));
```

## Security Checklist

- [ ] `SECRET_KEY` is at least 32 characters and cryptographically random
- [ ] Database credentials use strong passwords
- [ ] Redis is not exposed to public internet
- [ ] HTTPS/TLS is enabled (via reverse proxy)
- [ ] CORS origins are restricted to known domains
- [ ] Rate limiting is configured
- [ ] Security headers are set (via reverse proxy)
- [ ] Database backups are automated and tested
- [ ] Secrets are not committed to version control
- [ ] Environment variables are properly secured
- [ ] SAML assertions are signed (if using SAML)

## Performance Tuning

### Database Optimization
```bash
# Increase shared_buffers (PostgreSQL)
# In postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
```

### Redis Optimization
```bash
# Increase max memory (redis.conf)
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Application Workers
```bash
# Calculate optimal worker count
# Workers = (2 x CPU cores) + 1
# For 4 CPU cores: 9 workers

uvicorn app.main:app --workers 9
```

## Backup and Disaster Recovery

### Database Backups

```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/neoforge
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/neoforge_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "neoforge_*.sql" -mtime +30 -delete
```

### Restore from Backup

```bash
# Restore database
psql $DATABASE_URL < /var/backups/neoforge/neoforge_20251007.sql

# Run migrations to ensure schema is current
alembic upgrade head
```

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Support

For additional support:
- GitHub Issues: https://github.com/your-org/neoforge/issues
- Documentation: https://docs.neoforge.dev
- Email: support@neoforge.dev
