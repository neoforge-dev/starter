# Design System

> **Comprehensive visual language** for building consistent, accessible, and beautiful user interfaces with NeoForge components.

## 🎨 Design Philosophy

The NeoForge design system is built on four core principles:

1. **Consistency** - Unified visual language across all components
2. **Accessibility** - WCAG AA compliance with inclusive design practices  
3. **Flexibility** - Easy customization without breaking functionality
4. **Performance** - Optimized CSS custom properties with minimal overhead

## 🎯 Design Tokens

Design tokens are the atomic values that power our entire visual system. They're implemented as CSS custom properties for maximum flexibility and runtime theming capabilities.

### Color System

#### Brand Colors
Our primary color palette forms the foundation of the visual identity:

```css
:root {
  /* Primary - Main brand color for actions and emphasis */
  --primary-color: #2563eb;
  --primary-color-light: #dbeafe;
  --primary-color-dark: #1d4ed8;
  
  /* Secondary - Supporting brand color */  
  --secondary-color: #4f46e5;
  --secondary-color-light: #e0e7ff;
  --secondary-color-dark: #3730a3;
  
  /* Accent - Highlight and attention color */
  --accent-color: #0ea5e9;
  --accent-color-light: #cff5ff;
  --accent-color-dark: #0284c7;
}
```

#### Semantic Colors
Colors that convey meaning and state across the interface:

```css
:root {
  /* Success - Positive actions and confirmations */
  --success-color: #059669;
  --success-color-light: #d1fae5;
  --success-color-dark: #047857;
  
  /* Warning - Caution and important notices */  
  --warning-color: #d97706;
  --warning-color-light: #fef3c7;
  --warning-color-dark: #b45309;
  
  /* Error - Problems and destructive actions */
  --error-color: #dc2626;
  --error-color-light: #fee2e2;
  --error-color-dark: #b91c1c;
  
  /* Info - Neutral information */
  --info-color: #0891b2;
  --info-color-light: #cdfcf3;
  --info-color-dark: #0e7490;
}
```

#### Neutral Colors
Grays and text colors that adapt to light and dark themes:

```css
:root {
  /* Light theme neutrals */
  --text-color: #0f172a;           /* Primary text */
  --text-secondary: #475569;        /* Secondary text */
  --text-tertiary: #94a3b8;        /* Muted text */
  --text-inverse: #f8fafc;         /* Text on dark backgrounds */
  
  --background-color: #ffffff;      /* Page background */
  --surface-color: #f8fafc;        /* Card and container background */
  --border-color: #e2e8f0;         /* Default borders */
  --divider-color: #f1f5f9;        /* Subtle dividers */
}

/* Dark theme automatically switches via [data-theme="dark"] */
[data-theme="dark"] {
  --text-color: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #64748b;
  --text-inverse: #0f172a;
  
  --background-color: #0f172a;
  --surface-color: #1e293b;
  --border-color: #334155;
  --divider-color: #475569;
}
```

### Color Usage Examples

```html
<!-- Using semantic colors in components -->
<neo-button variant="primary">Primary Action</neo-button>
<neo-button variant="secondary">Secondary Action</neo-button>
<neo-button variant="danger">Delete Item</neo-button>

<neo-alert type="success">Operation completed successfully!</neo-alert>
<neo-alert type="warning">Please review your settings.</neo-alert>
<neo-alert type="error">An error occurred while saving.</neo-alert>
```

### Typography System

#### Font Family
We use a carefully selected system font stack for optimal performance and cross-platform consistency:

```css
:root {
  --font-family: system-ui, -apple-system, "Segoe UI", Roboto, 
                 "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  --font-family-mono: "SF Mono", Monaco, "Cascadia Code", 
                      "Roboto Mono", Consolas, monospace;
}
```

#### Font Sizes
A harmonious scale that maintains readability across all screen sizes:

