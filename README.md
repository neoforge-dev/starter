# 🚀 NeoForge

**Modern Full-Stack Starter Kit for Bootstrapped Founders**
*Zero to MVP with FastAPI + Lit, Optimized for Speed and Cost*

[![Built with FastAPI](https://img.shields.io/badge/Built%20with-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Built with Lit](https://img.shields.io/badge/Built%20with-Lit-324FFF?style=flat&logo=lit)](https://lit.dev)
[![Monthly Cost](https://img.shields.io/badge/Monthly%20Cost-%3C%2415-success)](docs/costs.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Why NeoForge?

Built for bootstrapped founders who need to:

- Launch MVPs quickly without technical debt
- Keep costs near zero during validation
- Scale efficiently when product-market fit is achieved
- Maintain flexibility for future growth

## ✨ Core Features

### For Founders

- 🚀 Zero to MVP in under 1 hour
- 💰 Costs under $15/month until scale needed
- 🛠 Modern stack without complexity
- 🔍 Debug-friendly development
- 📈 Built-in analytics and user tracking

### Technical Stack

#### Backend

- ⚡️ FastAPI with async support
- 📦 UV for ultra-fast package management
- 🎯 Ruff for comprehensive linting
- 🗃 SQLite → PostgreSQL migration path
- ✅ Pydantic v2 for validation

#### Frontend

- 🎨 Lit 4.0 web components
- 🌐 Browser-native features
- 📱 PWA-ready configuration
- 🔧 TypeScript for type safety
- 🏗 Vite for building

#### Infrastructure

- 🚀 Single $10 DO droplet to start
- 📦 Nomad for container orchestration
- ⚙️ Terraform for infrastructure
- 🔄 GitHub Actions for CI/CD
- 🌐 Cloudflare for CDN (free tier)

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Make
- Git

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/neoforge.git
cd neoforge
```

2. Initialize the development environment:
```bash
make setup  # Creates .env and builds Docker images
```

3. Start the development environment:
```bash
make dev  # Starts all services with hot-reload
```

The API will be available at http://localhost:8000 with auto-reload enabled.

### Common Development Tasks

```bash
# Run tests
make test           # Run all tests
make test-watch     # Run tests in watch mode

# Code quality
make lint           # Run all linters
make format         # Format code

# Database
make db-shell      # Open PostgreSQL shell
make redis-shell   # Open Redis shell

# Monitoring
make logs          # View service logs
make health        # Check service health

# Cleanup
make clean         # Remove all containers and cache
```

## Development Environment

### Docker Services

- **API**: FastAPI application with hot-reload
- **Database**: PostgreSQL 15
- **Redis**: For caching and rate limiting
- **Test**: Separate container for running tests

### Health Checks

All services include health checks:

- API: HTTP check on `/health` endpoint
- PostgreSQL: Connection check with `pg_isready`
- Redis: Ping check

View detailed health status:
```bash
make health
```

### Testing Strategy

Tests run in a dedicated container with:
- Isolated test database
- Factory Boy for test data
- Async test support
- Full coverage reporting

**Current Test Coverage:**
- **Backend**: 90% coverage (270 tests passing, 2 failed, 1 skipped)
- **Frontend**: 75/88 test files passing (659 tests passing, 34 skipped)

```bash
# Backend tests
docker compose -f backend/docker-compose.dev.yml run --rm api pytest --cov --cov-report=html

# Frontend tests
cd frontend && npm run test:unit
cd frontend && npm run test:coverage

# Run specific test file
docker compose -f backend/docker-compose.dev.yml run --rm api pytest tests/api/test_users.py -v
```

## Project Structure

```
neoforge/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/               # API endpoints and middleware
│   │   │   ├── v1/           # API version 1 endpoints
│   │   │   ├── middleware/   # Security and validation middleware
│   │   │   └── deps.py       # Dependency injection
│   │   ├── core/             # Core functionality
│   │   │   ├── config.py     # Configuration management
│   │   │   ├── security.py   # Authentication & authorization
│   │   │   ├── database.py   # Database setup
│   │   │   ├── email.py      # Email services
│   │   │   └── metrics.py    # Performance monitoring
│   │   ├── crud/             # Database operations
│   │   ├── db/               # Database models and session management
│   │   ├── models/           # SQLModel data models
│   │   ├── schemas/          # Pydantic schemas for validation
│   │   └── worker/           # Background task workers
│   ├── tests/                # Comprehensive test suite (270+ tests)
│   │   ├── api/              # API endpoint tests
│   │   ├── core/             # Core functionality tests
│   │   ├── crud/             # Database operation tests
│   │   └── conftest.py       # Test configuration
│   └── docker-compose.dev.yml
├── frontend/                  # Lit-based web components frontend
│   ├── src/
│   │   ├── components/       # Web components (atomic design)
│   │   │   ├── atoms/        # Basic UI elements
│   │   │   ├── molecules/    # Composed components
│   │   │   ├── organisms/    # Complex components
│   │   │   └── pages/        # Full page components
│   │   ├── services/         # API clients and utilities
│   │   ├── styles/           # Shared styles and themes
│   │   └── test/             # Frontend tests (123 test files)
│   ├── docs/                 # Component documentation
│   └── index.html            # Application entry point
├── docs/                     # Project documentation
│   ├── architecture.md      # System architecture
│   ├── api/                 # API documentation
│   ├── frontend/            # Frontend guides
│   └── deployment.md        # Deployment instructions
├── deploy/                   # Infrastructure as code
│   ├── terraform/           # Terraform configurations
│   ├── nomad/              # Nomad job specifications
│   └── prometheus/         # Monitoring configuration
└── Makefile                 # Development task automation
```

## Best Practices

- Use `make` commands for common tasks
- Run tests before committing: `make test`
- Format code: `make format`
- Check health before deploying: `make health`
- Use `make help` to see all available commands

## Troubleshooting

1. **Services won't start**:
   ```bash
   make clean   # Remove all containers
   make setup   # Rebuild everything
   make dev     # Start fresh
   ```

2. **Tests failing**:
   ```bash
   make logs    # Check service logs
   make health  # Verify service health
   ```

3. **Database issues**:
   ```bash
   make db-shell  # Inspect database directly
   ```

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guide](docs/security.md)
- [API Documentation](docs/api/README.md)
- [Frontend Guide](docs/frontend/README.md)
- [Database Schema](docs/database/README.md)
- [Infrastructure](docs/infrastructure/README.md)
- [Monitoring](docs/monitoring/README.md)
- [Best Practices](docs/best-practices.md)
- [ADRs](docs/adr/README.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for Bootstrapped Founders**
[Website](https://neoforge.dev) · [Documentation](https://neoforge.dev/docs) ·
[Discord](https://discord.gg/neoforge)

[Getting Started](docs/getting-started.md) · [Architecture](docs/architecture.md) · [Best Practices](docs/best-practices.md) · [Deployment](docs/deployment.md) · [Security](docs/security.md) · [Monitoring](docs/monitoring.md) · [Backend API](docs/backend/README.md) · [Frontend](docs/frontend/README.md)  · [Infrastructure](docs/infrastructure/README.md)
