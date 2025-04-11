# Active Context (Optimized)

## Current Focus
- **Backend Reliability**: Fix failing health check tests.
- **Test Coverage**: Increase backend coverage towards 80%.
- **MVP Features**: Continue core feature dev (Auth, Data Mgmt, Errors) after tests stabilize.

## Current State
- **Backend Tests**: Failing (`test_detailed_health_check_db_failure`, `test_detailed_health_check_redis_failure`). Multiple mocking strategies (patch, dependency_overrides) ineffective. Coverage ~79%.
- **Frontend Tests**: ~85% passing (634/694), 60 skipped (incl. memory perf).
- **Storybook**: Basic setup works.

## Next Steps (Prioritized)
1.  **Address BE Coverage** (High): Identify modules below 80% (deps, health, main, admin) and add tests to reach the threshold. Start with `app.api.deps.py`.
2.  **Fix BE Health Tests** (Medium): Revisit `test_health.py` failures if coverage work doesn't resolve or suggest a path.
3.  **Address FE Skipped Tests** (Medium): Review/enable skipped FE tests.
4.  **Core Features** (Medium): Continue MVP features once tests pass/coverage met.
5.  **Docs/Polish** (Low): Deferred post-MVP.

## Key Patterns / Reminders
- MVP First: Defer non-essential optimizations.
- Test Strategy: Prioritize coverage target (>80%), then fix remaining failures.
- Tech Debt: Only address MVP blockers.
- Configuration: Use `get_settings()` DI; fetch explicitly if DI unavailable.