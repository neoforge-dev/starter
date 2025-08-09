# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NeoForge Development Guide

**A modern full-stack starter kit built for bootstrapped founders focusing on cost-efficiency and rapid MVP development.**

## Architecture Overview

### Tech Stack
- **Backend**: FastAPI + SQLModel + PostgreSQL + Redis + Alembic migrations
- **Frontend**: Lit 4.0 Web Components + Vite + PWA-ready configuration  
- **Infrastructure**: Docker containers + Make automation + GitHub Actions CI/CD
- **Monitoring**: Prometheus metrics + structured logging (structlog)
- **Testing**: pytest (backend) + Vitest (frontend) + Factory Boy patterns

### Key Design Patterns
- **Dependency Injection**: FastAPI's `Depends()` system for database/Redis connections
- **Async/Await**: Throughout backend for performance (`AsyncSession`, `aioredis`)
- **Type Safety**: Pydantic v2 schemas + SQLModel for database + TypeScript frontend
- **Atomic Design**: Frontend components organized as atoms → molecules → organisms → pages
- **Factory Pattern**: Test data generation using Factory Boy for consistent test fixtures

## Development Commands

### Environment Setup
```bash
make setup          # Initial setup - creates .env, builds Docker images
make dev            # Start full development environment (backend + frontend)
make clean          # Clean up all containers and cached data
```

### Backend Development
```bash
# Testing
docker compose -f backend/docker-compose.dev.yml run --rm api pytest [path]
docker compose -f backend/docker-compose.dev.yml run --rm api pytest --cov --cov-report=html
docker compose -f backend/docker-compose.dev.yml run --rm api pytest tests/path/to/test_file.py::test_function_name -v

# Database
docker compose -f backend/docker-compose.dev.yml run --rm api alembic upgrade head
docker compose -f backend/docker-compose.dev.yml run --rm api alembic revision --autogenerate -m "description"

# Linting & Quality
ruff check backend/
ruff format backend/
```

### Frontend Development
```bash
cd frontend
npm run test                # All tests
npm run test:coverage       # With coverage report
npm run test -- component-name  # Single test/component
npm run test:watch          # Watch mode
npm run lint               # ESLint
npm run build              # Production build
```

### Integration Testing
- **Health Checks**: All services have health endpoints - API `/health`, PostgreSQL `pg_isready`, Redis ping
- **Test Database**: Isolated test environment with separate database instance
- **Current Status**: Backend 90% coverage (270 tests), Frontend 79/95 files passing (659 tests)

## Code Architecture

### Backend Structure (`backend/app/`)
```
app/
├── main.py              # FastAPI app setup, middleware, health checks
├── api/                 # API layer
│   ├── deps.py         # Dependency injection (DB, Redis, auth)
│   ├── v1/api.py       # Router aggregation
│   ├── endpoints/      # Individual route handlers
│   └── middleware/     # Security, validation, CORS
├── core/               # Core services
│   ├── config.py       # Settings with pydantic-settings
│   ├── database.py     # SQLModel async engine setup
│   ├── auth.py         # JWT authentication
│   ├── redis.py        # Redis connection management
│   ├── metrics.py      # Prometheus metrics collection
│   └── security.py     # Password hashing, validation
├── crud/               # Database operations (Repository pattern)
├── db/                 # Database models and session management
├── models/             # SQLModel table definitions
├── schemas/            # Pydantic request/response models
└── worker/             # Background tasks (email, etc.)
```

### Frontend Structure (`frontend/src/`)
```
src/
├── components/         # Web Components (Atomic Design)
│   ├── atoms/         # Basic elements (buttons, inputs)
│   ├── molecules/     # Composed components (forms, cards)  
│   ├── organisms/     # Complex components (headers, tables)
│   └── pages/         # Full page components
├── services/          # API clients and utilities
│   ├── api.js         # HTTP client with error handling
│   ├── auth.js        # Authentication service
│   └── pwa.js         # PWA functionality
├── styles/            # Shared CSS and themes
└── test/             # Component and integration tests
```

### Database Patterns
- **Async SQLModel**: `async with get_db() as db:` pattern for all database operations
- **Migration Strategy**: Alembic for schema changes - always review auto-generated migrations
- **Connection Pooling**: Configured for production with health checks
- **Factory Boy**: Use `tests/factories.py` for consistent test data creation

