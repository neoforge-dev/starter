# Button Component

> **Interactive button element** for user actions with comprehensive state management, accessibility features, and visual variants.

## 🚀 Quick Start

```html
<script type="module" src="./src/components/atoms/button/button.js"></script>

<neo-button variant="primary" size="md">Click me</neo-button>
```

## 📋 API Reference

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `string` | `"primary"` | Visual style variant |
| `size` | `string` | `"md"` | Button size |
| `type` | `string` | `"button"` | HTML button type |
| `disabled` | `boolean` | `false` | Whether button is disabled |
| `loading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Take full container width |
| `label` | `string` | `""` | Button text content |
| `icon` | `string` | `""` | Icon to display |
| `iconOnly` | `boolean` | `false` | Show only icon, hide text |

#### Variant Options
| Variant | Usage | Visual Style |
|---------|-------|-------------|
| `primary` | Main call-to-action | Solid background with brand color |
| `secondary` | Secondary actions | Solid background with secondary color |
| `tertiary` | Tertiary actions | Outlined style with transparent background |
| `danger` | Destructive actions | Solid background with error color |
| `ghost` | Minimal actions | Transparent with subtle hover |
| `text` | Inline text actions | No background, underline on hover |

#### Size Options
| Size | Height | Padding | Font Size | Touch Target |
|------|--------|---------|-----------|-------------|
| `xs` | 32px | 4px 8px | 12px | ✅ 32px (minimum) |
| `sm` | 36px | 6px 12px | 14px | ✅ 36px |
| `md` | 44px | 8px 16px | 16px | ✅ 44px (WCAG AA) |
| `lg` | 48px | 12px 20px | 18px | ✅ 48px |
| `xl` | 52px | 16px 24px | 20px | ✅ 52px |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `click` | `{ originalEvent }` | Fired when button is clicked (unless disabled/loading) |
| `focus` | `{}` | Fired when button receives focus |
| `blur` | `{}` | Fired when button loses focus |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `focus()` | None | `void` | Programmatically focus the button |
| `blur()` | None | `void` | Programmatically blur the button |
| `click()` | None | `void` | Programmatically trigger click (if not disabled) |

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--button-padding` | `var(--spacing-md)` | Internal padding |
| `--button-border-radius` | `var(--radius-md)` | Corner rounding |
| `--button-font-weight` | `var(--font-weight-medium)` | Text weight |
| `--button-transition` | `all 150ms ease` | Hover/focus transitions |
| `--button-focus-ring-width` | `3px` | Focus ring thickness |
| `--button-focus-ring-color` | `var(--primary-color-light)` | Focus ring color |
| `--button-disabled-opacity` | `0.5` | Opacity when disabled |

## 📚 Usage Examples

### Basic Usage

```html
<!-- Simple primary button -->
<neo-button variant="primary">Save Changes</neo-button>

<!-- Secondary action -->
<neo-button variant="secondary">Cancel</neo-button>

<!-- Destructive action -->
<neo-button variant="danger">Delete Account</neo-button>
```

### Size Variations

```html
<neo-button size="xs">Extra Small</neo-button>
<neo-button size="sm">Small</neo-button>
<neo-button size="md">Medium</neo-button>
<neo-button size="lg">Large</neo-button>
<neo-button size="xl">Extra Large</neo-button>
```

### Button States

```html
<!-- Disabled button -->
<neo-button disabled>Disabled Button</neo-button>

<!-- Loading state -->
<neo-button loading>Processing...</neo-button>

<!-- Full width -->
<neo-button full-width>Full Width Button</neo-button>
```

### With Icons

```html
<!-- Button with icon -->
<neo-button icon="📧" variant="primary">Send Email</neo-button>

<!-- Icon-only button -->
<neo-button icon="❤️" icon-only label="Like this post"></neo-button>

<!-- Loading with custom text -->
<neo-button loading label="Saving...">Save</neo-button>
```

### Form Integration

```html
<form id="contact-form">
  <neo-input-field 
    name="email" 
    type="email" 
    label="Email" 
    required>
  </neo-input-field>
  
  <neo-input-field 
    name="message" 
    type="textarea" 
    label="Message" 
    required>
  </neo-input-field>
  
  <div class="form-actions">
    <neo-button type="button" variant="secondary">Cancel</neo-button>
    <neo-button type="submit" variant="primary">Send Message</neo-button>
  </div>
</form>
```

### Event Handling