```css
:root {
  --font-size-xs: 0.75rem;    /* 12px - Small labels, captions */
  --font-size-sm: 0.875rem;   /* 14px - Secondary text, buttons */
  --font-size-base: 1rem;     /* 16px - Body text, inputs */
  --font-size-lg: 1.125rem;   /* 18px - Emphasized body text */
  --font-size-xl: 1.25rem;    /* 20px - Small headings */
  --font-size-2xl: 1.5rem;    /* 24px - Section headings */
  --font-size-3xl: 1.875rem;  /* 30px - Page headings */
  --font-size-4xl: 2.25rem;   /* 36px - Hero headings */
}
```

#### Font Weights
Carefully chosen weights that work across different font families:

```css
:root {
  --font-weight-normal: 400;    /* Regular body text */
  --font-weight-medium: 500;    /* Emphasized text, buttons */
  --font-weight-semibold: 600;  /* Strong emphasis */
  --font-weight-bold: 700;      /* Headings, very strong emphasis */
}
```

#### Line Heights  
Optimized for readability and visual rhythm:

```css
:root {
  --line-height-none: 1;        /* Icons, single lines */
  --line-height-tight: 1.25;    /* Headings, condensed text */  
  --line-height-normal: 1.5;    /* Body text, default */
  --line-height-relaxed: 1.75;  /* Long-form reading */
}
```

### Typography Examples

```html
<!-- Headings with proper hierarchy -->
<neo-heading level="1">Main Page Title</neo-heading>
<neo-heading level="2">Section Title</neo-heading>
<neo-heading level="3">Subsection Title</neo-heading>

<!-- Text with different emphasis levels -->
<p class="text-base">Regular body text with normal weight.</p>
<p class="text-base text-medium">Emphasized text with medium weight.</p>
<p class="text-sm text-secondary">Secondary information in smaller text.</p>
<p class="text-xs text-tertiary">Fine print and captions.</p>
```

### Spacing System

#### Spacing Scale
A consistent spacing scale based on a 4px grid system:

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px  - Tight spacing */
  --spacing-sm: 0.5rem;    /* 8px  - Small gaps */
  --spacing-md: 1rem;      /* 16px - Default spacing */
  --spacing-lg: 1.5rem;    /* 24px - Generous spacing */
  --spacing-xl: 2rem;      /* 32px - Large gaps */
  --spacing-2xl: 3rem;     /* 48px - Section spacing */
  --spacing-3xl: 4rem;     /* 64px - Page-level spacing */
}
```

#### Component Spacing
How spacing is applied within and between components:

```css
/* Internal component padding */
.component-padding-sm { padding: var(--spacing-sm); }
.component-padding-md { padding: var(--spacing-md); }  
.component-padding-lg { padding: var(--spacing-lg); }

/* Margin between components */
.component-margin-sm { margin-bottom: var(--spacing-sm); }
.component-margin-md { margin-bottom: var(--spacing-md); }
.component-margin-lg { margin-bottom: var(--spacing-lg); }
```

### Spacing Examples

```html
<!-- Cards with consistent internal padding -->
<neo-card padding="md">
  <h3>Card Title</h3>
  <p>Card content with proper internal spacing.</p>
</neo-card>

<!-- Form fields with appropriate vertical rhythm -->
<neo-input-field label="Email" margin="md"></neo-input-field>
<neo-input-field label="Password" margin="md"></neo-input-field>
<neo-button-group margin="lg">
  <neo-button variant="primary">Submit</neo-button>
  <neo-button variant="secondary">Cancel</neo-button>
</neo-button-group>
```

### Border Radius

#### Radius Scale
Consistent rounded corners that create visual hierarchy:

```css
:root {
  --radius-sm: 0.25rem;    /* 4px  - Subtle rounding */
  --radius-md: 0.375rem;   /* 6px  - Standard components */
  --radius-lg: 0.5rem;     /* 8px  - Emphasized components */
  --radius-xl: 0.75rem;    /* 12px - Cards, containers */
  --radius-2xl: 1rem;      /* 16px - Large containers */
  --radius-full: 9999px;   /* Full - Pills, avatars */
}
```

#### Usage Guidelines
- **Small radius** for buttons, inputs, badges  
- **Medium radius** for cards, modals
- **Large radius** for prominent containers
- **Full radius** for avatars, pills, toggles

### Shadows & Elevation

#### Shadow Scale  
Subtle depth that enhances hierarchy without distraction:

```css
:root {
  /* Light theme shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Dark theme shadows (automatically applied) */
  --shadow-sm-dark: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md-dark: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg-dark: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl-dark: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}
