# NeoForge Agent Guidelines

This file provides essential information for agentic coding agents working in this repository.

## Build/Lint/Test Commands

### Backend (Python/FastAPI)
```bash
# Run all tests
make test
# Run single test file
docker compose run --rm api_test pytest tests/path/to/test_file.py
# Run specific test function
docker compose run --rm api_test pytest tests/path/to/test_file.py::TestClass::test_function
# Run with coverage
docker compose run --rm api_test pytest --cov=app --cov-report=html
# Lint code
docker compose run --rm api_test ruff check app/
# Fix linting issues
docker compose run --rm api_test ruff check app/ --fix
# Type checking
docker compose run --rm api_test mypy app/
```

### Frontend (JavaScript/Vanilla + TypeScript)
```bash
# Run all tests
cd frontend && bun run test
# Run unit tests only
cd frontend && bun run test:unit
# Run E2E tests
cd frontend && bun run test:e2e
# Run component tests
cd frontend && bun run test:component
# Run service tests
cd frontend && bun run test:service
# Run tests in watch mode
cd frontend && bun run test:ui
# Run with coverage
cd frontend && bun run test:coverage
# Lint code
cd frontend && bun run lint
# Fix linting issues
cd frontend && bun run lint:fix
# Format code
cd frontend && bun run format
# Type checking
cd frontend && bun run type-check
# Start development server
cd frontend && bun run dev
# Build for production
cd frontend && bun run build
```

### General
```bash
# Setup development environment
make setup
# Start development servers
make dev
# Start frontend only
make frontend
# Start backend only
make backend
# Run smoke test
make smoke
# Clean up
make clean
# Run all tests
make test
# Run frontend tests
make test-frontend
# Run backend tests
make test-backend
```

## Code Style Guidelines

### Backend (Python)
- **Framework**: FastAPI with async patterns
- **Database**: SQLModel with PostgreSQL
- **Linting**: Ruff (line-length: 88, Python 3.11+)
- **Type Checking**: MyPy with strict mode
- **Logging**: Structured logging with structlog
- **Imports**: Use absolute imports, isort-style ordering
- **Error Handling**: Use HTTPException for API errors
- **Naming**: snake_case for variables/functions, PascalCase for classes
- **Documentation**: Google-style docstrings

### Frontend (JavaScript/TypeScript)
- **Framework**: Vanilla JavaScript + TypeScript support
- **Components**: Custom Elements (Web Components) - NO Lit
- **Styling**: CSS-in-JS with template literals + external CSS files
- **Browser APIs**: Use native browser features when possible
- **PWA**: Progressive Web App ready with service worker
- **Imports**: ES6 modules with relative paths
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error Handling**: Try-catch blocks, custom error events
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Build Tool**: Vite with Bun runtime

### General
- **Docker**: All services must run in Docker containers
- **Cost Efficiency**: Optimize for production costs (single $10 DO droplet)
- **Documentation**: Update docs when making changes
- **Testing**: Write tests for new features, maintain coverage thresholds
- **Commits**: Follow conventional commit format

## Cursor Rules Integration

### Development Standards
- Use Docker for all services
- Follow FastAPI async patterns
- Keep web components simple
- Optimize for production costs

### Frontend Rules
- Vanilla JS only (no TypeScript)
- Custom Elements (Web Components) - NO Lit
- Browser-native features
- PWA-ready code

### Backend Rules
- Async FastAPI endpoints
- SQLModel for database
- UV package management
- Ruff for linting

### Infrastructure
- Single DO droplet ($10)
- Nomad for containers
- GitHub Actions CI/CD
- Cloudflare CDN (free tier)

## Testing Strategy
- **Backend**: pytest with Factory Boy patterns, async support
- **Frontend Unit**: Vitest with jsdom, component testing
- **Frontend E2E**: Playwright with multiple browsers
- **Coverage**: Backend 80% global, Frontend 70%+ target
- **CI/CD**: GitHub Actions with automated testing
- **Performance**: Lighthouse CI integration
- **Accessibility**: axe-core integration in E2E tests

## Code Philosophy
1. Start with minimal viable features
2. Focus on developer experience
3. Maintain bootstrap-founder perspective
4. Document as we build
5. Test continuously

## File Structure
```
backend/           # FastAPI application
  app/            # Main application code
  tests/          # Backend tests
  requirements/   # Python dependencies

frontend/         # Vanilla JS web components
  src/           # Source code
    components/  # Custom Elements (Web Components)
    pages/       # Page components
    services/    # Business logic
  tests/         # Frontend tests

docs/            # Documentation
k8s/             # Kubernetes manifests
deploy/          # Deployment configs
```

## PWA Configuration
- **Service Worker**: `frontend/src/service-worker.js` handles caching and offline functionality
- **Icons**: All PWA icons located in `frontend/public/assets/icons/`
- **Manifest**: `frontend/public/manifest.json` defines PWA metadata
- **Icon Generation**: Use `frontend/scripts/generate-icons.sh` to regenerate icons

## Important Notes
- Always run lint and type check commands after changes
- Use Docker for all backend development
- Frontend uses Bun as package manager
- No TypeScript allowed in frontend
- Follow existing patterns in similar files
- Update documentation for significant changes
- always commit and then proceed with the next task from the plan. when there is nothing else planed let's re-evaluate all the docs and make sure to identify technical and documentation debt. update docs where needed
- always commit without additional confirmation when we are on a feature branch
- should only use astral uv for all python dependencies