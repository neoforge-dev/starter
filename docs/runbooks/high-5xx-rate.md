# High 5xx Error Rate Runbook

## Alert Description
**Alert Name**: High5xxRate  
**Severity**: Critical  
**Condition**: `http_5xx_responses_total` rate > 1% of total requests over 5m window

## Impact
- Users experiencing server errors
- Potential service degradation
- Risk of cascade failures

## Immediate Response (< 5 minutes)

### 1. Assess Scope
```bash
# Check current error rate by endpoint
curl -s http://localhost:9090/api/v1/query?query='rate(http_5xx_responses_total[5m]) / rate(http_requests_total[5m]) * 100'

# Identify worst endpoints
curl -s http://localhost:9090/api/v1/query?query='topk(5, rate(http_5xx_responses_total[5m]) by (endpoint))'
```

### 2. Check Service Health
```bash
# Application health
curl -f http://localhost:8000/health || echo "API unhealthy"

# Dependencies
curl -f http://localhost:8000/ready || echo "Dependencies failing"

# Database connections
curl -s http://localhost:8000/metrics | grep db_connections_active
```

### 3. Review Recent Changes
```bash
# Check recent deployments
git log --oneline -10

# Look for configuration changes
git diff HEAD~5 -- config/ .env
```

## Investigation (< 15 minutes)

### 4. Analyze Error Patterns
```bash
# Check logs for recent errors
docker compose logs api | grep -i error | tail -20

# Database connection issues
docker compose logs api | grep -i "database\|connection" | tail -10

# Memory/resource issues  
docker stats api
```

### 5. Database Analysis
```bash
# Check slow queries
curl -s http://localhost:8000/metrics | grep db_slow_queries_total

# Connection pool status
curl -s http://localhost:8000/metrics | grep db_pool
```

### 6. External Dependencies
```bash
# Redis connectivity
docker compose exec cache redis-cli ping

# Email service status
curl -s http://localhost:8000/metrics | grep email_failed_total
```

## Resolution Actions

### Quick Fixes
1. **Restart Services** (if resource exhaustion)
   ```bash
   docker compose restart api
   ```

2. **Scale Resources** (if load-related)
   ```bash
   # Increase memory limit
   docker compose up -d --scale api=2
   ```

3. **Database Connection Reset**
   ```bash
   docker compose restart db
   docker compose restart api
   ```

### Configuration Fixes
1. **Update Rate Limits** (if overload)
   - Adjust `RATE_LIMIT_REQUESTS` in `.env`
   - Restart API service

2. **Database Pool Tuning**
   - Increase `DATABASE_POOL_SIZE` if connection issues
   - Add connection timeout configs

3. **Memory Settings**
   - Increase container memory limits
   - Check for memory leaks in application

## Escalation

### When to Escalate (< 30 minutes)
- Error rate > 5% for 10+ minutes
- Database completely unreachable
- All quick fixes attempted without success
- Security-related errors (unusual patterns)

### Escalation Contacts
- **On-call Engineer**: [Contact info]
- **Database Team**: [Contact info] 
- **Infrastructure Team**: [Contact info]

## Prevention

### Monitoring Improvements
1. Add pre-emptive alerts:
   - Database connection count > 80%
   - Response time > 2s p95
   - Memory usage > 80%

2. Enhanced logging:
   - Add trace IDs to all error logs
   - Include request context in error messages

### Code Improvements
1. **Error Handling**
   - Add retry logic for transient failures
   - Improve graceful degradation
   - Add circuit breakers

2. **Resource Management**
   - Connection pool optimization
   - Memory leak detection
   - Background job monitoring

## Recovery Verification

### After Resolution
```bash
# Verify error rate normalized
curl -s http://localhost:9090/api/v1/query?query='rate(http_5xx_responses_total[5m])'

# Check application metrics
curl -s http://localhost:8000/metrics | grep -E "(http_requests|db_connections|redis)"

# Test critical endpoints
curl -f http://localhost:8000/api/v1/users/me
curl -f http://localhost:8000/api/v1/projects
```

### Documentation
1. Update incident log with:
   - Root cause analysis
   - Resolution steps taken
   - Prevention measures implemented

2. Review and update:
   - Alert thresholds if false positive
   - Runbook steps based on effectiveness
   - Monitoring gaps identified

## Related Dashboards
- [API Overview Dashboard](../ops/grafana/neoforge-api-dashboard.json)
- [System Metrics Dashboard](../deploy/grafana/dashboards/system-metrics.json)

## Related Alerts
- HighResponseTime
- DatabaseConnectionsHigh  
- ReadinessCheckFailing