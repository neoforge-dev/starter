# NeoForge Senior Developer Debug Protocol

## Core Principles

1. **Systematic Investigation Before Action**
2. **Evidence-Based Decision Making**
3. **Root Cause Analysis Over Quick Fixes**
4. **Documentation of Learning**

## Analysis Phase

### 1. Initial Observation
```bash
# Run the specific failing test in isolation
npm run test:component path/to/test.js

# Run all tests in the same file
npm run test path/to/test.js

# Run related component tests
npm run test src/test/components/[component-type]/
```

- Record exact error message and stack trace
- Note test environment details (browser, Node version, etc.)
- Document any recent changes that might affect this component

### 2. Test Case Analysis
- Review test's purpose and expectations
- Verify test setup and mock configurations
- Check component dependencies and their test status
- Review related Storybook stories if available

### 3. Assumption Validation
```javascript
// Example of validating component registration
import { fixture, expect } from '@open-wc/testing';
import '../src/components/my-component.js';

it('registers successfully', async () => {
  const el = await fixture('<my-component></my-component>');
  expect(el).to.be.instanceOf(customElements.get('my-component'));
});
```

## Systematic Investigation

### 1. Component Architecture Review
- Check component inheritance chain
- Verify all required implementations exist
- Review event handlers and lifecycle methods
- Examine state management approach

### 2. Test Infrastructure Verification
```javascript
// Example of verifying test setup
import { mockComponent } from '../test/utils/component-mock-utils.js';
import { setupTestEnvironment } from '../test/setup/test-setup.js';

describe('Test Environment', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('mocks components correctly', () => {
    const MockedComponent = mockComponent('test-component');
    expect(MockedComponent).to.exist;
  });
});
```

### 3. Dependency Chain Analysis
- Verify all imports resolve correctly
- Check for circular dependencies
- Validate mock implementations match real components

## Implementation Phase

### 1. Minimal Fix Implementation
```javascript
// Example of minimal fix pattern
it('handles edge case correctly', async () => {
  // 1. Arrange: Setup minimal test case
  const el = await fixture('<my-component></my-component>');

  // 2. Act: Trigger the specific behavior
  el.setAttribute('value', 'test');

  // 3. Assert: Verify only the specific fix
  expect(el.value).to.equal('test');
});
```

### 2. Verification Process
1. Run the specific test
2. Run all tests in the file
3. Run related component tests
4. Run full test suite if changes affect core utilities

### 3. Refactoring Guidelines
- Keep changes focused on the failing test
- Document any patterns that emerge
- Update component documentation if behavior changes
- Add new test cases for edge cases discovered

## Persistent Error Protocol

### When Errors Persist:

1. **Deep Analysis Documentation**
   ```markdown
   ## Error Investigation Log

   ### Hypothesis 1: Component Lifecycle
   - Current behavior:
   - Expected behavior:
   - Evidence:

   ### Hypothesis 2: State Management
   - Current behavior:
   - Expected behavior:
   - Evidence:

   ### Hypothesis 3: Event Handling
   - Current behavior:
   - Expected behavior:
   - Evidence:
   ```

2. **Component Architecture Review**
   - Review the entire component tree
   - Check state propagation
   - Verify event bubbling
   - Examine shadow DOM isolation

3. **Edge Case Matrix**
   ```markdown
   | Scenario | Expected | Actual | Notes |
   |----------|----------|---------|-------|
   | Init     |          |         |       |
   | Update   |          |         |       |
   | Destroy  |          |         |       |
   ```

## Workflow Integration

### 1. Test-First Development
```javascript
// Example of test-first approach
describe('MyComponent', () => {
  it('should have required API', async () => {
    const el = await fixture('<my-component></my-component>');
    expect(el.api).to.exist;
    // Implementation follows test
  });
});
```

### 2. Memory Bank Updates
After resolving issues:
1. Update `active-context.md` with new patterns
2. Document fixes in `system-patterns.md`
3. Update test documentation if needed

### 3. Commit Protocol
```bash
# Example commit message structure
git commit -m "fix(component): resolve edge case in my-component

- Add test for null value handling
- Implement defensive check in setValue
- Update component documentation
- Relates to #issue-number"
```

## Docker Testing Environment

### Setup
```bash
# Run tests in isolated container
docker-compose -f docker-compose.test.yml up frontend-tests

# Debug specific test
docker-compose -f docker-compose.test.yml run --rm frontend-tests npm run test:component path/to/test.js
```

### Best Practices
1. Always run full suite in Docker before committing
2. Use volume mounts for faster iteration
3. Keep test containers lightweight
4. Clean up containers regularly

## Continuous Improvement

1. **Pattern Recognition**
   - Document common failure patterns
   - Create test templates for common cases
   - Share learnings in team documentation

2. **Test Suite Maintenance**
   - Regular cleanup of skipped tests
   - Performance monitoring of test suite
   - Documentation updates

3. **Knowledge Sharing**
   - Update debugging guides
   - Document new test patterns
   - Share learnings in code reviews

Remember: The goal is not just to fix tests, but to improve the overall testing infrastructure and team knowledge base.
