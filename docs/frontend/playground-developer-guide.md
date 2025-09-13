# Playground Developer Guide

This guide provides comprehensive information for developers working with the NeoForge Component Playground, a powerful tool for creating, testing, and generating Web Components.

## 🎪 Overview

The NeoForge Playground is an interactive development environment that allows developers to:

- **Explore Components**: Browse and test all available Web Components
- **Generate Components**: Create new components using guided wizards
- **Design System Integration**: Switch themes and customize design tokens
- **Performance Testing**: Validate component performance and accessibility
- **Code Generation**: Export components for use in production applications

## 🚀 Getting Started

### Accessing the Playground

The playground is available at two endpoints:

```bash
# Main application with playground integration
http://localhost:3000/advanced-playground.html

# Dedicated playground server (recommended for development)
http://localhost:3001/advanced-playground.html
```

### Starting the Playground

```bash
# Start main development server
cd frontend && bun run dev

# Start dedicated playground server (recommended)
cd frontend && bun run playground
```

### Development Commands

```bash
# Build playground for production
bun run playground:build

# Run playground tests
bun vitest run src/test/playground/

# Test specific playground components
bun vitest run src/test/playground/design-system-panel.test.js
```

## 🏗️ Architecture

### Core Components

#### 1. Design System Panel (`design-system-panel.js`)

**Purpose**: Theme management and design token editing

**Key Methods**:
- `setActiveTab(tab)` - Switch between themes, tokens, and export tabs
- `close()` - Close the design system panel
- Theme switching via `themeManager.applyTheme(themeId)`

**Usage**:
```javascript
// Open design system panel
const panel = document.querySelector('design-system-panel');
panel.isOpen = true;

// Switch to tokens tab
panel.setActiveTab('tokens');

// Apply a theme
panel.dispatchEvent(new CustomEvent('theme-apply', { 
  detail: { themeId: 'dark' } 
}));
```

#### 2. Component Generator Modal (`component-generator-modal.js`)

**Purpose**: Interactive component creation wizard

**Key Methods**:
- `open()` - Open the generator modal
- `close()` - Close the generator modal
- `nextStep()` - Advance to next step in wizard
- `updateConfig(field, value)` - Update component configuration
- `generateComponent()` - Generate the component files

**Usage**:
```javascript
// Open component generator
const modal = document.querySelector('component-generator-modal');
modal.open();

// Configure component
modal.updateConfig('name', 'MyButton');
modal.updateConfig('category', 'atoms');
modal.updateConfig('description', 'A custom button component');

// Generate the component
modal.generateComponent();
```

### Module Structure

```
src/playground/
├── components/           # Playground-specific components
│   ├── design-system-panel.js
│   ├── component-generator-modal.js
│   └── deployment-validation-ui.js
├── core/                # Core playground functionality
│   ├── component-loader.js
│   ├── prop-editor.js
│   ├── smart-search.js
│   └── performance-optimizer.js
├── tools/               # Development tools
│   ├── component-generator.js
│   ├── performance-validator.js
│   └── deployment-validator.js
├── styles/              # Playground-specific styles
└── templates/           # Code generation templates
```

## 🛠️ Development Workflow

### 1. Component Development

```bash
# 1. Start playground
bun run playground

# 2. Open component generator
# Navigate to http://localhost:3001/advanced-playground.html
# Click "🧩 Generate" button

# 3. Configure your component
# - Name: my-awesome-component
# - Category: atoms/molecules/organisms
# - Description: Component purpose
# - Features: slots, events, styling options

# 4. Generate and test
# The component files will be created and can be tested immediately
```

### 2. Testing Components

```bash
# Test individual components
bun vitest run src/test/components/atoms/my-component.test.js

# Test playground integration
bun vitest run src/test/playground/

# Run performance tests
bun run test:perf
```

### 3. Theme Development

```bash
# 1. Open design system panel in playground
# Click "⚙️ Props" button or use keyboard shortcut 'D'

# 2. Switch to themes tab
# Browse available themes: light, dark, high-contrast

# 3. Customize tokens
# Switch to tokens tab to modify:
# - Colors: --colors-primary, --colors-background
# - Spacing: --spacing-1 through --spacing-12  
# - Typography: --typography-fontSizes-*
# - Borders: --borderRadius-*, --borderWidth-*

# 4. Export custom theme
# Switch to export tab to download theme file
```

## 🔧 Configuration

### Vite Configuration

The playground uses a dedicated Vite configuration (`vite.config.playground.js`):

```javascript
export default defineConfig({
  root: "./src/playground",
  publicDir: "../public", 
  server: {
    port: 3001,
    open: "/advanced-playground.html",
  },
  resolve: {
    alias: {
      "@": pathResolve(__dirname, "src"),
      "/components": pathResolve(__dirname, "src/playground/components"),
    },
  },
});
```

### Import Resolution

The playground supports multiple import patterns:

```javascript
// Absolute imports (recommended for playground)
import '/src/components/atoms/button.js';
import '/src/playground/core/component-loader.js';

// Alias imports
import '@/components/atoms/button.js';
import '/components/design-system-panel.js';

// Relative imports (for internal playground modules)
import './core/prop-editor.js';
import '../components/theme/theme-manager.js';
```

