# NeoForge Kubernetes Deployment

A comprehensive Kubernetes deployment system for the NeoForge application with zero-downtime deployments, auto-scaling, and production-ready configurations.

## Overview

This Kubernetes setup provides:

- **Complete application stack**: FastAPI backend, Lit frontend, PostgreSQL, Redis, Celery workers
- **Production-ready security**: Network policies, RBAC, Pod security policies, TLS termination
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA) with CPU/memory-based scaling
- **Zero-downtime deployments**: Rolling updates with health checks and proper shutdown handling
- **Observability**: Prometheus metrics, Grafana dashboards, AlertManager notifications
- **High availability**: Pod anti-affinity, disruption budgets, persistent storage
- **Automated operations**: Deployment scripts, health checks, monitoring

## Quick Start

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured and connected to your cluster
- Docker for building images
- Helm 3.x (optional, for Helm deployment)

### Basic Deployment

1. **Clone and prepare the repository:**
```bash
cd k8s
```

2. **Deploy using the automated script:**
```bash
# Production deployment
./scripts/deploy.sh deploy --environment production

# Staging deployment
./scripts/deploy.sh deploy --environment staging --namespace neoforge-staging

# Development deployment with specific image tag
./scripts/deploy.sh deploy --environment development --tag v1.2.3
```

3. **Check deployment status:**
```bash
./scripts/deploy.sh status
```

### Manual Deployment

For more control, deploy manually using kubectl:

```bash
# 1. Create namespaces and storage classes
kubectl apply -f namespace.yaml
kubectl apply -f storage-class.yaml

# 2. Set up RBAC and security
kubectl apply -f rbac.yaml

# 3. Create configuration and secrets
kubectl apply -f app-configmap.yaml
kubectl apply -f app-secret.yaml  # Update secrets first!

# 4. Deploy database and cache
kubectl apply -f postgres-*.yaml
kubectl apply -f redis-*.yaml

# 5. Deploy application
kubectl apply -f api-*.yaml
kubectl apply -f celery-*.yaml
kubectl apply -f frontend-*.yaml

# 6. Set up networking
kubectl apply -f network-policies.yaml
kubectl apply -f ingress.yaml

# 7. Enable auto-scaling
kubectl apply -f hpa.yaml

# 8. Deploy monitoring (production only)
kubectl apply -f monitoring-*.yaml
```

## Architecture

### Components

- **API (FastAPI)**: 3 replicas with auto-scaling (2-10 pods)
- **Frontend (Nginx)**: 3 replicas with auto-scaling (2-6 pods)
- **Celery Workers**: 2 general + 1 email worker with auto-scaling (1-8 pods)
- **PostgreSQL**: 1 StatefulSet with persistent storage (50GB SSD)
- **Redis**: 1 StatefulSet with persistent storage (10GB SSD)
- **Monitoring**: Prometheus, Grafana, AlertManager (production only)

### Network Architecture

```
Internet
    ↓
[Ingress Controller] (SSL termination, rate limiting)
    ↓
[Frontend Service] ←→ [API Service]
    ↓                    ↓
[Frontend Pods]     [API Pods]
                        ↓
                [Celery Workers]
                        ↓
                [PostgreSQL] ←→ [Redis]
```

### Security Features

- **Network Policies**: Strict pod-to-pod communication rules
- **RBAC**: Minimal permissions for service accounts
- **Pod Security**: Non-root users, read-only root filesystem
- **TLS**: End-to-end encryption with cert-manager
- **Secrets Management**: Encrypted secret storage
- **Image Security**: Distroless/minimal base images

## Configuration

### Environment Variables

Key configuration is managed through ConfigMaps and Secrets:

**ConfigMap (app-config):**
- `ENVIRONMENT`: production/staging/development
- `API_BASE_URL`: API endpoint URL
- `CORS_ORIGINS`: Allowed CORS origins
- `DATABASE_*`: Database connection parameters
- `REDIS_*`: Redis connection parameters
- `CELERY_*`: Celery worker configuration

**Secret (app-secret):**
- `DATABASE_URL`: Complete database connection string
- `REDIS_URL`: Complete Redis connection string
- `SECRET_KEY`: Application secret key (32+ characters)
- `JWT_SECRET_KEY`: JWT signing key (32+ characters)
- `SMTP_PASSWORD`: Email service password

### Scaling Configuration

Auto-scaling thresholds can be customized in `hpa.yaml`:

```yaml
# API scaling
- targetCPUUtilizationPercentage: 70
- targetMemoryUtilizationPercentage: 80
- minReplicas: 2
- maxReplicas: 10

# Frontend scaling
- targetCPUUtilizationPercentage: 60
- targetMemoryUtilizationPercentage: 70
- minReplicas: 2
- maxReplicas: 6
```

