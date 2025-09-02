# Input Field Component

> **Complete form field** combining label, input, validation, and help text into a cohesive, accessible form control.

## 🚀 Quick Start

```html
<script type="module" src="./src/components/molecules/input-field/input-field.js"></script>

<neo-input-field 
  label="Email Address" 
  type="email" 
  placeholder="Enter your email"
  help-text="We'll never share your email"
  required>
</neo-input-field>
```

## 📋 API Reference

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `""` | Field label text |
| `type` | `string` | `"text"` | Input type (text, email, password, etc.) |
| `value` | `string` | `""` | Input value |
| `placeholder` | `string` | `""` | Input placeholder text |
| `helpText` | `string` | `""` | Help text shown below input |
| `error` | `string` | `""` | Error message (shows error state when present) |
| `required` | `boolean` | `false` | Whether field is required |
| `disabled` | `boolean` | `false` | Whether field is disabled |
| `name` | `string` | `""` | Form field name |
| `autocomplete` | `string` | `""` | HTML autocomplete attribute |
| `maxLength` | `number` | `null` | Maximum input length |
| `minLength` | `number` | `null` | Minimum input length |
| `pattern` | `string` | `""` | Validation pattern (regex) |
| `size` | `string` | `"md"` | Field size variant |

#### Size Options
| Size | Usage | Label Size | Input Height |
|------|-------|------------|-------------|
| `sm` | Compact forms | Small | 36px |
| `md` | Standard forms | Medium | 44px |
| `lg` | Prominent forms | Large | 48px |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `neo-input` | `{ value, name, validity }` | Fired when input value changes |
| `neo-focus` | `{ name }` | Fired when input gains focus |
| `neo-blur` | `{ name, value, validity }` | Fired when input loses focus |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `validate()` | None | `boolean` | Validate field and return if valid |
| `focus()` | None | `void` | Focus the input element |
| `clear()` | None | `void` | Clear field value and error |

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--field-gap` | `var(--spacing-xs)` | Spacing between field elements |
| `--label-color` | `var(--color-text)` | Label text color |
| `--help-text-color` | `var(--color-text-light)` | Help text color |
| `--error-text-color` | `var(--color-error)` | Error text color |
| `--error-border-color` | `var(--color-error)` | Input border color in error state |

## 📚 Usage Examples

### Basic Form Fields

```html
<!-- Standard text input -->
<neo-input-field 
  label="Full Name" 
  type="text" 
  placeholder="Enter your full name"
  required>
</neo-input-field>

<!-- Email with validation -->
<neo-input-field 
  label="Email Address" 
  type="email" 
  placeholder="you@example.com"
  help-text="We'll use this to send you updates"
  required>
</neo-input-field>

<!-- Password with requirements -->
<neo-input-field 
  label="Password" 
  type="password" 
  help-text="Minimum 8 characters with letters and numbers"
  min-length="8"
  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
  required>
</neo-input-field>
```

### Validation States

```html
<!-- Field with error -->
<neo-input-field 
  label="Email Address" 
  type="email" 
  value="invalid-email"
  error="Please enter a valid email address">
</neo-input-field>

<!-- Field with custom validation -->
<neo-input-field 
  label="Username" 
  type="text" 
  pattern="^[a-zA-Z0-9_]{3,20}$"
  help-text="3-20 characters, letters, numbers, and underscores only">
</neo-input-field>
```

### Size Variations

```html
<neo-input-field size="sm" label="Small Field" placeholder="Small input"></neo-input-field>
<neo-input-field size="md" label="Medium Field" placeholder="Medium input"></neo-input-field>
<neo-input-field size="lg" label="Large Field" placeholder="Large input"></neo-input-field>
```

### Complete Registration Form

```html
<form id="registration-form" class="registration-form">
  <neo-input-field 
    name="firstName"
    label="First Name" 
    type="text" 
    placeholder="Enter your first name"
    autocomplete="given-name"
    required>
  </neo-input-field>
  
  <neo-input-field 
    name="lastName"
    label="Last Name" 
    type="text" 
    placeholder="Enter your last name"
    autocomplete="family-name"
    required>
  </neo-input-field>
  
  <neo-input-field 
    name="email"
    label="Email Address" 
    type="email" 
    placeholder="you@example.com"
    help-text="We'll use this for account verification"
    autocomplete="email"
    required>
  </neo-input-field>
  
  <neo-input-field 
    name="password"
    label="Password" 
    type="password" 
    help-text="Minimum 8 characters with letters and numbers"
    min-length="8"
    pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$"
    autocomplete="new-password"
    required>
  </neo-input-field>
  
  <neo-input-field 
    name="confirmPassword"
    label="Confirm Password" 
    type="password" 
    placeholder="Re-enter your password"
    autocomplete="new-password"
    required>
  </neo-input-field>
  
  <div class="form-actions">
    <neo-button type="submit" variant="primary" size="lg" full-width>
      Create Account
    </neo-button>
  </div>
