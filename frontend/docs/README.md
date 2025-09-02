# NeoForge Component Library Documentation

> **Production-ready** web components built with Lit 4.0, following Atomic Design principles for modern web applications.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Lit](https://img.shields.io/badge/Built%20with-Lit-324fff.svg)](https://lit.dev/)
[![Web Components](https://img.shields.io/badge/Web%20Components-Standards-orange.svg)](https://www.webcomponents.org/)
[![No Build Required](https://img.shields.io/badge/No%20Build-Required-brightgreen.svg)](https://nobuild.dev)

## 🚀 Quick Start

Get up and running with NeoForge components in under 5 minutes:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My NeoForge App</title>
  
  <!-- Import global styles -->
  <link rel="stylesheet" href="./src/styles/global.css">
</head>
<body>
  <!-- Import and use components -->
  <script type="module" src="./src/components/atoms/button/button.js"></script>
  <script type="module" src="./src/components/molecules/input-field/input-field.js"></script>
  
  <!-- Ready to use -->
  <neo-button variant="primary" size="lg">Get Started</neo-button>
  <neo-input-field label="Your Email" type="email" required></neo-input-field>
</body>
</html>
```

**That's it!** No build step, no complex configuration - just import and use.

## 📚 Documentation Overview

### 🏗️ Core Concepts
- **[Getting Started](./getting-started.md)** - Installation, setup, and first steps
- **[Design System](./design-system.md)** - Tokens, themes, and visual language
- **[Migration Guide](./migration-guide.md)** - Upgrading from legacy components
- **[Accessibility](./accessibility.md)** - WCAG compliance and testing

### 🧱 Component Reference

#### **Atoms** (15+ components)
Basic building blocks that form the foundation of all interfaces.

| Component | Description | Status |
|-----------|-------------|--------|
| [Button](./components/atoms/button.md) | Interactive buttons with variants | ✅ Ready |
| [Input](./components/atoms/input.md) | Text inputs with validation | ✅ Ready |
| [Avatar](./components/atoms/avatar.md) | User profile images | ✅ Ready |
| [Badge](./components/atoms/badge.md) | Status indicators | ✅ Ready |
| [Checkbox](./components/atoms/checkbox.md) | Selection controls | ✅ Ready |
| [Switch](./components/atoms/switch.md) | Toggle controls | ✅ Ready |
| [Icon](./components/atoms/icon.md) | SVG icon system | ✅ Ready |
| [Label](./components/atoms/label.md) | Form labels | ✅ Ready |
| [Progress](./components/atoms/progress.md) | Progress indicators | ✅ Ready |
| [Skeleton](./components/atoms/skeleton.md) | Loading placeholders | ✅ Ready |
| [Slider](./components/atoms/slider.md) | Range inputs | ✅ Ready |
| [TextArea](./components/atoms/textarea.md) | Multi-line text input | ✅ Ready |

#### **Molecules** (7+ components)  
Simple combinations of atoms for common UI patterns.

| Component | Description | Status |
|-----------|-------------|--------|
| [InputField](./components/molecules/input-field.md) | Complete form fields | ✅ Ready |
| [SearchBar](./components/molecules/search-bar.md) | Global search interface | ✅ Ready |
| [Modal](./components/molecules/modal.md) | Dialog and overlay system | ✅ Ready |
| [Alert](./components/molecules/alert.md) | Status messages | ✅ Ready |
| [Card](./components/molecules/card.md) | Content containers | ✅ Ready |
| [NavigationLink](./components/molecules/navigation-link.md) | Navigation items | ✅ Ready |
| [UserProfileSummary](./components/molecules/user-profile-summary.md) | User display widget | ✅ Ready |

#### **Organisms** (5+ components)
Complex combinations for complete interface sections.

| Component | Description | Status |
|-----------|-------------|--------|
| [DashboardLayout](./components/organisms/dashboard-layout.md) | Application shell | ✅ Ready |
| [DataTable](./components/organisms/data-table.md) | Advanced data tables | ✅ Ready |
| [NotificationList](./components/organisms/notification-list.md) | Notification center | ✅ Ready |
| [FormBuilder](./components/organisms/form-builder.md) | Dynamic form generator | ✅ Ready |
| [DataGrid](./components/organisms/data-grid.md) | Grid layouts for data | ✅ Ready |

### 🎯 Developer Guides

#### **Integration Patterns**
- **[Forms](./guides/forms.md)** - Building forms with validation
- **[Tables & Data](./guides/tables.md)** - Data display and manipulation
- **[Theming](./guides/theming.md)** - Customization and branding
- **[Performance](./guides/performance.md)** - Optimization best practices

#### **Advanced Topics**
- **[Testing Components](./guides/testing.md)** - Unit and integration testing
- **[Authentication Patterns](./guides/authentication.md)** - Login flows and guards
- **[State Management](./guides/state-management.md)** - Component communication
- **[Deployment](./guides/deployment.md)** - Production optimization

### 📋 Real-World Examples

#### **Complete Applications**
- **[Dashboard App](./examples/dashboard-app/)** - Admin dashboard with all components
- **[Authentication Flow](./examples/auth-flow/)** - Complete login/register system
- **[Data Management](./examples/data-management/)** - CRUD operations interface
- **[E-commerce Checkout](./examples/ecommerce-checkout/)** - Multi-step form process

#### **Component Playgrounds**
- **[Interactive Storybook](../src/playground/index.html)** - Live component testing
- **[Design System Showcase](./examples/design-system-demo/)** - Visual token reference
- **[Accessibility Testing](./examples/accessibility-demo/)** - A11y validation tools

## ✨ Key Features

### 🚫 **No Build Required**
- **Pure ES6 Modules** - Run directly in modern browsers
- **Source Mapping** - Debug your actual source code
- **Fast Development** - No compilation step needed

### ♿ **Accessibility First**
- **WCAG AA Compliant** - 4.5:1 contrast ratios minimum
- **Keyboard Navigation** - Full keyboard support throughout
- **Screen Reader Support** - Proper ARIA implementation
- **Touch Targets** - 44px minimum touch areas

### 🎨 **Design System**
- **Consistent Tokens** - Spacing, colors, typography
- **Themeable** - CSS custom properties throughout  
- **Responsive** - Mobile-first, adaptive layouts
- **Dark Mode Ready** - Full theme switching support

### 🏗️ **Developer Experience**
- **TypeScript Definitions** - Full type safety support
- **Rich Documentation** - Every prop, event, and method
- **Live Examples** - Interactive component playground
- **Testing Utilities** - Pre-built test helpers

### 📦 **Performance Optimized**
- **Tree Shakeable** - Import only what you need
- **Lightweight** - <2KB per component average  
- **Lazy Loading** - Load components on demand
- **Browser Caching** - Optimized for HTTP/2

## 🔄 Migration Path

### From Legacy HTML/CSS
```html
<!-- Before -->
<div class="form-group">
  <label for="email">Email</label>
  <input type="email" id="email" class="form-control">
  <div class="invalid-feedback">Invalid email</div>
</div>

<!-- After -->
<neo-input-field 
  label="Email" 
  type="email" 
  error="Invalid email">
</neo-input-field>
```

### From Other Component Libraries
```javascript
// Framework agnostic - works everywhere
import './src/components/atoms/button/button.js';

// React
<neo-button onClick={handleClick}>Click me</neo-button>

// Vue
<neo-button @click="handleClick">Click me</neo-button>

// Angular
<neo-button (click)="handleClick()">Click me</neo-button>

// Vanilla JS
document.querySelector('neo-button').addEventListener('click', handleClick);
```

## 📊 Browser Support

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 88+ | ✅ Full Support | All features |
| Firefox | 78+ | ✅ Full Support | All features |
| Safari | 14+ | ✅ Full Support | All features |  
| Edge | 88+ | ✅ Full Support | All features |
| Opera | 74+ | ✅ Full Support | All features |

**Legacy Support**: For older browsers, include the [Web Components polyfills](https://github.com/webcomponents/polyfills).

## 🤝 Contributing

We welcome contributions! Please see our:

- **[Contributing Guide](../CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](../CODE_OF_CONDUCT.md)** - Community guidelines  
- **[Development Setup](./guides/development.md)** - Local environment setup

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Ready to get started?** → [Installation Guide](./getting-started.md)

**Need help?** → [Community Support](./guides/support.md)

**Found a bug?** → [Report Issue](https://github.com/neoforge/issues)