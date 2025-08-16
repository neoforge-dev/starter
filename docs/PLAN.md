# Delivery Plan (Next 4 Epics)

This is the authoritative execution plan for the next phase. Keep changes small, CI-driven, and reversible. Optimize for fast merges with green builds.

## Current PR: fix/ci-makefile-and-frontend-tests
- Status: Open (PR #37)
- Branch: `fix/ci-makefile-and-frontend-tests`
- Changes so far:
  - Makefile tabs fix for CI
  - Frontend test stabilizations: `neo-table`, `performance-validator`, dynamic-config URL
  - Observability: 5xx counter increments; alerts hardened; Nomad readiness
  - Added `backend/.env.test` to satisfy backend Docker build in CI
- CI Status:
  - Failing jobs: Dependency Review (high/critical), Test matrix (frontend unit subset), Backend CI (progresses further; still failing)
- Must-have next actions to merge:
  1. Dependency Review: update vulnerable deps to clear high/critical. If blocked, temporarily set fail-on-severity to critical only and open follow-up to restore strictness.
  2. Frontend unit subset: reproduce locally (prefer Bun for speed) and fix failing specs with stable URL/polyfills.
  3. Backend CI: fetch failing test logs; fix flaky metrics/health tests.

Quick commands
```bash
# Root
make help
make test              # if configured to orchestrate both sides

# Frontend
cd frontend && bun install && bun run test

# Backend (inside Docker for parity)
docker compose run --rm api_test pytest -q
```

---

## Epic 1 — Observability & Readiness Hardening
Goal: Fast incident detection/triage with actionable metrics, logs, traces; consistent readiness and runbooks.

Work items
- Metrics
  - Ensure `http_requests_total` and `http_request_duration_seconds` emitted for every route via ASGI middleware; normalize path labels (templated, not raw IDs).
  - Keep per-route `5xx` counter (done) and expose histogram buckets; verify default buckets suit latency profile.
  - Add `p95`/`p99` panels to dashboards (confirm JSON committed under `deploy/` or `docs/operations/monitoring`).
- Alerts
  - Validate Prometheus rules and wire runbook/dashboard links.
  - Create runbooks in `docs/runbooks/`:
    - `docs/runbooks/high-5xx-rate.md`
    - `docs/runbooks/readiness-failing.md`
    - `docs/runbooks/queue-depth-high.md`
- Tracing
  - Add env-gated OTLP exporter: honor `OTEL_EXPORTER_OTLP_*` (HTTP/gRPC). Disabled by default in dev/tests.
  - Celery trace propagation: carry `traceparent` to tasks; basic spans around task execution.
- Logging
  - Confirm `request_id` bound via structlog contextvars; add tests asserting presence in error paths for representative endpoints.
- Readiness
  - Use `/ready` across deploy manifests (Nomad updated; add Kubernetes examples if present) and keep `/health` lightweight.
- Tests
  - Expand metrics tests to validate histogram buckets exist and labels are normalized.

Definition of Done
- Dashboards render locally; alerts evaluate; runbooks exist and link from alert descriptions.
- Unit/integration tests assert headers/metrics shape; CI green.

---

## Epic 2 — Frontend Type Safety and Accessibility
Goal: Reduce regressions, improve maintainability, ensure baseline a11y on core pages.

Work items
- TypeScript foundation
  - Add `frontend/tsconfig.json` (strict, ESNext, moduleResolution bundler, noEmit, incremental).
  - Add `frontend/.eslintrc.cjs` TS rules extension if not present; integrate with existing ESLint.
  - Create `frontend/src/types/api.d.ts` with: `PaginatedResponse<T>`, `Project`, `SupportTicket`, `CommunityPost`, `Status`.
- Services typing
  - Convert `frontend/src/services/api.js` and `frontend/src/services/auth.js` to `.ts` with explicit signatures.
  - Ensure `pwaService` methods have types (`getOfflineData`, `storeOfflineData`, `queueOfflineAction`).
- Test stability
  - Stabilize custom element registration in `frontend/src/test/setup/` to avoid "Invalid constructor" errors; ensure `@webcomponents/webcomponentsjs` shims as needed in JSDOM.
  - Mock PWA service in integration tests that currently `TODO` offline mocking.
- Accessibility CI + fixes
  - Add an axe-core CI job (Playwright + axe or `@axe-core/cli`) scanning login, register, dashboard, docs pages.
  - Fix labels, roles, focus order, button semantics, and contrast tokens in shared styles.
- Linting
  - Enable TS ESLint rules and fix violations; keep autofixes small and scoped.

Definition of Done
- Vitest green; `tsc --noEmit` passes; a11y job passes on core pages; CI green.

---

## Epic 3 — Performance and Cost Optimization
Goal: Better list scalability; smaller runtime footprint; cheaper ops.

Work items
- Cursor (keyset) pagination
  - Optional `cursor` param for `/projects`, `/support/tickets`, `/community/posts` with base64 JSON cursor; fallback to `page`/`page_size`.
  - Add DB indices for sort keys; verify query plans.
  - Update frontend services to handle cursor and retain backward compatibility.
- HTTP caching
  - Production-only `Cache-Control`/`ETag` for public lists; ensure strong validator and tested 304 path; add tests.
- Docker slimming
  - Separate prod vs dev deps; multi-stage builds; remove build toolchain from final image; non-root user.
- DB optimization
  - Indices for frequent filters/sorts; confirm with `EXPLAIN ANALYZE` in tests or docs.

Definition of Done
- Cursor pagination covered by tests; images reduced; 304 paths tested; CI green.

---

## Epic 4 — Security and Account Lifecycle (Phase 2)
Goal: Session robustness and safe refresh flows.

Work items
- Refresh token rotation + `jti` reuse detection (revoke all sessions on reuse); store refresh token family.
- Session device labels persisted and exposed via `SessionOut`.
- Tiered rate limits on sensitive auth endpoints (user+IP; controlled bursts) with headers exposed.
- Optional secure cookies for refresh token (document trade-offs and toggles via env).
- Audit logs for login, refresh, revocation, reuse detection.
- Alembic migrations + tests (attack sims + happy paths).

Definition of Done
- Rotation and reuse tests pass; audit entries recorded; headers expose rate limits; docs updated; CI green.

---

## Risks and Assumptions
- Dependency-review gate blocks merges due to upstream advisories; prefer updates over threshold lowering.
- Some frontend tests rely on dynamic imports/URL resolution in JSDOM; ensure `node-fetch` and URL polyfills are stable.
- PWA/offline tests require deterministic mocks to avoid flakiness.

---

## Execution Checklist (Rolling)
- [ ] PR #37 green (deps review fixed, frontend subset green, backend green)
- [ ] Runbooks created and linked in alert rules
- [ ] OTLP exporter behind env flags; Celery propagation with basic spans
- [ ] TS config added; `api.ts`/`auth.ts` migrated; tests updated
- [ ] Axe CI job added; critical a11y issues resolved
- [ ] Cursor pagination added server+client; tests passing
- [ ] HTTP caching (ETag/304) for public lists; tests passing
- [ ] Security lifecycle features implemented with migrations and tests

---

## Immediate Next (Today)
1) Get PR #37 green:
   - Fix dependency-review gate (update or temporary threshold change with follow-up issue)
   - Stabilize failing frontend unit jobs using Bun; ensure PWA mocks and polyfills
   - Verify backend job fully passes after `.env.test`; fix any flaky metrics/health tests
2) Land Epic 1 runbooks and minimal OTLP gating scaffolding for the backend (no-op unless env set).

