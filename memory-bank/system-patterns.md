# System Patterns: NeoForge

## Core Architecture

### Frontend (Lit)
- **Structure**: Component-based, Shadow DOM.
- **State**: Local component state, Service-based app state, Events.
- **Routing**: Client-side (History API), lazy-loaded pages, auth guards.
- **Services**: API client, Auth, Error, Notifications.

### Backend (FastAPI)
- **API**: RESTful, async, DI (services), Pydantic validation.
- **DB**: SQLModel ORM, Repository pattern, Alembic migrations, pooling.
- **Cache**: Redis (freq. accessed data, invalidation).
- **Auth**: JWT, RBAC, password hashing.

### Deployment
- Docker containers, Nomad orchestration.
- GitHub Actions CI/CD.
- Target: Single DO droplet ($10/mo), Cloudflare CDN.

## Key Project-Specific Patterns

### Frontend Testing
- **Mocks**: Custom JS mocks (`src/test/utils/component-mock-utils.js`, `dom-mock-utils.js`). Avoid `customElements.define`.
- **Fixtures**: `@open-wc/testing-helpers` (`fixture`, `html`).
- **Polyfill**: `src/test/setup/optimized-performance-polyfill.js`.
- **Test Structure**: Setup -> Execute -> Assert -> Cleanup.

### Backend Testing
- **Isolation**: Test containers (PostgreSQL).
- **Data**: Factory Boy + SQLModel.
- **Async**: `pytest-asyncio`.

### Storybook
- **Use**: Interactive docs, visual testing aid, isolated dev.
- **Structure**: Default export (meta), Template func, Stories.
- **Fixes**: See `scripts/fix-stories.js` (backticks), `vite.config.js`, `scripts/patch-figspec.cjs` (build).
