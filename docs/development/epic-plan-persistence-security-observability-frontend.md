# Next 4 Epics – Detailed Execution Plan

This plan captures concrete, sequenced tasks to deliver the next 4 epics.

## Epic 1: Replace In-Memory Stubs with Real Persistence and API Polish

### Goals
- Move `projects`, `support_tickets`, `community_posts`, `status_events`, `analytics_events` from in-memory to database using SQLModel.
- Add idempotency for non-GET requests.
- Standardize API ergonomics (pagination, filtering, ETags) and response shapes.

### Tasks
1) Data models + migrations
- [x] Models (SQLModel + Alembic):
  - `Project(id, name, description, created_at, updated_at, owner_id?)`
  - `SupportTicket(id, email, subject, message, status, created_at, updated_at)`
  - `CommunityPost(id, title, content, author, created_at, updated_at)`
  - `StatusEvent(id, service_id, status, description?, created_at)`
  - `IdempotencyKey(key, method, path, user_id?, request_hash, response_body, status_code, created_at, expires_at)`
- [x] Alembic revisions generated and reviewed
- [x] Indexes: status_event.service_id+created_at

2) CRUD and schemas
- [x] CRUD modules for each model with repository-style methods
- [x] Pydantic schemas (Create/Update/Read)
- [x] Validation (lengths, enums, required fields)

3) Endpoints migration
- [x] Replace in-memory endpoints with DB-backed logic (projects, support, community)
- [x] Add pagination (`page`, `page_size`) for lists returning `{ items, total, page, page_size, pages }`
- [ ] Replace status endpoints logic to compute from latest events (placeholder implemented)
- [x] ETag support for `GET` by id (projects); list ETag pending
 - [x] ETag support for lists (projects)

4) Idempotency implementation
- [x] Endpoint-level idempotency for create/update where applicable (projects/support/community)
- [ ] Middleware/decorator to reduce duplication and centralize logic
 - [x] Introduced `IdempotencyManager` DI helper for precheck/store
- [ ] TTL/expiry cleanup job

5) Tests
- [ ] Unit tests for CRUD
- [ ] Integration tests for endpoints (pagination, filters)
- [ ] Idempotency tests (duplicate POST/PATCH are deduped)

## Epic 2: Security and Account Lifecycle Hardening

### Goals
- Strengthen token model and session management; optional 2FA.
- Reduce abuse vectors on auth/email flows; add audit logging.

### Tasks
1) Tokens and sessions
- [ ] Short-lived access tokens, refresh rotation, reuse detection
- [ ] Device/session listing and revoke endpoints

2) 2FA / WebAuthn (scoped)
- [ ] TOTP setup/verify endpoints; recovery codes
- [ ] WebAuthn registration bootstrap (optional)

3) Abuse mitigation
- [ ] Tight per-IP+email rate limits for verify/reset/resend
- [ ] Generic messages to avoid enumeration

4) Audit logging
- [ ] Model + CRUD for audit events (who, what, when, where)
- [ ] Hooks on login/logout, password reset, admin actions

5) Tests
- [ ] Security integration for new flows

## Epic 3: Observability and SLOs

### Goals
- Deeper metrics/tracing coverage, dashboards, and alerting.

### Tasks
1) Metrics & tracing
- [ ] Instrument SQLAlchemy queries (duration, count)
- [ ] OpenTelemetry tracing (FastAPI + DB)

2) Dashboards & alerts
- [ ] Grafana JSON dashboards for: latency, error rate, RL violations, threat blocks, DB timings
- [ ] Alert rules with thresholds and runbooks

3) Logs & correlation
- [ ] Ensure `X-Request-ID` flows from frontend; propagate to logs/traces

4) CI/CD checks
- [ ] CI job to run `make setup && make test && make smoke`

## Epic 4: Frontend Type Safety, Accessibility, and PWA UX

### Goals
- Type-safe services and components; better accessibility; complete PWA UX.

### Tasks
1) TypeScript adoption
- [ ] Convert `src/services/*.js` to TS incrementally; generate types from OpenAPI
- [ ] Strict tsconfig; eslint adjustments

2) Accessibility
- [ ] Audit and fix keyboard navigation, aria roles, color contrast
- [ ] Automated a11y tests in CI

3) PWA UX completion
- [ ] Conflict resolution UI for offline replay failures
- [ ] Backoff policies, partial-failure handling in SW

4) Performance
- [ ] Preload critical routes; verify critical CSS
- [ ] Image optimization pipeline and cache headers alignment

---

# Immediate Implementation Steps (this PR series)

- [x] Create plan (this file)
- [x] Align frontend API base URL + idempotency keys
- [x] Consolidate router & PWA sync loop
- [x] Add backend stub endpoints for parity
- [x] Add CSP reporting + threat metrics
- [x] Data models for `Project`, `SupportTicket`, `CommunityPost`, `StatusEvent`, `IdempotencyKey`
- [x] Alembic migration for new tables
- [x] Replace projects/support/community endpoints with DB-backed implementations
- [x] Add pagination wrappers to lists
- [x] Add endpoint-level idempotency to create/update endpoints
- [ ] Apply migrations in dev environment and add integration tests
