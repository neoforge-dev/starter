# Active Context (Optimized)

## Current Focus
- **Backend Reliability**: Fix failing tests (Validation Middleware, Cache).
- **Test Coverage**: Increase backend coverage towards 80%.
- **MVP Features**: Continue core feature dev (Auth, Data Mgmt, Errors) after tests stabilize.

## Current State
- **BE Refactoring**: Completed automated refactoring of global `settings` to `get_settings()`. Manual edits requested for `core/email.py` and several test files.
- **Backend Tests**: Failing (Validation Middleware: 307 redirects; Cache: metrics assertion). Coverage 65%.
  - Auth tests passing.
  - Logging added to `get_current_user`.
- **Frontend Tests**: ~85% passing (634/694), 60 skipped (incl. memory perf).
- **Storybook**: Basic setup works.

## Next Steps (Prioritized)
1. **Apply Manual Edits** (High): User to apply requested manual edits for settings refactor (`core/email.py`, specific test files).
2. **Run BE Tests** (High): Execute `make test` (or equivalent) to verify refactoring and identify remaining failures.
3. **Fix BE Tests** (Critical): Resolve 307 redirects in validation tests (check endpoint slashes), fix cache metrics test.
4. **Increase BE Coverage** (High): Add tests for low-coverage areas (endpoints, core logic).
5. **Address FE Skipped Tests** (Medium): Review/enable skipped FE tests.
6. **Core Features** (Medium): Continue MVP features once tests pass.
7. **Docs/Polish** (Low): Deferred post-MVP.

## Key Patterns / Reminders
- MVP First: Essential features, defer optimizations.
- Test Strategy: Fix blockers first, >80% coverage target.
- Tech Debt: Only address MVP blockers.
- Configuration: Use `get_settings()` for dependency injection, fetch explicitly at module level or in scripts/tests when DI unavailable.