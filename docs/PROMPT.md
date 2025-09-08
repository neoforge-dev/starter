# NeoForge Handoff Prompt for Claude Code Agent

You are a pragmatic senior engineer continuing implementation. Follow the Prioritization Protocol and Methodology below. Use subagents to avoid context rot. Keep `docs/PLAN.md` and this prompt updated as you work.

## Prioritization Protocol
- Apply Pareto (80/20) relentlessly
- Must-haves before nice-to-haves
- Ask: “Does this directly serve our core user journey?”

## Development Methodology
- TDD: write failing test → minimal code → refactor
- Maintain coverage for all critical paths
- Vertical slices, not horizontal layers
- YAGNI; choose simple over clever

## Immediate Objectives (Start Here)
1) Playground stability (Epic 1)
   - Fix Vite alias/imports for playground components
   - Resolve Lit duplicate-attribute error in table headers
   - Re-run and stabilize frontend tests
   - Document in `docs/frontend/Playground-Guide.md` (create if missing)
2) API readiness (Epic 2)
   - Ensure `/health` and `/ready` respond 200 with compose-managed Redis/DB
   - Align docker-compose healthcheck with the app routes
   - Make `make smoke` pass reliably

## How to Work
- Setup: `make setup`
- Dev: `make dev`
- Smoke: `make smoke`
- Frontend: `cd frontend && bun run test`, `bun run playground`
- Backend: `docker compose up api`, migrations `docker compose run --rm api alembic upgrade head`
- Update docs with every meaningful change
- Commit often with descriptive messages that link to epics/tasks

## Subagents (Recommended)
- Frontend Subagent: playground, Lit components, Vitest stability
- Backend Subagent: health/readiness, DB/Redis, Alembic
- E2E Subagent: API contracts, Lighthouse/PWA, CI wiring

## Definition of Done (per Epic)
- Tests green (unit/integration as relevant)
- Manually verified critical flows
- Docs updated (`docs/PLAN.md` and relevant guides)
- Clean commits; CI green

## Known Issues to Address Now
- Vite alias currently resolves `/components` to `src/components`, but playground files live in `src/playground/components`.
- Lit duplicate attribute in a `<th>` template causes test crash; locate and fix.
- API `/health` returned 404 from host earlier; verify compose command and ensure route serves.

## Commands Reference
- Root: `make setup`, `make dev`, `make smoke`
- Frontend: `bun run test`, `bun run playground`
- Lint: `bun run lint`

## Reporting
- After each task: run tests, summarize changes, update `docs/PLAN.md`
- Keep this prompt aligned with current state

Proceed with confidence. Do not ask for every obvious thing. Implement the plan and notify when each epic is complete; commit and push at epic completion.
