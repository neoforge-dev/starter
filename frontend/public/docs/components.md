---
title: Component Guide
description: Explore NeoForge's component library and learn how to use them effectively
---

# Component Guide

NeoForge provides a collection of reusable web components built with Lit. These components are designed to be lightweight, accessible, and easy to customize.

## Core Components

### App Shell

The `app-shell` component provides the main application layout:

```javascript
import { AppShell } from '@neoforge/components';

<app-shell>
  <main>Your content here</main>
</app-shell>
```

Properties:
- `theme`: 'light' | 'dark' | 'system'
- `menuOpen`: boolean

### Forms

#### Input Field

```javascript
<nf-input
  label="Username"
  type="text"
  required
  @input=${this.handleInput}
></nf-input>
```

Properties:
- `label`: string
- `type`: 'text' | 'password' | 'email' | 'number'
- `value`: string
- `required`: boolean
- `disabled`: boolean
- `error`: string

#### Button

```javascript
<nf-button
  variant="primary"
  size="medium"
  @click=${this.handleClick}
>
  Click Me
</nf-button>
```

Properties:
- `variant`: 'primary' | 'secondary' | 'text'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean

### Navigation

#### Nav Bar

```javascript
<nf-nav-bar>
  <nf-nav-item href="/">Home</nf-nav-item>
  <nf-nav-item href="/docs">Docs</nf-nav-item>
</nf-nav-bar>
```

Properties:
- `variant`: 'top' | 'side'
- `collapsed`: boolean

### Data Display

#### Card

```javascript
<nf-card>
  <h2 slot="header">Card Title</h2>
  <p>Card content goes here</p>
  <div slot="footer">Card footer</div>
</nf-card>
```

Properties:
- `elevation`: number
- `interactive`: boolean

#### Table

```javascript
<nf-table
  .data=${this.items}
  .columns=${this.columns}
  @row-click=${this.handleRowClick}
></nf-table>
```

Properties:
- `data`: Array
- `columns`: Array
- `sortable`: boolean
- `loading`: boolean

### Feedback

#### Toast

```javascript
import { toast } from '@neoforge/components';

toast.success('Operation completed successfully');
```

Methods:
- `success(message: string, options?: ToastOptions)`
- `error(message: string, options?: ToastOptions)`
- `info(message: string, options?: ToastOptions)`
- `warning(message: string, options?: ToastOptions)`

#### Loading Spinner

```javascript
<nf-spinner
  size="medium"
  color="primary"
></nf-spinner>
```

Properties:
- `size`: 'small' | 'medium' | 'large'
- `color`: 'primary' | 'secondary'

## Using Components

### Installation

```bash
npm install @neoforge/components
```

### Basic Usage

```javascript
import { LitElement, html } from 'lit';
import '@neoforge/components/nf-button';
import '@neoforge/components/nf-input';

class MyComponent extends LitElement {
  render() {
    return html`
      <div>
        <nf-input
          label="Email"
          type="email"
          required
        ></nf-input>
        
        <nf-button
          variant="primary"
          @click=${this.handleSubmit}
        >
          Submit
        </nf-button>
      </div>
    `;
  }
}
```

### Styling Components

Components can be customized using CSS custom properties:

```css
nf-button {
  --nf-button-background: var(--primary-color);
  --nf-button-color: white;
  --nf-button-radius: 4px;
}
```

### Component Mixins

NeoForge provides several mixins for common functionality:

```javascript
import { LoadingMixin, ErrorMixin } from '@neoforge/components/mixins';

class MyComponent extends LoadingMixin(ErrorMixin(LitElement)) {
  // Your component now has loading and error handling capabilities
}
```

## Best Practices

1. **Performance**
   - Use lazy loading for non-critical components
   - Keep component dependencies minimal
   - Implement proper cleanup in disconnectedCallback

2. **Accessibility**
   - Include ARIA attributes
   - Support keyboard navigation
   - Maintain proper focus management

3. **Testing**
   - Write unit tests for components
   - Test accessibility
   - Test different states (loading, error, etc.)

## Next Steps

- Learn about [State Management](./state-management)
- Explore [Theming](./theming)
- Read our [Testing Guide](./testing)
- Check [Component Examples](./examples) 