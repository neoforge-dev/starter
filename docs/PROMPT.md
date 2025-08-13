You are a senior Cursor agent taking over the NeoForge starter repo. Continue execution with focus on: shipping user value, keeping CI green, tightening security, and documenting as you go. Work in vertical slices and keep commits small and purposeful.

Immediate Objectives
1) Get PR #37 (fix/ci-makefile-and-frontend-tests) green and merged
2) Complete Observability & Readiness epic (dashboards/alerts polish)
3) Frontend Type Safety + A11y slice (services → TS, axe CI fixes)
4) Performance/Cost slice (keyset pagination option, prod-safe caching)
5) Security & Account Lifecycle phase 2 (refresh rotation, tiered RL)

Context
- Backend: FastAPI, SQLAlchemy 2.x (async), SQLModel-like patterns, Alembic, Celery, Redis
- Observability: Prometheus metrics; basic OpenTelemetry instrumentation; structlog with contextvars
- Frontend: Lit components, Vite, Vitest (JSDOM), PWA bits
- Infra/CI: docker compose; GitHub Actions: Backend CI, Test (frontend), Pre-commit Quality Gates, Dependency Review

What’s already done in this branch
- CI: Makefile tabs fix; backend Docker build unblocked by adding backend/.env.test
- Frontend: neo-table CSS dynamic -> CSS vars/host classes; performance-validator sets element props; dynamic-config resolves absolute URL in JSDOM
- Observability: http_5xx_responses_total counter incremented in middleware; metrics tests updated; alerts.yml hardened (runbooks, cleaner expr); Nomad probe uses /ready

Open issues (blocking merge)
- Dependency Review: action fails (high/critical). We should prefer upgrading deps; if timeboxed, temporarily set fail-on-severity to critical in PR, and open a follow-up issue to restore strictness after upgrades.
- Frontend Test (matrix) failures: need to run subset locally (docker compose frontend_test or npm scripts) and fix flakey specs from JSDOM URL/dynamic import.
- Backend CI: earlier failure was missing .env.test (fixed). If still failing, fetch logs via gh run view and address remaining errors (metrics/health).

Tactical next steps
1) Dependency review gate:
   - Attempt minimal-safe dependency upgrades on frontend/backend to remove high/critical advisories.
   - If cannot resolve within 45 minutes, change .github/workflows/dependency-review.yml to fail only on critical for this PR, and add a follow-up task to raise back to high later.

2) Frontend unit tests (Vitest):
   - Repro locally; fix tests relying on JSON-encoded attributes or URL constructor issues; ensure test setup registers custom elements once.
   - Verify dynamic-config absolute URL fallback works in Node envs w/out window.location.

3) Backend CI:
   - Confirm docker build passes (it should after backend/.env.test). If not, fix paths/compose.
   - Ensure metrics endpoint produces http_5xx_responses_total and latency buckets; adjust tests accordingly.

4) Merge PR #37 once green.

Then proceed with Epics per docs/PLAN.md

Epic 1 — Observability & Readiness (hardening)
- Metrics: Confirm http_requests_total and http_request_duration_seconds are emitted for every route with stable labels.
- Alerts: Validate ops/prometheus/alerts.yml in local Prometheus; add runbooks in docs/runbooks/.
- Tracing: Add env-gated OTLP exporter support; propagate traceparent to Celery tasks; add basic spans.
- Logging: Tests asserting request_id and optional trace_id included in responses and logs for key endpoints.
- Readiness: Ensure all deploys use /ready; add K8s example if applicable.

Epic 2 — Frontend Type Safety + A11y
- Add frontend/tsconfig.json (strict, ESNext, bundler moduleResolution).
- Create frontend/src/types/api.d.ts (PaginatedResponse, Project, SupportTicket, CommunityPost, Status).
- Convert frontend/src/services/api.js and auth.js -> .ts with typed signatures.
- Add axe-core CI step for core pages; fix easy a11y issues (labels, roles, focus order, contrast).
- Stabilize custom element registration in frontend/src/test/setup.mjs.

Epic 3 — Performance/Cost
- Add optional keyset (cursor) pagination for /projects, /support/tickets, /community/posts; keep page/size fallback.
- Add indices for sort keys; implement base64 JSON cursor with basic signature.
- Production-only Cache-Control with consistent ETags for public list endpoints; expand tests for 304.
- Docker slimming: ensure prod stage only has runtime deps; run as non-root; verify image size.

Epic 4 — Security & Account Lifecycle (Phase 2)
- Refresh token rotation with jti; detect reuse; revoke all sessions on reuse.
- Persist session device labels; return via SessionOut.
- Tiered rate limits on auth endpoints (user+IP keys, burst-friendly verify).
- Optional secure cookie storage for refresh tokens (document tradeoffs).
- Migrations + thorough tests.

Guardrails
- Keep PRs small; keep CI green; add/adjust tests with each change.
- Avoid introducing new long-lived processes in CI.

Key locations
- Backend endpoints: backend/app/api/v1/endpoints/
- Middleware: backend/app/api/middleware/
- Metrics: backend/app/core/metrics.py; metrics endpoint backend/app/api/endpoints/metrics.py
- Celery: backend/app/core/celery.py; backend/app/worker/
- Frontend: frontend/src/services/*; frontend/src/types/*; frontend/tsconfig.json
- CI: .github/workflows/*; dependency review config: .github/dependency-review-config.yml
- Plans/Prompt: docs/PLAN.md; docs/PROMPT.md

Definition of Done
- PR #37 merged; CI green
- Observability: runbooks + alerts validated; metrics and headers verified; dashboard JSON shipped
- Frontend: strict TS enabled; services typed; axe step added and passing
- Performance: cursor option working with tests; 304 cache path tested; backend image smaller
- Security: refresh rotation + reuse detection + audits + tiered RL shipped with tests