## 🎨 Customization

### Adding New Components to Playground

1. **Create Component Files**:
   ```bash
   # Generate via playground or create manually
   src/components/atoms/my-component.js
   src/components/atoms/my-component.stories.js  
   src/test/components/atoms/my-component.test.js
   ```

2. **Register with Component Loader**:
   ```javascript
   // In component-loader.js
   const components = {
     'my-component': () => import('../../components/atoms/my-component.js'),
     // ... other components
   };
   ```

3. **Add to Navigation**:
   The component will automatically appear in the playground sidebar if it follows the naming convention and has proper metadata.

### Custom Templates

Create custom component templates in `src/playground/templates/`:

```javascript
// custom-button.template.js
export const customButtonTemplate = {
  name: 'Custom Button',
  category: 'atoms',
  files: {
    'component.js': ({ name, props }) => `
      import { LitElement, html, css } from 'lit';
      
      export class ${name} extends LitElement {
        static properties = {
          ${props.map(p => `${p}: { type: String }`).join(',\n          ')}
        };
        
        render() {
          return html\`<button><slot></slot></button>\`;
        }
      }
      
      customElements.define('${name.toLowerCase()}', ${name});
    `,
    'test.js': ({ name }) => `
      import { fixture, expect } from '@open-wc/testing';
      import './${name.toLowerCase()}.js';
      
      describe('${name}', () => {
        it('should render', async () => {
          const element = await fixture('<${name.toLowerCase()}></${name.toLowerCase()}>');
          expect(element).to.exist;
        });
      });
    `
  }
};
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Import Resolution Errors

**Problem**: `Failed to resolve import "./components/..."`

**Solution**: 
- Use absolute paths: `/src/components/...`
- Check alias configuration in `vite.config.playground.js`
- Ensure files exist at the specified paths

#### 2. Component Not Loading

**Problem**: Component doesn't appear in playground sidebar

**Solution**:
- Verify component is properly exported
- Check component registration in `component-loader.js`
- Ensure component follows naming conventions
- Check browser console for import errors

#### 3. Theme Changes Not Applied

**Problem**: Design token changes don't reflect in components

**Solution**:
- Refresh playground after theme changes
- Check CSS custom property names match design tokens
- Verify theme manager is properly initialized
- Clear browser cache if needed

#### 4. Performance Issues

**Problem**: Playground loading slowly or freezing

**Solution**:
- Check for infinite loops in component render methods
- Reduce data set size for testing
- Use performance profiler to identify bottlenecks
- Consider lazy loading for large component sets

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// In browser console
window.PLAYGROUND_DEBUG = true;

// Or set in localStorage
localStorage.setItem('playground-debug', 'true');
```

## 📊 Performance Optimization

### Component Testing

The playground includes performance testing tools:

```javascript
// Performance validation
const validator = document.querySelector('#performance-validator');
validator.validateComponent('my-component', {
  iterations: 100,
  scenarios: ['render', 'update', 'destroy']
});
```

### Best Practices

1. **Lazy Loading**: Use dynamic imports for components
2. **Memoization**: Cache expensive calculations
3. **Virtual Scrolling**: For large component lists
4. **Debounced Updates**: For real-time property editing

## 🧪 Testing

### Running Tests

```bash
# All playground tests
bun vitest run src/test/playground/

# Specific component tests  
bun vitest run src/test/playground/design-system-panel.test.js

# Watch mode for development
bun vitest watch src/test/playground/

# Coverage reports
bun vitest run --coverage src/test/playground/
```

### Writing Tests

Example test structure:

```javascript
import { fixture, expect, elementUpdated } from '@open-wc/testing';
import { html } from 'lit';
import '../../playground/components/my-component.js';

describe('MyComponent', () => {
  let element;

  beforeEach(async () => {
    element = await fixture(html`<my-component></my-component>`);
  });

  it('should initialize with default properties', () => {
    expect(element.property).to.equal('default-value');
  });

  it('should respond to property changes', async () => {
    element.property = 'new-value';
    await elementUpdated(element);
    
    expect(element.property).to.equal('new-value');
  });
});
```

## 🔗 Integration

### With Main Application

The playground can be embedded in the main application:

```javascript
// Import playground components
import '/src/playground/components/design-system-panel.js';

// Use in your application  
const panel = document.createElement('design-system-panel');
document.body.appendChild(panel);
```

### With CI/CD

```yaml
# .github/workflows/playground-tests.yml
name: Playground Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: cd frontend && bun install
        
      - name: Run playground tests
        run: cd frontend && bun vitest run src/test/playground/
        
      - name: Build playground
        run: cd frontend && bun run playground:build
```

## 📚 Additional Resources

- [Component Development Guide](./component-development.md)
- [Design System Documentation](./design-system.md)
- [Testing Best Practices](./testing-guidelines.md)
- [Performance Optimization](./performance-guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/playground-improvement`
3. Add your changes with tests
4. Run the test suite: `bun run test`
5. Submit a pull request

### Code Style

- Use ES modules and modern JavaScript
- Follow Lit component patterns
- Include comprehensive tests
- Document public APIs
- Use TypeScript for complex logic

---

*This guide covers the essentials of playground development. For advanced topics and specific use cases, refer to the component-specific documentation in each module.*