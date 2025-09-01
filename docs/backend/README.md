# NeoForge Backend Documentation

## Overview

The NeoForge backend is built with FastAPI and follows modern async patterns for optimal performance and scalability. This guide covers everything you need to know about the backend architecture, development workflow, and deployment process.

## Quick Start

```bash
# Setup development environment
make setup

# Start development server
make dev

# Run tests
make test
```

## Core Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **SQLModel ORM**: Type-safe database interactions
- **UV Package Management**: Fast, reliable dependency management
- **Docker Containers**: Isolated development and deployment
- **Async Support**: High-performance async/await patterns
- **Comprehensive Testing**: pytest with async support

## Project Structure

```
backend/
├── src/
│   ├── api/          # API endpoints
│   ├── core/         # Core functionality
│   ├── db/           # Database models and migrations
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── tests/            # Test suite
├── docker/           # Docker configurations
└── pyproject.toml    # Project dependencies
```

## Development Standards

### Code Style
- Black formatting with 88 chars
- Ruff for linting
- MyPy strict mode
- NumPy-style docstrings

### Testing
- Isolated test containers
- Factory Boy for test data
- Full async support
- Coverage reporting

### Database
- SQLModel for ORM
- Alembic migrations
- PostgreSQL 15
- Connection pooling

### API Design
- OpenAPI documentation
- Pydantic validation
- JWT authentication
- Rate limiting

## Common Tasks

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_api.py
```

### Docker Operations
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Documentation

The API documentation is available at `/docs` when running the development server. It includes:
- Interactive API explorer
- Request/response examples
- Authentication details
- Schema definitions

## Deployment

See [Deployment Guide](../deployment.md) for detailed deployment instructions.

## Contributing

1. Follow the code style guidelines
2. Add tests for new functionality
3. Update documentation
4. Submit a pull request

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