```javascript
// Import the component
import './src/components/atoms/button/button.js';

// Get button reference
const button = document.querySelector('neo-button');

// Listen for clicks
button.addEventListener('click', (event) => {
  console.log('Button clicked!', event.detail);
  
  // Access original DOM event
  const { originalEvent } = event.detail;
  console.log('Mouse position:', originalEvent.clientX, originalEvent.clientY);
});

// Handle async operations
button.addEventListener('click', async (event) => {
  const button = event.target;
  
  // Show loading state
  button.loading = true;
  button.label = 'Processing...';
  
  try {
    await performAsyncOperation();
    button.label = 'Success!';
    button.variant = 'success';
  } catch (error) {
    button.label = 'Error occurred';
    button.variant = 'danger';
  } finally {
    button.loading = false;
    
    // Reset after 2 seconds
    setTimeout(() => {
      button.label = 'Try Again';
      button.variant = 'primary';
    }, 2000);
  }
});
```

## 🎨 Styling & Theming

### Custom Styling

```css
/* Customize specific button */
.my-custom-button {
  --button-padding: 12px 24px;
  --button-border-radius: 8px;
  --button-font-weight: 600;
}

/* Custom variant colors */
neo-button[variant="custom"] {
  --color-primary: #7c3aed;
  --color-primary-dark: #5b21b6;
  --color-primary-light: #f3e8ff;
}
```

### Size Customization

```css
/* Create custom size */
neo-button[size="custom"] {
  min-height: 56px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
}

/* Responsive sizing */
@media (max-width: 640px) {
  neo-button {
    --button-padding: 8px 16px;
    min-height: 48px; /* Maintain touch targets */
  }
}
```

### Animation Customization

```css
/* Custom hover animations */
neo-button {
  --button-transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

neo-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
}

/* Custom loading animation */
neo-button[loading] .spinner {
  animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
```

## ♿ Accessibility

### Built-in Features

- **WCAG AA Compliance** - All sizes meet 44px touch target minimum
- **Keyboard Navigation** - Full keyboard support with proper focus management
- **Screen Reader Support** - Proper ARIA labels and state announcements
- **Focus Management** - Visible focus indicators with proper contrast
- **Loading States** - Screen reader announcements for state changes

### Accessibility Properties

```html
<!-- Proper labeling for icon-only buttons -->
<neo-button icon-only icon="✖️" label="Close dialog"></neo-button>

<!-- Loading state with screen reader text -->
<neo-button loading>
  <span aria-live="polite">Saving your changes...</span>
</neo-button>

<!-- Disabled state with reason -->
<neo-button disabled title="Complete required fields to enable">
  Submit Form
</neo-button>
```

### Testing Accessibility

```javascript
// Test keyboard navigation
function testKeyboardNavigation() {
  const button = document.querySelector('neo-button');
  
  // Focus should be visible
  button.focus();
  console.assert(document.activeElement === button, 'Button should be focusable');
  
  // Enter/Space should trigger click
  const clickEvent = new KeyboardEvent('keydown', { key: 'Enter' });
  button.dispatchEvent(clickEvent);
}

// Test screen reader announcements
function testScreenReader() {
  const button = document.querySelector('neo-button');
  
  // Loading state should announce change
  button.loading = true;
  const ariaLive = button.shadowRoot.querySelector('[aria-live]');
  console.assert(ariaLive, 'Loading state should have aria-live region');
}
```

## 🧪 Testing

### Unit Tests

```javascript
import { fixture, expect } from '@open-wc/testing';
import './button.js';

describe('NeoButton', () => {
  it('renders with default properties', async () => {
    const el = await fixture('<neo-button>Click me</neo-button>');
    
    expect(el.variant).to.equal('primary');
    expect(el.size).to.equal('md');
    expect(el.disabled).to.be.false;
    expect(el.loading).to.be.false;
  });

  it('handles click events', async () => {
    const el = await fixture('<neo-button>Click me</neo-button>');
    let clicked = false;

    el.addEventListener('click', () => {
      clicked = true;
    });

    el.click();
    expect(clicked).to.be.true;
  });

  it('prevents clicks when disabled', async () => {
    const el = await fixture('<neo-button disabled>Click me</neo-button>');
    let clicked = false;

    el.addEventListener('click', () => {
      clicked = true;
    });

    el.click();
    expect(clicked).to.be.false;
  });

  it('shows loading spinner', async () => {
    const el = await fixture('<neo-button loading>Loading...</neo-button>');
    
    const spinner = el.shadowRoot.querySelector('.spinner');
    expect(spinner).to.exist;
  });
});
```

### Integration Tests