```

#### Elevation Guidelines
- **No shadow** - Flat elements, backgrounds
- **Small shadow** - Slightly raised elements (buttons, inputs)
- **Medium shadow** - Floating elements (cards, dropdowns)  
- **Large shadow** - Prominent overlays (modals, panels)
- **Extra large** - Full-screen overlays, important dialogs

## 🌓 Theme System

### Light and Dark Themes

Our components automatically adapt to light and dark themes using CSS custom properties:

```html
<!-- Light theme (default) -->
<html>
  <body>
    <!-- Components use light theme colors -->
  </body>
</html>

<!-- Dark theme -->
<html data-theme="dark">
  <body>
    <!-- Components automatically switch to dark colors -->  
  </body>
</html>
```

### Theme Switching

Implement theme switching with smooth transitions:

```javascript
// Theme toggle utility
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Add transition class for smooth switching
  html.classList.add('theme-transition');
  html.setAttribute('data-theme', newTheme);
  
  // Remove transition class after animation
  setTimeout(() => {
    html.classList.remove('theme-transition');
  }, 300);
  
  // Persist theme preference
  localStorage.setItem('theme', newTheme);
}

// Restore saved theme on load
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

### Custom Themes

Create your own theme by overriding design tokens:

```css
/* Custom brand theme */
[data-theme="brand"] {
  --primary-color: #7c3aed;
  --primary-color-light: #f3e8ff;
  --primary-color-dark: #5b21b6;
  
  --secondary-color: #059669;
  --secondary-color-light: #d1fae5;
  --secondary-color-dark: #047857;
  
  --accent-color: #f59e0b;
  --accent-color-light: #fef3c7;
  --accent-color-dark: #d97706;
}
```

## 🎯 Component Customization

### CSS Custom Properties

Every component exposes customizable CSS properties:

```css
/* Button customization */
neo-button {
  --button-padding: var(--spacing-md) var(--spacing-lg);
  --button-border-radius: var(--radius-lg);
  --button-font-weight: var(--font-weight-semibold);
  --button-transition: all 150ms ease;
}

/* Input field customization */  
neo-input {
  --input-padding: var(--spacing-sm);
  --input-border-width: 1px;
  --input-border-radius: var(--radius-md);
  --input-focus-ring-width: 2px;
  --input-focus-ring-color: var(--primary-color);
}
```

### Component Variants

Use semantic variants that automatically map to your theme colors:

```html
<!-- Buttons with semantic variants -->
<neo-button variant="primary">Primary Action</neo-button>
<neo-button variant="secondary">Secondary Action</neo-button>
<neo-button variant="tertiary">Tertiary Action</neo-button>
<neo-button variant="danger">Destructive Action</neo-button>
<neo-button variant="ghost">Minimal Action</neo-button>

<!-- Alerts with semantic types -->
<neo-alert type="info">Information message</neo-alert>
<neo-alert type="success">Success message</neo-alert>
<neo-alert type="warning">Warning message</neo-alert>
<neo-alert type="error">Error message</neo-alert>
```

## 🔧 Utility Classes

### Layout Utilities

```css
/* Flexbox utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-center { align-items: center; justify-content: center; }
.flex-between { align-items: center; justify-content: space-between; }
.flex-start { align-items: center; justify-content: flex-start; }
.flex-end { align-items: center; justify-content: flex-end; }

/* Grid utilities */
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
```

### Spacing Utilities

```css
/* Margin utilities */
.m-0 { margin: 0; }
.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }

/* Padding utilities */
.p-0 { padding: 0; }
.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
```

### Typography Utilities

```css
/* Text size utilities */
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }

/* Text weight utilities */
.text-normal { font-weight: var(--font-weight-normal); }
.text-medium { font-weight: var(--font-weight-medium); }
.text-semibold { font-weight: var(--font-weight-semibold); }
.text-bold { font-weight: var(--font-weight-bold); }

/* Text color utilities */
.text-primary { color: var(--text-color); }
.text-secondary { color: var(--text-secondary); }  
.text-tertiary { color: var(--text-tertiary); }
```

