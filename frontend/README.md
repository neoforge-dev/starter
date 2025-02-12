# NeoForge Frontend Development

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

## Contributing

1. Branch naming: `feature/name` or `fix/issue`
2. Commit messages: Clear and descriptive
3. Test coverage: Required for new features
4. Documentation: Update as needed

## Resources

- [Lit Documentation](https://lit.dev/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Vite Guide](https://vitejs.dev/guide/)
