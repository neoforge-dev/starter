# NeoForge Component Library Performance Guidelines

## Overview

This guide provides essential performance best practices for developing and using NeoForge components efficiently in enterprise SaaS applications.

---

## Performance Targets

### Bundle Size Targets
- **Total Library**: <50KB (currently 85KB - needs optimization)
- **Critical Atoms**: <5KB each (Button ✅, Input ❌ needs optimization)
- **Molecules**: <15KB each
- **Organisms**: <30KB each (DataTable ❌ needs virtual scrolling)
- **Vendor Bundle**: <30KB (currently 27KB ✅)

### Runtime Performance Targets
- **Component Render Time**: <16ms (60fps target)
- **Event Response Time**: <100ms
- **Memory Growth**: <10MB per 1000 components
- **DataTable Performance**: Handle 1000+ rows without degradation

---

## Component Architecture Guidelines

### 1. Choose the Right Base Class

#### AtomComponent (NEW - Recommended for Simple Components)
```javascript
import { AtomComponent } from '../atom-component.js';

// ✅ Use for: Buttons, Inputs, Icons, Badges, Labels
export class MySimpleComponent extends AtomComponent {
  // Lightweight: ~500 bytes overhead
  // Fast initialization, no tenant awareness
  // Perfect for reusable atoms
}
```

#### BaseComponent (Use for Complex Components)
```javascript
import { BaseComponent } from '../base-component.js';

// ✅ Use for: Complex forms, dashboards, tenant-aware components
export class MyComplexComponent extends BaseComponent {
  // Full-featured: ~3KB overhead
  // Tenant awareness, API integration
  // Use only when needed
}
```

### 2. Component Size Optimization

