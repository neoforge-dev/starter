# Successor Agent Prompt

You are taking over the NeoForge starter kit on branch `fix/ci-makefile-and-frontend-tests`. Your mission is to drive the repo to green CI and deliver the next 4 epics incrementally, favoring the smallest safe changes. Follow the plan in `docs/PLAN.md` and keep work scoped, reversible, and well-tested.

## Context
- Stack: FastAPI + SQLModel + Celery + Redis; Lit 4.0 Web Components + Vite/Bun; Docker + Make; GitHub Actions CI
- Target: Production-ready with <$15/mo cost, high test stability, strong security baselines
- Docs hub: `docs/README.md` and roadmap in `NEOFORGE_CONSOLIDATION_ROADMAP.md`

## Primary Objectives
1) Get CI green on current PR
2) Execute Epics 1–4 in order, merging small PRs frequently

## Ground Rules
- Never commit failing builds. Always run tests before commits.
- Prefer Bun for frontend speed (`bun install`, `bun run test`).
- Backend tests run in Docker for parity: `docker compose run --rm api_test pytest -q`.
- Keep edits minimal, feature-flag risky changes, and write/update tests.
- Update docs when behavior changes. Link runbooks from alerts.

## Quick Commands
```bash
# Root
make help
make test

# Frontend
cd frontend && bun install && bun run test && bun run lint

# Backend
docker compose run --rm api_test pytest -q
ruff check backend/ && ruff format --check backend/
```

## Immediate Tasks (Current PR)
- Resolve Dependency Review: update offending deps; if blocked, temporarily relax to critical-only and open follow-up issue to restore stricter threshold.
- Stabilize frontend unit subset failures: reproduce locally; ensure URL and PWA mocks; fix flaky specs.
- Backend CI: inspect failing logs; address metrics/health flakiness.

## Epic Execution Guide
- Epic 1 (Observability & Readiness):
  - Ensure `http_requests_total` and `http_request_duration_seconds` for all routes; normalized labels.
  - Add/runbook links for Prometheus alerts. Create runbooks in `docs/runbooks/`.
  - OTLP exporter env-gated; Celery trace propagation. Tests for headers/metrics present.

- Epic 2 (Type Safety & A11y):
  - Add `frontend/tsconfig.json`; migrate `src/services/api.js` and `auth.js` to TypeScript.
  - Stabilize test setup for custom elements and PWA mocks.
  - Add axe CI scan for key pages and fix critical findings.

- Epic 3 (Performance/Cost):
  - Implement optional cursor pagination endpoints; add indices; update client.
  - ETag/Cache-Control for public lists with 304 tests.
  - Slim Docker images via multi-stage and non-root user.

- Epic 4 (Security & Account Lifecycle):
  - Refresh token rotation with `jti` reuse detection and session family revocation.
  - Device labels; tiered rate limits; secure cookie option; audit logs; migrations + tests.

## Quality Gate Template
Before marking any task complete, ensure:
```
QUALITY GATE VALIDATION:
✅ Tests passed: [command + result]
✅ Build successful: [command + result]
✅ No compilation errors
✅ Ready to merge
```

## Reporting
- Keep `docs/PLAN.md` updated as you land changes.
- When adding alerts, link to runbooks.
- Summarize important changes in PR descriptions (why > what).

## Tips
- Use small PRs that keep CI green.
- For flaky tests, prefer deterministic mocks over sleeps.
- Guard production-only features with env flags and strict defaults.

Proceed now: make the current PR green, then start Epic 1 runbooks + minimal OTLP scaffolding.
