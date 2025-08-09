# Email System Troubleshooting Guide

## Quick Diagnostic Commands

### System Health Check
```bash
# Check all services status
curl -f http://localhost:8000/health
curl -f http://localhost:8000/health/email

# Check email worker status
docker logs neoforge-worker --tail=50

# Check queue size
redis-cli -h redis-host -a password llen email_queue

# Check database connectivity
psql -h db-host -U username -d neoforge_prod -c "SELECT 1;"
```

### Service Status Overview
```bash
#!/bin/bash
# Quick system status check

echo "=== API Health ==="
curl -s http://localhost:8000/health | jq .

echo -e "\n=== Queue Status ==="
redis-cli -h localhost -p 6379 llen email_queue

echo -e "\n=== Database Status ==="
psql -h localhost -U neoforge_app -d neoforge_prod -c "SELECT COUNT(*) as pending_emails FROM email_tracking WHERE status = 'QUEUED';"

echo -e "\n=== Worker Status ==="
docker ps | grep worker

echo -e "\n=== Recent Errors ==="
docker logs neoforge-worker --since="1h" | grep ERROR | tail -5
```

---

## Common Issues and Solutions

### 1. Emails Not Being Sent

#### Symptoms
- Emails stuck in queue
- Users not receiving emails
- Queue size continuously growing

#### Diagnostic Steps

```bash
# Check queue size
redis-cli llen email_queue

# Check worker logs
docker logs neoforge-worker --tail=100 | grep -E "(ERROR|WARN|email)"

# Check recent email tracking records
psql -d neoforge_prod -c "
    SELECT status, COUNT(*) 
    FROM email_tracking 
    WHERE created_at > NOW() - INTERVAL '1 hour' 
    GROUP BY status;
"

# Test email worker processing
redis-cli lpop email_queue
```

#### Common Causes and Solutions

**Cause: EmailWorker not running**
```bash
# Check if worker is running
docker ps | grep worker

# Start worker if stopped
docker start neoforge-worker

# Check worker startup logs
docker logs neoforge-worker --since="5m"
```

**Cause: Email provider authentication failure**
```bash
# Check SMTP credentials
python -c "
import smtplib
try:
    server = smtplib.SMTP('smtp.sendgrid.net', 587)
    server.starttls()
    server.login('apikey', 'your-api-key')
    print('SMTP authentication successful')
except Exception as e:
    print(f'SMTP authentication failed: {e}')
"

# For SendGrid API
curl -X GET "https://api.sendgrid.com/v3/user/account" \
  -H "Authorization: Bearer your-api-key"
```

**Solution: Update credentials**
```bash
# Update environment variables
export SENDGRID_API_KEY="new-api-key"

# Restart services
docker restart neoforge-worker
```

**Cause: Redis connection failure**
```bash
# Test Redis connectivity
redis-cli -h redis-host -a password ping

# Check Redis logs
docker logs neoforge-redis --tail=50
```

**Solution: Fix Redis connection**
```bash
# Check Redis configuration
redis-cli info server

# Restart Redis if needed
docker restart neoforge-redis

# Update Redis URL in environment
export REDIS_URL="redis://:password@redis-host:6379/0"
```

---

### 2. High Email Bounce Rate

#### Symptoms
- Many emails marked as bounced
- Low delivery rates
- Reputation warnings from email provider

#### Diagnostic Steps

```bash
# Check bounce statistics
psql -d neoforge_prod -c "
    SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM email_tracking 
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY status
    ORDER BY count DESC;
"

# Check bounce reasons
psql -d neoforge_prod -c "
    SELECT 
        ee.event_metadata->>'reason' as bounce_reason,
        COUNT(*) as count
    FROM email_events ee
    JOIN email_tracking et ON ee.email_id = et.id
    WHERE ee.event_type = 'BOUNCED'
    AND ee.occurred_at > NOW() - INTERVAL '24 hours'
    GROUP BY bounce_reason
    ORDER BY count DESC;
"
```

#### Common Causes and Solutions

**Cause: Invalid email addresses**
```python
# Email validation script
import re
from typing import List

def validate_emails(email_list: List[str]) -> dict:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    results = {
        'valid': [],
        'invalid': []
    }
    
    for email in email_list:
        if re.match(pattern, email):
            results['valid'].append(email)
        else:
            results['invalid'].append(email)
    
    return results

# Check recent bounced emails
psql -d neoforge_prod -c "
    SELECT recipient, COUNT(*) as bounce_count
    FROM email_tracking 
    WHERE status = 'BOUNCED'
    GROUP BY recipient
    HAVING COUNT(*) > 1
    ORDER BY bounce_count DESC
    LIMIT 20;
"
```

