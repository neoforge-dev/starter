# Email System Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the NeoForge Email System to production environments. It covers configuration, security, monitoring, and operational considerations for a robust production deployment.

## Prerequisites

### Infrastructure Requirements

**Minimum Requirements:**
- **CPU**: 2 vCPUs per service instance
- **RAM**: 4GB per API instance, 2GB per worker instance
- **Storage**: 50GB SSD for database, 10GB for application
- **Network**: Reliable internet connection with low latency to email providers

**Recommended Production Setup:**
- **API Servers**: 3+ instances behind load balancer
- **Email Workers**: 2+ instances for redundancy
- **Database**: PostgreSQL 13+ with replication
- **Cache**: Redis 6+ with persistence
- **Load Balancer**: NGINX or cloud load balancer
- **Monitoring**: Prometheus + Grafana or equivalent

### Software Requirements

- **Python**: 3.11 or higher
- **PostgreSQL**: 13 or higher
- **Redis**: 6 or higher
- **Docker**: 20.10 or higher (if using containers)
- **Kubernetes**: 1.21+ (if using K8s)

## Production Configuration

### 1. Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# =============================================================================
# CORE APPLICATION SETTINGS
# =============================================================================

# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Application
PROJECT_NAME="NeoForge Email System"
API_V1_STR="/api/v1"
COMPANY_NAME="Your Company Name"
SUPPORT_EMAIL="support@yourcompany.com"

# Security
SECRET_KEY="your-256-bit-secret-key-here-change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Primary Database
DATABASE_URL="postgresql+asyncpg://username:password@db-host:5432/neoforge_prod?sslmode=require"

# Connection Pool Settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=3600

# Read Replica (Optional)
DATABASE_READ_URL="postgresql+asyncpg://username:password@db-read-host:5432/neoforge_prod?sslmode=require"

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================

# Redis URL with authentication
REDIS_URL="redis://:password@redis-host:6379/0"

# Redis Connection Pool
REDIS_POOL_SIZE=20
REDIS_SOCKET_TIMEOUT=5
REDIS_SOCKET_CONNECT_TIMEOUT=5
REDIS_RETRY_ON_TIMEOUT=true

# =============================================================================
# EMAIL PROVIDER CONFIGURATION
# =============================================================================

# Email Provider (sendgrid, smtp, ses)
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_WEBHOOK_SECRET="your-webhook-secret-256-bits"

# SMTP Configuration (if using SMTP)
SMTP_SERVER="smtp.yourprovider.com"
SMTP_PORT=587
SMTP_USERNAME="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_TIMEOUT=30

# Email Settings
FROM_EMAIL="noreply@yourcompany.com"
FROM_NAME="Your Company"
REPLY_TO_EMAIL="support@yourcompany.com"

# =============================================================================
# EMAIL WORKER CONFIGURATION
# =============================================================================

# Worker Settings
EMAIL_WORKER_INTERVAL=1.0
EMAIL_WORKER_ERROR_INTERVAL=5.0
EMAIL_WORKER_MAX_RETRIES=3
EMAIL_WORKER_BATCH_SIZE=10
EMAIL_WORKER_TIMEOUT=300

# Queue Settings
EMAIL_QUEUE_NAME="email_queue"
EMAIL_QUEUE_PRIORITY_HIGH=1
EMAIL_QUEUE_PRIORITY_NORMAL=2
EMAIL_QUEUE_PRIORITY_LOW=3

# Retry Settings
EMAIL_RETRY_DELAY=60
EMAIL_RETRY_MAX_DELAY=3600
EMAIL_RETRY_EXPONENTIAL_BASE=2

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# Token Expiration
EMAIL_VERIFICATION_EXPIRE_HOURS=24
PASSWORD_RESET_EXPIRE_HOURS=24
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
RATE_LIMIT_PER_DAY=10000

# CORS Settings
ALLOWED_ORIGINS="https://yourapp.com,https://admin.yourapp.com"
ALLOWED_METHODS="GET,POST,PUT,DELETE,OPTIONS"
ALLOWED_HEADERS="*"

# Webhook Security
WEBHOOK_TIMEOUT=30
WEBHOOK_MAX_RETRIES=3

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================

