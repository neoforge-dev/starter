# Active Context

## Current Work Focus
- **MVP Completion**: Core features, essential functionality (4-week plan).
- **Test Infra**: Fix critical test issues blocking MVP.
- **Core Features**: Auth, data management, error handling.

## Current State
- **Frontend Tests**: 88 files total, 75 passing, 13 skipped. Critical failures resolved (`table.test.js`, `memory-monitor.test.js`).
  - `performance.test.js` memory test remains skipped (`test.skip`) - JSDOM limit.
  - Core test utils stable (`src/test/utils`, `src/test/setup`).
- **Storybook**: Working (`npm run storybook`). Initial atom stories exist. Fixes applied (`scripts/fix-stories.js`, `vite.config.js`, `scripts/patch-figspec.cjs`).

## Next Steps (Prioritized)
1. **Fix Test Infra** (Critical): Resolve polyfill issues, setup env, add user flow tests.
1. **Address Skipped Tests** (High): Systematically review and enable skipped tests (memory, pages, e2e stubs).
2. **Core Features** (High): Finish auth, data mgmt, error boundaries, basic offline.
3. **Documentation** (Medium): Core APIs, setup guides, testing docs.
4. **Perf/Polish** (Low - Post-MVP): Lazy loading, bundle size, monitoring.

## Active Decisions / Key Patterns Reminders
- **MVP First**: Essentials only, defer optimizations, clear criteria.
- **Testing Strategy**: Prioritize user flows, fix blockers, follow Sr. Dev Debug Protocol.
- **Tech Debt**: Address only MVP blockers, document for later.
- **Review Process**: Daily tests, Weekly features, Bi-weekly MVP progress.