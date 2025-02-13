# NeoForge Frontend

[![Test Coverage](https://codecov.io/gh/neoforge/frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/neoforge/frontend)
[![Tests](https://github.com/neoforge/frontend/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/neoforge/frontend/actions/workflows/test-coverage.yml)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Test Coverage

We maintain high test coverage standards to ensure code quality and reliability:

| Type | Threshold |
|------|-----------|
| Statements | 80% |
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |

### Running Tests with Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Generate detailed coverage report
npm run test:coverage:report

# Watch mode for development
npm run test:watch
```

The coverage report will be generated in the `coverage` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/clover.xml` - Clover format for IDE integration

### Coverage Tools

- **Local Development**: View the HTML report in your browser
- **Pull Requests**: Coverage changes are automatically commented
- **Codecov**: Detailed coverage analytics and history
- **CI/CD**: Enforced coverage thresholds in GitHub Actions

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format
```

## Component Testing

We use several testing approaches:

1. **Unit Tests**: Component functionality and props
   ```bash
   npm run test:components
   ```

2. **Visual Tests**: Component appearance and styling
   ```bash
   npm run test-visual
   ```

3. **E2E Tests**: User interactions and flows
   ```bash
   npm run test:e2e
   ```

4. **Storybook Tests**: Component isolation and documentation
   ```bash
   npm run test-storybook
   ```

## Documentation

- [Component Library](./docs/COMPONENTS.md)
- [Atomic Design System](./docs/ATOMIC_DESIGN.md)
- [Pattern Library](./docs/PATTERN_LIBRARY.md)
- [Development Status](./DEVELOPMENT_STATUS.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure tests pass and coverage meets thresholds
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Development Features

- 🔥 Hot Module Replacement (HMR)
- 📱 Mobile-first responsive design
- 🧪 Browser-native testing
- 🎯 Zero-config PWA support
- 🔍 Source maps for debugging
- 📦 Modern ES modules

## Directory Structure

```
frontend/
├── src/
│   ├── components/     # Web components
│   │   ├── core/      # Core UI components
│   │   └── features/  # Feature-specific components
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   └── pages/         # Route pages
├── public/            # Static assets
└── test/             # Test files
```

## Development Commands

- `npm start` - Start development server
- `npm run dev` - Start dev server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm test` - Run tests

## Development Tips

### Hot Module Replacement

Components update automatically when you save changes. No page reload needed!

### Debugging

1. Open Chrome DevTools
2. Components panel shows web components
3. Source maps enabled for easy debugging
4. Network panel shows API calls

### Testing

```javascript
// Example component test
import { fixture, html, expect } from '@open-wc/testing';

describe('my-component', () => {
  it('renders correctly', async () => {
    const el = await fixture(html`<my-component></my-component>`);
    expect(el.shadowRoot).to.exist;
  });
});
```

### Path Aliases

Use convenient imports with aliases:

```javascript
// Instead of
import { Something } from '../../components/something.js';

// Use
import { Something } from '@components/something.js';
```

### Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Import Lit:
```javascript
import { LitElement, html, css } from '/vendor/lit-core.min.js';
```
3. Define component:
```javascript
export class MyComponent extends LitElement {
  static properties = {
    myProp: { type: String }
  };

  render() {
    return html`<div>${this.myProp}</div>`;
  }
}
customElements.define('my-component', MyComponent);
```

### Adding a New Page

1. Create page in `src/pages/`
2. Add route in `src/main.js`
3. Update navigation in `app-shell.js`

### Working with Styles

Use Shadow DOM for style encapsulation:

```javascript
static styles = css`
  :host {
    display: block;
  }
  
  .my-class {
    color: var(--primary-color);
  }
`;
```

## Troubleshooting

### Common Issues

1. **404 Errors**: Check file paths and server root
2. **HMR not working**: Clear browser cache
3. **Component not defined**: Check import paths
4. **Styles not applying**: Verify Shadow DOM usage

### Development Server

- Default port: 8080
- Auto-opens browser
- Watches for file changes
- Shows error overlay

## Resources

- [Lit Documentation](https://lit.dev/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Vite Guide](https://vitejs.dev/guide/)
