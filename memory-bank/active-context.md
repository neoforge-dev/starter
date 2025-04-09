# Active Context (Optimized)

## Current Focus
- **Backend Reliability**: Fix failing tests (Validation Middleware, Cache).
- **Test Coverage**: Increase backend coverage towards 80%.
- **MVP Features**: Continue core feature dev (Auth, Data Mgmt, Errors) after tests stabilize.

## Current State
- **Backend Tests**: Failing (Validation Middleware: 307 redirects; Cache: metrics assertion). Coverage 65%.
  - Auth tests passing.
  - Logging added to `get_current_user`.
- **Frontend Tests**: ~85% passing (634/694), 60 skipped (incl. memory perf).
- **Storybook**: Basic setup works.

## Next Steps (Prioritized)
1. **Fix BE Tests** (Critical): Resolve 307 redirects in validation tests (check endpoint slashes), fix cache metrics test.
2. **Increase BE Coverage** (High): Add tests for low-coverage areas (endpoints, core logic).
3. **Address FE Skipped Tests** (Medium): Review/enable skipped FE tests.
4. **Core Features** (Medium): Continue MVP features once tests pass.
5. **Docs/Polish** (Low): Deferred post-MVP.

## Key Patterns / Reminders
- MVP First: Essential features, defer optimizations.
- Test Strategy: Fix blockers first, >80% coverage target.
- Tech Debt: Only address MVP blockers.