# High Queue Depth Runbook

## Alert Description
**Alert Name**: HighQueueDepth  
**Severity**: Warning → Critical  
**Condition**: `celery_queue_depth` > 100 tasks for > 5 minutes

## Impact
- Email delivery delays
- Background task processing slowdown
- Memory accumulation in Redis
- Potential system performance degradation
- User-facing feature delays (email verification, notifications)

## Immediate Response (< 3 minutes)

### 1. Assess Queue Status
```bash
# Check current queue depths
curl -s http://localhost:8000/metrics | grep celery_queue_depth

# Get detailed queue information
docker compose exec cache redis-cli LLEN celery
docker compose exec cache redis-cli LLEN celery:priority

# Check for specific queue types
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
print('Active tasks:', inspect.active())
print('Reserved tasks:', inspect.reserved())
print('Scheduled tasks:', inspect.scheduled())
"
```

### 2. Identify Task Types
```bash
# Sample tasks in queue (non-destructive peek)
docker compose exec cache redis-cli LRANGE celery 0 10

# Check for stuck tasks
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
active = inspect.active() or {}
for worker, tasks in active.items():
    for task in tasks:
        print(f'Worker: {worker}, Task: {task.get(\"name\")}, Started: {task.get(\"time_start\")}')
"
```

### 3. Worker Health Check
```bash
# Check worker processes
docker compose ps email-worker
docker compose logs email-worker | tail -20

# Worker resource usage
docker stats email-worker

# Check worker registration
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
print('Registered workers:', list(inspect.registered().keys()) if inspect.registered() else 'None')
"
```

## Queue Analysis & Diagnosis

### 4. Task Failure Analysis
```bash
# Check for failing tasks in logs
docker compose logs email-worker | grep -i "error\|fail\|exception" | tail -10

# Check Redis for failed task traces
docker compose exec cache redis-cli KEYS "*celery-task-meta*" | head -5

# Get task failure details
docker compose exec api python -c "
from app.core.celery import celery_app
import redis
r = redis.Redis.from_url('redis://cache:6379/1')
# Get failed task results
for key in r.scan_iter(match='celery-task-meta-*'):
    result = r.get(key)
    if result and b'FAILURE' in result:
        print(f'Failed task: {key}')
        print(f'Result: {result.decode()[:200]}...')
        break
"
```

### 5. Performance Bottleneck Detection
```bash
# Check email service dependencies
curl -f http://localhost:8000/health | jq .dependencies

# Test email connectivity
docker compose exec api python -c "
import asyncio
from app.core.email import send_email_async
async def test():
    try:
        # Test email configuration without sending
        from app.core.config import get_settings
        settings = get_settings()
        print(f'SMTP configured: {bool(settings.smtp_host)}')
        print(f'Email enabled: {settings.emails_enabled}')
    except Exception as e:
        print(f'Email config error: {e}')
asyncio.run(test())
"

# Check database performance affecting email logging
curl -s http://localhost:8000/metrics | grep db_slow_queries
```

### 6. Resource Constraints
```bash
# Redis memory usage
docker compose exec cache redis-cli INFO memory | grep used_memory

# Redis slow operations
docker compose exec cache redis-cli SLOWLOG GET 5

# Worker memory/CPU
docker stats email-worker --no-stream
```

## Resolution Strategies

### Quick Fixes

#### 1. Scale Workers Temporarily
```bash
# Add more worker instances
docker compose up -d --scale email-worker=3

# Verify additional workers registered
sleep 10
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
workers = list(inspect.registered().keys()) if inspect.registered() else []
print(f'Active workers: {len(workers)}')
print('Workers:', workers)
"
```

#### 2. Process High-Priority Tasks
```bash
# Manually process critical email tasks if needed
docker compose exec api python -c "
from app.core.celery import celery_app
from app.worker.email_worker import send_email_task

# Check for any urgent verification emails in queue
inspect = celery_app.control.inspect()
print('Scheduled tasks:', inspect.scheduled())
"
```

#### 3. Clear Stuck Tasks (Last Resort)
```bash
# Only if tasks are definitely stuck and not processing
# WARNING: This will lose queued tasks
docker compose exec api python -c "
from app.core.celery import celery_app
celery_app.control.purge()
print('All queues purged - use only in emergency')
"
```

### Systematic Fixes

