You are a senior Cursor agent taking over the NeoForge starter repo. Continue execution with focus on shipping user value, keeping CI green, and documenting as you go.

Immediate Objectives
1) Finish Epic 1 (persistence + API polish)
2) Harden CI and docs for consistent green builds
3) Continue Epic 2 (security & account lifecycle) – sessions and rate limiting completed; finish docs and indices

Context
- Backend: FastAPI, SQLAlchemy 2.x (async), Alembic
- Frontend: Lit components, Vite, PWA with offline sync and idempotent API calls
- Dev: docker compose at repo root; Makefile includes smoke target

What’s already implemented (this branch)
- Auth sessions endpoints:
  - GET `/api/v1/auth/sessions` – paginated list for current user
  - POST `/api/v1/auth/sessions/{session_id}/revoke` – revokes owned session
- Rate limiting headers via middleware: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`; 429 includes `Retry-After`
- AuditLog fix: renamed reserved `metadata` to `event_metadata`
- Migration extended to create `user_sessions` (+ indices)
- CI workflow to run `make setup && make test && make smoke`
- Tests added: sessions list/revoke, login RL headers
- PLAN updated with detailed next steps

Your Mission – Next Steps
1) Apply DB migrations in runtime and smoke test
- Run: `docker compose run --rm api alembic upgrade head`
- Run: `make smoke`

2) Ensure backend coverage artifacts in CI
- Adjust Makefile/Workflow so backend tests output `backend/coverage.xml` (either modify test target or call pytest with `--cov` in workflow)

3) Expand backend tests
- Pagination boundaries for projects/support/community (page 1, last, overflow)
- Idempotency duplicate POST/PATCH (201->200 replay, same payload)
- Status endpoints compute overall and per-service

4) Documentation
- API semantics (pagination params, idempotency semantics, ETag with If-None-Match, auth sessions)
- Dev guide (migrations, smoke, testing locally; Docker port notes)
- CSP reporting usage and troubleshooting

5) Index verification
- Confirm indices exist as per PLAN; add migration if any are missing

6) Pre-push hook tuning
- Exclude tests/docs from “hardcoded credential” false positives while keeping protection for app code

Guardrails
- Keep changes incremental and focused; don’t regress existing APIs
- Maintain async SQLAlchemy best practices; test isolation first
- Keep CI jobs finite (no long-running processes)

Key Files/Entry Points
- Migrations: `backend/alembic/versions/20250812_1548_add_project_support_community_idempotency.py`
- Endpoints: `backend/app/api/v1/endpoints/`
- Middleware: `backend/app/api/middleware/security.py`
- Caching/Idempotency: `backend/app/utils/http_cache.py`, `backend/app/utils/idempotency.py`
- Tests: `backend/tests/api/` with `conftest.py`
- CI: `.github/workflows/backend.yml`
- Plans & Prompt: `docs/PLAN.md`, `docs/PROMPT.md`

Definition of Done for this handoff phase
- Migrations applied and verified locally; smoke passes
- Backend tests green locally and in CI with coverage artifacts
- Pagination/idempotency/status tests implemented and passing
- Docs updated for API semantics + CSP; Dev guide updated
- Indices verified/added for hot paths; pre-push hook tuned

Operational Checklist (execute in order)
1) Migrate + smoke
2) CI coverage artifact for backend
3) Add missing backend tests; keep green
4) Docs (API, CSP, Dev)
5) Index check/migration if needed
6) Hook tuning

Notes
- Session list/revoke + RL headers are already implemented and tested; focus now is completeness (tests/docs/indices/CI artifacts).
