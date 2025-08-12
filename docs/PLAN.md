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

### 2) Tests (backend)
- [ ] CRUD & pagination integration tests for `projects`, `support_tickets`, `community_posts` (initial suites added; verify and extend)
- [ ] Idempotency tests (duplicate POST/PATCH returning identical payloads)
- [ ] Status events tests – compute overall/per-service

### 3) Idempotency Middleware & TTL Cleanup
- [ ] Convert support/community endpoints to use `IdempotencyManager`
- [ ] Add periodic TTL cleanup job using `cleanup_idempotency_keys()` (cron/Celery beat or app startup task)

### 4) Caching
- [ ] Extend ETag to support and community lists if needed
- [ ] Consider `Cache-Control` headers for list endpoints

### 5) CI/CD
- [ ] Add workflow step to run: `make setup && make test && make smoke`
- [ ] Publish coverage and artifacts (logs, reports)

### 6) Documentation
- [ ] Add endpoint docs (paths, params, response shapes, ETag and idempotency semantics)
- [ ] Update dev guide with new Make targets and smoke

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
