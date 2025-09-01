# Getting Started with NeoForge

**Go from zero to running application in under 5 minutes.**

NeoForge is a production-ready full-stack starter kit optimized for bootstrapped founders who need to launch MVPs quickly while maintaining enterprise-grade security and scalability.

## 🏗️ What You're Building

- **Backend**: FastAPI with async SQLModel, PostgreSQL, Redis, Celery background tasks
- **Frontend**: Lit 4.0 web components with PWA support, comprehensive testing
- **Infrastructure**: Docker containers, health monitoring, production deployment ready
- **Security**: JWT authentication, rate limiting, comprehensive security headers

## ⚡ Quick Setup

### Prerequisites

Make sure you have installed:
- **Docker & Docker Compose** - For containerized development
- **Make** - For task automation
- **Git** - For version control
- **Node.js 18+** - For frontend development (if working outside containers)

### 1. Clone & Initialize

```bash
# Clone the repository
git clone https://github.com/yourusername/neoforge.git
cd neoforge

# Initialize development environment (creates .env, builds images)
make setup
```

### 2. Start Development Environment

```bash
# Start all services with hot-reload
make dev
```

**🎉 That's it!** Your application is now running:

- **API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (Interactive Swagger UI)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Frontend**: [http://localhost:3000](http://localhost:3000)

## 🧪 Verify Installation

Run these commands to ensure everything is working:

```bash
# Check service health
make health

# Run tests to verify setup
make test

# View service logs
make logs
```

**Expected Results:**
- ✅ All services show "healthy" status
- ✅ Backend: 95%+ test coverage (280+ tests)
- ✅ Frontend: 98%+ test stability (711+ passing tests)

## 🚀 Your First Feature

Let's add a simple API endpoint and frontend component:

### 1. Create a New API Endpoint

```bash
# Generate a new API endpoint with tests
python scripts/neoforge-cli.py generate api --name hello --description "Hello world endpoint"
```

This creates:
- `backend/app/api/v1/endpoints/hello.py` - API endpoint
- `backend/tests/api/test_hello.py` - Comprehensive tests

### 2. Create a Frontend Component

```bash
# Generate a new component
python scripts/neoforge-cli.py generate component --name hello-world --type atom
```

This creates:
- `frontend/src/components/atoms/hello-world.js` - Lit component
- `frontend/src/test/components/hello-world.test.js` - Component tests

### 3. Test Your Changes

```bash
# Test backend changes
make test-backend

# Test frontend changes
make test-frontend

# Start development to see changes
make dev
```

## 📂 Project Structure

```
neoforge/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Configuration, auth, security
│   │   ├── crud/           # Database operations
│   │   ├── models/         # SQLModel data models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── worker/         # Celery background tasks
│   └── tests/              # Comprehensive test suite
├── frontend/                # Lit-based frontend
│   ├── src/
│   │   ├── components/     # Web components (atomic design)
│   │   ├── services/       # API clients
│   │   └── test/           # Frontend tests
│   └── docs/               # Component documentation
└── docs/                   # Project documentation
```

## 🛠️ Essential Commands

### Development Workflow
```bash
# Start development environment
make dev

# Run all tests
make test

# Check code quality
make lint
make format

# View service health
make health

# View logs
make logs

# Clean up (remove all containers)
make clean
```

### Backend Development
```bash
# Run backend tests only
make test-backend

# Backend test coverage report
make coverage-backend

# Open database shell
make db-shell

# Run Alembic migrations
make migrate
```

### Frontend Development
```bash
# Run frontend tests only
make test-frontend

# Frontend test coverage
make coverage-frontend

# Run E2E tests
make test-e2e

# Build for production
make build-frontend
```

## 🔧 Environment Configuration

NeoForge uses environment-specific configuration. The `make setup` command creates a `.env` file with sensible defaults:

```env
# Development settings (automatically created)
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=sqlite:///./app.db
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev-secret-key-change-in-production
```

**Production setup:** See [First Deployment Guide](first-deployment.md)

## ✅ What's Working

After setup, you should have:

- **✅ Complete backend API** with authentication, CRUD operations, background tasks
- **✅ Modern frontend** with web components, PWA support, comprehensive testing
- **✅ Production-ready security** with JWT, rate limiting, security headers
- **✅ Comprehensive testing** with 95%+ backend coverage, 98%+ frontend stability
- **✅ Development automation** with hot-reload, auto-testing, health monitoring
- **✅ Production deployment** ready with Docker, infrastructure automation

## 🎯 Next Steps

### **For Daily Development**
→ **[Development Guide](../development/)** - Workflows, testing, best practices

### **For Production Deployment**
→ **[First Deployment](first-deployment.md)** - Production deployment walkthrough

### **For Architecture Understanding**
→ **[Architecture Guide](../architecture/)** - System design and decisions

### **Having Issues?**
→ **[Troubleshooting Guide](troubleshooting.md)** - Common problems and solutions

## 🆘 Need Help?

- **Common Issues**: [Troubleshooting Guide](troubleshooting.md)
- **Development Questions**: [Development Guide](../development/)
- **Production Issues**: [Operations Guide](../operations/)
- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/neoforge/issues)

---

*Ready to build something amazing? You're all set! 🚀*
