# Repository Guidelines

## Project Structure & Module Organization
Source lives in `backend/app` (FastAPI services, SQLModel models) and `frontend/src` (web components, pages, services). Tests reside in `backend/tests` for pytest suites and `frontend/tests` for Vitest, Playwright, and component specs. Shared documentation is organized under `docs/`, while deployment manifests sit in `deploy/` and `k8s/`. Top-level scripts such as `scripts/` and operational tooling in `ops/` support local automation and CI.

## Build, Test, and Development Commands
Run `make setup` once to provision the Dockerized dev environment. Use `make dev`, `make backend`, or `make frontend` to start services selectively. Execute `make test-backend` or `docker compose run --rm api_test pytest` for backend suites, and `cd frontend && bun run test` (or `test:unit`, `test:e2e`, `test:component`) for frontend coverage. Lint with `docker compose run --rm api_test ruff check app/` and `cd frontend && bun run lint`; fix issues using the `--fix` variants. Always rely on astral `uv` for Python dependency management.

## Coding Style & Naming Conventions
Python code targets 3.11+, uses 4-space indentation, async FastAPI patterns, snake_case for functions and variables, PascalCase for models, and Google-style docstrings. JavaScript remains vanilla (no TypeScript), two-space indented, with camelCase for logic, PascalCase for custom elements, and template-literal CSS. Keep imports absolute in Python, relative ES modules in the frontend, and ensure Ruff, MyPy, and Bun lint tasks pass before opening a PR.

## Testing Guidelines
Backend tests rely on pytest with async fixtures; maintain ≥80% coverage via `docker compose run --rm api_test pytest --cov=app`. Frontend unit tests use Vitest with jsdom, while Playwright drives E2E checks (target ≥70% coverage). Name tests after the feature or behavior under test (e.g., `test_auth_flow.py`, `auth.spec.js`) and include regression repro steps in failing scenarios.

## Commit & Pull Request Guidelines
Adopt Conventional Commits (`feat:`, `fix:`, `chore:`) and bundle related changes together. PRs should describe intent, list validation steps (tests, lint, type-check), link to tracking issues, and attach screenshots or logs for UI or API-facing updates. Request review only once CI is green and documentation in `docs/` or `README.md` reflects new behavior.

## Agent Workflow Notes
Work from feature branches, commit incrementally after each discrete change, and avoid rewriting user-authored modifications. Favor Dockerized commands over host tools, and keep run logs concise to streamline review.
