# Infrastructure Architecture

## Overview

NeoForge uses a containerized microservices architecture deployed on a single Digital Ocean droplet, with Cloudflare CDN for edge caching and distribution.

## Architecture Diagram

```mermaid
graph TB
    subgraph Internet
        User((User))
        CF[Cloudflare CDN]
    end

    subgraph "Digital Ocean ($10 Droplet)"
        subgraph "Docker Containers"
            NGINX[NGINX Proxy]
            FE[Frontend<br/>Lit Components]
            API[FastAPI Backend]
            DB[(PostgreSQL)]
            CACHE[(Redis Cache)]
        end
        
        subgraph "Monitoring"
            PROM[Prometheus]
            NODE[Node Exporter]
        end
    end

    User --> CF
    CF --> NGINX
    NGINX --> FE
    NGINX --> API
    API --> DB
    API --> CACHE
    
    PROM --> NODE
    NODE --> FE
    NODE --> API
    NODE --> DB
    NODE --> CACHE
```

## Component Details

### Frontend Layer
```mermaid
graph LR
    subgraph "Frontend Container"
        NGINX[NGINX Server]
        STATIC[Static Assets]
        SW[Service Worker]
    end

    subgraph "Browser"
        HTML[HTML]
        JS[JavaScript]
        CSS[CSS]
        CACHE[Cache API]
    end

    NGINX --> HTML
    NGINX --> JS
    NGINX --> CSS
    SW --> CACHE
```

### API Layer
```mermaid
graph TB
    subgraph "API Container"
        FAST[FastAPI]
        UVICORN[Uvicorn Server]
        MODELS[SQLModel]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    FAST --> UVICORN
    MODELS --> PG
    FAST --> REDIS
```

### Monitoring Stack
```mermaid
graph LR
    subgraph "Monitoring"
        PROM[Prometheus]
        ALERT[Alertmanager]
        DASH[Dashboard]
    end

    subgraph "Metrics Sources"
        NODE[Node Exporter]
        CONT[Container Metrics]
        APP[Application Metrics]
    end

    NODE --> PROM
    CONT --> PROM
    APP --> PROM
    PROM --> ALERT
    PROM --> DASH
```

## Resource Allocation

### Container Resources
```mermaid
pie
    title "Container Resource Allocation"
    "Frontend" : 25
    "API" : 40
    "Database" : 25
    "Cache" : 10
```

### Memory Distribution
```mermaid
pie
    title "Memory Distribution (1GB Total)"
    "Frontend" : 256
    "API" : 512
    "Database" : 512
    "Cache" : 256
    "System" : 512
```

## Deployment Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant CI as GitHub Actions
    participant DO as Digital Ocean
    participant CF as Cloudflare

    Dev->>Git: Push Code
    Git->>CI: Trigger Workflow
    CI->>CI: Run Tests
    CI->>CI: Build Images
    CI->>DO: Deploy Containers
    DO->>CF: Update Edge Cache
    CF->>Dev: Deployment Complete
```

## Backup Strategy

```mermaid
graph TB
    subgraph "Automated Backups"
        CRON[Cron Job]
        SCRIPT[Backup Script]
        DB[(PostgreSQL)]
        S3[S3 Storage]
    end

    CRON --> SCRIPT
    SCRIPT --> DB
    SCRIPT --> S3
```

## Security Layers

```mermaid
graph TB
    subgraph "Security Stack"
        CF[Cloudflare WAF]
        SSL[SSL/TLS]
        FW[Firewall]
        AUTH[Authentication]
        CORS[CORS]
        CSP[Content Security]
    end

    CF --> SSL
    SSL --> FW
    FW --> AUTH
    AUTH --> CORS
    CORS --> CSP
``` 