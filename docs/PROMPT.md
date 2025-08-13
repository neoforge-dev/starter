You are a senior Cursor agent taking over the NeoForge starter repo. Continue execution with focus on: shipping user value, keeping CI green, tightening security, and documenting as you go. Work in vertical slices and keep commits small and purposeful.

Immediate Objectives
1) Complete Observability & Readiness epic (dashboards/alerts polish)
2) Frontend Type Safety + A11y slice (services → TS, axe CI fixes)
3) Performance/Cost slice (keyset pagination option, prod-safe caching)
4) Security & Account Lifecycle phase 2 (refresh rotation, tiered RL)

Context
- Backend: FastAPI, SQLAlchemy 2.x (async), Alembic, Celery, Redis; Prometheus metrics; OTEL basic instrumentation
- Frontend: Lit components, Vite, PWA with offline sync and idempotent API calls
- Dev: docker compose at repo root; Makefile includes smoke; backend coverage artifact at `backend/coverage.xml`

What’s already implemented (this branch)
- Sessions: list/revoke + revoke-others; rate limit headers on login; indices added
- Idempotency: helpers + TTL cleanup background task; tests for replay semantics
- Caching: ETag for projects/support/community lists; dev Cache-Control TTL
- Observability: 
  - OTEL basic instrumentation for FastAPI/SQLAlchemy/Redis/HTTPX
  - X-Trace-Id on responses; trace_id in structured logs
  - Celery queue depth gauges on /metrics and test coverage
  - Readiness endpoint `/ready` (DB+Redis gates) + test
- Performance: session pruning scheduled with idempotency cleanup loop
- CI: Makefile emits coverage.xml; workflow uploads artifacts

Your Mission – What to do next
1) Observability & SLOs (finish):
   - Add error-rate counters per route and expose p95/p99 panels via committed Grafana JSON in `ops/grafana/`
   - Commit Prometheus alerts for 5xx rate/readiness/queue-depth in `ops/prometheus/alerts.yml`
   - Ensure all error logs include both request_id and trace_id consistently

2) Frontend type safety + a11y:
   - Add `frontend/tsconfig.json` and convert `frontend/src/services/api.js` → `api.ts` with typed signatures
   - Add `frontend/src/types/api.d.ts` for `PaginatedResponse`, `Project`, `SupportTicket`, `CommunityPost`, `Status`
   - Enable axe-core CI for core pages; fix low-hanging a11y issues in forms/auth flows

3) Performance/cost:
   - Add optional keyset pagination (`cursor`) for hot list endpoints (keep page/size fallback)
   - Add gated production-safe Cache-Control for public lists; keep ETag consistency
   - Slim backend Docker image (ensure non-root; drop build deps in prod)

4) Security phase 2:
   - Implement refresh token rotation and reuse detection; on reuse, revoke all sessions
   - Add device label to sessions and expose in `SessionOut`
   - Apply tiered rate limits for auth/email/verify endpoints; prefer user+IP keys

Guardrails
- Keep changes incremental; maintain async SQLAlchemy best practices; don’t regress existing APIs
- Always keep tests green locally and in CI; ensure no long-lived CI steps

Key Files/Entry Points
- Backend endpoints: `backend/app/api/v1/endpoints/`
- Middleware: `backend/app/api/middleware/security.py`, `backend/app/api/middleware/validation.py`
- Observability: `backend/app/core/metrics.py`, `backend/app/main.py`, `backend/app/api/endpoints/metrics.py`
- Sessions/refresh: `backend/app/api/v1/endpoints/auth.py`, `backend/app/crud/user_session.py`
- Idempotency/cache: `backend/app/utils/idempotency.py`, `backend/app/utils/http_cache.py`
- Frontend services and types: `frontend/src/services/*`, `frontend/src/types/*`, `frontend/tsconfig.json`
- CI: `.github/workflows/*.yml`, `Makefile`
- Plans: `docs/PLAN.md`; this prompt: `docs/PROMPT.md`

Definition of Done for this handoff phase
- Observability: dashboards + alerts committed; /ready working; metrics and correlation in place
- Frontend: services typed; axe CI for core pages passing; no broken builds
- Performance: keyset pagination option; prod-safe caching for public lists; images slimmer
- Security: refresh rotation+reuse detection; tiered RL configured; device labels in sessions
- CI: green with coverage artifacts; smoke passes

Operational Checklist (use in order)
1) Finish observability polish (dashboards/alerts; ensure logs include trace_id)
2) Frontend TS/a11y slice (api.ts + types + axe fixes)
3) Performance: keyset `cursor` and prod Cache-Control; image slimming
4) Security phase 2: rotation/reuse, device labels, tiered RL
5) Update docs: backend-development.md and security.md as features land
6) Run: `make setup && make test && make smoke`; cut a PR if needed

Notes
- `/ready` is authoritative for readiness; `/health` remains informational
- Coverage is uploaded from `backend/coverage.xml` by the backend CI workflow