**Solution: Implement email validation**
```python
# Add to registration endpoint
from email_validator import validate_email, EmailNotValidError

def validate_email_address(email: str) -> bool:
    try:
        valid = validate_email(email)
        return True
    except EmailNotValidError:
        return False
```

**Cause: Poor sender reputation**
```bash
# Check domain reputation
dig TXT _dmarc.yourdomain.com
dig TXT yourdomain.com | grep spf
dig TXT default._domainkey.yourdomain.com

# Check SendGrid reputation
curl -X GET "https://api.sendgrid.com/v3/user/reputation" \
  -H "Authorization: Bearer your-api-key"
```

**Solution: Improve domain setup**
```bash
# Add SPF record
# TXT record for yourdomain.com:
# "v=spf1 include:sendgrid.net ~all"

# Add DKIM record
# TXT record for default._domainkey.yourdomain.com:
# "k=rsa; t=s; p=YOUR_PUBLIC_KEY"

# Add DMARC record
# TXT record for _dmarc.yourdomain.com:
# "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

---

### 3. Webhook Processing Issues

#### Symptoms
- Email statuses not updating
- Missing delivery confirmations
- Webhook endpoint errors

#### Diagnostic Steps

```bash
# Check webhook endpoint
curl -X GET "https://yourdomain.com/api/v1/webhooks/test"

# Check recent webhook processing
psql -d neoforge_prod -c "
    SELECT 
        event_type,
        COUNT(*) as count,
        MAX(occurred_at) as latest_event
    FROM email_events 
    WHERE occurred_at > NOW() - INTERVAL '1 hour'
    GROUP BY event_type
    ORDER BY count DESC;
"

# Check for webhook errors in logs
docker logs neoforge-api | grep webhook | grep ERROR
```

#### Common Causes and Solutions

**Cause: Invalid webhook signature**
```python
# Test webhook signature validation
import hmac
import hashlib

def validate_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)

# Debug webhook request
payload = b'{"test": "webhook"}'
secret = "your-webhook-secret"
signature = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
print(f"Expected signature: {signature}")
```

**Solution: Update webhook configuration**
```bash
# Update webhook secret
export SENDGRID_WEBHOOK_SECRET="new-secret-key"

# Restart API service
docker restart neoforge-api

# Test webhook with new signature
curl -X POST "https://yourdomain.com/api/v1/webhooks/sendgrid" \
  -H "Content-Type: application/json" \
  -H "X-Twilio-Email-Event-Webhook-Signature: sha256=signature" \
  -d '[{"email": "test@example.com", "event": "delivered"}]'
```

**Cause: Webhook URL not accessible**
```bash
# Test webhook URL from external IP
curl -f "https://yourdomain.com/api/v1/webhooks/test"

# Check DNS resolution
nslookup yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**Solution: Fix network/DNS issues**
```bash
# Update DNS records
# Check firewall rules
# Verify SSL certificate
# Test from provider's IP ranges
```

---

### 4. Database Performance Issues

#### Symptoms
- Slow email tracking queries
- High database CPU usage
- Connection pool exhaustion

#### Diagnostic Steps

```bash
# Check active connections
psql -d neoforge_prod -c "
    SELECT 
        state,
        COUNT(*) as connection_count
    FROM pg_stat_activity 
    WHERE datname = 'neoforge_prod'
    GROUP BY state;
"

# Check slow queries
psql -d neoforge_prod -c "
    SELECT 
        query,
        mean_exec_time,
        calls
    FROM pg_stat_statements 
    WHERE mean_exec_time > 100
    ORDER BY mean_exec_time DESC
    LIMIT 10;
"

# Check table sizes
psql -d neoforge_prod -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### Common Causes and Solutions

**Cause: Missing or inefficient indexes**
```sql
-- Check for missing indexes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_email_tracking_recipient_status 
ON email_tracking (recipient, status);

CREATE INDEX CONCURRENTLY idx_email_tracking_created_at_desc 
ON email_tracking (created_at DESC);

CREATE INDEX CONCURRENTLY idx_email_events_email_type_occurred 
ON email_events (email_id, event_type, occurred_at DESC);
```

**Solution: Optimize queries and add indexes**
```sql
-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM email_tracking 
WHERE recipient = 'user@example.com' 
AND status = 'DELIVERED';

