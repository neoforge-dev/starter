# NeoForge Frontend

Modern web components with Lit. Built for speed, maintainability, and browser-native features.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
frontend/
├── src/
│   ├── components/     # Reusable web components
│   ├── pages/         # Route pages
│   ├── services/      # API and utility services
│   ├── styles/        # Global styles
│   └── main.ts        # Entry point
├── public/            # Static assets
├── index.html         # HTML entry
└── vite.config.ts     # Build config
```

## Key Features

- 📦 Lit 4.0 Web Components
- 🔧 TypeScript for type safety
- ⚡️ Vite for blazing fast builds
- 🎨 Shadow DOM for style isolation
- 📱 PWA-ready configuration

## Development

```typescript
// Example component
import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('app-card')
export class AppCard extends LitElement {
    @property() title = ''

    render() {
        return html`
            <div class="card">
                <h2>${this.title}</h2>
                <slot></slot>
            </div>
        `
    }
}
```

## Browser Support

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

## Learn More

- [Documentation](https://neoforge.dev/docs)
- [Component Library](https://neoforge.dev/components)
- [Contributing Guide](../CONTRIBUTING.md)

## License

MIT © [NeoForge](https://neoforge.dev)
