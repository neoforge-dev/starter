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

### Frontend (JavaScript/Lit)
```bash
# Run all tests
cd frontend && bun run test
# Run single test file
cd frontend && bun vitest run src/test/path/to/test_file.test.js
# Run tests in watch mode
cd frontend && bun run test:watch
# Run with coverage
cd frontend && bun run test:coverage
# Lint code
cd frontend && bun run lint
# Fix linting issues
cd frontend && bun run lint:fix
# Format code
cd frontend && bun run format
```

### General
```bash
# Setup development environment
make setup
# Start development servers
make dev
# Run smoke test
make smoke
# Clean up
make clean
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

### Frontend (JavaScript)
- **Framework**: Vanilla JavaScript only (NO TypeScript)
- **Components**: Lit web components (lit-html/lit-element)
- **Styling**: CSS-in-JS with Lit's css`` template literals
- **Browser APIs**: Use native browser features when possible
- **PWA**: Progressive Web App ready
- **Imports**: ES6 modules with relative paths
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error Handling**: Try-catch blocks, custom error events
- **Testing**: Vitest with jsdom environment

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
- Lit web components
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
- **Frontend**: Vitest with jsdom, component testing
- **Coverage**: Backend 80% global, Frontend thresholds configured
- **CI/CD**: GitHub Actions with automated testing

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

frontend/         # Lit web components
  src/           # Source code
    components/  # Web components
    pages/       # Page components
    services/    # Business logic
  tests/         # Frontend tests

docs/            # Documentation
k8s/             # Kubernetes manifests
deploy/          # Deployment configs
```

## Important Notes
- Always run lint and type check commands after changes
- Use Docker for all backend development
- Frontend uses Bun as package manager
- No TypeScript allowed in frontend
- Follow existing patterns in similar files
- Update documentation for significant changes