# Metrics
ENABLE_METRICS=true
METRICS_PORT=8001
METRICS_PATH="/metrics"

# Health Checks
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_TIMEOUT=10

# Logging
LOG_FORMAT=json
LOG_LEVEL=INFO
LOG_FILE="/var/log/neoforge/email-system.log"
LOG_MAX_SIZE=100MB
LOG_BACKUP_COUNT=5

# Sentry (Error Tracking)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE="1.0.0"

# =============================================================================
# OPERATIONAL SETTINGS
# =============================================================================

# Graceful Shutdown
GRACEFUL_SHUTDOWN_TIMEOUT=30

# File Upload
MAX_FILE_SIZE=10MB
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf,doc,docx"

# Request Timeouts
REQUEST_TIMEOUT=30
KEEPALIVE_TIMEOUT=5

# Worker Process Settings
WORKER_PROCESSES=4
WORKER_CONNECTIONS=1000
```

### 2. Database Configuration

#### PostgreSQL Production Setup

```sql
-- Create production database
CREATE DATABASE neoforge_prod 
    WITH ENCODING 'UTF8' 
    LC_COLLATE='en_US.UTF-8' 
    LC_CTYPE='en_US.UTF-8';

-- Create application user
CREATE USER neoforge_app WITH PASSWORD 'secure-password-here';

-- Grant permissions
GRANT CONNECT ON DATABASE neoforge_prod TO neoforge_app;
GRANT USAGE ON SCHEMA public TO neoforge_app;
GRANT CREATE ON SCHEMA public TO neoforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neoforge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neoforge_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO neoforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO neoforge_app;
```

#### Database Optimization

```sql
-- Performance tuning for production
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Connection settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET max_prepared_transactions = 100;

-- Logging
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Reload configuration
SELECT pg_reload_conf();
```

#### Database Backup Strategy

```bash
#!/bin/bash
# /opt/neoforge/scripts/backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/neoforge/backups"
DB_NAME="neoforge_prod"
DB_USER="neoforge_app"
DB_HOST="localhost"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/neoforge_full_$DATE.backup"

# Schema-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -s -f "$BACKUP_DIR/neoforge_schema_$DATE.sql"

# Compress backups older than 1 day
find $BACKUP_DIR -name "*.backup" -mtime +1 -exec gzip {} \;

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.backup.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 3. Redis Configuration

#### Redis Production Config (`/etc/redis/redis.conf`):

```conf
# Network
bind 127.0.0.1
port 6379
timeout 300
keepalive 300

# Security
requirepass your-strong-redis-password-here
rename-command FLUSHALL ""
rename-command FLUSHDB ""
rename-command CONFIG e5a5c8d3

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Persistence
save 900 1
save 300 10
save 60 10000

# AOF
appendonly yes
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Performance
tcp-keepalive 300
databases 16
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
syslog-enabled yes
syslog-ident redis

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128
```

### 4. Email Provider Setup

#### SendGrid Configuration

1. **API Key Setup:**
   ```bash
   # Create SendGrid API key with full access
   # Store in environment variables, never in code
   SENDGRID_API_KEY="SG.your-api-key-here"
   ```

2. **Domain Authentication:**
   ```bash
   # Add these DNS records to your domain:
   # CNAME: em1234.yourdomain.com → u1234.wl.sendgrid.net
   # CNAME: s1._domainkey.yourdomain.com → s1.domainkey.u1234.wl.sendgrid.net
   # CNAME: s2._domainkey.yourdomain.com → s2.domainkey.u1234.wl.sendgrid.net
   ```

3. **Webhook Configuration:**
   ```bash
   # Configure webhook endpoint in SendGrid:
   # URL: https://yourapi.com/api/v1/webhooks/sendgrid
   # HTTP Method: POST
   # Events: delivered, bounce, open, click, spam_report, unsubscribe
   ```

#### SMTP Configuration (Alternative)

```bash
# Example for Google Workspace
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="noreply@yourdomain.com"
SMTP_PASSWORD="your-app-password"
SMTP_USE_TLS=true
```

## Docker Deployment

### 1. Production Dockerfile

