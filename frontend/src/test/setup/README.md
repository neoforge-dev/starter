# Test Setup Utilities

This directory contains utilities for setting up the test environment for the NeoForge frontend project.

## Contents

- `optimized-performance-polyfill.js`: Performance API polyfill (ESM version)
- `optimized-performance-polyfill.cjs`: Performance API polyfill (CommonJS version)
- `silence-lit-dev-mode.js`: Utility to silence Lit dev mode warnings (ESM version)
- `silence-lit-dev-mode.cjs`: Utility to silence Lit dev mode warnings (CommonJS version)
- `package-patches.js`: Patches for third-party packages (ESM version)
- `package-patches.cjs`: Patches for third-party packages (CommonJS version)

## Performance API Polyfill

The Performance API polyfill ensures that `performance.now()` and other Performance API methods are available in all test environments, including Node.js, JSDOM, and worker threads.

### Key Features

- Complete implementation of the Performance API
- Works in all JavaScript environments
- Handles edge cases and error conditions
- Specifically designed to work in worker threads

For detailed documentation, see `/docs/performance-polyfill.md`.

## Silence Lit Dev Mode Warning

The Lit dev mode warning utility silences the warning message that Lit displays when running in development mode. This is useful for tests to reduce noise in the test output.

### Key Features

- Patches the reactive-element.js file to silence the warning
- Works in all JavaScript environments
- Handles edge cases and error conditions

## Package Patches

The package patches utility fixes issues with third-party packages that may cause problems in the test environment.

### Key Features

- Fixes the deprecation warning about missing "main" or "exports" field in the @open-wc/semantic-dom-diff package
- Works in all JavaScript environments

## Usage

These utilities are automatically loaded by the Vitest setup files. No additional configuration is needed for most use cases.

### ESM vs CommonJS

- The `.js` files are ESM modules and are used in the main test environment
- The `.cjs` files are CommonJS modules and are used in worker threads

This dual-format approach ensures that the utilities work correctly in all environments.

## Troubleshooting

If you encounter issues with the test environment:

1. Check the console for error messages
2. Verify that the polyfills are being loaded
3. Check the Vitest configuration to ensure the setup files are properly configured

## Maintenance

When updating these utilities:

1. Test in multiple environments (Node.js, JSDOM, browsers)
2. Update both ESM and CommonJS versions when applicable
3. Update the documentation with any significant changes
