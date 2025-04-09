# Tech Context: NeoForge (Optimized)

## Key Technologies
- **FE Core**: Vanilla JS (ES2020+), Lit 3+, Web Components
- **FE Build/Test**: Vite, ESLint, Prettier, Vitest, @open-wc/testing
- **BE Core**: Python 3.10+, FastAPI, SQLModel, Pydantic
- **BE DB/Cache**: PostgreSQL 15, Redis
- **BE Test**: Pytest, Factory Boy, Coverage.py
- **Infra**: Docker (+Compose), Nomad, GitHub Actions, Makefile
- **Monitor**: Prometheus, Grafana, Loki (Basic)

## Development Setup
- **Prereqs**: Docker, Node 18+, npm 9+, Python 3.10+, Make
- **Commands**: `make setup`, `make dev` (Full), FE/BE specific commands available.
- **Dependencies**: See `frontend/package.json`, `backend/pyproject.toml`.

## Key Constraints / Targets
- **Browser**: Modern Evergreen
- **Perf**: Lighthouse > 90 (FCP < 1.5s, TTI < 3s)
- **Deploy**: ~$10/mo DO droplet (2GB RAM)
- **Security**: Standard web (HTTPS, JWT, CSRF, CSP)

## Key Testing Tools/Libs
- **FE**: Vitest, @open-wc/testing, Sinon, Custom Mocks (`src/test/utils/`)
- **BE**: Pytest (+asyncio, cov), Factory Boy, Test Containers (Postgres)

## Key Integrations
- Stripe, SendGrid, S3/MinIO 