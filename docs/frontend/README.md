# 🖥 NeoForge Frontend

Get from zero to MVP in under an hour using browser-native web components. Enjoy a no-build, directly debuggable setup for rapid iteration and development.

## 🚀 Quick Start

Start by serving your project without a build step:

```bash
# Using Python's simple HTTP server (recommended for quick testing)
python -m http.server 8080

# Alternatively, using Node.js static server (better for development)
npx serve
```

Then visit http://localhost:8080 to start developing.

For development with hot-reload and testing support:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎯 Core Principles

### 1. Lean Development
- **No Build Step:** Code runs directly in the browser, using native JavaScript modules
- **Direct Debugging:** Leverage browser DevTools to inspect live components
- **Focus on Core UX:** Implement essential features to validate user experience quickly

### 2. Superior Developer Experience
- **Real-Time Editing:** Immediate feedback as you edit components
- **Live Running Code:** Source files are executable code
- **Style Isolation:** Shadow DOM ensures styles don't leak
- **Self-Documenting:** Inline documentation and examples

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Web components
│   │   ├── core/      # Reusable UI components
│   │   └── features/  # Feature-specific components
│   │   └── utils/     # Shared utilities
│   ├── pages/         # Route-specific pages
│   ├── services/      # API integration, auth, etc.
│   ├── styles/        # Global styles and themes
│   ├── main.js        # Application entry
│   └── sw.js         # Service worker (PWA)
├── public/            # Static assets
├── tests/            # Unit and integration tests
├── index.html        # Entry point
└── manifest.json     # PWA configuration
```

## 💻 Component Development

Components use Lit for efficient rendering and native web components:

```javascript
import { LitElement, html, css } from '/vendor/lit-core.min.js';

/**
 * Example button component with variants
 * @customElement neo-button
 */
export class NeoButton extends LitElement {
  static properties = {
    variant: { type: String },
    disabled: { type: Boolean }
  };

  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-family: inherit;
    }
    button[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .primary {
      background: var(--primary-color);
      color: white;
    }
    .secondary {
      background: transparent;
      border: 1px solid var(--primary-color);
      color: var(--primary-color);
    }
  `;

  render() {
    return html`
      <button 
        class=${this.variant || 'primary'}
        ?disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }

  _handleClick(e) {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('neo-click', {
        bubbles: true,
        composed: true
      }));
    }
  }
}

customElements.define('neo-button', NeoButton);
```

## 🔧 Development Tools

### Testing
We use Open Web Components testing utilities:

```javascript
import { fixture, html, expect } from '@open-wc/testing';

describe('neo-button', () => {
  it('renders with default variant', async () => {
    const el = await fixture(html`
      <neo-button>Click me</neo-button>
    `);
    
    expect(el.variant).to.equal('primary');
    expect(el.shadowRoot.querySelector('button'))
      .to.have.class('primary');
  });
});
```

### Debugging Tips
1. Use Chrome DevTools' Elements panel to inspect Shadow DOM
2. Enable "Show user agent shadow DOM" for full visibility
3. Use the Console to interact with components directly
4. Set breakpoints in source files for step debugging

## 🚀 Deployment

Deploy to production using our automated pipeline:

```bash
# Build for production
npm run build

# Test the production build
npm run serve:prod

# Deploy (requires authentication)
npm run deploy
```

### Browser Support
- Chrome/Edge (latest 2 versions): ✅
- Firefox (latest 2 versions): ✅
- Safari (latest 2 versions): ✅
- Mobile browsers: ✅

> Note: We use native ES modules and web components. For older browsers, 
> consider using the build process which includes necessary polyfills.

## 📈 Performance

### Key Metrics
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.0s
- Lighthouse Performance Score: > 90

### Optimization Tips
1. Use lazy loading for non-critical components
2. Implement code splitting via dynamic imports
3. Optimize images using WebP format
4. Cache assets using service worker

## 🔒 Security

1. All API requests use HTTPS
2. Authentication tokens stored securely
3. CSP headers prevent XSS attacks
4. Regular security audits via npm audit

## 📚 Additional Resources

- [Lit Documentation](https://lit.dev/)
- [Web Components Best Practices](https://open-wc.org/)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [Browser DevTools Guide](https://developers.google.com/web/tools/chrome-devtools/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## 📝 License

MIT License - see [LICENSE](../LICENSE) for details 