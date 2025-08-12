# Next 4 Epics – Detailed Execution Plan (Q3/Q4 2025)

This plan breaks work into implementation-ready tasks, acceptance criteria, and risks. It is designed to be delivered incrementally via small PRs per task group.

## Epic 1: Closeout + Harden Persistence and CI

### Goals
- Make persistence + idempotency production-solid
- Remove CI duplication, add coverage gates and artifacts
- Eliminate docs drift

### Tasks
1) Tests and coverage
- Backend pytest gate: cov-fail-under=85% (DONE in `backend/pytest.ini`)
- Extend tests (DONE):
  - Pagination boundary for `projects`, `support`, `community`
  - Initial status acceptance (`unknown`)
- Consider adding list-level ETag tests for support/community

2) Caching and headers
- Add list ETag for `support` and `community` (DONE)
- Optional: Cache-Control guidance in docs (later)

3) CI
- Remove redundant `.github/workflows/backend-ci.yml`
- Enhance `.github/workflows/test.yml` backend job:
  - Cache pip based on `backend/requirements.txt`
  - Upload `backend/coverage.xml` as artifact

4) Smoke reliability
- Augment `make smoke` to probe `/api/v1/config` after `/health`

5) Docs alignment
- Update backend dev/testing docs to use root compose + `api_test` (DONE)
- Add API semantics doc (pagination, ETag, idempotency)

### Acceptance Criteria
- Green CI with coverage gate and coverage artifact uploaded
- Smoke passes reliably (health + API v1 probe)
- Docs reflect current commands and API semantics

---

## Epic 2: Security & Account Lifecycle

### Goals
- Robust session lifecycle and security posture; actionable audit trail

### Tasks
1) Sessions
- Refresh-token rotation with device/session inventory
- Revoke single session; list sessions endpoint
- Optional 2FA scaffold (TOTP) with feature flag

2) Audit log
- Model + CRUD for sensitive actions (auth, profile, admin)
- Middleware/hooks to emit entries; redact PII
- Admin endpoint with pagination + filtering

   Breakdown:
   - Create `AuditLog` model (table `audit_logs`) with fields: id, user_id (nullable), action, resource, metadata (JSON string), created_at.
   - Add to `backend/app/db/base.py` imports and `models/__init__.py`.
   - CRUD: `app/crud/audit_log.py` for create/list with pagination and filters.
   - Endpoint: `GET /api/v1/admin/audit-logs` (admin-only), with query filters: user_id, action, date range; returns PaginatedResponse.
   - Hook examples: On project create/update, emit audit entry (feature-flagged initially).

3) Rate limits & headers
- Per-endpoint tiers (auth stricter): document and test
- 429 headers: `Retry-After`, `X-RateLimit-*`

4) CSP reporting & PII safety
- Ensure report schemas are PII-safe; add sampling controls
- Toggle + docs

### Acceptance Criteria
- Session list/refresh/revoke covered by tests
- Audit entries recorded and retrievable by admins
- Auth endpoints rate-limited and tested; headers present
- CSP reporting documented, off by default in prod

---

## Epic 3: Observability & SLOs

### Goals
- Tracing + metrics for critical paths with ready-to-use dashboards

### Tasks
1) Tracing (OpenTelemetry)
- Add FastAPI + SQLAlchemy instrumentation
- Propagate trace id in logs and response headers
- Switchable collector config; doc “turn it on”

2) Metrics
- Histograms for API latencies per route
- DB query latency buckets
- Expand existing counters (threats, RL) with labels

3) Dashboards & Alerts
- Commit Grafana dashboards JSON: API p50/p95, error rate, RL violations, threat blocks
- Example alert rules with SLO thresholds

4) Perf baseline
- Lightweight load script to produce initial SLIs

### Acceptance Criteria
- Traces visible locally (collector optional)
- Metrics exposed and validated; dashboards and alert rules in repo

---

## Epic 4: Frontend Type-Safety, A11y, Offline UX

### Goals
- Safer API usage, accessible UI, resilient offline experience

### Tasks
1) Type safety
- Introduce TypeScript incrementally (start with `services/api`)
- Generate OpenAPI types and wire into client

2) A11y
- Add axe/Pa11y CI check for key pages; fix violations
- Document a11y standard and exemptions

3) Offline conflict UX
- When replay fails (409/412), show toast + merge guidance; add tests
- Ensure idempotency keys consistently attached

4) Visual regression
- Verify Playwright snapshots in CI (already scaffolded); stabilize flaky masks

### Acceptance Criteria
- Typed API client with generated types
- CI a11y gate passes on key routes
- Offline replay UX tested and documented

---

## Delivery Notes
- Prefer small, reviewable PRs (1–3 files) per task group
- Keep CI fast: shard expensive suites; avoid e2e on main job
- Maintain async best practices and test isolation