</form>

<style>
.registration-form {
  max-width: 400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-actions {
  margin-top: var(--spacing-md);
}
</style>
```

### Dynamic Form Validation

```javascript
// Import component
import './src/components/molecules/input-field/input-field.js';

class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.fields = this.form.querySelectorAll('neo-input-field');
    this.setupValidation();
  }

  setupValidation() {
    this.fields.forEach(field => {
      // Real-time validation on input
      field.addEventListener('neo-input', (e) => {
        this.validateField(field, e.detail.value);
      });

      // Validation on blur
      field.addEventListener('neo-blur', (e) => {
        this.validateField(field, e.detail.value);
      });
    });

    // Form submission validation
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.validateForm();
    });
  }

  async validateField(field, value) {
    const { name, type } = field;

    // Clear previous errors
    field.error = '';

    // Custom validation rules
    const validators = {
      email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
        async: true,
        asyncValidator: this.validateEmailUnique.bind(this)
      },
      password: {
        minLength: 8,
        pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        message: 'Password must contain at least 8 characters with letters and numbers'
      },
      confirmPassword: {
        match: 'password',
        message: 'Passwords do not match'
      }
    };

    const validator = validators[name] || validators[type];
    
    if (validator && value) {
      // Pattern validation
      if (validator.pattern && !validator.pattern.test(value)) {
        field.error = validator.message;
        return false;
      }

      // Length validation
      if (validator.minLength && value.length < validator.minLength) {
        field.error = `Minimum ${validator.minLength} characters required`;
        return false;
      }

      // Match validation (for confirm password)
      if (validator.match) {
        const matchField = this.form.querySelector(`neo-input-field[name="${validator.match}"]`);
        if (matchField && value !== matchField.value) {
          field.error = validator.message;
          return false;
        }
      }

      // Async validation
      if (validator.async && validator.asyncValidator) {
        try {
          const result = await validator.asyncValidator(value);
          if (!result.valid) {
            field.error = result.message;
            return false;
          }
        } catch (error) {
          field.error = 'Validation failed. Please try again.';
          return false;
        }
      }
    }

    return true;
  }

  async validateEmailUnique(email) {
    // Simulate API call
    const response = await fetch('/api/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    return {
      valid: result.available,
      message: result.available ? '' : 'This email is already registered'
    };
  }

  async validateForm() {
    const validations = Array.from(this.fields).map(field => 
      this.validateField(field, field.value)
    );

    const results = await Promise.all(validations);
    const isValid = results.every(Boolean);

    if (isValid) {
      // Collect form data
      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData);

      try {
        await this.submitForm(data);
        this.showSuccess('Account created successfully!');
      } catch (error) {
        this.showError('Failed to create account. Please try again.');
      }
    } else {
      // Focus first invalid field
      const firstInvalidField = Array.from(this.fields).find(field => field.error);
      if (firstInvalidField) {
        firstInvalidField.focus();
      }
    }
  }

  async submitForm(data) {
    const response = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  }

  showSuccess(message) {
    // Show success notification
    console.log('Success:', message);
  }

  showError(message) {
    // Show error notification
    console.error('Error:', message);
  }
}

// Initialize form validation
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');
  if (form) {
    new FormValidator(form);
  }
});
```

## 🎨 Styling & Theming

### Custom Field Styling

```css
/* Customize field appearance */
.custom-field {
  --field-gap: var(--spacing-sm);
  --label-color: var(--color-primary);
  --help-text-color: var(--color-text-secondary);
}

/* Error state customization */
.custom-field[error] {
  --error-text-color: #dc2626;
  --error-border-color: #dc2626;
}

/* Focus state styling */
.custom-field[focused] {
  --label-color: var(--color-accent);
}
```

### Form Layout Patterns

```css
/* Single column form */
.form-single-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  max-width: 400px;
}

/* Two column form */
.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg) var(--spacing-md);
}

.form-two-column .form-field-full {
  grid-column: 1 / -1;
}

/* Responsive form */
.form-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