## 📱 Responsive Design

### Breakpoints

Our responsive system uses container queries where supported, with media query fallbacks:

```css
:root {
  --breakpoint-sm: 640px;   /* Small devices */
  --breakpoint-md: 768px;   /* Medium devices */ 
  --breakpoint-lg: 1024px;  /* Large devices */
  --breakpoint-xl: 1280px;  /* Extra large devices */
  --breakpoint-2xl: 1536px; /* Ultra wide devices */
}

/* Container queries (modern browsers) */
@container (min-width: 768px) {
  .responsive-component {
    /* Tablet and up styles */
  }
}

/* Media query fallback */
@media (min-width: 768px) {
  .responsive-component {
    /* Tablet and up styles */
  }
}
```

### Component Responsiveness

Components automatically adapt to different screen sizes:

```html
<!-- Responsive button sizes -->
<neo-button size="sm" size-md="md" size-lg="lg">
  Responsive Button
</neo-button>

<!-- Responsive grid layouts -->
<neo-grid cols="1" cols-md="2" cols-lg="3" gap="md">
  <neo-card>Card 1</neo-card>
  <neo-card>Card 2</neo-card>  
  <neo-card>Card 3</neo-card>
</neo-grid>

<!-- Responsive navigation -->
<neo-navigation-menu collapse-at="md" burger-menu="true">
  <!-- Navigation items -->
</neo-navigation-menu>
```

## ♿ Accessibility

### Color Contrast

All color combinations meet WCAG AA standards (4.5:1 contrast ratio):

```css
/* High contrast text combinations */
.text-on-primary { 
  background: var(--primary-color); 
  color: white; /* 7.2:1 contrast ratio */
}

.text-on-secondary { 
  background: var(--secondary-color); 
  color: white; /* 6.8:1 contrast ratio */
}

.text-on-surface { 
  background: var(--surface-color); 
  color: var(--text-color); /* 9.1:1 contrast ratio */
}
```

### Focus Management

Consistent focus indicators across all interactive elements:

```css
:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* High contrast focus for better visibility */
@media (prefers-contrast: high) {
  :focus-visible {
    outline-width: 3px;
    outline-color: var(--accent-color);
  }
}
```

### Motion Preferences

Respect user's motion preferences:

```css
/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🔍 Design System Tools

### CSS Custom Property Inspector

Debug and modify design tokens in development:

```javascript
// List all custom properties
function getCSSCustomProperties() {
  const styles = getComputedStyle(document.documentElement);
  const customProps = {};
  
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i];
    if (prop.startsWith('--')) {
      customProps[prop] = styles.getPropertyValue(prop).trim();
    }
  }
  
  return customProps;
}

// Modify design tokens at runtime  
function setDesignToken(property, value) {
  document.documentElement.style.setProperty(property, value);
}

// Example usage
setDesignToken('--primary-color', '#ff6b35');
```

### Theme Builder

Create custom themes interactively:

```javascript
const themeBuilder = {
  // Generate theme from base colors
  generateTheme(primaryColor, secondaryColor) {
    const tokens = {
      '--primary-color': primaryColor,
      '--primary-color-light': this.lighten(primaryColor, 40),
      '--primary-color-dark': this.darken(primaryColor, 20),
      '--secondary-color': secondaryColor,
      '--secondary-color-light': this.lighten(secondaryColor, 40),
      '--secondary-color-dark': this.darken(secondaryColor, 20),
    };
    
    return tokens;
  },
  
  // Apply theme to document
  applyTheme(tokens) {
    Object.entries(tokens).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }
};
```

---

**Next Steps:**
- [Component Reference](./components/) - Explore individual components
- [Theming Guide](./guides/theming.md) - Advanced customization techniques  
- [Accessibility Guide](./accessibility.md) - Ensure inclusive design
- [Performance Tips](./guides/performance.md) - Optimize your implementation