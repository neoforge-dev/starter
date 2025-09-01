# 2. No Build Tooling in Development

Date: 2024-02-20

## Status

Accepted

## Context

Modern web development often involves complex build tooling (webpack, Vite, etc.) which can:
- Slow down development cycles
- Add complexity to the development process
- Create a disconnect between source and running code
- Make debugging more difficult
- Increase project maintenance burden

We needed to decide whether to use a build tool or go with a no-build approach.

## Decision

We decided to avoid build tools during development and use native ES modules because:

1. **Faster Development**: No build step means instant feedback
2. **Simpler Debugging**: Source code is the running code
3. **Native Modules**: Modern browsers support ES modules natively
4. **Better Learning**: Developers understand the actual code running
5. **Reduced Complexity**: No build configuration to maintain
6. **Direct DevTools Integration**: Clean debugging experience

We do use a minimal build step for production to:
- Optimize assets
- Add polyfills when needed
- Generate service worker
- Create PWA assets

## Consequences

### Positive

- Instant development feedback loop
- Simpler project setup
- Easier debugging
- Better developer understanding
- Reduced tooling maintenance
- Smaller repository size

### Negative

- Some modern JS features need polyfills
- Manual optimization for production
- Limited preprocessor support
- Need careful module organization

### Mitigations

1. Created clear module organization guidelines
2. Implemented simple production build process
3. Added browser support documentation
4. Created deployment checklist
5. Added performance monitoring