### Resource Limits

Default resource allocations:

| Component | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|------------|-----------|----------------|--------------|
| API | 250m | 1000m | 512Mi | 1Gi |
| Frontend | 50m | 200m | 64Mi | 128Mi |
| Celery Worker | 200m | 500m | 256Mi | 512Mi |
| PostgreSQL | 250m | 1000m | 512Mi | 2Gi |
| Redis | 100m | 500m | 128Mi | 512Mi |

## Deployment Operations

### Deployment Script Commands

```bash
# Deploy/upgrade
./scripts/deploy.sh deploy [options]
./scripts/deploy.sh upgrade --tag v1.2.3

# Management
./scripts/deploy.sh status
./scripts/deploy.sh logs
./scripts/deploy.sh rollback

# Development
./scripts/deploy.sh port-forward
./scripts/deploy.sh destroy --namespace dev

# Options
--namespace, -n       Kubernetes namespace
--environment, -e     Environment (production/staging/development)
--tag, -t            Docker image tag
--dry-run, -d        Show what would be deployed
--verbose, -v        Verbose output
```

### Manual Operations

```bash
# Scale deployments
kubectl scale deployment api --replicas=5 -n neoforge

# Update image
kubectl set image deployment/api api=neoforge/backend:v1.2.3 -n neoforge

# Check rollout status
kubectl rollout status deployment/api -n neoforge

# Restart deployment
kubectl rollout restart deployment/api -n neoforge

# View logs
kubectl logs -f deployment/api -n neoforge

# Debug pod
kubectl exec -it deployment/api -n neoforge -- /bin/bash
```

### Database Operations

```bash
# Connect to database
kubectl exec -it postgres-0 -n neoforge -- psql -U postgres -d neoforge

# Backup database
kubectl exec postgres-0 -n neoforge -- pg_dump -U postgres neoforge > backup.sql

# Restore database
kubectl exec -i postgres-0 -n neoforge -- psql -U postgres neoforge < backup.sql

# Database migration
kubectl exec deployment/api -n neoforge -- python -m alembic upgrade head
```

## Monitoring and Observability

### Metrics and Dashboards

Access monitoring tools:

```bash
# Port forward to access locally
kubectl port-forward service/grafana 3000:3000 -n neoforge-monitoring
kubectl port-forward service/prometheus 9090:9090 -n neoforge-monitoring

# Or via ingress (production)
https://monitoring.neoforge.example.com/grafana
https://monitoring.neoforge.example.com/prometheus
```

### Key Metrics

- **Application**: Request rate, response time, error rate, queue depth
- **Infrastructure**: CPU/memory usage, disk space, network I/O
- **Business**: Active users, API usage, background task processing

### Alerts

Pre-configured alerts for:
- High error rates (>10% 5xx responses)
- High response times (>1s 95th percentile)
- Database/Redis connection issues
- High resource usage (>80% CPU/memory)
- Pod crash loops
- SSL certificate expiration

## Security

### Network Security

- **Default deny-all**: All traffic blocked by default
- **Explicit allow**: Only required communication paths allowed
- **Ingress filtering**: Rate limiting and IP filtering
- **Internal communication**: Pods can only talk to required services

### Access Control

- **Service accounts**: Minimal permissions per component
- **RBAC**: Role-based access control for humans and automation
- **Pod security**: Non-root users, capability dropping
- **Image security**: Distroless base images, vulnerability scanning

### TLS and Certificates

- **cert-manager**: Automated Let's Encrypt certificates
- **Ingress TLS**: SSL termination at ingress with modern ciphers
- **Internal TLS**: Optional pod-to-pod encryption
- **Certificate rotation**: Automatic renewal and rotation

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
# Check pod status and events
kubectl describe pod <pod-name> -n neoforge
kubectl get events -n neoforge --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n neoforge --previous
```

**Database connection issues:**
```bash
# Test database connectivity
kubectl exec deployment/api -n neoforge -- nc -zv postgres 5432

# Check database logs
kubectl logs postgres-0 -n neoforge

# Verify secrets
kubectl get secret app-secret -n neoforge -o yaml
```

**Ingress not working:**
```bash
# Check ingress status
kubectl describe ingress neoforge-ingress -n neoforge

# Verify certificates
kubectl describe certificate neoforge-tls-cert -n neoforge

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### Health Checks

Built-in health check endpoints:

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

### Log Aggregation

Access application logs:

```bash
# API logs
kubectl logs -f deployment/api -n neoforge

# Worker logs
kubectl logs -f deployment/celery-worker -n neoforge

# Database logs
kubectl logs -f postgres-0 -n neoforge

# All pod logs with labels
kubectl logs -f -l app=api -n neoforge
```

## Backup and Disaster Recovery

### Database Backups