@media (max-width: 640px) {
  .form-responsive {
    grid-template-columns: 1fr;
  }
}
```

### Field Group Styling

```css
/* Field group with border */
.field-group {
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.field-group h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

.field-group neo-input-field {
  margin-bottom: var(--spacing-md);
}

.field-group neo-input-field:last-child {
  margin-bottom: 0;
}
```

## ♿ Accessibility

### Built-in Accessibility Features

- **Proper Labeling** - Labels are correctly associated with inputs
- **Error Announcements** - Error messages are announced to screen readers
- **Focus Management** - Logical tab order and focus indicators
- **ARIA Attributes** - Proper `aria-invalid`, `aria-describedby` usage
- **Semantic HTML** - Uses proper form semantics

### Accessibility Best Practices

```html
<!-- Proper field grouping -->
<fieldset>
  <legend>Personal Information</legend>
  
  <neo-input-field 
    label="First Name" 
    type="text" 
    required
    autocomplete="given-name">
  </neo-input-field>
  
  <neo-input-field 
    label="Last Name" 
    type="text" 
    required
    autocomplete="family-name">
  </neo-input-field>
</fieldset>

<!-- Error handling with proper announcements -->
<neo-input-field 
  label="Email Address" 
  type="email" 
  error="Please enter a valid email address"
  aria-live="polite"
  role="alert">
</neo-input-field>
```

### Keyboard Navigation Testing

```javascript
// Test keyboard navigation
function testKeyboardNavigation() {
  const fields = document.querySelectorAll('neo-input-field');
  
  fields.forEach((field, index) => {
    // Tab should move to next field
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        const nextField = fields[index + 1];
        if (nextField) {
          setTimeout(() => {
            console.assert(
              document.activeElement === nextField.shadowRoot.querySelector('neo-input'),
              'Tab navigation failed'
            );
          }, 0);
        }
      }
    });
  });
}
```

## 🧪 Testing

### Unit Tests

```javascript
import { fixture, expect } from '@open-wc/testing';
import './input-field.js';

describe('NeoInputField', () => {
  it('renders with all parts', async () => {
    const el = await fixture(`
      <neo-input-field 
        label="Test Field" 
        help-text="Test help">
      </neo-input-field>
    `);
    
    const label = el.shadowRoot.querySelector('neo-label');
    const input = el.shadowRoot.querySelector('neo-input');
    const helpText = el.shadowRoot.querySelector('.help-text');
    
    expect(label).to.exist;
    expect(input).to.exist;
    expect(helpText).to.exist;
    expect(helpText.textContent).to.equal('Test help');
  });

  it('shows error state correctly', async () => {
    const el = await fixture(`
      <neo-input-field 
        label="Test Field" 
        error="Test error">
      </neo-input-field>
    `);
    
    expect(el.hasAttribute('error')).to.be.true;
    
    const errorText = el.shadowRoot.querySelector('.error-text');
    expect(errorText).to.exist;
    expect(errorText.textContent.trim()).to.equal('Test error');
  });

  it('validates input correctly', async () => {
    const el = await fixture(`
      <neo-input-field 
        label="Email" 
        type="email" 
        required>
      </neo-input-field>
    `);
    
    // Test with invalid email
    el.value = 'invalid-email';
    const isValid = el.validate();
    
    expect(isValid).to.be.false;
    expect(el.error).to.not.be.empty;
  });

  it('handles focus and blur events', async () => {
    const el = await fixture('<neo-input-field label="Test"></neo-input-field>');
    
    let focusTriggered = false;
    let blurTriggered = false;
    
    el.addEventListener('neo-focus', () => focusTriggered = true);
    el.addEventListener('neo-blur', () => blurTriggered = true);
    
    const input = el.shadowRoot.querySelector('neo-input');
    
    // Simulate focus
    input.dispatchEvent(new Event('focus'));
    expect(focusTriggered).to.be.true;
    expect(el.hasAttribute('focused')).to.be.true;
    
    // Simulate blur
    input.dispatchEvent(new Event('blur'));
    expect(blurTriggered).to.be.true;
    expect(el.hasAttribute('focused')).to.be.false;
  });
});
```

### Integration Tests

```javascript
describe('InputField Form Integration', () => {
  it('works in form submission', async () => {
    const form = await fixture(`
      <form>
        <neo-input-field name="email" value="test@example.com"></neo-input-field>
        <neo-input-field name="password" value="password123"></neo-input-field>
      </form>
    `);
    
    const formData = new FormData(form);
    expect(formData.get('email')).to.equal('test@example.com');
    expect(formData.get('password')).to.equal('password123');
  });

  it('prevents invalid form submission', async () => {
    const form = await fixture(`
      <form>
        <neo-input-field name="email" type="email" required></neo-input-field>
        <button type="submit">Submit</button>
      </form>
    `);
    
    const field = form.querySelector('neo-input-field');
    field.value = 'invalid-email';
    
    const isValid = field.validate();
    expect(isValid).to.be.false;
    
    // Form should not submit
    const isFormValid = form.reportValidity();
    expect(isFormValid).to.be.false;
  });
});
```

## 🔧 Advanced Usage

### Custom Field Validation

```javascript
class CustomInputField extends NeoInputField {
  static get properties() {
    return {
      ...super.properties,
      customValidator: { type: Function },
      asyncValidation: { type: Boolean }
    };
  }

