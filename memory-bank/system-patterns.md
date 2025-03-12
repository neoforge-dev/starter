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

## Testing Patterns

### Component Testing

We use a comprehensive approach to testing our web components, including unit tests, integration tests, and performance tests. Our testing strategy is designed to ensure that our components work correctly in isolation and in the context of the application.

#### Mocking Components with CDN Imports

Many of our components rely on other components that are loaded from CDN URLs. To test these components effectively, we've created a standardized approach for mocking components with CDN imports. This approach allows us to test our components without relying on external resources, which is more reliable and faster.

Our approach involves creating mock implementations of components that simulate the behavior of the actual components. These mock implementations are registered with the custom elements registry, allowing our components to interact with them as if they were the actual components.

We've created a set of utility functions in `src/test/utils/component-mock-utils.js` that provide a standardized approach for mocking components with CDN imports. These utilities include:

- `createMockComponent`: Creates a mock component class with specified properties and methods
- `createMockShadowRoot`: Creates a mock shadow root for testing
- `createMockClassList`: Creates a mock class list for testing
- `createMockFixture`: Creates a mock fixture function for testing
- `registerMockComponent`: Registers a mock component with the custom elements registry
- `createAndRegisterMockComponent`: Creates and registers a mock component in one step

Example usage:

```javascript
// Create and register a mock button component
const mockButton = createAndRegisterMockComponent('neo-button', {
  properties: {
    disabled: false,
    variant: 'primary',
    size: 'medium'
  },
  methods: {
    click: vi.fn(),
    focus: vi.fn()
  }
});

// Create a mock fixture function
const fixture = createMockFixture();

// Use the mock fixture to create an instance of a component
const element = fixture('<my-component></my-component>');

// Test the component
expect(element.shadowRoot.querySelector('neo-button')).not.toBeNull();
```

#### Performance Testing

We use performance tests to ensure that our components render quickly and efficiently. Our performance tests measure:

- **Rendering Time**: The time it takes to render a component
- **Memory Usage**: The amount of memory used by a component
- **Style Recalculations**: The number of style recalculations triggered by a component
- **Paint Metrics**: The time it takes to paint a component on the screen

We've established performance budgets for each of these metrics to ensure that our components meet our performance standards.

#### Test Optimization

To optimize our tests, we've implemented several strategies:

1. **Consolidated Polyfills**: We've created a consolidated performance polyfill that reduces redundant installations and improves test performance. We've also added a global flag to prevent multiple installations of the polyfill, significantly reducing the number of installation messages in the test output.
2. **Silenced Warnings**: We've silenced the Lit dev mode warning by patching the reactive-element.js file. We've also added a global flag to prevent multiple silencing operations, significantly reducing the number of silencing messages in the test output.
3. **Fixed Deprecation Warnings**: We've fixed the deprecation warning about missing "main" or "exports" field in the @open-wc/semantic-dom-diff package.
4. **Eliminated MaxListenersExceededWarning**: We've increased the limit to eliminate the MaxListenersExceededWarning.
5. **Handled Unhandled Errors**: We've created a custom reporter to handle unhandled errors related to function cloning.

These optimizations have resulted in faster and more reliable tests, with all 76 test files now passing, and 667 out of 672 tests passing (99.3%).

### Test Structure

Our tests follow a consistent structure:

1. **Setup**: Set up the test environment, including mocking components and creating fixtures
2. **Execution**: Execute the code being tested
3. **Assertion**: Assert that the code behaves as expected
4. **Cleanup**: Clean up the test environment to prevent side effects

Example:

```javascript
describe('MyComponent', () => {
  // Setup
  beforeEach(() => {
    // Create and register mock components
    createAndRegisterMockComponent('neo-button', {
      properties: { disabled: false },
      methods: { click: vi.fn() }
    });
    
    // Create a mock fixture
    fixture = createMockFixture();
  });
  
  // Execution and Assertion
  it('should render a button', () => {
    const element = fixture('<my-component></my-component>');
    expect(element.shadowRoot.querySelector('neo-button')).not.toBeNull();
  });
  
  // Cleanup
  afterEach(() => {
    // Clean up the test environment
    vi.restoreAllMocks();
  });
});
```

### Test Documentation

We've created comprehensive documentation for our testing approach, including:

- **Usage Examples**: Examples of how to use our testing utilities
- **Best Practices**: Best practices for testing web components
- **Common Issues**: Common issues and solutions when testing web components
- **Performance Testing**: Guidelines for performance testing web components

This documentation is available in the `frontend/docs/testing` directory.
