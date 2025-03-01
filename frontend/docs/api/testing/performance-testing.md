# Performance Testing

## Overview
NeoForge includes comprehensive performance testing tools to ensure optimal user experience. Our testing suite covers:
- Layout performance
- Style recalculation efficiency
- Component rendering speed
- Memory usage
- Network performance

## Running Tests

### Basic Performance Tests
```bash
npm run test:perf
```

### Watch Mode
```bash
npm run test:perf:watch
```

## Test Types

### Layout Duration Tests
These tests measure the time taken for layout operations to complete. We target 60fps (16.67ms per frame).

```javascript
it('should have acceptable layout duration', async () => {
  const el = await fixture(html`<your-component></your-component>`);
  
  // Force layout recalculation
  el.style.display = 'none';
  await el.updateComplete;
  el.style.display = 'block';
  await el.updateComplete;

  const avgLayoutDuration = layoutDurations.reduce((a, b) => a + b, 0) / layoutDurations.length;
  expect(avgLayoutDuration).to.be.below(16.67);
});
```

### Style Recalculation Tests
Monitor the number and duration of style recalculations triggered by component updates.

```javascript
it('should minimize style recalculations', async () => {
  const el = await fixture(html`<your-component></your-component>`);
  
  // Trigger component update
  el.someProperty = 'new value';
  await el.updateComplete;

  expect(styleRecalcs.length).to.be.below(3);
});
```

### Memory Leak Detection
Tests for memory leaks using the Memory Leak Detector utility.

```javascript
it('should not leak memory', async () => {
  const { detectLeaks } = await import('../../utils/memory-leak-detector.js');
  
  const results = await detectLeaks(() => {
    const el = document.createElement('your-component');
    document.body.appendChild(el);
    document.body.removeChild(el);
  });

  expect(results.leaks).to.be.empty;
});
```

## Performance Budgets

We enforce the following performance budgets:

- First Contentful Paint: < 1.8s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 150KB (compressed)
- Memory Usage: < 60MB
- Layout Shifts: < 0.1 CLS

## Docker Integration

Run performance tests in an isolated container:

```bash
docker-compose run frontend_test npm run test:perf
```

## CI/CD Integration

Performance tests are automatically run in the CI pipeline. Tests will fail if:
- Any layout operation takes longer than 16.67ms (60fps)
- Style recalculations exceed the budget
- Memory leaks are detected
- Performance budgets are exceeded

## Custom Performance Metrics

### Adding Custom Metrics
```javascript
import { PerformanceObserver } from 'perf_hooks';

function measureCustomMetric(callback) {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    callback(entries);
  });
  
  observer.observe({ entryTypes: ['measure'] });
}
```

### Creating Performance Marks
```javascript
performance.mark('start-operation');
// ... perform operation
performance.mark('end-operation');
performance.measure('operation-duration', 'start-operation', 'end-operation');
```

## Best Practices

1. **Test Setup**
   - Always use isolated test environments
   - Clear performance buffers between tests
   - Use realistic data volumes

2. **Measurement**
   - Measure multiple iterations
   - Account for warm-up time
   - Consider variance in measurements

3. **Thresholds**
   - Use relative thresholds for different environments
   - Consider device capabilities
   - Account for network conditions

4. **Reporting**
   - Generate detailed performance reports
   - Track trends over time
   - Alert on significant regressions

## Troubleshooting

Common issues and solutions:

1. **Inconsistent Measurements**
   - Ensure test isolation
   - Increase sample size
   - Check for background processes

2. **False Positives**
   - Verify test environment
   - Check for test interference
   - Adjust thresholds if needed

3. **CI/CD Failures**
   - Check resource constraints
   - Verify test environment
   - Review performance budgets 