  async _validateInput() {
    // Run standard validation first
    super._validateInput();
    
    // Run custom validation if no standard errors
    if (!this.error && this.customValidator && typeof this.customValidator === 'function') {
      try {
        const result = await this.customValidator(this.value, this);
        
        if (!result.valid) {
          this.error = result.message;
        }
      } catch (error) {
        this.error = 'Validation failed';
        console.error('Custom validation error:', error);
      }
    }
  }

  // Override input handler to support async validation
  async _handleBlur(e) {
    super._handleBlur(e);
    
    if (this.asyncValidation) {
      await this._validateInput();
    }
  }
}

customElements.define('custom-input-field', CustomInputField);

// Usage with custom validator
const field = document.querySelector('custom-input-field');
field.customValidator = async (value, field) => {
  if (field.name === 'username') {
    const response = await fetch(`/api/check-username/${value}`);
    const result = await response.json();
    
    return {
      valid: result.available,
      message: result.available ? '' : 'Username is not available'
    };
  }
  
  return { valid: true };
};
```

### Field Factory Pattern

```javascript
class FieldFactory {
  static createField(config) {
    const field = document.createElement('neo-input-field');
    
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'validator') {
        field.addEventListener('neo-blur', value);
      } else if (typeof value === 'boolean') {
        if (value) field.setAttribute(key, '');
      } else {
        field.setAttribute(key, value);
      }
    });
    
    return field;
  }

  static createForm(fields, options = {}) {
    const form = document.createElement('form');
    
    if (options.className) {
      form.className = options.className;
    }

    fields.forEach(fieldConfig => {
      const field = this.createField(fieldConfig);
      form.appendChild(field);
    });

    if (options.submitButton) {
      const button = document.createElement('neo-button');
      button.type = 'submit';
      button.variant = options.submitButton.variant || 'primary';
      button.textContent = options.submitButton.text || 'Submit';
      form.appendChild(button);
    }

    return form;
  }
}

// Usage
const registrationForm = FieldFactory.createForm([
  { label: 'First Name', name: 'firstName', type: 'text', required: true },
  { label: 'Last Name', name: 'lastName', type: 'text', required: true },
  { label: 'Email', name: 'email', type: 'email', required: true },
  { label: 'Password', name: 'password', type: 'password', required: true }
], {
  className: 'registration-form',
  submitButton: { text: 'Create Account', variant: 'primary' }
});

document.body.appendChild(registrationForm);
```

## 📖 Related Components

- **[Input](../atoms/input.md)** - Base input component used internally
- **[Label](../atoms/label.md)** - Label component used for field labels
- **[Button](../atoms/button.md)** - Buttons used in forms with input fields
- **[Form](../organisms/form.md)** - Complete form component that uses input fields

## 🐛 Common Issues

### Issue: Label not properly associated with input

```html
<!-- Problem: Missing association -->
<neo-input-field label="Email">
  <!-- Internal label-input association may fail -->
</neo-input-field>

<!-- Solution: Ensure proper ID generation -->
<neo-input-field 
  label="Email" 
  id="email-field">
  <!-- Component handles internal ID generation -->
</neo-input-field>
```

### Issue: Form data not submitted

```javascript
// Problem: Input field value not captured in FormData
const form = document.querySelector('form');
const formData = new FormData(form); // May be empty

// Solution: Ensure name attribute is set
const fields = form.querySelectorAll('neo-input-field');
fields.forEach(field => {
  if (!field.name) {
    console.warn('Input field missing name attribute:', field);
  }
});
```

### Issue: Validation not working properly

```javascript
// Problem: Custom validation not triggering
field.addEventListener('input', () => {
  // This won't work - use neo-input instead
});

// Solution: Use component-specific events
field.addEventListener('neo-input', (e) => {
  const { value, validity } = e.detail;
  // Custom validation here
});
```

---

**Next:** [Search Bar Component](./search-bar.md) | **Up:** [Molecules Overview](./README.md)