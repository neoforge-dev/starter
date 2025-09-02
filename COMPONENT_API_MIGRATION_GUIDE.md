# Component API Migration Guide

## Overview

This guide helps developers migrate from the old component APIs to the new standardized APIs. All changes are designed to be backward compatible where possible, with clear migration paths for breaking changes.

## Key Changes Summary

### 1. BaseComponent Migration
All components now extend `BaseComponent` instead of `LitElement` directly, providing:
- Tenant awareness and multi-tenancy support  
- Enhanced lifecycle management
- Common utilities and helper methods
- Improved error handling and debugging

### 2. Standardized Size Properties
All components now use consistent size values: `xs | sm | md | lg | xl`

### 3. Event Naming Convention
All custom events follow the pattern: `neo-{component}-{action}`

### 4. CSS Custom Properties
Removed component-specific CSS custom properties in favor of design system tokens

## Component-Specific Migration

### Badge Component

#### Breaking Changes

##### Size Property Values
**Old:**
```html
<neo-badge size="small">Small Badge</neo-badge>
<neo-badge size="medium">Medium Badge</neo-badge>  
<neo-badge size="large">Large Badge</neo-badge>
```

**New:**
```html
<neo-badge size="sm">Small Badge</neo-badge>
<neo-badge size="md">Medium Badge</neo-badge>
<neo-badge size="lg">Large Badge</neo-badge>

<!-- New size options available -->
<neo-badge size="xs">Extra Small</neo-badge>
<neo-badge size="xl">Extra Large</neo-badge>
```

**Migration Script:**
```javascript
// Update size attributes in HTML
document.querySelectorAll('neo-badge[size="small"]').forEach(el => {
  el.setAttribute('size', 'sm');
});

document.querySelectorAll('neo-badge[size="medium"]').forEach(el => {
  el.setAttribute('size', 'md');
});

document.querySelectorAll('neo-badge[size="large"]').forEach(el => {
  el.setAttribute('size', 'lg');
});
```

##### Event Naming
**Old:**
```javascript
badge.addEventListener('remove', (e) => {
  console.log('Badge removed');
});
```

**New:**
```javascript
badge.addEventListener('neo-badge-remove', (e) => {
  console.log('Badge removed:', e.detail.badge);
});
```

##### CSS Custom Properties Removed
**Old:**
```css
neo-badge {
  --badge-padding: 0.5rem 1rem;
  --badge-radius: 8px;
  --badge-bg-color: #007bff;
  --badge-text-color: white;
}
```

**New:**
```css
/* Use standard design tokens instead */
neo-badge {
  /* Padding and radius are now controlled by size property */
  /* Use variant property for colors */
}

/* For custom colors, use CSS custom properties on design tokens */
:root {
  --color-primary: #007bff; /* This affects primary variant */
}
```

### Input Component

#### New Features (Backward Compatible)

##### Size Property Added
**New:**
```html
<neo-input size="xs" placeholder="Extra small input">
<neo-input size="sm" placeholder="Small input">
<neo-input size="md" placeholder="Medium input (default)">
<neo-input size="lg" placeholder="Large input">
<neo-input size="xl" placeholder="Extra large input">
```

**No Migration Required:** Existing inputs without size attribute will default to `md`.

### Card Component

#### New Features (Backward Compatible)

##### Size Property Added
**New:**
```html
<neo-card size="xs">Compact card</neo-card>
<neo-card size="sm">Small card</neo-card>
<neo-card size="md">Default card</neo-card>
<neo-card size="lg">Large card</neo-card>
<neo-card size="xl">Extra large card</neo-card>
```

##### Enhanced Event Handling
**New:**
```javascript
card.addEventListener('neo-card-click', (e) => {
  console.log('Card clicked:', e.detail.card);
  console.log('Original event:', e.detail.originalEvent);
});
```

**Legacy Support:** The `padding` property is still supported but deprecated in favor of `size`.

### Button Component

#### Enhanced Features (Backward Compatible)

##### Extended Size Range
**Old:**
```html
<neo-button size="sm">Small</neo-button>
<neo-button size="md">Medium</neo-button>
<neo-button size="lg">Large</neo-button>
```

**New (Additional Options):**
```html
<neo-button size="xs">Extra Small</neo-button>
<neo-button size="sm">Small</neo-button>
<neo-button size="md">Medium</neo-button>
<neo-button size="lg">Large</neo-button>
<neo-button size="xl">Extra Large</neo-button>
```

**No Migration Required:** Existing buttons will continue to work.

### Search Bar Component

#### No Breaking Changes
The search bar component already followed the new conventions and requires no migration.

## TypeScript Integration

### New Type Definitions Available

```typescript
import type {
  ComponentSize,
  ButtonProps,
  InputProps,
  BadgeProps,
  CardProps,
  NeoInputEvent,
  NeoBadgeRemoveEvent
} from './src/types/component-interfaces';

// Type-safe component usage
const buttonProps: ButtonProps = {
  size: 'lg',
  variant: 'primary',
  disabled: false
};

// Type-safe event handling
const handleBadgeRemove = (event: NeoBadgeRemoveEvent) => {
  console.log('Badge removed:', event.detail.badge);
};
```