Automated backup job (deployed with monitoring):

```yaml
# Backup CronJob runs daily at 2 AM
schedule: "0 2 * * *"
retention: 7 days
storage: 50Gi
```

Manual backup:
```bash
# Create backup
kubectl exec postgres-0 -n neoforge -- pg_dump -U postgres neoforge | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore backup
gunzip -c backup-20240815.sql.gz | kubectl exec -i postgres-0 -n neoforge -- psql -U postgres neoforge
```

### Persistent Data

- **PostgreSQL**: 50GB SSD persistent volume with daily backups
- **Redis**: 10GB SSD persistent volume (cache data, can be recreated)
- **Monitoring**: 20GB (Prometheus) + 5GB (Grafana) + 2GB (AlertManager)

### Disaster Recovery

1. **Regular backups**: Automated daily database backups
2. **Configuration as code**: All Kubernetes configs in git
3. **Image registry**: Docker images stored in registry
4. **Multi-zone**: Pod anti-affinity across availability zones
5. **Monitoring**: Alerts for all critical issues

## Development and Testing

### Local Development

Use port-forwarding for local development:

```bash
# Forward all services
./scripts/deploy.sh port-forward

# Individual services
kubectl port-forward service/api 8000:8000 -n neoforge
kubectl port-forward service/frontend 3000:80 -n neoforge
```

### Testing Deployments

```bash
# Dry run deployment
./scripts/deploy.sh deploy --dry-run

# Deploy to development namespace
./scripts/deploy.sh deploy --namespace dev --environment development

# Run specific tests
kubectl apply -f test/integration-tests.yaml
```

## Performance Tuning

### Database Optimization

PostgreSQL tuning in `postgres-configmap.yaml`:
- `shared_buffers`: 256MB (25% of memory)
- `max_connections`: 100
- `work_mem`: 4MB
- `checkpoint_completion_target`: 0.7

### Redis Optimization

Redis tuning in `redis-configmap.yaml`:
- `maxmemory-policy`: allkeys-lru
- `maxmemory`: 256MB
- `save`: Snapshot configuration
- `appendonly`: AOF enabled

### Application Tuning

FastAPI optimization:
- Workers: 1 per pod (managed by Kubernetes)
- Keep-alive: 2 seconds
- Max requests: 1000 per worker
- Timeout: 30 seconds

## Upgrade Guide

### Application Updates

1. **Build new images:**
```bash
docker build -t neoforge/backend:v1.2.3 backend/
docker build -t neoforge/frontend:v1.2.3 frontend/
```

2. **Deploy using script:**
```bash
./scripts/deploy.sh upgrade --tag v1.2.3
```

3. **Manual rolling update:**
```bash
kubectl set image deployment/api api=neoforge/backend:v1.2.3 -n neoforge
kubectl set image deployment/frontend frontend=neoforge/frontend:v1.2.3 -n neoforge
```

### Database Migrations

Always run migrations before application updates:

```bash
kubectl exec deployment/api -n neoforge -- python -m alembic upgrade head
```

### Rollback

If issues occur:

```bash
./scripts/deploy.sh rollback
# or manually
kubectl rollout undo deployment/api -n neoforge
```

## Cost Optimization

### Resource Efficiency

- **Right-sizing**: Monitor actual usage and adjust requests/limits
- **Spot instances**: Use for non-critical workloads
- **Horizontal scaling**: Scale based on demand
- **Resource requests**: Set accurate requests for proper scheduling

### Storage Optimization

- **Storage classes**: Use appropriate storage types (SSD for DB, standard for logs)
- **Backup retention**: Configure appropriate retention periods
- **Volume sizing**: Start small and expand as needed

### Monitoring Costs

Track resource usage:
- CPU and memory utilization per pod
- Storage usage and growth rates
- Network traffic and egress costs
- Load balancer and ingress costs

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review monitoring dashboards and alerts
- Check resource usage and scaling patterns
- Verify backup completion and integrity
- Update security patches

**Monthly:**
- Review and rotate secrets/certificates
- Update base images and dependencies
- Performance testing and optimization
- Capacity planning review

**Quarterly:**
- Kubernetes version upgrades
- Major dependency updates
- Security audit and penetration testing
- Disaster recovery testing

### Getting Help

1. **Check logs**: Application and infrastructure logs
2. **Monitor alerts**: Grafana dashboards and AlertManager
3. **Community**: Kubernetes and application-specific communities
4. **Documentation**: Kubernetes, FastAPI, and component docs

### Contributing

To contribute improvements to this Kubernetes setup:

1. Test changes in development namespace
2. Update documentation
3. Submit pull request with deployment verification
4. Include monitoring/alerting changes if needed

## License

This Kubernetes deployment configuration is part of the NeoForge project and follows the same license terms.
