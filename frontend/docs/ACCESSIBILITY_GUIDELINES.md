# Accessibility Guidelines for NeoForge Frontend

This document provides comprehensive accessibility guidelines for developing WCAG 2.1 AA compliant components in the NeoForge frontend application.

## Table of Contents

1. [Overview](#overview)
2. [WCAG 2.1 AA Requirements](#wcag-21-aa-requirements)
3. [Component Development Guidelines](#component-development-guidelines)
4. [Testing Requirements](#testing-requirements)
5. [Common Patterns](#common-patterns)
6. [Automated Testing](#automated-testing)
7. [Manual Testing Checklist](#manual-testing-checklist)
8. [Resources](#resources)

## Overview

Accessibility is not optional—it's a requirement for all components and features in NeoForge. We follow WCAG 2.1 AA standards to ensure our application is usable by everyone, including users with disabilities.

### Key Principles

1. **Perceivable**: Information must be presentable in ways users can perceive
2. **Operable**: Interface components must be operable
3. **Understandable**: Information and UI operation must be understandable
4. **Robust**: Content must be robust enough to be interpreted by various assistive technologies

## WCAG 2.1 AA Requirements

### Color Contrast Requirements

- **Text**: Minimum 4.5:1 contrast ratio for normal text
- **Large Text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **Non-text Elements**: Minimum 3:1 for graphics and UI components

Our color system ensures compliance:

```css
/* WCAG AA compliant colors */
--color-primary: #1d4ed8; /* 4.61:1 contrast on white */
--color-text: #111827; /* 16.75:1 contrast on white */
--color-text-secondary: #374151; /* 10.59:1 contrast on white */
--color-error: #dc2626; /* 5.74:1 contrast on white */
```

### Touch Target Requirements

- **Minimum Size**: 44x44 pixels for all interactive elements
- **Spacing**: Adequate spacing between touch targets
- **Mobile Optimization**: Larger targets on smaller screens

### Keyboard Navigation Requirements

- All interactive elements must be keyboard accessible
- Visible focus indicators required
- Logical tab order
- No keyboard traps (except modals with proper focus management)

## Component Development Guidelines

### Required Accessibility Features for All Components

#### 1. Semantic HTML
```html
<!-- Good: Use semantic elements -->
<button type="button">Submit</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>

<!-- Bad: Non-semantic with just styling -->
<div class="button">Submit</div>
<div class="nav">...</div>
```

#### 2. ARIA Labels and Roles
```html
<!-- Required ARIA attributes -->
<button aria-label="Close dialog" aria-describedby="help-text">
  ×
</button>
<div id="help-text">This will close the dialog</div>

<!-- Form controls -->
<input
  id="email"
  type="email"
  aria-label="Email address"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
>
<div id="email-error" role="alert">Please enter a valid email</div>
```

#### 3. Focus Management
```javascript
// Modal focus trap implementation
_trapFocus() {
  this._previousActiveElement = document.activeElement;
  this.updateComplete.then(() => {
    const focusableElements = this._getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  });
}

_restoreFocus() {
  if (this._previousActiveElement?.focus) {
    this._previousActiveElement.focus();
  }
}
```

#### 4. Touch Target Sizing
```css
/* Ensure minimum 44px touch targets */
.interactive-element {
  min-width: 44px;
  min-height: 44px;
  /* Adequate padding for smaller visual elements */
  padding: 8px;
}
```

### Component-Specific Guidelines

#### Buttons
```javascript
// Required properties and implementation
class NeoButton extends BaseComponent {
  static get styles() {
    return css`
      button {
        min-height: 44px; /* WCAG AA requirement */
        min-width: 44px;
        cursor: pointer;
      }

      button:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }
    `;
  }

  render() {
    return html`
      <button
        type="${this.type}"
        ?disabled="${this.disabled}"
        aria-label="${this.ariaLabel || this.label}"
        aria-describedby="${this.describedBy}"
        @click="${this._handleClick}"
        @keydown="${this._handleKeydown}"
      >
        ${this.label}
      </button>
    `;
  }
}
```

#### Form Controls
```javascript
// Required accessibility features for inputs
class NeoInput extends LitElement {
  render() {
    return html`
      <div class="input-group">
        <label for="${this._id}">${this.label}</label>
        <input
          id="${this._id}"
          type="${this.type}"
          .value="${this.value}"
          ?required="${this.required}"
          ?disabled="${this.disabled}"
          aria-label="${this.ariaLabel || this.label}"
          aria-required="${this.required}"
          aria-invalid="${this.hasError}"
          aria-describedby="${this.describedBy}"
          style="min-height: 44px;"
        >
        ${this.error ? html`
          <div id="${this._id}-error" role="alert">${this.error}</div>
        ` : ''}
        ${this.helperText ? html`
          <div id="${this._id}-help">${this.helperText}</div>
        ` : ''}
      </div>
    `;
  }
}
```

#### Modals and Dialogs
```javascript
// Complete accessible modal implementation
class NeoModal extends LitElement {
  render() {
    return html`
      <div
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        @click="${this._handleOverlayClick}"
      >
        <div class="modal-content">
          <h2 id="modal-title">${this.title}</h2>
          <div id="modal-description">
            <slot></slot>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            @click="${this.close}"
            style="min-width: 44px; min-height: 44px;"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    `;
  }
}
```

## Testing Requirements

### Automated Testing with axe-core

Every component must pass automated accessibility tests:

```javascript
// Component accessibility test
import { testComponentAccessibility } from '../test/accessibility/axe-utils.js';

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const element = await fixture(html`
      <neo-button variant="primary">Submit</neo-button>
    `);

    const results = await testComponentAccessibility(element);
    expect(results.hasViolations).toBe(false);
  });

  it('should meet touch target requirements', async () => {
    const element = await fixture(html`
      <neo-button size="sm">Small Button</neo-button>
    `);

    const results = await testComponentAccessibility(element);
    const touchTargetViolations = results.customChecks.touchTargets;
    expect(touchTargetViolations.length).toBe(0);
  });
});
```

### CI/CD Integration

Our GitHub Actions workflow automatically tests accessibility:

```yaml
# .github/workflows/accessibility.yml
- name: Run accessibility tests
  run: npm run test:a11y

- name: Run component accessibility tests
  run: npm run test:a11y:components
```

## Common Patterns

### Focus Trap for Modals
```javascript
import { KeyboardNavigationMixin } from '../mixins/keyboard-navigation.js';

class AccessibleModal extends KeyboardNavigationMixin(LitElement) {
  _handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
    super._handleKeydown(event);
  }
}
```

### Keyboard Navigation for Lists
```javascript
import { MenuNavigationMixin } from '../mixins/keyboard-navigation.js';

class AccessibleList extends MenuNavigationMixin(LitElement) {
  // Arrow key navigation is automatically handled
  // Override for custom behavior
  _selectCurrentItem() {
    super._selectCurrentItem();
    // Custom selection logic
  }
}
```

### Screen Reader Announcements
```javascript
// Announce dynamic changes to screen readers
_announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

### Accessible Form Validation
```javascript
// Provide accessible error feedback
_showError(message) {
  this.error = message;
  this.setAttribute('aria-invalid', 'true');

  // Announce error to screen readers
  this._announceToScreenReader(`Error: ${message}`);

  // Focus the input for correction
  this.focus();
}

_clearError() {
  this.error = '';
  this.setAttribute('aria-invalid', 'false');
}
```

## Manual Testing Checklist

### Keyboard Testing
- [ ] All interactive elements are reachable with Tab
- [ ] Tab order is logical and intuitive
- [ ] All actions available with mouse are available with keyboard
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys navigate within lists/menus

### Screen Reader Testing
- [ ] All content is announced properly
- [ ] Form labels are associated correctly
- [ ] Error messages are announced
- [ ] Loading states are announced
- [ ] Dynamic content changes are announced

### Color and Contrast Testing
- [ ] All text meets contrast requirements
- [ ] Color is not the only way to convey information
- [ ] Interface works in high contrast mode
- [ ] Focus indicators are visible

### Touch/Mobile Testing
- [ ] All touch targets are at least 44px
- [ ] Interface works with zoom up to 200%
- [ ] No horizontal scrolling at 320px width
- [ ] Touch targets have adequate spacing

## Automated Testing Setup

### Running Tests

```bash
# Run all accessibility tests
npm run test:a11y

# Run component-level tests
npm run test:a11y:components

# Run full page audit
npm run test:a11y:audit

# Run tests in CI mode
npm run test:a11y -- --ci
```

### Test Configuration

Our accessibility tests use multiple tools:

- **axe-core**: Automated WCAG testing
- **@axe-core/playwright**: Browser-based testing
- **Custom validators**: Touch targets, color contrast
- **Keyboard navigation tests**: Focus management

### Reporting

Test results are automatically:
- Uploaded as CI artifacts
- Included in PR comments for failures
- Tracked for regression testing

## Best Practices Summary

### DO
✅ Use semantic HTML elements
✅ Provide alternative text for images
✅ Ensure 4.5:1 color contrast for text
✅ Make all functionality keyboard accessible
✅ Use 44px minimum touch targets
✅ Provide clear focus indicators
✅ Test with screen readers
✅ Include accessibility in code reviews

### DON'T
❌ Rely only on color to convey information
❌ Remove focus outlines without replacement
❌ Use placeholder text as labels
❌ Create keyboard traps
❌ Use very light gray text (poor contrast)
❌ Make tiny touch targets
❌ Forget to test with assistive technology
❌ Add accessibility as an afterthought

## Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluator
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Accessibility audit
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/) - Color testing

### Documentation
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/AA/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/) - Comprehensive accessibility resource

### Screen Readers for Testing
- **NVDA** (Windows) - Free screen reader
- **JAWS** (Windows) - Popular commercial screen reader
- **VoiceOver** (macOS/iOS) - Built-in screen reader
- **TalkBack** (Android) - Built-in screen reader

## Getting Help

If you need help with accessibility:

1. Check this documentation first
2. Review existing accessible components for patterns
3. Use the provided mixins and utilities
4. Test early and often with automated tools
5. Ask for accessibility review in PRs
6. Consider user testing with people who use assistive technology

Remember: Accessibility is everyone's responsibility, and it's much easier to build it in from the start than to retrofit it later.
