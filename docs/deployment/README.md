# NeoForge Deployment Guide

## Overview

NeoForge is designed to be deployed on a single Digital Ocean droplet using Docker containers orchestrated by Nomad. This guide covers the complete deployment process, from setting up infrastructure to monitoring the production environment.

## Infrastructure Requirements

- Digital Ocean Droplet ($10/month)
  - 2GB RAM
  - 1 vCPU
  - 50GB SSD
- Cloudflare (Free tier)
  - DNS management
  - CDN services
  - SSL/TLS

## Initial Setup

### 1. Droplet Configuration

```bash
# Create new droplet
doctl compute droplet create neoforge \
  --size s-1vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --region nyc1

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Domain Configuration

1. Add domain to Cloudflare
2. Update nameservers
3. Configure SSL/TLS (Full strict mode)
4. Add DNS records:
   ```
   Type  Name     Value
   A     @        <droplet-ip>
   CNAME www      @
   CNAME api     @
   ```

### 3. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
  docker.io \
  docker-compose \
  nginx \
  certbot \
  python3-certbot-nginx
```

## Container Setup

### 1. Docker Configuration

```bash
# Create docker network
docker network create neoforge

# Configure docker to start on boot
systemctl enable docker
```

### 2. Nomad Setup

```bash
# Install Nomad
curl -fsSL https://apt.releases.hashicorp.com/gpg | apt-key add -
apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
apt update && apt install nomad

# Configure Nomad
cat > /etc/nomad.d/neoforge.hcl <<EOF
datacenter = "dc1"
data_dir = "/opt/nomad/data"

server {
  enabled = true
  bootstrap_expect = 1
}

client {
  enabled = true
}
EOF

# Start Nomad
systemctl enable nomad
systemctl start nomad
```

## Application Deployment

### 1. Environment Setup

```bash
# Create environment file
cat > .env <<EOF
POSTGRES_USER=neoforge
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=neoforge
JWT_SECRET=<secure-secret>
REDIS_PASSWORD=<secure-password>
EOF
```

### 2. Database Setup

```bash
# Start PostgreSQL
nomad job run postgres.nomad

# Run migrations
nomad exec -job postgres alembic upgrade head
```

### 3. Application Deployment

```bash
# Deploy backend
nomad job run backend.nomad

# Deploy frontend
nomad job run frontend.nomad
```

## Monitoring Setup

### 1. Prometheus & Grafana

```bash
# Deploy monitoring stack
nomad job run monitoring.nomad
```

### 2. Logging

```bash
# Configure log rotation
cat > /etc/logrotate.d/neoforge <<EOF
/var/log/neoforge/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

## Backup Strategy

### 1. Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh <<EOF
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U neoforge -d neoforge > /backups/neoforge_$DATE.sql
EOF

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/backup-db.sh" | crontab -
```

### 2. File Backups

```bash
# Install restic
apt install restic

# Configure backups
restic init --repo /backups
restic backup /var/lib/neoforge
```

## SSL/TLS Configuration

```bash
# Obtain SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Configure auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Maintenance

### Regular Tasks

1. Update system packages weekly
2. Rotate logs daily
3. Monitor disk usage
4. Check backup integrity
5. Review security updates

### Security

1. Enable UFW firewall
2. Configure fail2ban
3. Regular security audits
4. Monitor access logs

## Troubleshooting

### Common Issues

1. Container health checks failing
   ```bash
   nomad alloc status <alloc-id>
   docker logs <container-id>
   ```

2. Database connection issues
   ```bash
   nomad exec -job postgres psql -U neoforge -d neoforge
   ```

3. Nginx configuration
   ```bash
   nginx -t
   systemctl status nginx
   ```

## Scaling

The current setup supports:
- Up to 1000 concurrent users
- 100GB storage
- 2TB monthly bandwidth

To scale:
1. Increase droplet size
2. Add read replicas
3. Enable caching
4. Implement CDN

## Additional Resources

- [Nomad Documentation](https://www.nomadproject.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Digital Ocean Documentation](https://docs.digitalocean.com/)
- [Cloudflare Documentation](https://developers.cloudflare.com/) 