# Production Deployment Troubleshooting Guide

## Quick Fix for API Database Connectivity Issue

### Problem
API container cannot connect to PostgreSQL database, causing continuous restarts.

### Solution
The issue is caused by asyncpg SSL connection requirements. Here's the immediate fix:

```bash
# 1. Update database URL in docker-compose.prod.yml
# Change line 53 from:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/neoforge

# To:
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/neoforge?sslmode=disable

# 2. Restart the API service
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d api

# 3. Verify API health
curl http://localhost:8001/health
```

### Alternative Fixes

#### Option 1: Use Standard PostgreSQL Driver (Recommended for Quick Fix)
```yaml
environment:
  - DATABASE_URL=postgresql://postgres:postgres@db:5432/neoforge
```

#### Option 2: Configure PostgreSQL SSL (Production Recommended)
```yaml
# In docker-compose.prod.yml, add to db service:
environment:
  - POSTGRES_INITDB_ARGS=--auth-host=md5
command: >
  postgres 
  -c ssl=on 
  -c ssl_cert_file=/etc/ssl/certs/server.crt 
  -c ssl_key_file=/etc/ssl/private/server.key
```

## NumPy Production Build Fix

### Problem
ML endpoints disabled due to NumPy compilation issues in production container.

### Solution
```dockerfile
# In backend/Dockerfile, add after line 32:
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libpq-dev \
    libssl-dev \
    pkg-config \
    gfortran \
    libopenblas-dev \
    liblapack-dev \
    && apt-get clean

# Rebuild with platform-specific settings
ENV OPENBLAS_NUM_THREADS=1
ENV NUMPY_MANYLINUX1_X86_64=1
```

## Validation Commands

### Health Check All Services
```bash
echo "Frontend: $(curl -s http://localhost:8082/health)"
echo "Database: $(docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U postgres)"
echo "Cache: $(docker-compose -f docker-compose.prod.yml exec -T cache redis-cli ping)"
echo "API: $(curl -s http://localhost:8001/health)"
```

### Resource Monitoring
```bash
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Log Analysis
```bash
# Check API startup logs
docker-compose -f docker-compose.prod.yml logs --tail=20 api

# Check database initialization
docker-compose -f docker-compose.prod.yml logs --tail=10 db
```

## Test Production Endpoints

### Once API is Fixed
```bash
# Test authentication
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test billing plans (requires API working)
curl http://localhost:8001/api/v1/billing/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Validation

### Expected Resource Usage
- Frontend: <15MB RAM
- Database: <50MB RAM  
- Cache: <10MB RAM
- API: <100MB RAM
- Total: <200MB RAM

### Startup Time Targets
- Services should start within 60 seconds
- Health checks should pass within 90 seconds
- Full stack ready in <2 minutes

## Emergency Rollback

### Quick Rollback to Development
```bash
# Stop production stack
docker-compose -f docker-compose.prod.yml down

# Start development stack  
docker-compose up -d

# Verify development environment
curl http://localhost:3000
curl http://localhost:8000/health
```

## Security Checklist for Production

- [ ] Database SSL enabled
- [ ] Environment variables secured
- [ ] Container users non-root
- [ ] Resource limits configured
- [ ] Health checks active
- [ ] Logging configured
- [ ] Network policies applied

## Contact Information

For urgent production issues:
1. Check this troubleshooting guide
2. Review logs with commands above
3. Apply quick fixes documented here
4. Escalate to human review if needed

**Last Updated:** September 4, 2025