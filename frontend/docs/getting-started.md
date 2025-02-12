# Getting Started with NeoForge

Welcome to NeoForge! This guide will help you get up and running with our modern, lightweight web development framework.

## Overview

NeoForge is designed with simplicity and performance in mind. It uses vanilla JavaScript with Web Components, making it easy to understand and maintain while providing powerful features for building modern web applications.

## Key Features

- 🚀 **Zero Build Tools** - No complex build pipelines or configuration
- 📱 **PWA Ready** - Built-in service worker and offline support
- 🔒 **Modern Auth** - Secure token-based authentication system
- 🎨 **Web Components** - Using native browser features with Lit
- 🔥 **Hot Module Reload** - Instant feedback during development
- 📦 **Small Bundle Size** - Minimal dependencies for fast loading
- 📚 **Rich Documentation** - Interactive examples and best practices
- 🎯 **Production Ready** - Optimized for deployment
- 🛠️ **Developer Focused** - Built for developer productivity

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/neoforge.git
   cd neoforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Documentation

Our documentation is designed to get you productive quickly:

1. **Core Concepts**
   - Project structure and architecture
   - Component development
   - Backend integration
   - Deployment workflow

2. **Best Practices**
   - Authentication patterns
   - State management
   - Performance optimization
   - Testing strategies

3. **Examples & Recipes**
   - Common use cases
   - Production patterns
   - Deployment guides
   - Performance tips

Looking for in-depth tutorials? Visit our dedicated [Learning Platform](http://learn.neoforge.dev)!

## Project Structure

```
neoforge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── pages/
│   │   └── main.js
│   ├── docs/
│   ├── vendor/
│   └── index.html
└── backend/
    ├── src/
    ├── tests/
    └── pyproject.toml
```

## Development Workflow

1. **Local Development**
   - Start the development server
   - Use hot module reloading
   - Run tests continuously

2. **Building Features**
   - Follow the architecture guide
   - Use provided components
   - Run automated tests

3. **Deployment**
   - Build production assets
   - Deploy to Digital Ocean
   - Monitor performance

## Next Steps

- Check out the [Installation](./installation) guide
- Learn about our [Architecture](./architecture)
- Explore available [Components](./components)
- Read the [Deployment](./deployment) guide

## Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct before submitting pull requests.

## Need Help?

- Join our Discord community
- Check out our GitHub issues
- Read our documentation
- Contact our support team

## Developer Experience Tips

This project leverages Vite to provide a streamlined development environment with hot module reloading and instant updates. During development, simply run:

```bash
npm run dev
```

This will start the Vite development server at http://localhost:3000, ensuring a fast and responsive experience while you work on your code.

For production, we maintain a simplified no-build approach to reduce complexity and runtime overhead. If you choose to bundle your assets for production, refer to the commented build configuration in `vite.config.js` for guidance on customizing your build process.

Happy coding with NeoForge! 🚀 