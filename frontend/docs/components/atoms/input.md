# Input Component

> **Text input field** with validation, accessibility features, and consistent styling across all form elements.

## 🚀 Quick Start

```html
<script type="module" src="./src/components/atoms/input/input.js"></script>

<neo-input 
  type="email" 
  label="Your Email" 
  placeholder="Enter your email address"
  required>
</neo-input>
```

## 📋 API Reference

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | `"text"` | HTML input type |
| `label` | `string` | `""` | Input label text |
| `value` | `string` | `""` | Input value |
| `placeholder` | `string` | `""` | Placeholder text |
| `disabled` | `boolean` | `false` | Whether input is disabled |
| `required` | `boolean` | `false` | Whether input is required |
| `error` | `string` | `""` | Error message to display |
| `helperText` | `string` | `""` | Helper text below input |
| `helper` | `string` | `""` | Alternative helper text property |
| `pattern` | `string` | `""` | Validation pattern |
| `maxLength` | `number` | `undefined` | Maximum character length |
| `minLength` | `number` | `undefined` | Minimum character length |
| `name` | `string` | `""` | Form field name |
| `size` | `string` | `"md"` | Input size variant |

#### Input Types
| Type | Usage | Validation |
|------|-------|------------|
| `text` | General text input | Pattern matching |
| `email` | Email addresses | Built-in email validation |
| `password` | Password fields | Toggle visibility button |
| `tel` | Phone numbers | Pattern matching |
| `url` | Web addresses | Built-in URL validation |
| `number` | Numeric input | Min/max validation |
| `search` | Search queries | Search styling |
| `date` | Date picker | Date validation |
| `time` | Time picker | Time validation |

#### Size Options
| Size | Height | Font Size | Touch Target |
|------|--------|-----------|-------------|
| `xs` | 36px | 12px | ✅ 36px |
| `sm` | 40px | 14px | ✅ 40px |
| `md` | 44px | 16px | ✅ 44px (WCAG AA) |
| `lg` | 48px | 18px | ✅ 48px |
| `xl` | 52px | 20px | ✅ 52px |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `neo-input` | `{ value }` | Fired on each keystroke |
| `neo-change` | `{ value }` | Fired when input loses focus with changed value |
| `input` | Standard event | Native input event (bubbles) |
| `change` | Standard event | Native change event (bubbles) |
| `focus` | Standard event | Input receives focus |
| `blur` | Standard event | Input loses focus |
| `invalid` | Standard event | Validation fails |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `focus()` | None | `void` | Focus the input field |
| `blur()` | None | `void` | Blur the input field |
| `reportValidity()` | None | `boolean` | Validate and show validation message |
| `checkValidity()` | None | `boolean` | Check if input is valid (no UI feedback) |

### Slots

| Slot | Description |
|------|-------------|
| `prefix` | Content before the input (icons, labels) |
| `suffix` | Content after the input (buttons, icons) |

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--input-padding` | `var(--spacing-sm)` | Internal padding |
| `--input-border-width` | `1px` | Border thickness |
| `--input-border-radius` | `var(--radius-sm)` | Corner rounding |
| `--input-border-color` | `var(--color-border)` | Default border color |
| `--input-focus-color` | `var(--color-primary)` | Focus border color |
| `--input-error-color` | `var(--color-error)` | Error state color |
| `--input-background` | `transparent` | Background color |
| `--input-font-size` | `var(--font-size-base)` | Text size |
| `--input-font-weight` | `var(--font-weight-normal)` | Text weight |
| `--input-transition` | `all 150ms ease` | State transitions |

## 📚 Usage Examples

### Basic Text Inputs

```html
<!-- Simple text input -->
<neo-input 
  type="text" 
  label="Full Name" 
  placeholder="Enter your full name">
</neo-input>

<!-- Required field with helper text -->
<neo-input 
  type="email" 
  label="Email Address" 
  placeholder="you@example.com"
  helper-text="We'll never share your email address"
  required>
</neo-input>

<!-- Input with character limit -->
<neo-input 
  type="text" 
  label="Bio" 
  placeholder="Tell us about yourself"
  max-length="160"
  helper-text="Maximum 160 characters">
</neo-input>
```

### Password Input

```html
<!-- Password field with visibility toggle -->
<neo-input 
  type="password" 
  label="Password" 
  placeholder="Enter your password"
  min-length="8"
  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
  helper-text="Minimum 8 characters with letters and numbers"
  required>
</neo-input>
```

### Validation States

```html
<!-- Input with error -->
<neo-input 
  type="email" 
  label="Email Address" 
  value="invalid-email"
  error="Please enter a valid email address">
</neo-input>