```dockerfile
# Multi-stage build for production
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r neoforge && useradd -r -g neoforge neoforge

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /home/neoforge/.local

# Copy application code
COPY --chown=neoforge:neoforge . .

# Set environment variables
ENV PATH="/home/neoforge/.local/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

# Create logs directory
RUN mkdir -p /var/log/neoforge && chown neoforge:neoforge /var/log/neoforge

# Switch to non-root user
USER neoforge

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2. Docker Compose Production

```yaml
version: '3.8'

services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile
    image: neoforge/email-api:${VERSION:-latest}
    container_name: neoforge-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    env_file:
      - .env.production
    volumes:
      - ./logs:/var/log/neoforge
      - ./uploads:/app/uploads
    depends_on:
      - db
      - redis
    networks:
      - neoforge-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'

  worker:
    build: 
      context: .
      dockerfile: Dockerfile
    image: neoforge/email-api:${VERSION:-latest}
    container_name: neoforge-worker
    restart: unless-stopped
    command: python -m app.worker.run_worker
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    env_file:
      - .env.production
    volumes:
      - ./logs:/var/log/neoforge
    depends_on:
      - db
      - redis
    networks:
      - neoforge-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  db:
    image: postgres:15-alpine
    container_name: neoforge-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-neoforge_prod}
      POSTGRES_USER: ${POSTGRES_USER:-neoforge}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --lc-collate=en_US.UTF-8 --lc-ctype=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
      - ./backups:/backups
    networks:
      - neoforge-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

  redis:
    image: redis:7-alpine
    container_name: neoforge-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - neoforge-network
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    container_name: neoforge-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./config/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - api
    networks:
      - neoforge-network

  prometheus:
    image: prom/prometheus:latest
    container_name: neoforge-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - neoforge-network

  grafana:
    image: grafana/grafana:latest
    container_name: neoforge-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./config/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - neoforge-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  neoforge-network:
    driver: bridge
```

## Kubernetes Deployment

### 1. Namespace and ConfigMap

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: neoforge-email

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: neoforge-config
  namespace: neoforge-email
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  API_V1_STR: "/api/v1"
  PROJECT_NAME: "NeoForge Email System"
  EMAIL_WORKER_INTERVAL: "1.0"
  EMAIL_WORKER_MAX_RETRIES: "3"
  RATE_LIMIT_PER_MINUTE: "60"
```

### 2. Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: neoforge-secrets
  namespace: neoforge-email
type: Opaque
stringData:
  DATABASE_URL: "postgresql+asyncpg://user:password@postgres:5432/neoforge_prod"
  REDIS_URL: "redis://:password@redis:6379/0"
  SECRET_KEY: "your-secret-key-here"
  SENDGRID_API_KEY: "your-sendgrid-api-key"
  SENDGRID_WEBHOOK_SECRET: "your-webhook-secret"
```

### 3. API Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neoforge-api
  namespace: neoforge-email
  labels:
    app: neoforge-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: neoforge-api
  template:
    metadata:
      labels:
        app: neoforge-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8001"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: api
        image: neoforge/email-api:latest
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 8001
          name: metrics
        envFrom:
        - configMapRef:
            name: neoforge-config
        - secretRef:
            name: neoforge-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: logs
          mountPath: /var/log/neoforge
      volumes:
      - name: logs
        emptyDir: {}
      restartPolicy: Always

---
# k8s/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: neoforge-api-service
  namespace: neoforge-email
  labels:
    app: neoforge-api
spec:
  selector:
    app: neoforge-api
  ports:
  - name: http
    port: 80
    targetPort: 8000
    protocol: TCP
  - name: metrics
    port: 8001
    targetPort: 8001
    protocol: TCP
  type: ClusterIP
```

### 4. Worker Deployment

```yaml
# k8s/worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neoforge-worker
  namespace: neoforge-email
  labels:
    app: neoforge-worker
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: neoforge-worker
  template:
    metadata:
      labels:
        app: neoforge-worker
    spec:
      containers:
      - name: worker
        image: neoforge/email-api:latest
        command: ["python", "-m", "app.worker.run_worker"]
        envFrom:
        - configMapRef:
            name: neoforge-config
        - secretRef:
            name: neoforge-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: logs
          mountPath: /var/log/neoforge
      volumes:
      - name: logs
        emptyDir: {}
      restartPolicy: Always
```