```javascript
describe('Button Integration', () => {
  it('works in forms', async () => {
    const form = await fixture(`
      <form>
        <neo-button type="submit">Submit</neo-button>
      </form>
    `);
    
    const button = form.querySelector('neo-button');
    const submitEvent = new Event('submit');
    let formSubmitted = false;
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formSubmitted = true;
    });
    
    button.click();
    expect(formSubmitted).to.be.true;
  });
});
```

### Visual Regression Tests

```javascript
// Playwright visual tests
test.describe('Button Visual Tests', () => {
  test('all variants and sizes', async ({ page }) => {
    await page.goto('/test/button-showcase.html');
    
    // Test all variants
    await expect(page.locator('.button-variants')).toHaveScreenshot('button-variants.png');
    
    // Test all sizes
    await expect(page.locator('.button-sizes')).toHaveScreenshot('button-sizes.png');
    
    // Test states
    await expect(page.locator('.button-states')).toHaveScreenshot('button-states.png');
  });

  test('hover and focus states', async ({ page }) => {
    await page.goto('/test/button-interactions.html');
    const button = page.locator('neo-button[variant="primary"]');
    
    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');
    
    // Focus state
    await button.focus();
    await expect(button).toHaveScreenshot('button-focus.png');
  });
});
```

## 🔧 Advanced Usage

### Custom Variants

```javascript
// Extend button with custom variants
class CustomButton extends NeoButton {
  static get styles() {
    return [
      super.styles,
      css`
        .variant-gradient {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
          border: none;
        }
        
        .variant-neon {
          background: transparent;
          color: #00ff00;
          border: 2px solid #00ff00;
          box-shadow: 0 0 10px #00ff00;
          text-shadow: 0 0 5px #00ff00;
        }
        
        .variant-glassmorphism {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
        }
      `
    ];
  }
}

customElements.define('custom-button', CustomButton);
```

### Button Groups

```html
<div class="button-group">
  <neo-button variant="primary">First</neo-button>
  <neo-button variant="secondary">Second</neo-button>
  <neo-button variant="tertiary">Third</neo-button>
</div>

<style>
.button-group {
  display: flex;
  gap: var(--spacing-xs);
}

.button-group neo-button:not(:last-child) {
  margin-right: -1px;
}

.button-group neo-button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.button-group neo-button:not(:first-child):not(:last-child) {
  border-radius: 0;
}

.button-group neo-button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
</style>
```

### Dynamic Button Factory

```javascript
class ButtonFactory {
  static create(config) {
    const button = document.createElement('neo-button');
    
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) button.setAttribute(key, '');
      } else {
        button.setAttribute(key, value);
      }
    });
    
    return button;
  }
  
  static createGroup(buttons) {
    const group = document.createElement('div');
    group.className = 'button-group';
    
    buttons.forEach(config => {
      const button = this.create(config);
      group.appendChild(button);
    });
    
    return group;
  }
}

// Usage
const actionButtons = ButtonFactory.createGroup([
  { variant: 'secondary', label: 'Cancel' },
  { variant: 'primary', label: 'Save', type: 'submit' }
]);

document.body.appendChild(actionButtons);
```

## 📖 Related Components

- **[Input](./input.md)** - Form input fields that work with buttons
- **[Modal](../molecules/modal.md)** - Dialogs that use buttons for actions
- **[Form](../organisms/form.md)** - Complete forms with button integration
- **[Toolbar](../molecules/toolbar.md)** - Button groups and toolbars

## 🐛 Common Issues

### Issue: Button not responding to clicks

```javascript
// Problem: Event listener attached before component definition
document.querySelector('neo-button').addEventListener('click', handler); // ❌

// Solution: Wait for component to be defined
customElements.whenDefined('neo-button').then(() => {
  document.querySelector('neo-button').addEventListener('click', handler); // ✅
});
```

### Issue: Styling not applying

```css
/* Problem: CSS loaded before component */
neo-button { color: red; } /* ❌ May not work */

/* Solution: Use CSS custom properties */
neo-button { --color-primary: red; } /* ✅ Always works */
```

### Issue: Focus management in SPAs

```javascript
// Problem: Focus lost during route changes
function navigateToPage() {
  showPage('/dashboard');
  // Focus is lost
}

// Solution: Restore focus appropriately  
function navigateToPage() {
  showPage('/dashboard');
  
  // Focus main content or first interactive element
  const mainContent = document.querySelector('main');
  const firstButton = mainContent.querySelector('neo-button:not([disabled])');
  
  if (firstButton) {
    firstButton.focus();
  } else {
    mainContent.setAttribute('tabindex', '-1');
    mainContent.focus();
  }
}
```

---

**Next:** [Input Component](./input.md) | **Up:** [Atoms Overview](./README.md)