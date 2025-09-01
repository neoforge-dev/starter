# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Security**: Resolved 9 npm security vulnerabilities including critical RCE vulnerability
- **PWA**: Complete offline support with IndexedDB storage and background sync
- **State Management**: Redux-like centralized store with middleware and persistence
- **API Integration**: Enhanced error handling, retry logic, and offline support
- **Logging**: Production-safe logger service with environment-aware log levels
- Comprehensive FastAPI backend with health checks and database monitoring
- PostgreSQL database integration with advanced query monitoring
- Redis caching support with rate limiting middleware
- Complete Docker development environment with health checks
- UV package management for ultra-fast dependency resolution
- Extensive documentation structure with ADRs and guides
- Advanced development tooling (make commands, testing infrastructure)
- Complete testing infrastructure with 90% backend coverage (270 tests)
- Lit-based frontend with 659 tests across 75 test files
- Authentication and authorization system with JWT tokens
- Email system with template support and tracking
- Analytics and performance monitoring dashboards
- PWA-ready frontend with service worker support
- Component library with atomic design patterns
- Browser compatibility testing with Playwright
- Visual regression testing infrastructure
- Performance optimization and bundle analysis

### Changed
- Enhanced database session management with request context
- Improved health check endpoints with detailed monitoring
- Updated security middleware with better error handling
- Refactored user authentication to use CRUD layer
- Enhanced test coverage reporting and CI/CD integration

### Deprecated
- None

### Removed
- None

### Fixed
- Database collation issues in PostgreSQL setup
- Health check endpoint reliability improvements
- Session handling in test environments
- Component test infrastructure and mock strategies

### Security
- Enhanced token handling and validation
- Improved rate limiting and request validation
- Secure session management with proper cleanup

## [0.1.0] - 2024-02-06

### Added
- Initial release
- Project structure
- Basic documentation
- Development environment setup
- Health check endpoints
- Docker configuration
- Make commands for common tasks

[Unreleased]: https://github.com/yourusername/neoforge/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/neoforge/releases/tag/v0.1.0
