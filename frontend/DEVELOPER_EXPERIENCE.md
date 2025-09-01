# Developer Experience Guide

## Quick Setup

### Using Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/neoforge.git
   cd neoforge/frontend
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up
   ```
   This will start:
   - Development server with hot-reload at http://localhost:3000
   - Test runner in watch mode
   - E2E test environment

### Manual Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

## Code Quality

- **Linting & Formatting:**
  - Run `npm run lint` to check for style issues
  - Run `npm run format` to automatically format code with Prettier

## Testing

### Unit Tests
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

### Visual Regression Tests
```bash
# Update visual regression baselines
npm run test:visual:update

# Run visual regression tests
npm run test:visual
```

### Performance Tests
```bash
# Run performance tests
npm run test:perf

# Run accessibility tests
npm run test:a11y
```

## Docker Commands

- **Start development environment:**
  ```bash
  docker-compose up
  ```

- **Run tests in Docker:**
  ```bash
  docker-compose run test
  ```

- **Run E2E tests in Docker:**
  ```bash
  docker-compose run e2e
  ```

## Routing & Navigation

- Our custom router (in `src/services/router.js`) handles all client-side navigation
- Protected routes are guarded via `authGuard`; ensure you have an `auth_token` in localStorage when navigating to protected pages

## Production Build

```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Run production build locally
docker-compose -f docker-compose.prod.yml up
```

## Contribution Guidelines

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and ensure:
   - All tests pass
   - Code is properly formatted
   - Documentation is updated
   - Visual regression tests pass

3. Submit a pull request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Test coverage report
   - Updated documentation

Happy coding with NeoForge!
