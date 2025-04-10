# System Patterns: NeoForge (Optimized)

## Core Architecture
- **FE**: Lit (Component-based, Shadow DOM, Local/Service State, Client Routing).
- **BE**: FastAPI (Async REST, SQLModel, Repository Pattern, Redis Cache, JWT Auth).
- **Deploy**: Docker -> Nomad on single DO droplet ($10/mo), Cloudflare CDN, GitHub Actions CI/CD.

## Key Project Patterns

### Testing (General)
- **Coverage Target**: > 80%
- **CI Speed Target**: < 2 min

### FE Testing
- **Mocks**: Custom JS (`src/test/utils/`), avoid `customElements.define`.
- **Fixtures**: `@open-wc/testing-helpers`.
- **Polyfill**: `src/test/setup/optimized-performance-polyfill.js`.
- **Structure**: Setup -> Execute -> Assert -> Cleanup.

### BE Testing
- **Isolation**: Test containers (Postgres).
- **Data**: Factory Boy + SQLModel.
- **Async**: `pytest-asyncio`.

### Storybook
- **Use**: Interactive docs, visual test aid.
- **Structure**: Meta -> Template -> Stories.
- **Fixes**: See `scripts/fix-stories.js`, `vite.config.js`, `scripts/patch-figspec.cjs`.

### Email System (Backend)
- **Queuing**: Uses `EmailQueue` (Redis-based: sorted set for scheduled/status, hash for data).
- **Enqueuing**: Functions like `send_reset_password_email` call `EmailService.enqueue_email`.
- **Processing**: `EmailWorker` (background task) dequeues emails via `EmailQueue.dequeue`.
- **Sending**: Worker calls `send_email`, which uses `EmailService._send_direct_email` (FastMail) for actual dispatch.
