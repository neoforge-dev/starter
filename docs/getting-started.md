# Getting Started with NeoForge

> **📋 Complete Guide**: This is a quick overview. For the comprehensive step-by-step guide, see **[Complete Getting Started Guide](getting-started/index.md)**.

**Go from zero to running application in under 5 minutes.**

## ⚡ Quick Setup

### Prerequisites
- Docker & Docker Compose
- Make  
- Git
- Node.js 18+ (optional, for frontend development outside containers)

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
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Frontend**: [http://localhost:3000](http://localhost:3000)

## 🧪 Verify Installation

```bash
# Run tests to verify setup
make test
```

**Expected Results:**
- ✅ All services show "healthy" status
- ✅ Backend: 95%+ test coverage (280+ tests)
- ✅ Frontend: 98%+ test stability (711+ passing tests)

### 🔧 Apply Migrations & Smoke Test

```bash
# If you see Postgres port conflicts, our compose maps DB to 55432.
# Apply migrations and run a quick smoke check
docker compose run --rm api alembic upgrade head
make smoke
```

Notes:
- `make smoke` spins up `db`, `cache`, and `api`, then probes `/health` until healthy.
- ETag is enabled on `GET /api/v1/projects` and `GET /api/v1/projects/{id}`. Use `If-None-Match` for 304s.
- Idempotency: send `Idempotency-Key` on POST/PATCH for `projects`, `support`, and `community` to dedupe duplicates.

## 🛠️ Essential Commands

```bash
# Development workflow
make dev          # Start all services
make test         # Run backend tests
make clean        # Clean up containers

# Backend development
docker compose run --rm api_test pytest -q    # Backend tests only
docker compose exec db psql -U postgres       # Database shell access

# Frontend development
make test-frontend    # Frontend tests only
make build-frontend   # Production build
```

## 🎯 Next Steps

### **📋 Complete Setup Guide**
→ **[Complete Getting Started Guide](getting-started/index.md)** - Full setup, first feature, and comprehensive workflow

### **💻 Daily Development** 
→ **[Development Guide](development/)** - Workflows, testing, best practices

### **🏗️ System Architecture**
→ **[Architecture Guide](architecture/)** - System design and technical decisions

### **🚀 Production Deployment**
→ **[Zero to Production Guide](../ZERO_TO_PRODUCTION_GUIDE.md)** - Complete production setup

### **🆘 Having Issues?**
→ **[Troubleshooting Guide](getting-started/troubleshooting.md)** - Common problems and solutions

## 🆘 Need Help?

- **Quick Issues**: [Troubleshooting Guide](getting-started/troubleshooting.md)  
- **Development Questions**: [Development Guide](development/)
- **Production Support**: [Operations Guide](operations/)
- **Bug Reports**: [GitHub Issues](https://github.com/yourusername/neoforge/issues)

---

*This quick overview gets you running in 5 minutes. For the complete step-by-step experience, see the **[Complete Getting Started Guide](getting-started/index.md)**.*
