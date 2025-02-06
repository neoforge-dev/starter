# 🚀 NeoForge

**Modern Full-Stack Starter Kit for Bootstrapped Founders**
*Zero to MVP with FastAPI + Lit, Optimized for Speed and Cost*

[![Built with FastAPI](https://img.shields.io/badge/Built%20with-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Built with Lit](https://img.shields.io/badge/Built%20with-Lit-324FFF?style=flat&logo=lit)](https://lit.dev)
[![Monthly Cost](https://img.shields.io/badge/Monthly%20Cost-%3C%2415-success)](https://neoforge.dev/costs)
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

```bash
# Run specific test file
docker compose -f backend/docker-compose.dev.yml run --rm test pytest tests/api/test_users.py -v

# Run with coverage report
docker compose -f backend/docker-compose.dev.yml run --rm test pytest --cov=app --cov-report=html
```

## Project Structure

```
neoforge/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── models/        # SQLModel models
│   │   └── services/      # Business logic
│   ├── tests/
│   │   ├── factories.py   # Test data factories
│   │   └── conftest.py    # Test configuration
│   └── docker-compose.dev.yml
├── frontend/
│   ├── index.html
│   └── js/
│       └── components/    # Web components
└── Makefile              # Development tasks
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

## License

MIT

## 📚 Documentation

- [Getting Started](https://neoforge.dev/docs/getting-started)
- [Architecture Guide](https://neoforge.dev/docs/architecture)
- [Deployment Guide](https://neoforge.dev/docs/deployment)
- [Security Guide](https://neoforge.dev/docs/security)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for Bootstrapped Founders**

[Website](https://neoforge.dev) · [Documentation](https://neoforge.dev/docs) · [Discord](https://discord.gg/neoforge)
