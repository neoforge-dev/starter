# System Patterns

## Architecture Overview

### Frontend Architecture
The frontend of NeoForge is built using Lit web components with a focus on simplicity and performance. The architecture follows these key patterns:

1. **Component-Based Structure**
   - Each UI element is encapsulated as a web component
   - Components use shadow DOM for style encapsulation
   - Components follow a consistent lifecycle pattern

2. **State Management**
   - Local component state for UI-specific state
   - Service-based state for application-wide state
   - Event-based communication between components

3. **Routing**
   - Client-side routing with history API
   - Lazy-loaded page components
   - Route guards for authentication

4. **Services**
   - API client for backend communication
   - Authentication service
   - Error handling service
   - Notification service

### Backend Architecture
The backend is built with FastAPI and follows these patterns:

1. **API Structure**
   - RESTful endpoints organized by resource
   - Async handlers for all endpoints
   - Dependency injection for services
   - Pydantic models for validation

2. **Database Access**
   - SQLModel for ORM functionality
   - Repository pattern for data access
   - Migration-based schema management
   - Connection pooling for efficiency

3. **Caching**
   - Redis for caching frequently accessed data
   - Cache invalidation patterns
   - Distributed locking when needed

4. **Authentication**
   - JWT-based authentication
   - Role-based access control
   - Secure password handling

### Testing Patterns

#### Frontend Testing
1. **Component Testing**
   - Mock components that extend HTMLElement
   - Manual shadow root attachment
   - Simplified rendering methods
   - Direct DOM manipulation for testing

2. **Service Testing**
   - Mock API responses
   - Isolated service tests
   - Event handling tests

#### Backend Testing
1. **API Testing**
   - Isolated test containers
   - Factory Boy for test data
   - Async test support
   - Full coverage reporting

2. **Database Testing**
   - Test-specific database
   - Transaction-based test isolation
   - Migration testing

### Deployment Architecture
1. **Container-Based Deployment**
   - Docker for all services
   - Nomad for container orchestration
   - GitHub Actions for CI/CD

2. **Infrastructure**
   - Single Digital Ocean droplet for cost efficiency
   - Cloudflare CDN for static assets
   - Monitoring and logging
