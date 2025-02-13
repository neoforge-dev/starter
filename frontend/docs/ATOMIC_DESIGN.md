# NeoForge Atomic Design System

## Overview

Our component library follows atomic design principles to create a scalable and maintainable design system. This approach breaks down interfaces into fundamental building blocks that combine to create increasingly complex components.

## Structure

### 1. Atoms (`/src/components/atoms`)
Basic building blocks of matter, applied to web interfaces. These are the smallest possible components.

- `button.js` - Core button component
- `input.js` - Basic input fields
- `badge.js` - Status and notification badges
- `spinner.js` - Loading indicators
- `checkbox.js` - Checkbox inputs
- `radio.js` - Radio button inputs
- `dropdown.js` - Basic dropdown component

Usage example:
```javascript
import { Button, Input } from '../components/atoms';
```

### 2. Molecules (`/src/components/molecules`)
Groups of atoms bonded together to form a functional component.

- `card.js` - Content containers
- `breadcrumbs.js` - Navigation aids
- `tabs.js` - Content organization
- `date-picker.js` - Date selection
- `select.js` - Enhanced selection inputs
- `phone-input.js` - Phone number input
- `language-selector.js` - Language selection

Usage example:
```javascript
import { Card, Tabs } from '../components/molecules';
```

### 3. Organisms (`/src/components/organisms`)
Complex UI components composed of groups of molecules and/or atoms.

- `modal.js` - Dialog windows
- `toast.js` - Notification system
- `data-table.js` - Data display and manipulation
- `file-upload.js` - File handling
- `rich-text-editor.js` - Text editing
- `charts.js` - Data visualization
- `form.js` - Form handling
- `pagination.js` - Page navigation

Usage example:
```javascript
import { Modal, DataTable } from '../components/organisms';
```

### 4. Templates (`/src/components/templates`)
Page-level objects that place components into a layout.

- Grid systems
- Container layouts
- Page structures
- Section layouts

### 5. Pages (`/src/components/pages`)
Specific instances of templates with real content.

## Design Tokens

Our design system uses a comprehensive token system for consistent styling:

```javascript
import { colors, typography, spacing } from '../components/tokens/design-tokens';
```

### Available Token Categories:
- Colors
- Typography
- Spacing
- Animation
- Elevation
- Breakpoints
- Border Radius
- Z-Index

## Component Patterns

### Composition Pattern
```javascript
class MyComponent extends LitElement {
  static styles = css\`
    :host {
      display: block;
      padding: var(--component-padding);
    }
  \`;

  static properties = {
    variant: { type: String },
    disabled: { type: Boolean }
  };
}
```

### Event Handling Pattern
```javascript
handleEvent() {
  this.dispatchEvent(new CustomEvent('my-event', {
    detail: { /* event data */ },
    bubbles: true,
    composed: true
  }));
}
```

## Best Practices

1. **Component Creation**
   - Keep components focused and single-purpose
   - Use composition over inheritance
   - Follow the Single Responsibility Principle

2. **State Management**
   - Use properties for component state
   - Implement reactive updates
   - Keep state changes predictable

3. **Styling**
   - Use design tokens for consistency
   - Implement CSS custom properties
   - Follow BEM naming convention

4. **Accessibility**
   - Include ARIA attributes
   - Support keyboard navigation
   - Maintain proper contrast ratios

## Testing Strategy

1. **Unit Tests**
   - Test component properties
   - Verify event handling
   - Check state changes

2. **Integration Tests**
   - Test component interactions
   - Verify data flow
   - Check layout composition

3. **Visual Tests**
   - Component appearance
   - Responsive behavior
   - Theme variations

## Development Workflow

1. Start with atoms
2. Compose molecules
3. Build organisms
4. Create templates
5. Implement pages

## Contributing

1. Follow the atomic design principles
2. Use existing design tokens
3. Include documentation
4. Add appropriate tests
5. Update storybook examples 