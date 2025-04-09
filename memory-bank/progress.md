# Progress Overview

## What Works

### Frontend
- **UI**: Core components built, basic tests. Pages exist.
- **Services**: API client, Auth, Error, Notification functional.
- **Env**: Vite, ESLint, Prettier stable (`make dev`).
- **Testing**: Vitest setup, mock utils (`src/test/utils/`), polyfills (`src/test/setup/`) stable.
  - *Status*: All non-skipped tests passing (634/694), 60 skipped.
- **Storybook**: Setup works (`npm run storybook`); core atom stories exist.

### Backend
- **API**: Core FastAPI structure, async, SQLModel integration.
- **DB**: PostgreSQL schema (Alembic).
- **Cache**: Redis integration.
- **Testing**: Pytest setup, basic Factory Boy.

### Infrastructure
- Local Docker setup (`docker-compose.yml`, `Makefile`).
- Basic GitHub Actions CI.

## Needs Work / Focus Areas

### Frontend
- **Testing**: Address skipped tests (e.g., memory, pages), improve coverage.
- **Components**: Refine consistency, accessibility, performance.
- **Storybook**: Add organism/page stories.
- **Docs**: Testing guides, Storybook guide, component registry.

### Backend
- **Testing**: Increase coverage (>80%).
- **API**: Optimize cache, queries, rate limits.
- **Security**: Harden headers, CSRF, validation.
- **Docs**: API, DB schema, deployment guide.

### General
- **E2E Tests**: Implement.
- **Monitoring**: Flesh out Prometheus/Grafana/Loki.
- **Deployment**: Refine Nomad scripts.