-- Update table statistics
ANALYZE email_tracking;
ANALYZE email_events;
```

**Cause: Large table sizes without partitioning**
```sql
-- Partition email_tracking by date
CREATE TABLE email_tracking_partitioned (
    LIKE email_tracking INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE email_tracking_y2024m01 PARTITION OF email_tracking_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE email_tracking_y2024m02 PARTITION OF email_tracking_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

---

### 5. Memory and Resource Issues

#### Symptoms
- Application crashes with OOM errors
- High memory usage
- Slow response times

#### Diagnostic Steps

```bash
# Check memory usage
docker stats neoforge-api neoforge-worker

# Check application memory usage
curl -s http://localhost:8001/metrics | grep memory

# Check database memory usage
psql -d neoforge_prod -c "
    SELECT 
        setting,
        unit,
        context
    FROM pg_settings 
    WHERE name IN ('shared_buffers', 'work_mem', 'maintenance_work_mem');
"

# Check for memory leaks
docker exec neoforge-api python -c "
import gc
import psutil
import os

process = psutil.Process(os.getpid())
print(f'Memory usage: {process.memory_info().rss / 1024 / 1024:.1f} MB')
print(f'Open files: {len(process.open_files())}')
print(f'Garbage collection: {gc.get_stats()}')
"
```

#### Solutions

**Optimize connection pools**
```python
# Reduce connection pool sizes
DATABASE_CONFIG = {
    "pool_size": 10,  # Reduce from 20
    "max_overflow": 15,  # Reduce from 30
    "pool_timeout": 30,
    "pool_recycle": 1800,  # Reduce from 3600
}

REDIS_CONFIG = {
    "connection_pool_kwargs": {
        "max_connections": 25,  # Reduce from 50
    }
}
```

**Configure garbage collection**
```python
# Add to application startup
import gc
gc.set_threshold(700, 10, 10)  # More aggressive GC
```

**Set container memory limits**
```yaml
# Docker Compose
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M  # Set appropriate limit
        reservations:
          memory: 256M
```

---

### 6. Rate Limiting Issues

#### Symptoms
- 429 Too Many Requests errors
- Email sending delays
- Provider rate limit warnings

#### Diagnostic Steps

```bash
# Check rate limit status
curl -v http://localhost:8000/api/v1/auth/register

# Check provider rate limits
curl -X GET "https://api.sendgrid.com/v3/user/credits" \
  -H "Authorization: Bearer your-api-key"

# Check email sending rate
psql -d neoforge_prod -c "
    SELECT 
        date_trunc('minute', created_at) as minute,
        COUNT(*) as emails_sent
    FROM email_tracking
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY minute
    ORDER BY minute DESC
    LIMIT 20;
"
```

#### Solutions

**Adjust application rate limits**
```python
# Update rate limiting configuration
RATE_LIMITS = {
    "registration": "5 per minute",
    "password_reset": "3 per 5 minutes",
    "email_verification": "10 per hour",
}
```

**Implement email sending throttling**
```python
# Add to email worker
import asyncio
from datetime import datetime, timedelta

class EmailThrottler:
    def __init__(self, max_per_minute: int = 100):
        self.max_per_minute = max_per_minute
        self.sent_times = []
    
    async def wait_if_needed(self):
        now = datetime.now()
        # Remove times older than 1 minute
        self.sent_times = [t for t in self.sent_times if now - t < timedelta(minutes=1)]
        
        if len(self.sent_times) >= self.max_per_minute:
            sleep_time = 60 - (now - min(self.sent_times)).total_seconds()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
        
        self.sent_times.append(now)

# Use in email worker
throttler = EmailThrottler(max_per_minute=50)
await throttler.wait_if_needed()
```

---

### 7. Configuration Issues

#### Symptoms
- Service startup failures
- Authentication errors
- Template rendering errors

#### Diagnostic Steps

```bash
# Validate configuration
python -c "
from app.core.config import get_settings
settings = get_settings()
print('Configuration loaded successfully')
print(f'Environment: {settings.environment}')
print(f'Database URL: {settings.database_url[:20]}...')
"

# Check environment variables
env | grep -E "(DATABASE|REDIS|SENDGRID|SMTP)" | sort

# Test email templates
python -c "
from app.core.email_templates import render_template
try:
    result = render_template('new_account', {'username': 'Test User'})
    print('Template rendering successful')
except Exception as e:
    print(f'Template error: {e}')
"
```

#### Common Solutions

**Fix missing environment variables**
```bash
# Check required variables
cat << 'EOF' > check_env.sh
#!/bin/bash
required_vars=("DATABASE_URL" "REDIS_URL" "SECRET_KEY" "SENDGRID_API_KEY")

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "ERROR: $var is not set"
        exit 1
    else
        echo "OK: $var is set"
    fi
done
EOF

chmod +x check_env.sh
./check_env.sh
```

**Fix template issues**
```python
# Check template files exist
import os
template_dir = "app/email_templates"
required_templates = ["new_account.html", "reset_password.html"]

for template in required_templates:
    path = os.path.join(template_dir, template)
    if os.path.exists(path):
        print(f"OK: {template} exists")
    else:
        print(f"ERROR: {template} missing")
```

---

## Performance Monitoring

### Key Metrics to Monitor

```bash
# Email processing metrics
curl -s http://localhost:8001/metrics | grep -E "(email_|queue_)"

# System resource metrics
docker stats --no-stream | grep neoforge

# Database performance
psql -d neoforge_prod -c "
    SELECT 
        datname,
        numbackends,
        xact_commit,
        xact_rollback,
        blks_read,
        blks_hit,
        temp_files,
        temp_bytes
    FROM pg_stat_database 
    WHERE datname = 'neoforge_prod';
"
```

### Performance Alerts

```yaml
# Prometheus alert rules
- alert: HighEmailProcessingTime
  expr: histogram_quantile(0.95, email_processing_duration_seconds) > 30
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Email processing time is high"

- alert: HighDatabaseConnections
  expr: pg_stat_database_numbackends > 80
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High number of database connections"
```

---

## Emergency Procedures

### Service Recovery

```bash
#!/bin/bash
# Emergency recovery script

echo "Starting emergency recovery..."

# 1. Stop all services
docker stop neoforge-api neoforge-worker

# 2. Clear Redis queue if corrupted
redis-cli flushdb

# 3. Check database integrity
psql -d neoforge_prod -c "
    SELECT pg_database_size('neoforge_prod');
    SELECT COUNT(*) FROM email_tracking;
"

# 4. Start services with health checks
docker start neoforge-api
sleep 10
curl -f http://localhost:8000/health || exit 1

docker start neoforge-worker
sleep 5
docker logs neoforge-worker --tail=10

echo "Recovery completed"
```

### Data Recovery

```bash
# Restore from backup
pg_restore -h localhost -U neoforge_app -d neoforge_prod \
  /backups/neoforge_latest.backup

# Verify data integrity
psql -d neoforge_prod -c "
    SELECT 
        status,
        COUNT(*) 
    FROM email_tracking 
    WHERE created_at > NOW() - INTERVAL '1 day'
    GROUP BY status;
"
```

### Escalation Procedures

1. **Level 1**: Restart affected services
2. **Level 2**: Failover to backup systems
3. **Level 3**: Contact senior engineer
4. **Level 4**: Engage vendor support

### Contact Information

- **Primary On-Call**: +1-XXX-XXX-XXXX
- **DevOps Team**: devops@yourcompany.com
- **Database Admin**: dba@yourcompany.com
- **SendGrid Support**: https://support.sendgrid.com

---

## Preventive Maintenance

### Daily Checks

```bash
#!/bin/bash
# Daily maintenance script

# Check service health
curl -f http://localhost:8000/health

# Check queue size
queue_size=$(redis-cli llen email_queue)
echo "Queue size: $queue_size"

if [ "$queue_size" -gt 1000 ]; then
    echo "WARNING: Queue size is high"
    # Send alert
fi

# Check disk space
df -h /var/lib/postgresql/data
df -h /var/log/neoforge

# Check recent errors
docker logs neoforge-api --since="24h" | grep ERROR | wc -l
docker logs neoforge-worker --since="24h" | grep ERROR | wc -l
```

### Weekly Maintenance

```bash
#!/bin/bash
# Weekly maintenance script

# Database maintenance
psql -d neoforge_prod -c "VACUUM ANALYZE;"

# Clean old logs
find /var/log/neoforge -name "*.log" -mtime +7 -delete

# Update statistics
psql -d neoforge_prod -c "
    UPDATE pg_stat_statements_reset();
    ANALYZE;
"

# Check SSL certificate expiry
openssl x509 -in /etc/ssl/certs/yourdomain.pem -noout -dates
```

### Monthly Reviews

1. Review error logs and trends
2. Analyze performance metrics
3. Update security patches
4. Test backup and recovery procedures
5. Review and update documentation

---

This troubleshooting guide should help you quickly identify and resolve common issues with the NeoForge Email System. Keep this document updated as you encounter new issues and solutions in your production environment.