<!-- Input with custom validation -->
<neo-input 
  type="text" 
  label="Username" 
  pattern="^[a-zA-Z0-9_]{3,20}$"
  helper-text="3-20 characters, letters, numbers, and underscores only">
</neo-input>
```

### Size Variations

```html
<neo-input size="xs" label="Extra Small" placeholder="XS input"></neo-input>
<neo-input size="sm" label="Small" placeholder="Small input"></neo-input>
<neo-input size="md" label="Medium" placeholder="Medium input"></neo-input>
<neo-input size="lg" label="Large" placeholder="Large input"></neo-input>
<neo-input size="xl" label="Extra Large" placeholder="XL input"></neo-input>
```

### With Slots

```html
<!-- Input with prefix icon -->
<neo-input type="email" label="Email" placeholder="Enter email">
  <neo-icon slot="prefix" name="mail"></neo-icon>
</neo-input>

<!-- Input with suffix button -->
<neo-input type="text" label="Promo Code" placeholder="Enter code">
  <neo-button slot="suffix" variant="ghost" size="sm">Apply</neo-button>
</neo-input>

<!-- Search input with both slots -->
<neo-input type="search" placeholder="Search...">
  <neo-icon slot="prefix" name="search"></neo-icon>
  <neo-button slot="suffix" variant="ghost" size="sm" icon-only>
    <neo-icon name="close"></neo-icon>
  </neo-button>
</neo-input>
```

### Form Integration

```html
<form id="registration-form">
  <neo-input 
    name="firstName"
    type="text" 
    label="First Name" 
    placeholder="Enter your first name"
    required>
  </neo-input>
  
  <neo-input 
    name="lastName"
    type="text" 
    label="Last Name" 
    placeholder="Enter your last name"
    required>
  </neo-input>
  
  <neo-input 
    name="email"
    type="email" 
    label="Email Address" 
    placeholder="you@example.com"
    required>
  </neo-input>
  
  <neo-input 
    name="password"
    type="password" 
    label="Password" 
    min-length="8"
    required>
  </neo-input>
  
  <neo-button type="submit" variant="primary">Create Account</neo-button>
</form>
```

### Real-time Validation

```javascript
// Import component
import './src/components/atoms/input/input.js';

// Get input reference
const emailInput = document.querySelector('neo-input[name="email"]');

// Real-time validation
emailInput.addEventListener('neo-input', (event) => {
  const { value } = event.detail;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (value && !emailRegex.test(value)) {
    emailInput.error = 'Please enter a valid email address';
  } else {
    emailInput.error = '';
  }
});