## Migration Timeline

### Phase 1: Immediate (Backward Compatible)
- ✅ All components now extend BaseComponent
- ✅ New size variants (`xs`, `xl`) available
- ✅ TypeScript interfaces available
- ✅ Enhanced event details provided

### Phase 2: Deprecation Period (6 months)
- ⚠️ Badge `small/medium/large` size values deprecated (still work)
- ⚠️ Badge `remove` event deprecated (still works)
- ⚠️ Custom CSS properties on Badge deprecated (still work)

### Phase 3: Breaking Changes (After 6 months)
- 🚨 Old Badge size values will be removed
- 🚨 Old Badge event name will be removed
- 🚨 Custom CSS properties will be removed

## Automated Migration Tools

### Size Property Migration Script

```javascript
/**
 * Migrate badge size attributes from old to new values
 */
function migrateBadgeSizes() {
  const sizeMap = {
    'small': 'sm',
    'medium': 'md', 
    'large': 'lg'
  };
  
  Object.entries(sizeMap).forEach(([oldSize, newSize]) => {
    document.querySelectorAll(`neo-badge[size="${oldSize}"]`).forEach(el => {
      el.setAttribute('size', newSize);
      console.log(`Migrated badge size: ${oldSize} → ${newSize}`);
    });
  });
}

/**
 * Update event listeners from old to new event names
 */
function migrateBadgeEvents() {
  document.querySelectorAll('neo-badge[removable]').forEach(badge => {
    // Check if using old event listener
    const oldListeners = badge._listeners?.remove;
    if (oldListeners) {
      // Migrate to new event
      badge.addEventListener('neo-badge-remove', oldListeners);
      console.log('Migrated badge event listener');
    }
  });
}

// Run migration
migrateBadgeSizes();
migrateBadgeEvents();
```

### CSS Migration Script

```javascript
/**
 * Identify usage of deprecated CSS custom properties
 */
function auditCustomProperties() {
  const deprecatedProps = [
    '--badge-padding',
    '--badge-radius', 
    '--badge-font-size',
    '--badge-bg-color',
    '--badge-text-color'
  ];
  
  const stylesheets = Array.from(document.styleSheets);
  const issues = [];
  
  stylesheets.forEach(sheet => {
    try {
      Array.from(sheet.cssRules).forEach(rule => {
        if (rule.style) {
          deprecatedProps.forEach(prop => {
            if (rule.style.getPropertyValue(prop)) {
              issues.push({
                property: prop,
                rule: rule.cssText
              });
            }
          });
        }
      });
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  });
  
  if (issues.length > 0) {
    console.warn('Deprecated CSS properties found:', issues);
  }
  
  return issues;
}

auditCustomProperties();
```

## Testing Migration

### Component Tests to Update

```javascript
// Old test
test('badge removes when clicked', () => {
  const badge = document.createElement('neo-badge');
  badge.removable = true;
  
  let removeEvent = null;
  badge.addEventListener('remove', (e) => {
    removeEvent = e;
  });
  
  badge.shadowRoot.querySelector('.close-button').click();
  expect(removeEvent).toBeTruthy();
});

// New test
test('badge removes when clicked', () => {
  const badge = document.createElement('neo-badge');
  badge.removable = true;
  
  let removeEvent = null;
  badge.addEventListener('neo-badge-remove', (e) => {
    removeEvent = e;
  });
  
  badge.shadowRoot.querySelector('.close-button').click();
  expect(removeEvent).toBeTruthy();
  expect(removeEvent.detail.badge).toBe(badge);
});
```

## FAQ

### Q: Will my existing components break?
**A:** No, all changes are backward compatible during the deprecation period. Your existing code will continue to work with deprecation warnings.

### Q: How long do I have to migrate?
**A:** 6 months deprecation period before breaking changes are introduced.

### Q: What if I'm using custom CSS properties on badges?
**A:** They will continue to work during the deprecation period. Migrate to using design system tokens and the variant property.

### Q: How do I know if I'm using deprecated features?
**A:** Run the migration audit scripts provided above. The browser console will also show deprecation warnings.

### Q: Can I opt into the new APIs immediately?
**A:** Yes! All new APIs are available immediately. You can start using them right away.

### Q: What about performance impact?
**A:** BaseComponent adds minimal overhead (~1KB) but provides significant benefits. Performance should be equivalent or better.

## Support

For migration support:
1. Check the API Consistency Report for detailed technical information
2. Review the TypeScript interfaces for type safety
3. Use the provided migration scripts
4. Test thoroughly in a development environment first

## Examples

### Complete Badge Migration Example

**Before:**
```html
<neo-badge 
  size="small" 
  removable
  style="--badge-bg-color: #28a745; --badge-text-color: white;">
  Success
</neo-badge>

<script>
badge.addEventListener('remove', () => {
  console.log('Badge removed');
});
</script>
```

**After:**
```html
<neo-badge 
  size="sm" 
  variant="success"
  removable>
  Success
</neo-badge>

<script>
badge.addEventListener('neo-badge-remove', (e) => {
  console.log('Badge removed:', e.detail.badge);
});
</script>
```

This migration provides better semantics, improved type safety, and enhanced functionality while maintaining consistency across the component library.