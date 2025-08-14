# Accessibility Testing Guide

## Quick Start Testing

### 1. Run Automated Tests
```bash
# Test all components
npm run test:a11y:components

# Test full pages
npm run test:a11y

# Full audit
npm run test:a11y:audit
```

### 2. Manual Keyboard Testing
1. **Tab Navigation**: Use Tab to navigate through all interactive elements
2. **Enter/Space**: Activate buttons and links
3. **Arrow Keys**: Navigate within lists, menus, and complex widgets
4. **Escape**: Close dialogs, dropdowns, and cancel operations

### 3. Screen Reader Testing
- **Windows**: Download NVDA (free)
- **macOS**: Use VoiceOver (built-in, Cmd+F5)
- **Chrome**: Use ChromeVox extension

### 4. Color/Contrast Testing
- Use browser DevTools Lighthouse audit
- Install axe DevTools extension
- Test with high contrast mode enabled

## Common Issues and Fixes

### Touch Targets Too Small
```css
/* Fix: Ensure minimum 44px */
.button {
  min-width: 44px;
  min-height: 44px;
}
```

### Missing ARIA Labels
```html
<!-- Fix: Add descriptive labels -->
<button aria-label="Close dialog">×</button>
<input aria-label="Search" placeholder="Search...">
```

### Poor Color Contrast
```css
/* Fix: Use high-contrast colors */
.text {
  color: #111827; /* 16.75:1 contrast */
  background: #ffffff;
}
```

### Missing Focus Indicators
```css
/* Fix: Add visible focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Testing Checklist

- [ ] All tests pass: `npm run test:a11y`
- [ ] Keyboard navigation works
- [ ] Screen reader announces content properly
- [ ] Touch targets are 44px minimum
- [ ] Color contrast meets 4.5:1 ratio
- [ ] No accessibility violations in axe-core
- [ ] Focus management works in modals
- [ ] Error messages are announced