### 5. Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: neoforge-ingress
  namespace: neoforge-email
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: neoforge-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: neoforge-api-service
            port:
              number: 80
```

## Monitoring and Alerting

### 1. Prometheus Configuration

```yaml
# config/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'neoforge-api'
    static_configs:
      - targets: ['neoforge-api:8001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'neoforge-worker'
    static_configs:
      - targets: ['neoforge-worker:8001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. Alert Rules

```yaml
# config/alert-rules.yml
groups:
- name: neoforge-email-system
  rules:
  - alert: EmailSystemDown
    expr: up{job="neoforge-api"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Email System API is down"
      description: "The Email System API has been down for more than 1 minute"

  - alert: EmailWorkerDown
    expr: up{job="neoforge-worker"} == 0
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Email Worker is down"
      description: "The Email Worker has been down for more than 2 minutes"

  - alert: HighEmailQueueSize
    expr: email_queue_size > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High email queue size"
      description: "Email queue size is {{ $value }}, which is above the threshold"

  - alert: HighEmailErrorRate
    expr: (rate(emails_failed_total[5m]) / rate(emails_sent_total[5m])) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High email error rate"
      description: "Email error rate is {{ $value | humanizePercentage }}"

  - alert: DatabaseConnectionFailure
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failure"
      description: "Cannot connect to PostgreSQL database"

  - alert: RedisConnectionFailure
    expr: up{job="redis"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Redis connection failure"
      description: "Cannot connect to Redis server"
```

### 3. Grafana Dashboards

Create dashboards for:

1. **Email System Overview**
   - Email sent/delivered/failed rates
   - Queue size and processing rate
   - Response times
   - Error rates

2. **Application Performance**
   - Request rate and response times
   - Memory and CPU usage
   - Database connection pool usage
   - Redis performance metrics

3. **Infrastructure Metrics**
   - Server resource usage
   - Network metrics
   - Disk usage and I/O

## Security Hardening

### 1. Application Security

```bash
# Security headers configuration
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### 2. Database Security

```sql
-- Enable row-level security
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for user data access
CREATE POLICY email_tracking_policy ON email_tracking
    USING (user_id = current_setting('app.current_user_id')::integer);

-- Audit logging
CREATE EXTENSION IF NOT EXISTS pgaudit;
ALTER SYSTEM SET pgaudit.log = 'write';
ALTER SYSTEM SET pgaudit.log_catalog = off;
```

### 3. Network Security

```bash
# Firewall rules (iptables)
# Allow only necessary ports
iptables -A INPUT -p tcp --dport 80 -j ACCEPT    # HTTP
iptables -A INPUT -p tcp --dport 443 -j ACCEPT   # HTTPS
iptables -A INPUT -p tcp --dport 22 -j ACCEPT    # SSH
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -j DROP

# Rate limiting for SSH
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/opt/backups/neoforge"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="neoforge_prod"

# Create full backup
pg_dump -h localhost -U neoforge_app -d $DB_NAME -F c -b -v \
    -f "$BACKUP_DIR/neoforge_$DATE.backup"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/neoforge_$DATE.backup" \
    "s3://your-backup-bucket/database/"

# Retention policy
find $BACKUP_DIR -name "*.backup" -mtime +7 -delete
```

### 2. Application State Backup

```bash
#!/bin/bash
# Backup Redis data and application logs

BACKUP_DIR="/opt/backups/neoforge"
DATE=$(date +%Y%m%d_%H%M%S)

# Redis backup
redis-cli --rdb "$BACKUP_DIR/redis_$DATE.rdb"

# Application logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /var/log/neoforge/

# Configuration backup
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /etc/neoforge/
```

### 3. Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 1 hour
2. **RPO (Recovery Point Objective)**: 15 minutes

**Recovery Steps:**
1. Restore database from latest backup
2. Restore Redis state (if applicable)
3. Deploy application from latest image
4. Update DNS if switching data centers
5. Verify all services are healthy
6. Resume normal operations

## Performance Optimization

### 1. Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX CONCURRENTLY idx_email_tracking_recipient 
    ON email_tracking (recipient);

CREATE INDEX CONCURRENTLY idx_email_tracking_status_created 
    ON email_tracking (status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_email_events_email_occurred 
    ON email_events (email_id, occurred_at DESC);

-- Partition large tables by date
CREATE TABLE email_tracking_y2024m01 PARTITION OF email_tracking
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. Application Optimization

```python
# Connection pooling configuration
DATABASE_CONFIG = {
    "pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600,
    "pool_pre_ping": True
}

# Redis optimization
REDIS_CONFIG = {
    "connection_pool_kwargs": {
        "max_connections": 50,
        "retry_on_timeout": True,
        "socket_timeout": 5,
        "socket_connect_timeout": 5
    }
}
```

### 3. Caching Strategy

```python
# Cache configuration
CACHE_CONFIG = {
    "default_timeout": 300,
    "email_templates": 3600,
    "user_data": 900,
    "settings": 1800
}
```

## Operational Procedures

### 1. Deployment Process

```bash
#!/bin/bash
# Zero-downtime deployment script

# Build new image
docker build -t neoforge/email-api:$VERSION .

# Run tests
docker run --rm neoforge/email-api:$VERSION python -m pytest

# Push to registry
docker push neoforge/email-api:$VERSION

# Update Kubernetes deployment
kubectl set image deployment/neoforge-api api=neoforge/email-api:$VERSION -n neoforge-email
kubectl set image deployment/neoforge-worker worker=neoforge/email-api:$VERSION -n neoforge-email

# Wait for rollout
kubectl rollout status deployment/neoforge-api -n neoforge-email
kubectl rollout status deployment/neoforge-worker -n neoforge-email

# Health check
kubectl get pods -n neoforge-email
```

### 2. Scaling Procedures

```bash
# Scale API instances
kubectl scale deployment neoforge-api --replicas=5 -n neoforge-email

# Scale worker instances
kubectl scale deployment neoforge-worker --replicas=3 -n neoforge-email

# Auto-scaling (HPA)
kubectl autoscale deployment neoforge-api --cpu-percent=70 --min=3 --max=10 -n neoforge-email
```

### 3. Maintenance Procedures

```bash
# Database maintenance
# Run during low-traffic hours
psql -d neoforge_prod -c "VACUUM ANALYZE;"
psql -d neoforge_prod -c "REINDEX DATABASE neoforge_prod;"

# Clear old email events (retain 90 days)
psql -d neoforge_prod -c "DELETE FROM email_events WHERE occurred_at < NOW() - INTERVAL '90 days';"

# Redis maintenance
redis-cli BGREWRITEAOF
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **High Memory Usage**
   - Check for memory leaks in application
   - Optimize database queries
   - Adjust connection pool sizes
   - Monitor garbage collection

2. **Slow Email Processing**
   - Check Redis queue health
   - Monitor worker process performance
   - Review email provider rate limits
   - Scale worker instances if needed

3. **Database Connection Issues**
   - Check connection pool exhaustion
   - Verify database server health
   - Review connection timeout settings
   - Monitor long-running queries

4. **Email Delivery Issues**
   - Check provider API status
   - Verify domain authentication
   - Review bounce rates and reasons
   - Check webhook configuration

### Emergency Contacts

- **Primary On-Call**: +1-XXX-XXX-XXXX
- **Secondary On-Call**: +1-XXX-XXX-XXXX
- **DevOps Team**: devops@yourcompany.com
- **Email Provider Support**: support@emailprovider.com

### Support Resources

- **Documentation**: https://docs.neoforge.dev
- **Status Page**: https://status.neoforge.dev
- **Monitoring**: https://monitoring.neoforge.dev
- **Logs**: https://logs.neoforge.dev

---

## Conclusion

This production deployment guide provides comprehensive instructions for deploying the NeoForge Email System in a production environment. Follow these guidelines to ensure a secure, scalable, and reliable deployment.

For additional support or questions, please contact the development team or refer to the project documentation.

**Remember to:**
- Test all configurations in a staging environment first
- Keep all secrets and passwords secure
- Monitor system performance and adjust as needed
- Keep backups current and test recovery procedures
- Update documentation as the system evolves