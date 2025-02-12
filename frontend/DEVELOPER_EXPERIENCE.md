# Developer Experience Guide

## Quick Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/neoforge.git
   cd neoforge/frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
   (Hot-reload is enabled via Vite and source maps are available for debugging.)

## Code Quality

- **Linting & Formatting:**
  - Run `npm run lint` to check for style issues.
  - Run `npm run format` to automatically format code with Prettier.

## Testing

- Run unit tests with:
  ```bash
  npm test
  ```
- Use browser developer tools for debugging and inspection.

## Routing & Navigation

- Our custom router (in `src/services/router.js`) handles all client-side navigation.
- Protected routes are guarded via `authGuard`; ensure you have an `auth_token` in localStorage when navigating to protected pages.

## Contribution Guidelines

- Use branch names like `feature/<name>` or `fix/<issue>`.
- Submit clear pull requests with test coverage and documentation updates.

Happy coding with NeoForge! 