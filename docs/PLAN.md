# Delivery Plan – NeoForge Next Epics (Execution-Ready)

This plan captures the missing details and the exact work remaining to complete the epics underway and to hand off cleanly.

## Scope Covered So Far
- DB-backed persistence for `projects`, `support_tickets`, `community_posts`, `status_events`, and `idempotency_keys`.
- Endpoints migrated from in-memory:
  - Projects: list/get/create/patch/delete
  - Support tickets: create/list/patch
  - Community posts: create/list
  - Status: create/list events; compute overall and per-service status
- Idempotency:
  - Endpoint-level idempotency for create (projects, support, community) and patch (projects)
  - Central helper `IdempotencyManager` for precheck/store and TTL cleanup function
- Pagination:
  - `PaginatedResponse { items, total, page, page_size, pages }` used across list endpoints
- Caching:
  - ETag for `GET /api/v1/projects/{id}` and the project list endpoint
- Security/Observability support:
  - Threat & rate-limit Prometheus counters
  - CSP report-only endpoint; Report-To header in non-prod
- Frontend integration:
  - Dynamic API base URL and idempotency keys added to `api.js`
  - Router consolidated; PWA offline sync implemented

## Remaining Tasks (Finish Epic 1 + operationalize)

### 1) Apply DB Migrations in Runtime
- [ ] Free local port 5432 or update compose mapping
- [ ] Apply migrations: `docker compose run --rm api alembic upgrade head`
  - Contains `user_sessions` table + indices

### 2) Tests (backend)
- [ ] CRUD & pagination integration tests for `projects`, `support_tickets`, `community_posts` (initial suites added; verify and extend)
- [ ] Idempotency tests (duplicate POST/PATCH returning identical payloads)
- [ ] Status events tests – compute overall/per-service
- [x] Auth sessions list/revoke tests (slice for Epic 2)

### 3) Idempotency Middleware & TTL Cleanup
- [ ] Convert support/community endpoints to use `IdempotencyManager`
- [ ] Add periodic TTL cleanup job using `cleanup_idempotency_keys()` (cron/Celery beat or app startup task)

### 4) Caching
- [ ] Extend ETag to support and community lists if needed
- [ ] Consider `Cache-Control` headers for list endpoints

### 5) CI/CD
- [x] Add workflow step to run: `make setup && make test && make smoke`
- [ ] Publish coverage and artifacts (logs, reports)
 - [x] Frontend unit sharding runs `vitest run --shard` (non-watch)
 - [x] Fix Makefile tab separators to unblock backend CI job
 - [x] Restrict pre-commit quality gates to PRs and set Node 20
 - [ ] Backend job: add coverage upload `backend/coverage.xml` and ensure always-artifact on failure
 - [ ] Consider ESLint config or ignore patterns to exclude playground heavy files from PR gates (see "Affecting Pre-commit Quality Gates" below)

### 6) Documentation
- [ ] Add endpoint docs (paths, params, response shapes, ETag and idempotency semantics)
- [ ] Update dev guide with new Make targets and smoke

## Epic 2 – Security & Account Lifecycle (Execution Details)

### A) Refresh token sessions (foundation done)
- Models/CRUD: `UserSession` exists; opaque refresh tokens issued at `POST /api/v1/auth/token`; `POST /api/v1/auth/refresh` exchanges refresh→access.
- Remaining work:
  - [x] Session listing for current user: `GET /api/v1/auth/sessions`
    - Query `UserSession` by `user_id`, default sort `created_at desc`, pagination via standard params
    - Response: `PaginatedResponse[SessionOut]` (id, created_at, last_used_at, user_agent, ip, expires_at, is_current)
  - [x] Session revocation: `POST /api/v1/auth/sessions/{session_id}/revoke`
    - Sets `revoked_at`; denies subsequent refresh; owner-only
  - [ ] Revoke all except current: `POST /api/v1/auth/sessions/revoke-others` (optional stretch)
  - [ ] Tests: `backend/tests/api/test_auth_sessions.py`
    - List sessions returns current + previous; pagination; redaction of sensitive token values
    - Revoke single session prevents future refresh; status codes; ownership enforcement

### B) Rate limiting response headers
- Add standard headers on limited routes (especially login):
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (epoch seconds)
- Implementation point: `backend/app/api/middleware/security.py`
  - After computing the allowance decision, attach headers to the response
- [ ] Tests: hit the login route repeatedly, assert headers decrement and 429 contains headers
 - [x] Tests: hit the login route repeatedly, assert headers decrement and 429 contains headers

### C) CSP reporting docs
- Document CSP report endpoint and sample `Content-Security-Policy-Report-Only` and `Report-To` values
- Add troubleshooting for common violations and how to aggregate in logs

### D) Indices and DB performance
- Ensure indices exist for:
  - `status_events (service, created_at desc)`
  - `idempotency_keys (key)` unique index
  - `user_sessions (user_id, created_at desc)`
- If missing, generate and apply a migration (zero-downtime safe)

### E) Affecting Pre-commit Quality Gates (PR-only)
- ESLint currently flags numerous issues under `frontend/src/playground/**` and advanced tests.
- Options (pick one):
  - Relax PR gate to run `npm run lint` only on `src/components/**`, `src/services/**`, `src/pages/**`
  - Add `.eslintignore` entries for `src/playground/**`, `src/test/advanced/**`, `src/test/visual/**` (kept in main lint but not PR gate)
  - Introduce a separate slower, non-blocking workflow that lints full tree and posts a report

## Acceptance Criteria – Epic 2 (phase slice)
- [x] Users can view and revoke refresh sessions via API (endpoint implemented; test added)
- [ ] Login route exposes rate limit headers; behavior tested
- [ ] CSP reporting documented and endpoint verified via smoke
- [ ] DB indices verified or added for hot paths

## Operational Steps to Close This Phase
1) Implement and test sessions list/revoke
2) Add RL headers; extend tests
3) Update docs (API semantics + CSP + Dev steps)
4) Tidy CI lint scope for PRs if too noisy; keep a non-blocking full lint report
5) Ensure smoke passes and CI green

## Future Epics (High-Level)

### Epic 2: Security & Account Lifecycle
- Refresh-token rotation; session/device management; optional 2FA
- Audit log model and hooks for sensitive flows
- Strong rate-limit tiers on auth/email

### Epic 3: Observability & SLOs
- OpenTelemetry tracing (FastAPI + SQLAlchemy)
- Grafana dashboards and alert rules (latency, errors, RL violations, threat blocks)

### Epic 4: Frontend Type Safety, A11y, PWA UX
- Incremental TS migration; openapi-generated types for `apiService`
- A11y fixes and automated CI checks
- Conflict-resolution UX for offline replay failures

## Operational Checklist to Call Epic 1 “Done”
- [ ] Migrations applied in dev/runtime and verified
- [ ] All new backend tests pass in CI
- [ ] Project/support/community endpoints verified with pagination and ETag
- [ ] Idempotency works reliably under load; TTL cleanup scheduled
- [ ] Docs updated (API + Dev)
- [ ] CI smoke passes consistently
