# Delivery Plan (Next 4 Epics)

This is the authoritative execution plan for the next phase. Keep it concise, actionable, and tied to CI green status. Prioritize the smallest changes that unblock core workflows.

## Current PR: fix/ci-makefile-and-frontend-tests
- Status: Open (PR #37)
- Branch: fix/ci-makefile-and-frontend-tests
- Changes:
  - Makefile tabs fix for CI
  - Frontend test stabilizations: neo-table, performance-validator, dynamic-config URL
  - Observability: 5xx counter increments; alerts hardened; Nomad readiness
  - Added backend/.env.test to satisfy backend Docker build in CI
- CI Status:
  - Failing jobs: Dependency Review (high/critical), Test matrix (frontend unit subset), Backend CI (was missing .env.test, now progresses further; still failing elsewhere)
- Next actions on this PR (must-have to merge):
  1. Dependency Review: either update deps to clear high/critical or temporarily set fail-on-severity to critical only (preferred fix: update deps). Timebox: 45m. If blocked, lower threshold in PR and open follow-up issue to restore strictness.
  2. Frontend unit subset failures: reproduce locally via docker compose frontend_test, fix breaking specs/CDN/url regressions introduced by test env. Timebox: 60m.
  3. Backend CI: fetch failing test logs; address any flaky metrics/health tests.

---

## Epic 1 — Observability & Readiness (hardening)
Goal: Fast incident detection/triage with actionable metrics, logs, and traces.

- Metrics
  - Ensure http_requests_total and http_request_duration_seconds are emitted for every route (middleware path labels consistent)
  - Per-route 5xx counter (done)
  - Add p95/p99 panels (dashboard JSON already includes)
- Alerts
  - Validated Prometheus rules (updated expressions + runbook/dashboard links)
  - Create runbooks:
    - docs/runbooks/high-5xx-rate.md
    - docs/runbooks/readiness-failing.md
    - docs/runbooks/queue-depth-high.md
- Tracing
  - Add env-gated OTLP exporter wiring: honor OTEL_EXPORTER_OTLP_* (HTTP/gRPC)
  - Celery trace propagation: carry traceparent to tasks; basic spans around task execution
- Logging
  - Confirm request_id is bound via structlog contextvars; add tests to assert presence in error paths for key endpoints
- Readiness
  - Use /ready across deploy manifests (Nomad updated; add Kubernetes examples if present)
- Tests
  - Expand metrics test to validate latency buckets exist for a sample route

Acceptance:
- Local Prometheus renders panels; alerts evaluate; runbooks exist; tests assert headers and metrics shape.

---

## Epic 2 — Frontend Type Safety + Accessibility
Goal: Reduce regressions, improve maintainability, and ensure baseline accessibility.

- TypeScript foundation
  - Add frontend/tsconfig.json (strict, ESNext, moduleResolution bundler)
  - Create frontend/src/types/api.d.ts with: PaginatedResponse, Project, SupportTicket, CommunityPost, Status
- Service typing
  - Convert frontend/src/services/api.js and auth.js to .ts with typed signatures
- Test stability
  - Stabilize custom element registration in frontend/src/test/setup.mjs to avoid "Invalid constructor" errors
- A11y CI + fixes
  - Add axe-core job to GitHub Actions to scan login, register, dashboard, docs
  - Fix labels, roles, focus order, button semantics, low contrast tokens in shared styles
- Linting
  - Enable TS ESLint rules and fix violations

Acceptance:
- Vitest green; type checks pass; a11y job passes on core pages.

---

## Epic 3 — Performance/Cost
Goal: Better list scalability and smaller runtime footprint.

- Cursor (keyset) pagination
  - Optional cursor param for /projects, /support/tickets, /community/posts with base64 JSON cursor; fallback to page/page_size
  - Add DB indices for sort keys
  - Update frontend services to handle cursor
- HTTP caching
  - Production-only Cache-Control/ETag for public lists; ensure strong validator and tested 304 path
- Docker slimming
  - Split prod vs dev deps; remove build toolchain from final image; non-root user
- DB optimization
  - Add indices for frequent filters/sorts and verify query plans

Acceptance:
- Cursor pagination covered by tests; image size reduced; 304 paths tested.

---

## Epic 4 — Security & Account Lifecycle (Phase 2)
Goal: Session robustness and safe refresh flows.

- Refresh token rotation + jti reuse detection => revoke all sessions on reuse
- Session device labels persisted and exposed via SessionOut
- Tiered rate limits on sensitive auth endpoints (user+IP; controlled bursts)
- Optional secure cookies for refresh token (document trade-offs)
- Audit logs for login, refresh, revocation, reuse detection
- Alembic migrations + tests (attack sims + happy paths)

Acceptance:
- Rotation and reuse tests pass; audit entries recorded; rate limits enforced with headers; docs updated.

---

## Risks/Assumptions
- Dependency-review gate currently blocks PR merges due to upstream advisories; either update or raise threshold to critical temporarily.
- Some frontend tests rely on dynamic imports/URL resolution in JSDOM; ensure node-fetch and URL polyfills are stable.

## Immediate Next (today)
1) Get PR #37 green:
   - Fix dependency-review gate (update or threshold)
   - Stabilize failing frontend unit jobs
   - Verify backend job fully passes after .env.test
2) Land Epic 1 runbooks + minimal OTLP gating and Celery propagation scaffolding.