#### Critical Size Optimizations
```javascript
// ❌ AVOID: Importing entire base styles
import { baseStyles } from "../../styles/base.js"; // 3KB overhead

// ✅ PREFER: Component-specific styles  
static get styles() {
  return css`
    /* Only styles needed for this component */
    :host { display: block; }
    button { 
      min-height: 44px; /* WCAG compliance */
      padding: 0 16px;
      background: var(--color-primary, #3b82f6);
    }
  `;
}
```

#### Efficient Property Definitions
```javascript
// ❌ AVOID: Over-engineering simple components
static get properties() {
  return {
    // Too many reflected properties create DOM overhead
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, reflect: true },
    // ... 10+ more properties
  };
}

// ✅ PREFER: Essential properties only
static get properties() {
  return {
    variant: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String }, // No reflect if not needed for CSS
  };
}
```

---

## Performance Best Practices

### 1. Efficient Rendering

#### Memoization for Expensive Operations
```javascript
// ✅ Cache expensive computations
get processedData() {
  const dataHash = this._generateHash(this.data);
  if (this._cachedDataHash === dataHash) {
    return this._cachedData; // Return cached result
  }
  
  // Expensive processing only when data changes
  this._cachedData = this.data.filter(...).sort(...);
  this._cachedDataHash = dataHash;
  return this._cachedData;
}
```

#### Virtual Scrolling for Large Datasets
```javascript
// ✅ For datasets > 100 items
export class OptimizedList extends AtomComponent {
  render() {
    const visibleItems = this.data.slice(
      this.startIndex, 
      this.endIndex
    );
    
    return html`
      <div style="height: ${this.totalHeight}px;">
        ${visibleItems.map(item => this.renderItem(item))}
      </div>
    `;
  }
}
```

#### Efficient Event Handling
```javascript
// ❌ AVOID: Creating new functions in render
render() {
  return html`
    <button @click=${() => this.handleClick()}>Click</button>
  `;
}

// ✅ PREFER: Bound methods
constructor() {
  super();
  this._handleClick = this._handleClick.bind(this);
}

render() {
  return html`
    <button @click=${this._handleClick}>Click</button>
  `;
}
```

### 2. Memory Management

#### Proper Cleanup
```javascript
// ✅ Always clean up in disconnectedCallback
disconnectedCallback() {
  super.disconnectedCallback();
  
  // Clean up event listeners
  this._boundHandlers.forEach(cleanup => cleanup());
  
  // Clear timers
  if (this._timer) {
    clearTimeout(this._timer);
  }
  
  // Clear references
  this._cache.clear();
}
```

#### Avoid Memory Leaks
```javascript
// ❌ AVOID: Uncleaned event listeners
connectedCallback() {
  super.connectedCallback();
  window.addEventListener('resize', this.handleResize);
}

// ✅ PREFER: Automatic cleanup with AtomComponent
connectedCallback() {
  super.connectedCallback();
  this.bindEventHandler('resize', this.handleResize, window);
  // Automatically cleaned up on disconnect
}
```

---

## Component-Specific Guidelines

### Atoms Performance

#### Button Component
```javascript
// ✅ Optimized button implementation
export class OptimizedButton extends AtomComponent {
  static get properties() {
    return {
      variant: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      loading: { type: Boolean, reflect: true },
    };
  }

  // Minimal styles - only what's needed
  static get styles() {
    return css`
      :host { display: inline-block; }
      button {
        min-height: 44px;
        padding: 0 16px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      /* Only essential variants */
      button { background: var(--color-primary); }
      :host([variant="secondary"]) button { background: var(--color-gray-100); }
    `;
  }

  render() {
    return html`
      <button ?disabled=${this.disabled}>
        ${this.loading ? html`<div class="spinner"></div>` : ''}
        <slot></slot>
      </button>
    `;
  }
}
```

#### Input Component
```javascript
// ✅ Split into Simple and Advanced versions
export class SimpleInput extends AtomComponent {
  // 3KB - for common cases
  // Basic validation, no password toggle
}

export class AdvancedInput extends BaseComponent {
  // 6KB - for complex forms  
  // Full validation, password toggle, tenant awareness
}
```

### Organisms Performance

#### DataTable with Virtual Scrolling
```javascript
export class OptimizedDataTable extends AtomComponent {
  // ✅ Virtual scrolling implementation
  _calculateVisibleRange() {
    const containerHeight = this.offsetHeight - 44; // Header height
    const visibleRowCount = Math.ceil(containerHeight / this.rowHeight);
    const startIndex = Math.floor(this.scrollTop / this.rowHeight);
    
    // Render only visible rows + buffer
    this.visibleStartIndex = Math.max(0, startIndex - 5);
    this.visibleEndIndex = Math.min(
      this.data.length,
      startIndex + visibleRowCount + 5
    );
  }
}
```

---

## Bundle Optimization

### 1. Code Splitting
```javascript
// ✅ Lazy load heavy components
const DataTable = lazy(() => import('./organisms/data-table.js'));
const ComplexForm = lazy(() => import('./organisms/form.js'));

// Use dynamic imports for optional features
async loadChart() {
  const { ChartComponent } = await import('./chart.js');
  return new ChartComponent();
}
```

### 2. Tree Shaking Optimization
```javascript
// ✅ Named exports for better tree shaking
export { OptimizedButton } from './button/optimized-button.js';
export { SimpleInput } from './input/simple-input.js';

// ❌ Avoid default exports for components
export default { OptimizedButton, SimpleInput }; // Harder to tree-shake
```

### 3. CSS Optimization
```javascript
// ✅ Critical CSS extraction
export const criticalCSS = css`
  /* Only above-the-fold styles */
  :host { display: block; }
  button { min-height: 44px; }
`;

export const enhancedCSS = css`
  /* Additional styles loaded after critical path */
  button:hover { background: var(--color-primary-dark); }
  .complex-animation { /* ... */ }
`;
```

---

## Performance Monitoring

### 1. Bundle Size Monitoring
```bash
# Run after every build
bun scripts/bundle-size-monitor.js

# CI/CD integration
bun scripts/bundle-size-monitor.js --ci
```

### 2. Runtime Performance Testing
```javascript
// Component performance tests
describe('Component Performance', () => {
  it('should render within 16ms', async () => {
    const renderTime = await measureRenderTime(() => {
      const component = new MyComponent();
      container.appendChild(component);
    });
    
    expect(renderTime).to.be.lessThan(16);
  });
});
```

### 3. Memory Leak Detection
```javascript
// Memory usage testing
it('should not leak memory', () => {
  const memory = measureMemoryUsage(() => {
    for (let i = 0; i < 100; i++) {
      const component = new MyComponent();
      container.appendChild(component);
      container.removeChild(component);
    }
  });
  
  expect(memory.diff).to.be.lessThan(1024 * 1024); // < 1MB
});
```

---

## Development Workflow

### 1. Performance-First Development
```bash
# 1. Create component with performance targets in mind
npm run create:component --type=atom --performance

# 2. Run performance tests during development  
npm run test:performance

# 3. Monitor bundle size impact
npm run build && npm run analyze:bundle

# 4. Profile in browser DevTools
npm run dev:profile
```

### 2. Performance Gates
- **Pre-commit**: Bundle size regression check
- **Pull Request**: Performance test results required  
- **Release**: Full performance audit

### 3. Performance Budget Enforcement
```json
// package.json
{
  "bundlewatch": {
    "files": [
      {
        "path": "./dist/assets/main.*.js",
        "maxSize": "20KB"
      },
      {
        "path": "./dist/assets/vendor-lit.*.js", 
        "maxSize": "30KB"
      }
    ]
  }
}
```

---

## Common Performance Anti-patterns

### ❌ What to Avoid

1. **Heavy Base Components**: Using BaseComponent for simple atoms
2. **Excessive DOM Manipulation**: Direct DOM queries in render methods
3. **Memory Leaks**: Uncleaned event listeners and timers
4. **Large Bundle Imports**: Importing entire libraries for small features
5. **Synchronous Operations**: Blocking the main thread with heavy computations
6. **Over-engineering**: Adding features that won't be used

### ✅ What to Do Instead

1. **Right-sized Components**: AtomComponent for atoms, BaseComponent for complex features
2. **Declarative Rendering**: Let Lit handle DOM efficiently
3. **Automatic Cleanup**: Use AtomComponent's bindEventHandler
4. **Selective Imports**: Import only what you need
5. **Async Operations**: Use Web Workers or async operations
6. **YAGNI Principle**: Build only what's needed now

---

## Performance Checklist

### Before Component Release
- [ ] Bundle size under target (<5KB atoms, <15KB molecules, <30KB organisms)
- [ ] Render time <16ms for typical usage
- [ ] Memory usage <1MB per 100 instances
- [ ] No console errors or warnings
- [ ] Accessibility compliance (WCAG AA)
- [ ] Performance tests passing
- [ ] Bundle size regression check passing

### Monthly Performance Review
- [ ] Bundle size trends analysis
- [ ] Performance regression detection
- [ ] Memory leak investigation
- [ ] User experience metrics review
- [ ] Performance target adjustments

---

## Tools and Resources

### Performance Testing Tools
- **Bundle Analyzer**: `bun scripts/bundle-size-monitor.js`
- **Performance Tests**: Vitest with custom performance matchers
- **Memory Profiler**: Chrome DevTools Memory tab
- **Network Analysis**: Chrome DevTools Network tab

### Monitoring Dashboards
- Bundle size over time
- Component render performance
- Memory usage patterns
- Core Web Vitals integration

### Further Reading
- [Web Performance Fundamentals](https://web.dev/performance/)
- [Lit Performance Guide](https://lit.dev/docs/components/performance/)
- [Bundle Size Optimization](https://web.dev/reduce-bundle-sizes/)
- [Memory Management Best Practices](https://web.dev/memory-leaks/)