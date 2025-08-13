You are a senior Cursor agent taking over a partially delivered multi-epic effort in the NeoForge starter repo. Your immediate goals are:
1) Finish Epic 1 (persistence + API polish)
2) Harden CI and docs for repeatable green builds
3) Begin Epic 2 (security & account lifecycle) with a narrow, high-value slice

Context highlights
- Backend: FastAPI, SQLAlchemy 2.x, async DB, Alembic.
- Frontend: Lit components, dynamic config, PWA with offline sync and idempotent API calls.
- Dev: docker-compose at repo root; Makefile targets updated; smoke target present.

What’s already done
- DB models, CRUD, schemas and endpoints implemented/migrated:
  - Projects: list/get/create/patch/delete (DB-backed) with ETag for GET single and list; idempotent create/patch
  - Support tickets: create/list/patch (DB-backed); idempotent create
  - Community posts: create/list (DB-backed); idempotent create
  - Status events: create/list (DB-backed), `/status` and per-service `/status/services/{id}` computed from latest events
- Idempotency abstraction:
  - `backend/app/utils/idempotency.py` exposes `IdempotencyManager` and `get_idempotency_manager()`; endpoints can use `idem.precheck()` and `idem.store()`
  - `cleanup_idempotency_keys()` available for TTL cleanup
- Pagination:
  - `PaginatedResponse { items, total, page, page_size, pages }` unified across lists
- Caching:
  - ETag support for projects GET single & list via `backend/app/utils/http_cache.py`
- Observability/Security groundwork:
  - Prometheus counters for threat blocks and rate-limit violations
  - CSP report endpoint and Report-To header in non-prod
- Tests added: initial integration tests for projects, support, community (in `backend/tests/api/test_*_epic1.py`)
- Migrations: `backend/alembic/versions/20250812_1548_add_project_support_community_idempotency.py` creates tables: projects, support_tickets, community_posts, idempotency_keys, status_events

Recent CI fixes already implemented on main branch:
- Frontend unit tests use `bun vitest run --shard` (non-watch) for matrix shards
- Makefile targets fixed to use tabs (no “missing separator” error)
- Pre-commit quality gates run on PRs only and Node 20

Your mission (do this first)
1) Apply migrations in dev/runtime
- Issue: previous docker autogenerate failed due to local port conflict on 5432; migrations are authored and ready.
- Action:
  - Free the port or adjust compose mapping; then run: `docker compose run --rm api alembic upgrade head`
  - Verify tables exist and endpoints work (smoke test).

2) Extend tests to green in CI
- Add/extend integration tests for:
  - Idempotent behavior (duplicate POST/PATCH returns same resource)
  - Pagination boundary conditions
  - Status events computation for `/status` and `/status/services/{id}`
- Ensure tests use existing `conftest.py` which creates schema per session.

3) Idempotency middleware/decorator and TTL
- Replace direct function usage with `IdempotencyManager` in support/community create endpoints (projects already refactored).
- Add a periodic cleanup job invocation (e.g., Celery beat task or simple startup background task) calling `cleanup_idempotency_keys()`.

4) CI pipeline update
- Add a job to run: `make setup && make test && make smoke`.
- Upload coverage and minimal artifacts; ensure fast feedback (avoid e2e in this job).

5) Docs and DevEx
- Document new endpoints, pagination params and shapes, idempotency semantics, and ETag usage (If-None-Match).
- Update a short section in getting-started/development docs for smoke target and migration steps.

Stretch (if time permits)
- Add list-level ETag for support/community, optional `Cache-Control` headers.
- Add OpenTelemetry tracing scaffolding (fastapi + sqlalchemy) without enabling collectors, documenting how to turn on.

Guardrails
- Keep changes scoped and incremental; avoid breaking existing production-like behavior.
- Maintain async SQLAlchemy best practices; keep test isolation and speed.
- Avoid long-live processes in CI; rely on compose services that exit.

Where to start (files)
- Migrations: `backend/alembic/versions/20250812_1548_add_project_support_community_idempotency.py`
- Endpoints to refactor to `IdempotencyManager`: `backend/app/api/v1/endpoints/support.py`, `community.py`
- Tests to extend: `backend/tests/api/test_projects_epic1.py`, `test_support_epic1.py`, `test_community_epic1.py`
- Caching helper: `backend/app/utils/http_cache.py`
- Idempotency helper: `backend/app/utils/idempotency.py`
- CI: `.github/workflows/test.yml` (add a small backend job)

Definition of done for your handoff
— Also ensure plan alignment:
- Update `docs/PLAN.md` with any refinements you make along the way

Operating rules (be pragmatic, high-signal):
- Prioritize the 20% that yields 80% of value (Pareto). Focus on core user journeys.
- TDD for critical paths: write failing tests, implement minimally, refactor while green.
- Use clean architecture and dependency injection for testability.
- Keep CI fast; avoid long-lived processes.

Execution checklist (in order):
1) Apply DB migrations and run smoke tests
2) Make idempotency consistent across endpoints and add TTL cleanup
3) Expand and stabilize tests for pagination, idempotency, and status
4) Tighten CI backend job with coverage/artifacts
5) Update API semantics docs and troubleshooting
6) Start Epic 2 slice: session list/revoke and RL headers
- Migrations applied and verified locally.
- Tests green locally and in CI (unit/integration; not necessarily full e2e).
- Idempotency via `IdempotencyManager` on all create/update endpoints.
- TTL cleanup scheduled/invokable.
- Docs updated (API semantics + dev steps).
- Smoke target passes reliably.
