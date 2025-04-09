# Tech Context: NeoForge

## Key Technologies

### Frontend
- **Core**: Vanilla JS (ES2020+), Lit 3+, HTML5/CSS3, Web Components API
- **Build**: Vite, ESLint, Prettier
- **Test**: Vitest, @open-wc/testing, Sinon
- **Libs**: lit-html, lit-element

### Backend
- **Core**: Python 3.10+, FastAPI, SQLModel, Pydantic
- **DB**: PostgreSQL 15, Redis
- **Test**: Pytest, Factory Boy, Coverage.py
- **Libs**: Uvicorn, Alembic, Python-jose, Passlib

### Infrastructure
- **Containers**: Docker, Docker Compose (local), Nomad (deploy)
- **CI/CD**: GitHub Actions, Makefile
- **Monitor**: Prometheus, Grafana, Loki (basic)

## Development Setup

### Prerequisites
- Docker, Docker Compose, Node.js 18+, npm 9+, Python 3.10+, Make

### Local Dev Commands
- `make setup`, `make dev` (Full Stack)
- `cd frontend && npm install && npm run dev` (Frontend)
- `cd backend && make setup && make dev` (Backend)

## Technical Constraints
- **Browsers**: Modern Evergreen (No IE11)
- **Perf**: FCP < 1.5s, TTI < 3s, Lighthouse > 90
- **Deploy**: $10/mo DO droplet (2GB RAM, 1vCPU, 50GB SSD)
- **Security**: HTTPS, JWT, CSRF, CSP, dep updates

## Dependencies
- See `frontend/package.json`, `backend/pyproject.toml`.

## Key Integrations
- Stripe (Payments), SendGrid (Email), S3/MinIO (Storage)

## Key Testing Infrastructure

### Frontend
- **Core**: Vitest, @open-wc/testing
- **Mocks**: Custom utils (`src/test/utils/`)
- **Polyfills**: `src/test/setup/optimized-performance-polyfill.js`

### Backend
- **Core**: Pytest (+ asyncio, cov, xdist)
- **Data**: Factory Boy
- **DB**: Test container (PostgreSQL) 