#### 1. Worker Configuration Optimization
```bash
# Increase worker concurrency
# Edit docker-compose.yml or environment:
# CELERY_WORKER_CONCURRENCY=8

# Restart with new configuration
docker compose restart email-worker
```

#### 2. Task Routing Optimization
```bash
# Check task routing configuration
docker compose exec api python -c "
from app.core.celery import celery_app
print('Task routes:', celery_app.conf.task_routes)
print('Queue configuration:', celery_app.conf.task_default_queue)
"
```

#### 3. Redis Optimization
```bash
# Increase Redis memory limit if needed
docker compose exec cache redis-cli CONFIG SET maxmemory 256mb

# Enable Redis persistence for task reliability
docker compose exec cache redis-cli CONFIG SET save \"900 1 300 10 60 10000\"
```

## Monitoring & Prevention

### 7. Set Up Enhanced Monitoring
```bash
# Add queue monitoring script
cat > monitor_queues.sh << 'EOF'
#!/bin/bash
while true; do
    echo "$(date): Queue depth $(docker compose exec cache redis-cli LLEN celery)"
    echo "$(date): Active tasks $(docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
active = inspect.active() or {}
print(sum(len(tasks) for tasks in active.values()))
" 2>/dev/null)"
    sleep 30
done
EOF
chmod +x monitor_queues.sh
```

### 8. Performance Optimization
```bash
# Check task execution times
docker compose logs email-worker | grep -E "Task.*succeeded|Task.*failed" | tail -10

# Monitor task success/failure rates
curl -s http://localhost:8000/metrics | grep email_
```

## Advanced Troubleshooting

### Database Impact Analysis
```bash
# Check if database issues affecting email tracking
curl -s http://localhost:8000/metrics | grep -E "db_connections|db_pool"

# Test email tracking operations
docker compose exec api python -c "
import asyncio
from app.crud import email_tracking
from app.db.session import get_db

async def test():
    async for db in get_db():
        stats = await email_tracking.get_stats(db)
        print(f'Email stats: {stats}')
        break

asyncio.run(test())
"
```

### Network Connectivity Issues
```bash
# Test SMTP connectivity from worker
docker compose exec email-worker python -c "
import smtplib
from app.core.config import get_settings

settings = get_settings()
if settings.smtp_host:
    try:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.quit()
        print('SMTP connection successful')
    except Exception as e:
        print(f'SMTP connection failed: {e}')
else:
    print('SMTP not configured')
"
```

## Recovery Verification

```bash
# Verify queue depth normalized
curl -s http://localhost:8000/metrics | grep celery_queue_depth

# Check worker health
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
stats = inspect.stats()
print('Worker stats:', stats)
"

# Test email functionality
docker compose exec api python -c "
from app.worker.email_worker import send_email_task
import asyncio

async def test():
    # Queue a test email (adjust recipient)
    task = send_email_task.delay(
        'test@example.com',
        'Test Email',
        'Queue recovery test'
    )
    print(f'Test task queued: {task.id}')

asyncio.run(test())
"

# Monitor test task completion
sleep 30
docker compose logs email-worker | grep -i "test email\|test task" | tail -5
```

## Escalation

### Escalate When
- Queue depth > 500 for 15+ minutes
- Multiple worker scaling attempts failed
- Redis memory exhausted
- Email delivery completely stopped
- Database connectivity issues affecting email tracking

### Before Escalation
1. Document current queue metrics
2. Capture worker logs and error patterns
3. Verify email service configuration
4. Test manual task processing capability

## Prevention Measures

### Monitoring Improvements
- Alert on queue depth > 50 (early warning)
- Monitor email delivery success rate
- Track worker memory/CPU usage
- Set up queue age monitoring

### Infrastructure Enhancements
- Configure automatic worker scaling
- Add Redis persistence configuration
- Implement task retry policies
- Set up email delivery monitoring

### Code Improvements
- Add task timeout configurations
- Implement graceful task failure handling
- Add task prioritization
- Consider batch processing for bulk operations

## Related Documentation
- [Email Worker Implementation](../backend/app/worker/email_worker.py)
- [Celery Configuration](../backend/app/core/celery.py)
- [Email System Architecture](../docs/EMAIL_SYSTEM_STRATEGY.md)

## Related Runbooks
- [Readiness Check Failing](./readiness-failing.md)
- [High 5xx Rate](./high-5xx-rate.md)