### Authentication Flow
1. **JWT Tokens**: Generated in `core/auth.py` with configurable expiration
2. **Dependency Injection**: `Depends(get_current_user)` for protected routes  
3. **Security Middleware**: Rate limiting and CORS configured in `api/middleware/`
4. **Password Handling**: bcrypt hashing in `core/security.py`

### Frontend Component Patterns
```javascript
// Lit component example following project patterns
@customElement('user-card')
export class UserCard extends LitElement {
  @property({ type: Object }) user;
  
  static styles = css`
    :host { 
      display: block; 
      /* Cost-optimized styles - minimal CSS */
    }
  `;
  
  render() {
    return html`
      <div class="card">
        <h2>${this.user?.name}</h2>
      </div>
    `;
  }
}
```

## Development Guidelines

### Code Style Standards
- **Python**: PEP8, 88 char line limit, type hints required, async/await preferred
- **JavaScript**: ES2021+, Lit component patterns, camelCase naming
- **Imports**: Group standard library, third-party, then local imports
- **Error Handling**: Domain-specific exceptions, structured logging with context
- **Testing**: AAA pattern (Arrange-Act-Assert), descriptive test names

### Performance Considerations
- **Cost Optimization**: Designed for <$15/month until scale needed
- **Caching Strategy**: Redis for API responses, browser caching for assets
- **Database**: Async queries with proper indexing, connection pooling
- **Frontend**: Lazy loading, code splitting, minimal bundle sizes

### Security Requirements  
- **Input Validation**: Pydantic schemas + enhanced security validation middleware
- **SQL Injection**: SQLModel parameterized queries + pattern detection
- **XSS Prevention**: Lit's html template literal escaping + request filtering
- **CORS**: Environment-specific configuration (HTTPS-only in production)
- **Rate Limiting**: Per-client IP rate limiting with configurable thresholds
- **Security Headers**: Production-grade CSP, HSTS, X-Frame-Options
- **Threat Detection**: Malicious user-agent blocking, suspicious path detection

## Common Patterns

### Adding New API Endpoint
1. Define Pydantic schema in `schemas/`
2. Create CRUD operations in `crud/` 
3. Add route handler in `api/endpoints/`
4. Include router in `api/v1/api.py`
5. Write tests in `tests/api/`

### Creating Frontend Component
1. Follow atomic design - determine if atom/molecule/organism
2. Use Lit `@customElement` decorator
3. Implement proper TypeScript types
4. Add to component index files
5. Create test file in `test/components/`
6. Include in Storybook if complex

### Database Schema Changes
1. Update SQLModel in `models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated SQL in `alembic/versions/`
4. Test migration up/down: `alembic upgrade head` / `alembic downgrade -1`
5. Update relevant CRUD operations and tests

### Error Handling Pattern
```python
# Backend - use structured logging + proper HTTP status codes
try:
    result = await crud_operation()
    return result
except ValidationError as e:
    logger.warning("Validation failed", error=str(e))
    raise HTTPException(status_code=422, detail="Validation error")
except Exception as e:
    logger.error("Unexpected error", error=str(e), extra={"user_id": user_id})
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Security Testing Patterns
```bash
# Test production security configuration
ENVIRONMENT=production pytest tests/api/test_security.py

# Validate CORS restrictions
curl -X OPTIONS -H "Origin: http://malicious.com" http://localhost:8000/api/v1/health

# Test rate limiting
for i in {1..110}; do curl -s http://localhost:8000/health; done

# Verify security headers
curl -I http://localhost:8000/health | grep -E "(X-|Strict|Content-Security)"
```

### Production Security Checklist
- [ ] Set `ENVIRONMENT=production` in deployment
- [ ] Generate new 32+ character secrets for production
- [ ] Configure CORS_ORIGINS with only HTTPS domains  
- [ ] Test security headers are applied correctly
- [ ] Verify rate limiting works as expected
- [ ] Check threat detection blocks suspicious requests

This architecture prioritizes rapid development while maintaining production-ready security patterns. The focus is on cost-efficiency, type safety, environment-aware security, and clear separation of concerns.