// Server-side validation
emailInput.addEventListener('neo-change', async (event) => {
  const { value } = event.detail;
  
  if (value) {
    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        body: JSON.stringify({ email: value }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (!result.valid) {
        emailInput.error = result.message;
      } else {
        emailInput.error = '';
        emailInput.helperText = 'Email is available!';
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  }
});
```

## 🎨 Styling & Theming

### Custom Styling

```css
/* Customize specific input */
.custom-input {
  --input-border-radius: 12px;
  --input-padding: 16px;
  --input-border-width: 2px;
  --input-focus-color: #7c3aed;
}

/* Modern glassmorphism style */
.glass-input {
  --input-background: rgba(255, 255, 255, 0.1);
  --input-border-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
```

### State-based Styling

```css
/* Success state styling */
neo-input[data-valid="true"] {
  --input-border-color: var(--color-success);
  --input-focus-color: var(--color-success);
}

neo-input[data-valid="true"]::after {
  content: "✓";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-success);
}

/* Loading state */
neo-input[data-loading="true"] {
  position: relative;
}

neo-input[data-loading="true"]::after {
  content: "";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  border-right-color: transparent;
  animation: spin 1s linear infinite;
}
```

### Responsive Styling

```css
/* Mobile-first responsive inputs */
neo-input {
  --input-font-size: 16px; /* Prevents zoom on iOS */
}

@media (min-width: 768px) {
  neo-input {
    --input-font-size: var(--font-size-base);
    --input-padding: var(--spacing-md);
  }
}

/* Touch-friendly sizing on mobile */
@media (max-width: 640px) {
  neo-input {
    --input-padding: 12px 16px;
    min-height: 48px;
  }
}
```

## ♿ Accessibility

### Built-in Features

- **WCAG AA Compliance** - Proper contrast ratios and touch targets
- **Keyboard Navigation** - Full keyboard support with proper tab order
- **Screen Reader Support** - ARIA labels, descriptions, and error announcements
- **Focus Management** - Visible focus indicators
- **Validation Feedback** - Screen reader accessible error messages

### Accessibility Attributes

```html
<!-- Proper labeling -->
<neo-input 
  type="text" 
  label="Full Name"
  aria-describedby="name-helper"
  required>
</neo-input>
<div id="name-helper">Enter your legal first and last name</div>

<!-- Error state -->
<neo-input 
  type="email" 
  label="Email" 
  error="Invalid email format"
  aria-invalid="true"
  aria-errormessage="email-error">
</neo-input>

<!-- Required field indication -->
<neo-input 
  type="password" 
  label="Password" 
  required
  aria-required="true"
  aria-describedby="password-requirements">
</neo-input>
<div id="password-requirements" role="region" aria-label="Password requirements">
  Must contain at least 8 characters with letters and numbers
</div>
```

### Screen Reader Testing

```javascript
// Test ARIA attributes
function testAccessibility() {
  const input = document.querySelector('neo-input');
  const inputElement = input.shadowRoot.querySelector('input');
  
  // Check required ARIA attributes
  console.assert(inputElement.hasAttribute('aria-label') || 
                inputElement.hasAttribute('aria-labelledby'), 
                'Input must have accessible name');
  
  // Check error state
  if (input.error) {
    console.assert(inputElement.getAttribute('aria-invalid') === 'true',
                  'Invalid inputs must have aria-invalid');
    console.assert(inputElement.hasAttribute('aria-errormessage'),
                  'Invalid inputs must reference error message');
  }
}
```

## 🧪 Testing

### Unit Tests

```javascript
import { fixture, expect } from '@open-wc/testing';
import './input.js';

describe('NeoInput', () => {
  it('renders with default properties', async () => {
    const el = await fixture('<neo-input label="Test"></neo-input>');
    
    expect(el.type).to.equal('text');
    expect(el.size).to.equal('md');
    expect(el.disabled).to.be.false;
    expect(el.required).to.be.false;
    expect(el.value).to.equal('');
  });

  it('updates value on input', async () => {
    const el = await fixture('<neo-input></neo-input>');
    const input = el.shadowRoot.querySelector('input');
    
    input.value = 'test value';
    input.dispatchEvent(new Event('input'));
    
    expect(el.value).to.equal('test value');
  });

  it('validates required fields', async () => {
    const el = await fixture('<neo-input required></neo-input>');
    
    const isValid = el.reportValidity();
    expect(isValid).to.be.false;
    expect(el.error).to.not.be.empty;
  });

  it('shows password toggle', async () => {
    const el = await fixture('<neo-input type="password"></neo-input>');
    
    const toggle = el.shadowRoot.querySelector('.password-toggle');
    expect(toggle).to.exist;
    
    toggle.click();
    const input = el.shadowRoot.querySelector('input');
    expect(input.type).to.equal('text');
  });
});
```

### Integration Tests

```javascript
describe('Input Form Integration', () => {
  it('participates in form submission', async () => {
    const form = await fixture(`
      <form>
        <neo-input name="test" value="test-value"></neo-input>
        <button type="submit">Submit</button>
      </form>
    `);
    
    const formData = new FormData(form);
    expect(formData.get('test')).to.equal('test-value');
  });

  it('validates on form submission', async () => {
    const form = await fixture(`
      <form>
        <neo-input name="email" type="email" required></neo-input>
      </form>
    `);
    
    const input = form.querySelector('neo-input');
    input.value = 'invalid-email';
    
    const isValid = form.reportValidity();
    expect(isValid).to.be.false;
  });
});
```

### End-to-End Tests

```javascript
// Playwright E2E tests
test.describe('Input Component E2E', () => {
  test('handles user interaction', async ({ page }) => {
    await page.goto('/test/input-form.html');
    
    const input = page.locator('neo-input[name="email"]');
    
    // Type in input
    await input.fill('user@example.com');
    
    // Check value was set
    const value = await input.getAttribute('value');
    expect(value).toBe('user@example.com');
    
    // Test validation
    await input.fill('invalid-email');
    await page.keyboard.press('Tab'); // Trigger blur
    
    const error = await input.getAttribute('error');
    expect(error).toContain('invalid');
  });

  test('password visibility toggle', async ({ page }) => {
    await page.goto('/test/password-input.html');
    
    const input = page.locator('neo-input[type="password"]');
    const toggle = page.locator('.password-toggle');
    
    // Initially hidden
    const inputType = await page.locator('input').getAttribute('type');
    expect(inputType).toBe('password');
    
    // Click toggle
    await toggle.click();
    
    // Now visible
    const newInputType = await page.locator('input').getAttribute('type');
    expect(newInputType).toBe('text');
  });
});
```

## 🔧 Advanced Usage

### Custom Validation

```javascript
class CustomValidatedInput extends NeoInput {
  static get properties() {
    return {
      ...super.properties,
      asyncValidation: { type: Boolean },
      validationEndpoint: { type: String }
    };
  }

  async _validateAsync(value) {
    if (!this.asyncValidation || !this.validationEndpoint) {
      return { valid: true };
    }

    try {
      const response = await fetch(this.validationEndpoint, {
        method: 'POST',
        body: JSON.stringify({ value }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      return await response.json();
    } catch (error) {
      return { valid: false, message: 'Validation service unavailable' };
    }
  }

  async _handleChange() {
    super._handleChange();
    
    if (this.asyncValidation && this.value) {
      const result = await this._validateAsync(this.value);
      
      if (!result.valid) {
        this.error = result.message;
      } else {
        this.error = '';
      }
    }
  }
}

customElements.define('custom-validated-input', CustomValidatedInput);
```

### Input Masking

```javascript
class MaskedInput extends NeoInput {
  static get properties() {
    return {
      ...super.properties,
      mask: { type: String }
    };
  }

  _applyMask(value) {
    if (!this.mask) return value;
    
    // Simple phone mask example: (555) 555-5555
    if (this.mask === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
      
      return cleaned;
    }
    
    return value;
  }

  _handleInput(e) {
    const rawValue = e.target.value;
    const maskedValue = this._applyMask(rawValue);
    
    // Update display value
    e.target.value = maskedValue;
    this.value = maskedValue;
    
    // Dispatch events with masked value
    this.dispatchEvent(new CustomEvent('neo-input', {
      detail: { value: maskedValue, rawValue },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('masked-input', MaskedInput);
```

### Input with Suggestions

```javascript
class AutocompleteInput extends NeoInput {
  static get properties() {
    return {
      ...super.properties,
      suggestions: { type: Array },
      showSuggestions: { type: Boolean, state: true }
    };
  }

  static get styles() {
    return [
      super.styles,
      css`
        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-dropdown);
          max-height: 200px;
          overflow-y: auto;
        }
        
        .suggestion {
          padding: var(--spacing-sm);
          cursor: pointer;
          border-bottom: 1px solid var(--color-border);
        }
        
        .suggestion:hover,
        .suggestion[data-highlighted] {
          background: var(--color-primary-light);
        }
        
        .suggestion:last-child {
          border-bottom: none;
        }
      `
    ];
  }

  constructor() {
    super();
    this.suggestions = [];
    this.showSuggestions = false;
  }

  _handleInput(e) {
    super._handleInput(e);
    
    // Filter suggestions based on input
    this._filterSuggestions(e.target.value);
  }

  _filterSuggestions(value) {
    if (!value) {
      this.showSuggestions = false;
      return;
    }

    const filtered = this.suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );

    this.showSuggestions = filtered.length > 0;
    this._filteredSuggestions = filtered;
  }

  _selectSuggestion(suggestion) {
    this.value = suggestion;
    this.showSuggestions = false;
    
    this.dispatchEvent(new CustomEvent('suggestion-selected', {
      detail: { suggestion },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      ${super.render()}
      ${this.showSuggestions ? html`
        <div class="suggestions">
          ${this._filteredSuggestions.map(suggestion => html`
            <div 
              class="suggestion" 
              @click=${() => this._selectSuggestion(suggestion)}>
              ${suggestion}
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('autocomplete-input', AutocompleteInput);
```

## 📖 Related Components

- **[Button](./button.md)** - Action buttons used with inputs
- **[Label](./label.md)** - Standalone labels for inputs
- **[InputField](../molecules/input-field.md)** - Complete form field wrapper
- **[Form](../organisms/form.md)** - Complete form with input integration

## 🐛 Common Issues

### Issue: Mobile keyboard covering input

```css
/* Solution: Adjust viewport on focus */
neo-input {
  scroll-margin-bottom: 150px; /* Account for keyboard height */
}

/* Alternative: Use visual viewport API */
neo-input.focused {
  transform: translateY(-100px);
  transition: transform 0.3s ease;
}
```

### Issue: iOS zoom on focus

```css
/* Solution: Ensure 16px font size minimum */
neo-input {
  --input-font-size: 16px;
}

/* Or prevent zoom entirely */
input {
  font-size: 16px !important;
}
```

### Issue: Autofill styling conflicts

```css
/* Solution: Style autofill states */
neo-input input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 1000px var(--color-surface) inset !important;
  -webkit-text-fill-color: var(--color-text) !important;
}
```

---

**Next:** [Avatar Component](./avatar.md) | **Up:** [Atoms Overview](./README.md)