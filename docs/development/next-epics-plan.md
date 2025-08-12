# Next 4 Epics Plan (Q3/Q4 2025)

This plan defines concrete, high‑leverage work across four epics. Each epic includes goals, tasks, acceptance criteria, risks, and owners.

## Epic 1: API Contract Alignment + Router Consolidation

- Goal: Ensure the frontend only calls supported backend endpoints and remove routing duplication.
- Scope:
  - Align API base URL to backend dynamic config
  - Remove duplicate router (keep `frontend/src/router.js`)
  - Update router to target `#router-outlet`
  - Decide on unsupported endpoints: stub server or trim client
- Tasks:
  - Frontend
    - [x] Update `frontend/src/services/api.js` to use `dynamicConfig.getApiBaseUrl()` (lazy init) and add `Idempotency-Key` header for non‑GET requests
    - [x] Modify `frontend/src/router.js` to inject into `#router-outlet` if present, fallback to `document.querySelector('main')`
    - [x] Remove embedded router from `frontend/src/main.js`; keep `NeoApp` only
    - [ ] Search and remove dead calls or gate features behind flags if endpoints are not yet implemented
  - Backend
    - [x] Implement minimal stubs for `projects`, `support/tickets`, `community/posts`, `status`, `analytics`
- Acceptance Criteria:
  - Single router controls navigation; no duplicate route loaders
  - All navigable routes render without 404s
  - API base URL comes from `/api/v1/config`; no hardcoded `"/api"`

## Epic 2: Dev Environment and Docs Alignment

- Goal: One‑command dev with accurate docs/Makefile reflecting current compose (`docker-compose.yml` at repo root).
- Tasks:
  - [x] Update `Makefile` targets to use root compose (build/up/run with `api`, `api_test`, `frontend`)
  - [x] Add smoke target (optional): checks DB/Redis health and `/health`
  - [x] Update `docs/getting-started.md` and `CLAUDE.md` snippets to remove references to `backend/docker-compose.dev.yml`
  - [ ] Add basic CI job (later) to run `make setup && make test`
- Acceptance Criteria:
  - New developer can run `make setup` + `make dev` without edits
  - `make test` runs backend tests via `api_test` service

## Epic 3: Offline‑First PWA Maturity

- Goal: Complete offline write queue and background sync loop.
- Tasks:
  - [x] Change background sync tag to `sync-forms` in `frontend/src/services/pwa.js`
  - [x] Implement `syncForms()` in `frontend/src/service-worker.js`:
    - Open IndexedDB `neoforge-offline` → `offline_actions`
    - Re‑POST actions when online; on success, delete queued action
    - On failure, keep and reschedule background sync
  - [x] Add `Idempotency-Key` header for non‑GET requests in `api.js`
  - [ ] Add basic conflict handling (toast/log) on replay failures
  - [ ] Add tests later for offline→online flows
- Acceptance Criteria:
  - Offline non‑GET actions queue and replay automatically when online
  - Cached GETs work; users see consistent behavior during offline

## Epic 4: Security + Observability Enhancements (Phase 1)

- Goal: Close feedback loops and expose actionable insights. (Begin with backend plumbing; dashboards in a follow‑up PR.)
- Tasks:
  - [x] Add CSP report‑only toggle and endpoint (`/security/report`) to collect violations (minimal PII‑safe schema)
  - [x] Emit Prometheus counters for:
    - Suspicious path blocks
    - Malicious UA blocks
    - Rate limit hits
  - [ ] Document toggles in settings and briefly in docs
- Acceptance Criteria:
  - CSP reporting can be enabled in non‑prod safely
  - Threat metrics exposed in `/metrics`

---

## Timeline & Dependencies

- Week 1: Epic 1 (base URL + router) and Epic 2 (Makefile/docs). Ship as PR 1.
- Week 2: Epic 3 SW sync loop + idempotency header. Ship as PR 2.
- Week 3: Epic 4 CSP report endpoint + metrics. Ship as PR 3. Dashboards in PR 4.

## Risks & Mitigations

- Router refactor regressions → keep fallback to `main` selector; add quick nav smoke tests
- Service worker sync complexity → limit initial scope to basic POST/PATCH/DELETE with naive retries
- Docs drift → CI guard (follow‑up) to validate `make` targets

## Owners

- Backend/API: @owner-backend
- Frontend: @owner-frontend
- DevEx/Docs: @owner-devex
