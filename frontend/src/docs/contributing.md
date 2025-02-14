# Contributing to NeoForge

Thank you for your interest in contributing to NeoForge! This guide will help you get started with contributing to our project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)
- [Community](#community)

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/your-username/neoforge.git
cd neoforge
```

3. Install dependencies:
```bash
npm install
```

4. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Environment

### Prerequisites

- Node.js 18+
- Docker
- VS Code (recommended)

### VS Code Extensions

We recommend the following extensions:
- Lit Plugin
- ESLint
- Prettier
- Docker
- Live Server

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Start the development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

## Making Changes

### Component Development

1. Create new components in `src/components/`:
```javascript
import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";

export class MyComponent extends LitElement {
  static styles = [
    baseStyles,
    css`
      :host {
        display: block;
      }
    `,
  ];

  render() {
    return html`<div>My Component</div>`;
  }
}

customElements.define("my-component", MyComponent);
```

2. Add tests in `src/test/components/`:
```javascript
import { expect } from "@esm-bundle/chai";
import "../../components/my-component.js";

describe("MyComponent", () => {
  it("renders correctly", async () => {
    const el = document.createElement("my-component");
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot.textContent).to.include("My Component");
  });
});
```

### Code Style

We use:
- Black for Python (88 chars)
- Prettier for JavaScript
- ESLint for linting
- Type hints for Python
- JSDoc for JavaScript

Example:
```javascript
/**
 * Calculates memory usage statistics
 * @param {number} threshold - Memory threshold in MB
 * @returns {Promise<Object>} Memory statistics
 */
async function getMemoryStats(threshold) {
  // Implementation
}
```

## Testing

### Types of Tests

1. **Unit Tests**
```javascript
describe("MemoryMonitor", () => {
  it("detects memory leaks", async () => {
    const monitor = document.createElement("memory-monitor");
    monitor.threshold = 100;
    await monitor.updateComplete;
    const leaks = await monitor.checkMemory();
    expect(leaks).to.be.an("array");
  });
});
```

2. **Visual Regression Tests**
```javascript
test("component appearance", async ({ page }) => {
  await page.goto("/components/my-component");
  await expect(page).toHaveScreenshot("my-component.png");
});
```

3. **Accessibility Tests**
```javascript
test("accessibility compliance", async ({ page }) => {
  await page.goto("/components/my-component");
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
```

### Running Tests

```bash
# Unit tests
npm test

# Visual tests
npm run test:visual

# Accessibility tests
npm run test:a11y

# Coverage report
npm run test:coverage
```

## Pull Request Process

1. Update documentation
2. Add tests
3. Update CHANGELOG.md
4. Submit PR with:
   - Clear title
   - Detailed description
   - Screenshots (if UI changes)
   - Test results

Example PR description:
```markdown
## Description
Added memory leak detection feature to MemoryMonitor component

## Changes
- Implemented leak detection algorithm
- Added configuration options
- Updated documentation
- Added unit tests

## Screenshots
![Memory Monitor](screenshots/memory-monitor.png)

## Test Results
✅ Unit Tests: 42 passed
✅ Visual Tests: No changes
✅ Accessibility: No violations
```

## Style Guide

### Component Structure

```javascript
// imports
import { LitElement, html, css } from "lit";
import { baseStyles } from "../styles/base.js";

// documentation
/**
 * @customElement my-component
 */
export class MyComponent extends LitElement {
  // styles
  static styles = [baseStyles, css``];

  // properties
  static properties = {
    prop1: { type: String },
  };

  // lifecycle methods
  constructor() {
    super();
  }

  // public methods
  publicMethod() {}

  // private methods
  _privateMethod() {}

  // render methods
  render() {}
}

// registration
customElements.define("my-component", MyComponent);
```

### Naming Conventions

- Components: kebab-case for tags, PascalCase for classes
- Methods: camelCase
- Private methods: _prefixed
- CSS classes: kebab-case
- Constants: UPPER_SNAKE_CASE

### Documentation

Use JSDoc for all public APIs:

```javascript
/**
 * Monitors memory usage and detects leaks
 * @fires leak-detected - When a memory leak is detected
 * @fires threshold-exceeded - When memory usage exceeds threshold
 */
export class MemoryMonitor extends LitElement {
  /**
   * Starts monitoring memory usage
   * @param {Object} options - Configuration options
   * @param {number} options.threshold - Memory threshold in MB
   * @returns {Promise<void>}
   * @throws {Error} If monitoring fails to start
   */
  async startMonitoring(options) {
    // Implementation
  }
}
```

## Community

- Join our [Discord](https://discord.gg/neoforge)
- Follow us on [Twitter](https://twitter.com/neoforge)
- Read our [blog](https://blog.neoforge.dev)

### Getting Help

1. Check the documentation
2. Search existing issues
3. Ask in Discord
4. Create a new issue

### Reporting Bugs

Include:
- Version info
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/console logs
- Minimal reproduction

Example:
```markdown
## Bug Report

Version: 1.0.0
Browser: Chrome 90.0

### Steps to Reproduce
1. Open memory monitor
2. Set threshold to 100MB
3. Click "Start Monitoring"

### Expected Behavior
Memory usage graph should update every second

### Actual Behavior
Graph freezes after 5 seconds

### Console Output
```js
Error: Failed to update memory stats
    at MemoryMonitor._updateStats (memory-monitor.js:42)
```
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 