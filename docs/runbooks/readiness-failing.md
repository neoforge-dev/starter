# Readiness Check Failing Runbook

## Alert Description
**Alert Name**: ReadinessCheckFailing  
**Severity**: Warning → Critical (if persistent)  
**Condition**: `/ready` endpoint returning non-200 status for > 2 minutes

## Impact
- Load balancer may stop routing traffic
- New deployments will fail
- Auto-scaling may not function correctly
- Service appears unhealthy to orchestrators

## Immediate Response (< 2 minutes)

### 1. Check Readiness Status
```bash
# Test readiness endpoint directly
curl -v http://localhost:8000/ready

# Expected response: HTTP 200 with dependency status
# {"status": "ready", "dependencies": {"database": "ok", "redis": "ok", "celery": "ok"}}
```

### 2. Identify Failing Dependencies
```bash
# Parse readiness response for failing components
curl -s http://localhost:8000/ready | jq .

# Common failure patterns:
# - "database": "error" -> Database connection issues
# - "redis": "timeout" -> Redis connectivity problems  
# - "celery": "unreachable" -> Worker queue issues
```

## Dependency-Specific Troubleshooting

### Database Connectivity Issues

#### Quick Checks
```bash
# Test database connection directly
docker compose exec api python -c "
from app.core.database import engine
import asyncio
async def test():
    async with engine.connect() as conn:
        await conn.execute('SELECT 1')
        print('DB OK')
asyncio.run(test())
"

# Check database container health
docker compose ps db
docker compose logs db | tail -20
```

#### Common Fixes
```bash
# 1. Database container restart
docker compose restart db
sleep 10

# 2. Reset connection pool
docker compose restart api

# 3. Check database disk space
docker compose exec db df -h

# 4. Verify database credentials
docker compose exec api env | grep DATABASE_URL
```

### Redis Connectivity Issues

#### Quick Checks
```bash
# Test Redis directly
docker compose exec cache redis-cli ping

# Check Redis container health
docker compose ps cache
docker compose logs cache | tail -10

# Test Redis from API container
docker compose exec api python -c "
import redis.asyncio as redis
import asyncio
async def test():
    r = redis.Redis.from_url('redis://cache:6379/1')
    await r.ping()
    print('Redis OK')
asyncio.run(test())
"
```

#### Common Fixes
```bash
# 1. Redis container restart
docker compose restart cache
sleep 5

# 2. Clear Redis if corruption suspected
docker compose exec cache redis-cli FLUSHALL

# 3. Check Redis memory usage
docker compose exec cache redis-cli INFO memory

# 4. Verify Redis configuration
docker compose exec cache redis-cli CONFIG GET maxmemory
```

### Celery Worker Issues

#### Quick Checks
```bash
# Check worker health via Celery inspect
docker compose exec api python -c "
from app.core.celery import celery_app
inspect = celery_app.control.inspect()
print('Active workers:', inspect.active())
print('Registered tasks:', inspect.registered())
"

# Check worker container status
docker compose ps email-worker
docker compose logs email-worker | tail -20
```

#### Common Fixes
```bash
# 1. Restart Celery workers
docker compose restart email-worker

# 2. Check queue depth for blockages
docker compose exec cache redis-cli LLEN celery

# 3. Purge stuck tasks if needed
docker compose exec api python -c "
from app.core.celery import celery_app
celery_app.control.purge()
print('Queues purged')
"

# 4. Verify Celery configuration
docker compose exec api python -c "
from app.core.celery import celery_app
print('Broker URL:', celery_app.conf.broker_url)
print('Result backend:', celery_app.conf.result_backend)
"
```

## System-Level Troubleshooting

### Resource Constraints
```bash
# Check system resources
docker stats

# Check disk space
df -h

# Memory pressure
free -h

# Container resource limits
docker compose config | grep -A 5 -B 5 "mem_limit\|cpus"
```

### Network Connectivity
```bash
# Test internal container networking
docker compose exec api ping db
docker compose exec api ping cache

# Check port bindings
docker compose ps --format "table {{.Names}}\t{{.Ports}}"

# Verify container communication
docker network ls
docker network inspect neoforge-starter_default
```

### Configuration Issues
```bash
# Verify environment variables
docker compose exec api env | grep -E "(DATABASE|REDIS|CELERY)"

# Check mounted configuration files
docker compose exec api ls -la /app/

# Validate configuration parsing
docker compose exec api python -c "
from app.core.config import get_settings
settings = get_settings()
print('Environment:', settings.environment)
print('Database URL configured:', bool(settings.database_url))
print('Redis URL configured:', bool(settings.redis_url))
"
```

## Advanced Diagnostics

### Database Deep Dive
```bash
# Check connection pool status
curl -s http://localhost:8000/metrics | grep db_pool

# Test specific database operations
docker compose exec api python -c "
from app.db.session import get_db
from app.models.user import User
import asyncio
async def test():
    async for db in get_db():
        result = await db.execute('SELECT COUNT(*) FROM users')
        print('User count:', result.scalar())
        break
asyncio.run(test())
"

# Check for database locks
docker compose exec db psql -U postgres -d neoforge -c "
SELECT pid, state, query, query_start 
FROM pg_stat_activity 
WHERE state != 'idle' 
ORDER BY query_start;
"
```

### Redis Deep Dive
```bash
# Check Redis client connections
docker compose exec cache redis-cli CLIENT LIST

# Monitor Redis commands
docker compose exec cache redis-cli MONITOR &
sleep 5
kill %1

# Check Redis slow log
docker compose exec cache redis-cli SLOWLOG GET 10
```

## Recovery Actions

### Full Service Recovery
```bash
# 1. Graceful restart sequence
docker compose stop api email-worker
docker compose up -d db cache
sleep 10
docker compose up -d api email-worker

# 2. Verify each component
curl -f http://localhost:8000/health
curl -f http://localhost:8000/ready
```

### Partial Recovery
```bash
# If only one dependency failing, restart minimal set
# Database only:
docker compose restart db api

# Redis only:
docker compose restart cache api

# Celery only:
docker compose restart email-worker
```

## Escalation

### Escalate When
- Readiness failing > 10 minutes
- Multiple dependency failures
- System resource exhaustion
- Network connectivity issues
- Database corruption suspected

### Before Escalation
1. Capture system state:
   ```bash
   # System snapshot
   docker compose ps > incident-containers.log
   docker compose logs > incident-logs.log
   curl -s http://localhost:8000/ready > incident-readiness.log
   ```

2. Document attempted fixes
3. Gather relevant metrics/logs

## Prevention

### Monitoring Enhancements
- Add dependency-specific alerts
- Monitor connection pool utilization
- Track Redis memory usage
- Alert on Celery queue depth

### Infrastructure Improvements
- Add health check retries with backoff
- Implement graceful shutdown procedures
- Add resource monitoring and limits
- Configure automatic restarts for transient failures

## Recovery Validation

```bash
# Comprehensive health verification
curl -f http://localhost:8000/health
curl -f http://localhost:8000/ready
curl -f http://localhost:8000/metrics

# Test critical user flows
curl -f http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TEST_TOKEN"

# Verify background processing
docker compose logs email-worker | grep -i "task.*success" | tail -5
```

## Related Documentation
- [Health Check Implementation](../backend/app/api/endpoints/health.py)
- [Database Configuration](../backend/app/core/database.py)
- [Redis Configuration](../backend/app/core/redis.py)
- [Celery Configuration](../backend/app/core/celery.py)

## Related Runbooks
- [High 5xx Rate](./high-5xx-rate.md)
- [Queue Depth High](./queue-depth-high.md)