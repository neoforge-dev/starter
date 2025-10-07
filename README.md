# 🚀 NeoForge

**Enterprise-Ready Full-Stack Platform for Scalable SaaS Applications**
*FastAPI + Domain-Driven Design + Lit + PostgreSQL + Redis*

> **Current Status:** Migrating to Domain-Driven Design architecture (see [Architecture Migration](#-architecture-migration) below)

[![Built with FastAPI](https://img.shields.io/badge/Built%20with-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Built with Lit](https://img.shields.io/badge/Built%20with-Lit-324FFF?style=flat&logo=lit)](https://lit.dev)
[![Monthly Cost](https://img.shields.io/badge/Monthly%20Cost-%3C%2415-success)](#costs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎯 What is NeoForge?

NeoForge is an **enterprise-ready full-stack platform** that evolved from a simple starter kit into a sophisticated SaaS foundation with:

- 🏛️ **Domain-Driven Design** - Clean architecture with separated business logic
- 🚀 **Enterprise Features** - Multi-tenancy, SAML SSO, AI workflows, personalization
- 💰 **Cost-Efficient** - Still maintains <$15/month operating costs for MVPs
- 🔒 **Security-First** - Zero critical vulnerabilities, comprehensive threat protection
- 📚 **Production-Proven** - Complete deployment, monitoring, and operational guides

## ✨ Feature Set

### Core Platform (MVP-Ready)
- **Backend**: FastAPI + SQLModel + PostgreSQL + Redis + Celery background tasks
- **Frontend**: Lit 4.0 web components (NOBUILD architecture) + PWA support
- **Authentication**: JWT auth with secure token management
- **Infrastructure**: Docker containers + health monitoring + CI/CD automation
- **Testing**: 95%+ backend coverage, 98%+ frontend stability
- **Documentation**: 2,700+ lines of operational guides

### Enterprise Features (Production-Scale)
- **Multi-Tenancy**: Complete tenant isolation with middleware support
- **SAML SSO**: Enterprise single sign-on integration
- **AI Workflows**: Automated workflow orchestration with metrics
- **Personalization Engine**: ML-based user profiling and recommendations
- **A/B Testing**: Statistical analysis and conversion tracking
- **Advanced Security**: Rate limiting, threat detection, compliance monitoring
- **Subscription Billing**: Stripe integration with usage tracking

## 🚀 Zero to Production in 30 Minutes

**Transform your ideas into live, scalable applications in under 30 minutes!**

```bash
# 1. Install Bun for maximum performance (76x faster)
curl -fsSL https://bun.sh/install | bash

# 2. Start the advanced playground
cd frontend
bun install          # 783ms vs npm's 30-60s
bun run playground   # Opens at http://localhost:8080

# 3. Click "🚀 Build App" and follow the 4-step wizard
```

**Complete Zero-to-Production Guide**: [ZERO_TO_PRODUCTION_GUIDE.md](./ZERO_TO_PRODUCTION_GUIDE.md)

## What You Get

- ✅ **26 Production-Ready Components** - Atoms → Molecules → Organisms
- ✅ **Modern Dashboard Experience** - Welcome section, metrics, quick actions
- ✅ **Project Management Workflow** - Create, manage, and track projects
- ✅ **Real-time Analytics** - Live metrics and performance insights
- ✅ **Mobile-Responsive Design** - Works perfectly on all devices
- ✅ **One-Click Deployment** - Netlify, Vercel, Railway integration
- ✅ **Health Monitoring** - Built-in uptime and performance tracking
- ✅ **76x Faster Performance** - Bun runtime optimization
- ✅ **Complete App Templates** - Frontend, Full-Stack, API-Only, E-commerce
- ✅ **Security Hardened** - HTTPS, CSP headers, input validation
- ✅ **Production Optimized** - CDN, caching, compression, monitoring

## Traditional Development Setup

For traditional development workflow:

```bash
# Clone and setup (creates .env, builds containers)
git clone https://github.com/yourusername/neoforge.git
cd neoforge
make setup

# Start development environment
make dev
```

**🎉 That's it!** Your app is running at:
- API: [localhost:8000](http://localhost:8000)
- Docs: [localhost:8000/docs](http://localhost:8000/docs)
- Health: [localhost:8000/health](http://localhost:8000/health)

## 📚 Documentation

**👉 [Complete Documentation Hub](docs/)**

### Quick Navigation

| I'm a... | Go to... |
|----------|----------|
| **🆕 New Developer** | [Quick Start Guide](docs/getting-started/) |
| **💻 Active Developer** | [Development Guide](docs/development/) |
| **🏗️ Technical Lead** | [Architecture Guide](docs/architecture/) + [DDD Migration](docs/architecture/migration-guide-crud-to-ddd.md) |
| **🚀 DevOps Engineer** | [Operations Guide](docs/operations/) + [Deployment Docs](backend/docs/DEPLOYMENT.md) |
| **📖 Looking for Reference** | [API & Component Docs](docs/reference/) |
| **🔄 Migrating to DDD** | [ADR 0001](docs/architecture/decisions/0001-domain-driven-design-migration.md) + [Migration Guide](docs/architecture/migration-guide-crud-to-ddd.md) |

## 📊 Production Status

### Platform Maturity
✅ **Security**: Zero critical vulnerabilities (down from 11 production-blocking issues)
✅ **Backend**: 95%+ test coverage, 280+ tests, production-ready with DDD migration
✅ **Frontend**: 98.5% test stability, 711+ passing tests, NOBUILD architecture
✅ **Architecture**: Dual-pattern support (CRUD + DDD) during migration
✅ **Dependencies**: Optimized (1,222 packages, -123 cleanup, -96% lint issues)
✅ **Performance**: 646ms builds, optimal bundle sizes
✅ **Documentation**: 2,700+ lines of operational guides

### Recent Improvements (September-October 2025)
- 🛡️ **Security Hardening**: Eliminated 11 critical vulnerabilities (CVSS 8.4 → 0.0)
- 🏛️ **DDD Architecture**: Migration to Domain-Driven Design for scalability
- 📝 **Documentation**: Added ADR 0001, migration guides, deployment docs
- 🧹 **Code Quality**: -96% frontend lint issues, removed 807 console statements
- 🔧 **Infrastructure**: Fixed 6 broken database migrations, validated deployment

### Migration Progress
- ✅ **Phase 1**: Coexistence architecture established
- 🔄 **Phase 2**: In Progress - Migrating critical paths to DDD
- ⏳ **Phase 3**: Planned Q2 2026 - Legacy CRUD removal

*See [Technical Debt Resolution Report](TECHNICAL_DEBT_RESOLUTION_COMPLETE.md) for complete improvement details.*
*See [Architecture Migration](#-architecture-migration) for DDD transition status.*

## 🛠️ Development Commands

```bash
make setup      # Initial setup
make dev        # Start development environment
make test       # Run all tests
make health     # Check service health
make clean      # Clean up containers
```

**All commands**: `make help`

## 🏗️ Architecture & Tech Stack

### Backend Architecture (DDD Migration in Progress)

**New Domain-Driven Design Structure:**
```
backend/app/
├── domain/              # Pure business logic (no dependencies)
│   ├── entities/        # Business entities with behavior
│   ├── value_objects/   # Immutable domain concepts
│   ├── repositories/    # Repository interfaces (ports)
│   └── services/        # Domain services
├── application/         # Use cases and orchestration
│   ├── commands/        # Write operations (CQRS)
│   └── queries/         # Read operations (CQRS)
├── infrastructure/      # External concerns (adapters)
│   ├── repositories/    # Concrete implementations
│   └── database/        # SQLModel models, migrations
└── interfaces/          # API layer (FastAPI endpoints)
```

**Legacy CRUD Structure (Being Phased Out):**
- `/app/models/` - SQLModel database models
- `/app/crud/` - Direct database operations
- `/app/api/endpoints/` - API endpoints

> **Migration Status:** Both patterns coexist during transition. New features use DDD patterns. See [Architecture Migration](#-architecture-migration) for details.

### Technology Stack

**Backend:**
- **FastAPI** - Modern async Python web framework
- **SQLModel** - Type-safe ORM for database operations
- **PostgreSQL** - Production-grade relational database
- **Redis** - Caching, sessions, and task queue
- **Celery** - Background task processing
- **Alembic** - Database migration management

**Frontend:**
- **Lit 4.0** - Modern web components framework
- **JavaScript** - NOBUILD architecture (no TypeScript compilation)
- **Vite** - Development server and build tooling
- **PWA** - Progressive web app capabilities
- **Bun** - Ultra-fast JavaScript runtime (76x faster than npm)

**Infrastructure:**
- **Docker** - Containerized development and deployment
- **Make** - Build automation and task runner
- **GitHub Actions** - CI/CD pipeline automation
- **Prometheus** - Metrics collection and monitoring
- **Kubernetes** (Optional) - Production orchestration

## 🏛️ Architecture Migration

NeoForge is currently migrating from traditional CRUD patterns to **Domain-Driven Design (DDD)** architecture to better support enterprise features and complex business logic.

### Current State (Q4 2025)

**Branch:** `feature/domain-driven-refactor`

Both architectural patterns coexist during the migration:

| Pattern | Status | Use For |
|---------|--------|---------|
| **Legacy CRUD** | Being Deprecated | Existing features, simple CRUD operations |
| **New DDD** | Active Development | New features, complex business logic |

### Why the Migration?

As NeoForge evolved from a simple starter kit to an enterprise platform with:
- Multi-tenancy and tenant isolation
- SAML SSO and advanced authentication
- AI workflow orchestration
- Personalization engines with ML
- Complex subscription billing

...the traditional CRUD pattern showed limitations:
- Business logic scattered across layers
- Tight coupling to database models
- Difficult to test without database
- Circular dependencies between modules

### Migration Timeline

- **Phase 1 (Current):** Coexistence - Both patterns work side-by-side
- **Phase 2 (Q1 2026):** Gradual migration of critical paths to DDD
- **Phase 3 (Q2 2026):** Legacy CRUD removal, full DDD adoption

### Resources for Developers

- [ADR 0001: DDD Migration Decision](docs/architecture/decisions/0001-domain-driven-design-migration.md) - Architectural rationale
- [CRUD to DDD Migration Guide](docs/architecture/migration-guide-crud-to-ddd.md) - Step-by-step migration process
- [DDD Pattern Examples](docs/architecture/migration-guide-crud-to-ddd.md#step-2-create-domain-entities) - Code samples and best practices

### When to Use Each Pattern

**Use DDD for:**
- Complex business rules and workflows
- Event-driven interactions
- Features requiring high testability
- New development

**Use Legacy CRUD for:**
- Simple data retrieval
- Admin panels
- Rapid prototyping
- Maintenance of existing features

## 🚨 System Requirements & Warnings

### Disk Space Requirements
- **Development Environment:** 2-3 GB (dependencies + Docker images)
- **Build Artifacts:** 500 MB - 1 GB
- **Recommended Free Space:** 5 GB minimum

⚠️ **Important:** This project generates significant build artifacts. Ensure adequate disk space before setup. The system currently tracking at **99% capacity** may cause build failures.

### Runtime Requirements
- **Docker Desktop:** 4 GB RAM minimum, 8 GB recommended
- **Node/Bun:** Node 18+ or Bun 1.0+
- **Python:** 3.11+ (backend development)
- **PostgreSQL:** 14+ (if running natively)

## 🤝 Contributing

**New to the project?** → [Contributing Guide](CONTRIBUTING.md)
**Working with DDD patterns?** → See [Architecture Migration](#-architecture-migration) above
**Questions?** → [GitHub Issues](https://github.com/yourusername/neoforge/issues)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Ready to build your next big idea?** 🚀
[**Get Started →**](docs/getting-started/)

*Built with ❤️ for Bootstrapped Founders*
