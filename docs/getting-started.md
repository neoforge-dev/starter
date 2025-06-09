# Getting Started with NeoForge

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [First Application](#first-application)
- [Deployment](#deployment)
- [Next Steps](#next-steps)

## Prerequisites

### Required Software

- Python 3.12+
- Docker Desktop
- Git
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Optional (but recommended)

- VSCode with recommended extensions
- pgAdmin or DBeaver for database management
- Insomnia or Postman for API testing

## Quick Start

### 1. Create New Project

```bash
# Install cookiecutter if you haven't already
pip install cookiecutter

# Create project from template
cookiecutter gh:neoforge/starter

# Answer the prompts:
project_name [My SaaS]: # Your project name
project_slug [my_saas]: # URL-friendly name
use_postgresql [y]: # Use PostgreSQL? (recommended)
use_redis [y]: # Use Redis for caching?
include_admin [y]: # Include admin interface?
```

### 2. Setup Development Environment

```bash
# Navigate to project directory
cd your-project-name

# Create virtual environment and install dependencies
make setup

# Start development servers
make dev
```

Your development environment is now running:

- Frontend: http://localhost:8080 (served directly, no build needed)
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Metrics: http://localhost:8000/metrics

## Development Environment

### Key Commands

```bash
# Start all services
make dev

# Run backend only
make backend

# Serve frontend (no build needed)
python -m http.server 8080 --directory frontend

# Run tests
make test

# Format code
make format

# Check types
make typecheck

# Create new component
make create-component name=UserProfile

# Create new API endpoint
make create-endpoint name=users
```

### Environment Variables

```bash
# .env configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

## Project Structure

```
your-project/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints and middleware
│   │   │   ├── v1/        # API version 1 endpoints
│   │   │   ├── middleware/ # Security and validation
│   │   │   └── deps.py    # Dependencies
│   │   ├── core/          # Core functionality
│   │   │   ├── config.py  # Configuration
│   │   │   ├── security.py # Security utilities
│   │   │   ├── database.py # Database connection
│   │   │   └── email.py   # Email services
│   │   ├── crud/          # Database operations
│   │   ├── db/            # Database models and sessions
│   │   ├── models/        # SQLModel models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── worker/        # Background tasks
│   └── tests/             # Comprehensive test suite (270+ tests)
├── frontend/              # Lit-based web components
│   ├── src/
│   │   ├── components/    # Web components (atomic design)
│   │   │   ├── atoms/    # Basic UI elements
│   │   │   ├── molecules/ # Composed components
│   │   │   ├── organisms/ # Complex components
│   │   │   └── pages/    # Full page components
│   │   ├── services/     # API clients and utilities
│   │   ├── styles/       # Shared styles and themes
│   │   └── test/         # Frontend tests (123 test files)
│   └── index.html        # Entry point
├── docs/                 # Project documentation
├── deploy/               # Infrastructure as code
│   ├── terraform/        # Terraform configurations
│   ├── nomad/           # Container orchestration
│   └── prometheus/      # Monitoring setup
└── Makefile             # Development tasks
```

## First Application

### 1. Create Data Model

```python
# backend/models/item.py
from sqlmodel import SQLModel, Field
from typing import Optional

class Item(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: str
    price: float
```

### 2. Create API Endpoint

```python
# backend/api/v1/items.py
from fastapi import APIRouter, Depends
from sqlmodel import Session

router = APIRouter()

@router.post("/items/")
async def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db)
):
    db_item = Item(**item.dict())
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item
```

### 3. Create Frontend Component

```javascript
// frontend/src/components/features/item-list.js
import { LitElement, html } from 'lit';

export class ItemList extends LitElement {
    static properties = {
        items: { type: Array }
    };

    constructor() {
        super();
        this.items = [];
    }

    render() {
        return html`
            <div class="items">
                ${this.items.map(item => html`
                    <div class="item">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <span>${item.price}</span>
                    </div>
                `)}
            </div>
        `;
    }
}

customElements.define('item-list', ItemList);
```

### 4. Connect Frontend to API

```javascript
// frontend/src/services/api.js
export class ApiService {
    constructor(baseUrl = 'http://localhost:8000/api/v1') {
        this.baseUrl = baseUrl;
    }

    async getItems() {
        const response = await fetch(`${this.baseUrl}/items`);
        return await response.json();
    }

    async createItem(item) {
        const response = await fetch(`${this.baseUrl}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
        });
        return await response.json();
    }
}
```

## Deployment

### 1. Local Testing

```bash
# Build backend
make build-backend

# Test production setup locally
make prod
```

### 2. Cloud Deployment

```bash
# Deploy to production (default: Digital Ocean)
make deploy

# Deploy to staging
make deploy-staging

# Deploy to specific provider
make deploy provider=aws
```

### 3. Verify Deployment

```bash
# Run smoke tests
make test-deployment

# Monitor logs
make logs
```

## Next Steps

1. **Add Authentication**
   ```bash
   make add-auth provider=auth0  # or 'jwt' or 'oauth'
   ```

2. **Setup Monitoring**
   ```bash
   make add-monitoring  # Adds Prometheus + Grafana
   ```

3. **Enable CDN**
   ```bash
   make add-cdn provider=cloudflare
   ```

4. **Configure Emails**
   ```bash
   make add-email provider=sendgrid  # or 'ses' or 'postmark'
   ```

Remember: NeoForge is designed to help you move fast while keeping costs low. Start with the minimal setup you need and scale as your product grows.

## Common Tasks

### Adding a New Feature

1. **Create Database Migration**

   ```bash
   make migration name="add_user_preferences"
   ```

2. **Generate API Endpoint**

   ```bash
   make endpoint name="preferences"
   ```

3. **Create Frontend Component**

   ```bash
   make component name="user-preferences"
   ```

### Debugging

1. **Backend Debugging**

   ```bash
   make debug-backend  # Starts debugger on port 5678
   ```

2. **Frontend Debugging**

   ```bash
   make debug-frontend  # Starts debugger on port 9229
   ```

3. **View Logs**

   ```bash
   make logs  # Shows all logs
   make logs service=api  # Shows only API logs
   ```

## Cost Monitoring

Monitor your resource usage:

```bash
make costs  # Shows current month's costs
```

Example output:

```
Current Month Costs:
- API Requests: 123,456 ($0.50)
- Database Storage: 100MB ($0.20)
- Cache Usage: 50MB ($0.10)
Total: $0.80
```

## Getting Help

1. **Documentation**
   - Full docs: <https://docs.neoforge.dev>
   - API reference: <https://api.neoforge.dev>
   - Component library: <https://components.neoforge.dev>

2. **Community**
   - Discord: <https://discord.gg/neoforge>
   - GitHub Discussions: <https://github.com/neoforge/neoforge/discussions>

3. **Support**
   - Email: <support@neoforge.dev>
   - Issues: <https://github.com/neoforge/neoforge/issues>

Remember: NeoForge is designed to help you move fast while keeping costs low. Start with the minimal setup you need and scale as your product grows.
