# Troubleshooting Guide

This guide covers common issues and solutions for the NeoForge backend.

## Table of Contents
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Migration Issues](#migration-issues)
- [Performance Issues](#performance-issues)
- [SAML SSO Issues](#saml-sso-issues)
- [Redis Issues](#redis-issues)
- [API Issues](#api-issues)
- [Docker Issues](#docker-issues)

---

## Database Issues

### Issue: Cannot Connect to Database

**Symptoms:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions:**

1. **Check Database URL format:**
```bash
# Correct format
DATABASE_URL=postgresql+asyncpg://user:password@host:port/database

# Test connection
python -c "from app.db.session import engine; import asyncio; asyncio.run(engine.connect())"
```

2. **Verify PostgreSQL is running:**
```bash
# Linux/Mac
sudo systemctl status postgresql

# Docker
docker ps | grep postgres

# Check if port is listening
netstat -an | grep 5432
```

3. **Test connection manually:**
```bash
psql postgresql://user:password@host:port/database

# If this fails, check:
# - PostgreSQL is running
# - Firewall allows connections
# - pg_hba.conf allows remote connections
```

4. **Check credentials:**
```bash
# Verify credentials in .env file
grep DATABASE_URL .env

# Ensure no spaces or special characters that need encoding
# For special chars in password: urllib.parse.quote_plus(password)
```

### Issue: Database Pool Exhausted

**Symptoms:**
```
QueuePool limit of size 20 overflow 10 reached
```

**Solutions:**

1. **Increase pool size:**
```bash
# In .env
DB_POOL_SIZE=40
DB_MAX_OVERFLOW=20
```

2. **Check for connection leaks:**
```python
# Enable connection pool logging
# In app/db/session.py
engine = create_async_engine(
    settings.database_url,
    echo_pool=True,  # Enable pool logging
    pool_pre_ping=True
)
```

3. **Monitor active connections:**
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity
WHERE datname = 'neoforge_production';

-- Kill idle connections (if necessary)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'neoforge_production'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

### Issue: Slow Database Queries

**Symptoms:**
- API requests timeout
- High database CPU usage

**Solutions:**

1. **Enable slow query logging:**
```sql
-- In PostgreSQL
ALTER DATABASE neoforge_production
SET log_min_duration_statement = 1000;  -- Log queries > 1s
```

2. **Analyze slow queries:**
```sql
-- Check pg_stat_statements
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze specific query
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'test@example.com';
```

3. **Add missing indexes:**
```bash
# Check migration history for index creation
alembic history | grep -i index

# Create custom index if needed (via migration)
alembic revision -m "add_custom_index"
```

4. **Vacuum database:**
```sql
-- Analyze all tables
VACUUM ANALYZE;

-- Check bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Authentication Issues

### Issue: Invalid JWT Token

**Symptoms:**
```json
{"detail": "Could not validate credentials"}
```

**Solutions:**

1. **Verify SECRET_KEY is set:**
```bash
# Check if SECRET_KEY exists and has sufficient length
python -c "from app.core.config import get_settings; s = get_settings(); print(f'SECRET_KEY length: {len(s.secret_key.get_secret_value())}')"

# Should be at least 32 characters
```

2. **Check token expiration:**
```bash
# Verify token expiration settings
grep TOKEN_EXPIRE .env

# Default values:
# ACCESS_TOKEN_EXPIRE_MINUTES=15
# REFRESH_TOKEN_EXPIRE_DAYS=30
```

3. **Decode JWT to inspect claims:**
```python
import jwt
from app.core.config import get_settings

token = "your.jwt.token.here"
settings = get_settings()

try:
    payload = jwt.decode(
        token,
        settings.secret_key.get_secret_value(),
        algorithms=["HS256"]
    )
    print(payload)
except jwt.ExpiredSignatureError:
    print("Token expired")
except jwt.InvalidTokenError as e:
    print(f"Invalid token: {e}")
```

### Issue: Refresh Token Not Working

**Symptoms:**
```json
{"detail": "Invalid refresh token"}
```

**Solutions:**

1. **Check Redis connectivity:**
```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check if refresh token exists
redis-cli keys "refresh_token:*"
```

2. **Verify refresh token storage:**
```python
# Test refresh token in Redis
import redis
r = redis.from_url("redis://localhost:6379/0")

# Check if token exists
user_id = "user-uuid-here"
token_data = r.get(f"refresh_token:{user_id}")
print(f"Token data: {token_data}")
```

3. **Check token TTL:**
```bash
# Check time-to-live of refresh token
redis-cli TTL refresh_token:USER_ID

# Should show remaining seconds
# -1 means no expiration set (wrong!)
# -2 means key doesn't exist
```

### Issue: Password Reset Token Invalid

**Symptoms:**
- Reset token not found
- Token expired error

**Solutions:**

1. **Check password_reset_tokens table:**
```sql
-- Verify token exists
SELECT * FROM password_reset_tokens
WHERE token = 'reset-token-here'
  AND used = false
  AND expires_at > NOW();
```

2. **Check email delivery:**
```bash
# Verify SMTP settings
grep SMTP .env

# Test email sending (if you have a test script)
python scripts/test_email.py
```

---

## Migration Issues

### Issue: Migration Chain Broken

**Symptoms:**
```
alembic.util.exc.CommandError: Can't locate revision identified by 'xyz'
```

**Solutions:**

1. **Validate migration chain:**
```bash
# Run the validation script
python scripts/validate_migrations.py

# Check migration history
alembic history
```

2. **Fix broken references:**
```bash
# Find the broken migration
alembic current

# Check the down_revision of each migration file
grep -r "down_revision" alembic/versions/

# Manually fix the down_revision to point to correct parent
```

3. **Stamp database with current version:**
```bash
# If database is at correct state but Alembic thinks otherwise
alembic stamp head

# Or stamp to specific version
alembic stamp <revision_id>
```

### Issue: Migration Fails Midway

**Symptoms:**
```
sqlalchemy.exc.ProgrammingError: relation "table_name" already exists
```

**Solutions:**

1. **Rollback failed migration:**
```bash
# Check current state
alembic current

# Downgrade to previous working migration
alembic downgrade -1

# Fix the migration file
# Then re-run
alembic upgrade head
```

2. **Manual database cleanup:**
```sql
-- If table was partially created
DROP TABLE IF EXISTS table_name CASCADE;

-- Re-run migration
```

3. **Create repair migration:**
```bash
# Create new migration to fix issues
alembic revision -m "repair_broken_migration"

# In the migration, add logic to handle existing objects:
# op.execute("DROP TABLE IF EXISTS table_name")
# op.create_table(...)
```

### Issue: Can't Downgrade Migration

**Symptoms:**
```
NotImplementedError: downgrade() not implemented
```

**Solutions:**

1. **Implement downgrade function:**
```python
# In migration file
def downgrade() -> None:
    """Reverse the upgrade changes."""
    op.drop_table("new_table")
    # Add all reverse operations
```

2. **Force stamp if downgrade not critical:**
```bash
# WARNING: Only if you're sure about database state
alembic stamp <previous_revision>
```

---

## Performance Issues

### Issue: High Memory Usage

**Symptoms:**
- Application using excessive RAM
- Out of memory errors

**Solutions:**

1. **Check database query result sizes:**
```python
# Use pagination for large result sets
# BAD: users = session.query(User).all()
# GOOD: users = session.query(User).limit(100).offset(0).all()
```

2. **Monitor memory usage:**
```bash
# Check process memory
ps aux | grep uvicorn

# Use memory profiler
pip install memory-profiler
python -m memory_profiler app/main.py
```

3. **Adjust worker count:**
```bash
# Reduce workers if memory is limited
# Each worker uses ~100-200MB
uvicorn app.main:app --workers 2  # Instead of 4
```

### Issue: High CPU Usage

**Symptoms:**
- Server slow to respond
- CPU at 100%

**Solutions:**

1. **Profile application:**
```bash
# Use py-spy for profiling
pip install py-spy
py-spy top --pid $(pgrep -f uvicorn)

# Generate flame graph
py-spy record -o profile.svg --pid $(pgrep -f uvicorn)
```

2. **Check for infinite loops:**
```python
# Enable debug logging
LOG_LEVEL=DEBUG

# Look for repeated log messages
```

3. **Optimize database queries:**
```python
# Use select_related/joinedload to prevent N+1 queries
from sqlalchemy.orm import selectinload

query = select(User).options(selectinload(User.projects))
```

### Issue: Slow API Response Times

**Symptoms:**
- Requests taking > 1 second
- Timeout errors

**Solutions:**

1. **Enable request timing middleware:**
```python
# Already included in app/middleware.py
# Check logs for slow requests
grep "completed_in" logs/app.log | sort -t: -k3 -n
```

2. **Add caching:**
```python
# Use Redis caching for expensive operations
from app.core.cache import cache

@cache.cached(timeout=300)
async def expensive_operation():
    # Implementation
    pass
```

3. **Use database connection pooling:**
```bash
# Increase pool size if needed
DB_POOL_SIZE=30
DB_MAX_OVERFLOW=15
```

---

## SAML SSO Issues

### Issue: SAML Authentication Fails

**Symptoms:**
```
signxml.exceptions.InvalidSignature: Signature verification failed
```

**Solutions:**

1. **Verify signxml is installed:**
```bash
# Check if signxml is in dependencies
python -c "import signxml; print(signxml.__version__)"

# Should print version number (e.g., 3.2.0)
```

2. **Check IDP certificate:**
```bash
# Verify certificate is valid base64
echo $SAML_IDP_CERTIFICATE | base64 -d | openssl x509 -text -noout

# Check expiration
echo $SAML_IDP_CERTIFICATE | base64 -d | openssl x509 -noout -dates
```

3. **Verify SAML configuration:**
```bash
# Test SAML metadata endpoint
curl http://localhost:8000/api/v1/auth/saml/metadata

# Should return valid XML
```

4. **Enable SAML debug logging:**
```python
# In app/core/config.py
SAML_DEBUG=true
LOG_LEVEL=DEBUG
```

### Issue: SAML Metadata Not Loading

**Symptoms:**
- IDP metadata fetch fails
- Invalid metadata error

**Solutions:**

1. **Check IDP metadata URL:**
```bash
# Test URL is accessible
curl -v $SAML_IDP_METADATA_URL

# Should return XML metadata
```

2. **Verify network connectivity:**
```bash
# Check if firewall blocking
ping idp.example.com
telnet idp.example.com 443
```

---

## Redis Issues

### Issue: Redis Connection Failed

**Symptoms:**
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solutions:**

1. **Check Redis is running:**
```bash
# Test connection
redis-cli ping
# Should return: PONG

# Check Redis status
sudo systemctl status redis

# Docker
docker ps | grep redis
```

2. **Verify Redis URL:**
```bash
# Check Redis URL format
echo $REDIS_URL
# Should be: redis://host:port/db

# Test connection with Python
python -c "import redis; r = redis.from_url('redis://localhost:6379/0'); print(r.ping())"
```

3. **Check Redis logs:**
```bash
# System Redis
tail -f /var/log/redis/redis-server.log

# Docker Redis
docker logs redis-container
```

### Issue: Redis Out of Memory

**Symptoms:**
```
redis.exceptions.ResponseError: OOM command not allowed
```

**Solutions:**

1. **Check Redis memory usage:**
```bash
redis-cli INFO memory

# Check maxmemory setting
redis-cli CONFIG GET maxmemory
```

2. **Increase Redis memory limit:**
```bash
# In redis.conf
maxmemory 1gb

# Or via command line
redis-cli CONFIG SET maxmemory 1gb
```

3. **Configure eviction policy:**
```bash
# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Or in redis.conf
maxmemory-policy allkeys-lru
```

---

## API Issues

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://api.example.com' has been blocked by CORS policy
```

**Solutions:**

1. **Check ALLOWED_ORIGINS:**
```bash
# Verify origins are configured
grep ALLOWED_ORIGINS .env

# Should include your frontend domain
ALLOWED_ORIGINS=https://frontend.example.com,https://www.frontend.example.com
```

2. **Verify CORS middleware:**
```python
# In app/main.py, verify CORSMiddleware is configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Rate Limiting Blocking Requests

**Symptoms:**
```json
{"detail": "Too many requests"}
```

**Solutions:**

1. **Check rate limit settings:**
```bash
# Review rate limit configuration
# In app/api/middleware/rate_limit.py
```

2. **Whitelist IP if needed:**
```python
# Add IP to whitelist in configuration
RATE_LIMIT_WHITELIST=127.0.0.1,10.0.0.0/8
```

---

## Docker Issues

### Issue: Docker Container Exits Immediately

**Symptoms:**
```
Container exits with code 1
```

**Solutions:**

1. **Check container logs:**
```bash
docker logs neoforge-backend

# Follow logs in real-time
docker logs -f neoforge-backend
```

2. **Verify environment variables:**
```bash
# Check if .env file is mounted correctly
docker exec neoforge-backend env | grep DATABASE_URL
```

3. **Test container interactively:**
```bash
# Run container with shell
docker run -it --entrypoint /bin/bash neoforge-backend:latest

# Then manually test commands
python -c "from app.main import app"
```

### Issue: Database Not Accessible from Docker

**Symptoms:**
```
Connection refused when connecting to PostgreSQL
```

**Solutions:**

1. **Check Docker network:**
```bash
# Verify containers are on same network
docker network inspect bridge

# Use container name instead of localhost
DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/db
```

2. **Check host.docker.internal:**
```bash
# On Mac/Windows, use host.docker.internal
DATABASE_URL=postgresql+asyncpg://user:pass@host.docker.internal:5432/db
```

---

## General Debugging Tips

### Enable Detailed Logging

```bash
# Set debug level
LOG_LEVEL=DEBUG

# Enable SQLAlchemy query logging
# In app/db/session.py
engine = create_async_engine(url, echo=True)
```

### Check Application Health

```bash
# Health endpoint
curl http://localhost:8000/api/v1/health

# System health (requires auth)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/monitoring/health/system
```

### Inspect Environment Configuration

```bash
# Create a debug endpoint (development only!)
# app/api/v1/endpoints/debug.py

@router.get("/config")
async def get_config():
    settings = get_settings()
    return {
        "database_host": settings.database_url.split("@")[1].split("/")[0],
        "redis_host": settings.redis_url,
        "environment": settings.environment,
        # DO NOT expose secrets!
    }
```

### Common Commands Reference

```bash
# Check Python version
python --version

# Verify dependencies
uv pip list

# Test database connection
python -c "from app.db.session import engine; import asyncio; print(asyncio.run(engine.connect()))"

# Test Redis connection
python -c "import redis; r=redis.from_url('redis://localhost:6379/0'); print(r.ping())"

# Verify migration status
alembic current
alembic heads

# Check application logs
tail -f logs/app.log

# Monitor system resources
htop
docker stats
```

---

## Getting Help

If you're still experiencing issues:

1. **Check logs:** Always start with application and database logs
2. **GitHub Issues:** Search existing issues or create new one
3. **Documentation:** Review full documentation at https://docs.neoforge.dev
4. **Community:** Join our Discord/Slack for real-time help

### When Reporting Issues

Please include:
- Error message (full stack trace)
- Environment (OS, Python version, Docker version)
- Configuration (sanitized, no secrets!)
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs
