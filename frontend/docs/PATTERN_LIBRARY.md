# NeoForge Pattern Library

## Component Patterns

### 1. Button Patterns

```javascript
// Primary Action Button
<neo-button variant="primary">Submit</neo-button>

// Secondary Action Button
<neo-button variant="secondary">Cancel</neo-button>

// Icon Button
<neo-button variant="icon">
  <neo-icon name="settings"></neo-icon>
</neo-button>
```

### 2. Form Patterns

```javascript
// Basic Form
<neo-form>
  <neo-input label="Username" required></neo-input>
  <neo-input type="password" label="Password" required></neo-input>
  <neo-button type="submit">Login</neo-button>
</neo-form>

// Form with Validation
<neo-form validation-mode="onChange">
  <neo-input 
    label="Email" 
    type="email" 
    pattern="[^@]+@[^@]+\.[^@]+" 
    error-message="Please enter a valid email">
  </neo-input>
</neo-form>
```

### 3. Layout Patterns

```javascript
// Card Layout
<neo-card>
  <h2 slot="header">Card Title</h2>
  <div slot="content">Card content goes here</div>
  <div slot="footer">Card actions</div>
</neo-card>

// Grid Layout
<neo-grid columns="1fr 1fr" gap="1rem">
  <neo-card>Content 1</neo-card>
  <neo-card>Content 2</neo-card>
</neo-grid>
```

### 4. Navigation Patterns

```javascript
// Breadcrumb Navigation
<neo-breadcrumbs>
  <neo-link href="/">Home</neo-link>
  <neo-link href="/products">Products</neo-link>
  <neo-text>Current Page</neo-text>
</neo-breadcrumbs>

// Tab Navigation
<neo-tabs>
  <neo-tab label="Profile">Profile content</neo-tab>
  <neo-tab label="Settings">Settings content</neo-tab>
</neo-tabs>
```

### 5. Data Display Patterns

```javascript
// Data Table
<neo-data-table 
  .data=\${data}
  .columns=\${columns}
  sortable
  paginated>
</neo-data-table>

// Charts
<neo-chart 
  type="line"
  .data=\${chartData}
  .options=\${chartOptions}>
</neo-chart>
```

## Composition Patterns

### 1. Component Composition

```javascript
import { LitElement, html } from 'lit';
import { colors, spacing } from '../tokens/design-tokens.js';

export class ComplexComponent extends LitElement {
  static properties = {
    data: { type: Array },
    loading: { type: Boolean }
  };

  render() {
    if (this.loading) {
      return html\`<neo-spinner></neo-spinner>\`;
    }

    return html\`
      <div class="container">
        <neo-card>
          <neo-data-table .data=\${this.data}></neo-data-table>
        </neo-card>
      </div>
    \`;
  }
}
```

### 2. State Management

```javascript
export class StatefulComponent extends LitElement {
  static properties = {
    count: { type: Number },
    items: { type: Array }
  };

  constructor() {
    super();
    this.count = 0;
    this.items = [];
  }

  increment() {
    this.count++;
    this.requestUpdate();
  }

  addItem(item) {
    this.items = [...this.items, item];
  }
}
```

### 3. Event Handling

```javascript
export class EventComponent extends LitElement {
  handleClick(e) {
    this.dispatchEvent(new CustomEvent('custom-click', {
      detail: { value: e.target.value },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html\`
      <neo-button @click=\${this.handleClick}>
        Click Me
      </neo-button>
    \`;
  }
}
```

## Styling Patterns

### 1. Using Design Tokens

```javascript
import { css } from 'lit';
import { colors, spacing, typography } from '../tokens/design-tokens.js';

static styles = css\`
  :host {
    display: block;
    padding: var(--spacing-md);
    color: var(--color-text);
    font-family: var(--font-primary);
  }

  .container {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-low);
  }
\`;
```

### 2. Responsive Design

```javascript
static styles = css\`
  @media (min-width: 768px) {
    :host {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
    }
  }

  @media (min-width: 1024px) {
    :host {
      grid-template-columns: repeat(3, 1fr);
    }
  }
\`;
```

## Accessibility Patterns

### 1. ARIA Attributes

```javascript
render() {
  return html\`
    <div role="dialog" 
         aria-labelledby="dialog-title"
         aria-describedby="dialog-content">
      <h2 id="dialog-title">Dialog Title</h2>
      <div id="dialog-content">
        Dialog content goes here
      </div>
    </div>
  \`;
}
```

### 2. Keyboard Navigation

```javascript
handleKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    this.activate();
  }
  if (e.key === 'Escape') {
    this.close();
  }
}

render() {
  return html\`
    <div tabindex="0" 
         @keydown=\${this.handleKeyDown}
         role="button">
      Clickable Element
    </div>
  \`;
}
```

## Testing Patterns

### 1. Component Testing

```javascript
import { fixture, html, expect } from '@open-wc/testing';

describe('MyComponent', () => {
  it('renders with default properties', async () => {
    const el = await fixture(html\`<my-component></my-component>\`);
    expect(el).shadowDom.to.equal(\`
      <div class="container">
        <slot></slot>
      </div>
    \`);
  });

  it('handles events correctly', async () => {
    const el = await fixture(html\`<my-component></my-component>\`);
    const button = el.shadowRoot.querySelector('button');
    
    let eventFired = false;
    el.addEventListener('custom-event', () => eventFired = true);
    
    button.click();
    expect(eventFired).to.be.true;
  });
});
```

## Performance Patterns

### 1. Lazy Loading

```javascript
// In router configuration
{
  path: '/dashboard',
  component: () => import('../pages/dashboard-page.js')
}
```

### 2. Efficient Updates

```javascript
shouldUpdate(changedProperties) {
  return changedProperties.has('relevantProp');
}

render() {
  return html\`
    <div>
      \${this.relevantProp}
    </div>
  \`;
}
```

## Error Handling Patterns

### 1. Loading States

```javascript
render() {
  if (this.error) {
    return html\`
      <neo-error-message>
        \${this.error.message}
      </neo-error-message>
    \`;
  }

  if (this.loading) {
    return html\`<neo-spinner></neo-spinner>\`;
  }

  return html\`
    <div class="content">
      \${this.data.map(item => html\`
        <neo-item .data=\${item}></neo-item>
      \`)}
    </div>
  \`;
}
```

## Best Practices

1. Always use design tokens for consistent styling
2. Implement proper accessibility attributes
3. Handle loading and error states
4. Use proper event delegation
5. Implement responsive design
6. Write comprehensive tests
7. Document component APIs
8. Optimize for performance
9. Follow the Single Responsibility Principle
10. Use semantic HTML 