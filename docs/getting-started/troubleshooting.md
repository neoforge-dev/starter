# Troubleshooting Guide

**Common issues and solutions for NeoForge development setup and operations.**

## 🚨 Quick Resolution

### Setup Issues

**Docker containers won't start:**
```bash
# Check if ports are already in use
sudo lsof -i :8000 -i :5432 -i :6379

# Reset Docker environment
make clean
make setup
```

**Database connection failed:**
```bash
# Verify PostgreSQL is running
docker compose ps db

# Reset database
docker compose down -v
docker compose up -d db
```

**Frontend build errors:**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## 🔧 Development Issues

### Backend Troubleshooting

**Import errors or module not found:**
```bash
# Ensure you're in the backend container
docker compose run --rm api python -c "import app"

# Or install dependencies locally
cd backend
pip install -r requirements.txt
```

**Database migration issues:**
```bash
# Check current migration status
docker compose run --rm api alembic current

# Reset migrations (CAUTION: destroys data)
docker compose run --rm api alembic downgrade base
docker compose run --rm api alembic upgrade head
```

**Test failures:**
```bash
# Run specific test
docker compose run --rm api_test pytest tests/api/test_auth.py -v

# Check test database
docker compose run --rm api_test pytest --setup-show
```

### Frontend Troubleshooting

**Component not loading:**
```bash
# Check if component is registered
grep -r "customElements.define" frontend/src/components/

# Verify imports
npm run lint
```

**Test failures:**
```bash
# Run single test
cd frontend
npm run test -- --grep "component-name"

# Update test snapshots
npm run test:update
```

## 🌐 Production Issues

### Deployment Problems

**Build failures in production:**
```bash
# Check build logs
docker logs neoforge-api
docker logs neoforge-frontend

# Verify environment variables
docker exec neoforge-api env | grep -E "DATABASE_URL|REDIS_URL"
```

**Service health check failures:**
```bash
# Check all service health
curl http://localhost:8000/health

# Check detailed health
curl http://localhost:8000/health/detailed

# Individual service checks
curl http://localhost:8000/api/v1/health
```

### Performance Issues

**Slow API responses:**
```bash
# Check database performance
docker exec neoforge-db psql -U postgres -d neoforge -c "SELECT * FROM pg_stat_activity;"

# Check Redis performance
docker exec neoforge-redis redis-cli --latency-history -i 1
```

**High memory usage:**
```bash
# Check container stats
docker stats

# Check specific service memory
docker exec neoforge-api python -c "import psutil; print(f'Memory: {psutil.virtual_memory().percent}%')"
```

## 📧 Email System Issues

### Email Not Sending

**Celery worker not running:**
```bash
# Check worker status
docker compose logs celery-worker

# Restart worker
docker compose restart celery-worker

# Manual worker start
python -m app.worker.run_worker
```

**SMTP configuration issues:**
```bash
# Test SMTP connection
python -c "
import smtplib
smtp = smtplib.SMTP('localhost', 1025)
print('SMTP OK')
"

# Check email environment variables
docker exec neoforge-api env | grep SMTP
```

### Email Queue Issues

**Messages stuck in queue:**
```bash
# Check Redis queue
docker exec neoforge-redis redis-cli llen email_queue

# Flush queue (CAUTION)
docker exec neoforge-redis redis-cli flushall

# Restart queue processing
docker compose restart celery-worker
```

## 🔍 Debugging Tools

### Backend Debugging

**Enable debug logging:**
```python
# In backend/app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Database query debugging:**
```python
# Enable SQL query logging
# In backend/app/core/database.py
engine = create_async_engine(DATABASE_URL, echo=True)
```

### Frontend Debugging

**Browser developer tools:**
```javascript
// In browser console
// Check component registration
console.log(customElements.get('your-component'));

// Check component properties
document.querySelector('your-component').properties;
```

**Performance debugging:**
```bash
# Frontend bundle analysis
cd frontend
npm run build:analyze

# Performance testing
npm run test:performance
```

## ⚡ Common Error Codes

### HTTP Status Codes

| Code | Issue | Solution |
|------|-------|----------|
| 400 | Bad Request | Check request payload format |
| 401 | Unauthorized | Verify JWT token validity |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify endpoint URL |
| 422 | Validation Error | Check Pydantic schema requirements |
| 500 | Server Error | Check backend logs for exceptions |

### Database Errors

| Error | Issue | Solution |
|-------|-------|----------|
| `connection refused` | PostgreSQL not running | `docker compose up -d db` |
| `database does not exist` | DB not initialized | Run migrations `alembic upgrade head` |
| `relation does not exist` | Missing table | Check migration status |
| `duplicate key` | Unique constraint violation | Check data uniqueness |

## 🆘 Getting More Help

### Log Analysis

**Backend logs:**
```bash
# Real-time logs
docker compose logs -f api

# Specific service logs
docker compose logs celery-worker
```

**Frontend logs:**
```bash
# Development server logs
cd frontend
npm run dev 2>&1 | grep -E "(ERROR|WARN)"

# Browser console logs
# Open DevTools → Console tab
```

### Community Support

1. **Check existing issues** → [GitHub Issues](https://github.com/neoforge/issues)
2. **Documentation** → [Complete docs](../README.md)
3. **Architecture questions** → [Architecture Guide](../architecture/)
4. **Production issues** → [Operations Guide](../operations/)

### Emergency Contacts

**For production emergencies:**
- System outages → [Incident Response](../operations/index.md#incident-response)
- Security issues → [Security Guide](../security.md)
- Data recovery → [Backup Procedures](../operations/index.md#data-recovery)

---

*This troubleshooting guide covers 90% of common issues. For complex problems, consult the detailed technical documentation.*
