# NeoForge System Patterns

## System Architecture
NeoForge follows a modern full-stack architecture with clear separation of concerns:

### High-Level Architecture
- **Frontend**: Lit 4.0 web components organized using atomic design principles
- **Backend**: FastAPI with async support, SQLModel for ORM
- **Infrastructure**: Docker-based development, Nomad for production orchestration
- **Data Layer**: PostgreSQL database, Redis for caching

### Component Relationships
1. **Frontend to Backend**:
   - Frontend components communicate with backend via RESTful API endpoints
   - Authentication handled through JWT tokens
   - API responses cached in browser and Redis for performance

2. **Backend to Database**:
   - SQLModel provides type-safe database access
   - Async database drivers for non-blocking operations
   - Migrations managed through Alembic

3. **Infrastructure Components**:
   - Containers orchestrated through Docker Compose (dev) or Nomad (prod)
   - CDN (Cloudflare) for static asset delivery
   - Health checks for monitoring service status

## Key Technical Decisions

### Frontend
1. **Lit Web Components**:
   - Lightweight runtime (4KB vs. heavier frameworks)
   - Native browser features for better performance
   - Component-based architecture for reusability
   - Shadow DOM for style encapsulation

2. **Atomic Design Pattern**:
   - Components organized into atoms, molecules, organisms, templates, and pages
   - Clear hierarchy for component composition
   - Consistent naming and organization

3. **PWA Architecture**:
   - Service worker for offline capabilities
   - Web manifest for installation
   - Cache strategies for performance

### Backend
1. **FastAPI with Async**:
   - Leverages Python 3.10+ async capabilities
   - Automatic OpenAPI documentation
   - Type validation with Pydantic
   - High performance with minimal overhead

2. **SQLModel Integration**:
   - Combines SQLAlchemy core with Pydantic models
   - Type safety throughout the stack
   - Reduces boilerplate code

3. **API Versioning and Structure**:
   - Clear versioning strategy (v1, v2, etc.)
   - Consistent endpoint naming and organization
   - Proper error handling and status codes

## Design Patterns in Use

### Frontend Patterns
1. **Component Composition**:
   ```javascript
   import { LitElement, html } from 'lit';
   
   export class UserProfile extends LitElement {
     render() {
       return html`
         <user-avatar></user-avatar>
         <user-details></user-details>
       `;
     }
   }
   ```

2. **Custom Event Handling**:
   ```javascript
   // Event dispatch
   this.dispatchEvent(
     new CustomEvent('neo-dismiss', {
       bubbles: true,
       composed: true,
       detail: { id: this.id }
     })
   );
   
   // Event listening
   element.addEventListener('neo-dismiss', this.handleDismiss);
   ```

3. **Property Reactivity**:
   ```javascript
   static get properties() {
     return {
       user: { type: Object },
       visible: { type: Boolean }
     };
   }
   ```

4. **Conditional Rendering**:
   ```javascript
   render() {
     return html`
       <div class="container">
         ${this.label ? html`<label for="input">${this.label}</label>` : ''}
         <input id="input" .value=${this.value} ?disabled=${this.disabled}>
         ${this.error ? html`<div class="error-text">${this.error}</div>` : ''}
         ${!this.error && this.helperText ? html`<div class="helper-text">${this.helperText}</div>` : ''}
       </div>
     `;
   }
   ```

### Testing Patterns
1. **Component Property Testing**:
   ```javascript
   it('reflects property changes', async () => {
     const element = await fixture(html`<neo-input></neo-input>`);
     element.value = 'test';
     element.required = true;
     element.disabled = true;
     element.error = 'Error message';
     element.helperText = 'Helper text';
     
     await element.updateComplete;
     
     const input = element.shadowRoot.querySelector('input');
     expect(input.value).to.equal('test');
     expect(input.hasAttribute('required')).to.be.true;
     expect(input.hasAttribute('disabled')).to.be.true;
     expect(element.shadowRoot.querySelector('.error-text').textContent.trim()).to.equal('Error message');
     
     // Helper text is not rendered when error is present
     expect(element.shadowRoot.querySelector('.helper-text')).to.be.null;
     
     // Clear error to check helper text
     element.error = '';
     await element.updateComplete;
     expect(element.shadowRoot.querySelector('.helper-text').textContent.trim()).to.equal('Helper text');
   });
   ```

2. **Event Testing**:
   ```javascript
   it('handles input events', async () => {
     const element = await fixture(html`<neo-input></neo-input>`);
     const input = element.shadowRoot.querySelector('input');
     
     const changeHandler = sinon.spy();
     element.addEventListener('change', changeHandler);
     
     input.value = 'new value';
     input.dispatchEvent(new Event('input'));
     
     expect(changeHandler).to.have.been.calledOnce;
     expect(element.value).to.equal('new value');
   });
   ```

### Backend Patterns
1. **Dependency Injection**:
   ```python
   def get_current_user(token: str = Depends(oauth2_scheme)):
       return verify_token(token)
       
   @app.get("/users/me")
   async def read_users_me(current_user: User = Depends(get_current_user)):
       return current_user
   ```

2. **Repository Pattern**:
   ```python
   class UserRepository:
       async def get_user(self, user_id: int) -> User:
           return await User.get(id=user_id)
           
       async def create_user(self, data: UserCreate) -> User:
           user = User(**data.dict())
           await user.save()
           return user
   ```

3. **Service Layer**:
   ```python
   class UserService:
       def __init__(self, repo: UserRepository):
           self.repo = repo
           
       async def register_user(self, data: UserCreate) -> User:
           # Business logic here
           return await self.repo.create_user(data)
   ```

## Component Relationships Diagram

```
Frontend
├── App Shell
│   ├── Header
│   │   ├── Navigation
│   │   ├── Theme Toggle
│   │   └── User Menu
│   ├── Main Content
│   │   └── Router Outlet
│   └── Footer
├── Pages
│   ├── Home Page
│   ├── Dashboard
│   └── Settings
└── Shared Components
    ├── Toast Notifications
    ├── Modal Dialog
    └── Form Elements

Backend
├── API Routes
│   ├── Auth Endpoints
│   ├── User Endpoints
│   └── Feature Endpoints
├── Services
│   ├── Auth Service
│   ├── User Service
│   └── Feature Service
└── Data Access
    ├── Repositories
    └── Database Models
```

## Testing Patterns

### Backend Testing

1. **Factory Pattern**: We use factory classes to generate test data consistently:
   - `UserFactory`: Creates user objects with random data
   - `ItemFactory`: Creates item objects with random data
   - Factory classes handle both in-memory objects and database persistence

2. **Mock Testing**: We use mocking to test components without dependencies:
   - Mock external services and libraries (e.g., `psutil`)
   - Mock database sessions for unit testing
   - Use `unittest.mock.patch` to replace dependencies

3. **Database Testing**: We use a dedicated PostgreSQL container for testing:
   - Custom Docker image with proper locale settings
   - Initialization script to create the test database with correct collation
   - Separate test database to avoid affecting development data
   - Tests for CRUD operations and model relationships

4. **Test Runner Scripts**: We've created flexible scripts for running tests:
   - `run_tests.sh`: Main test runner with options for coverage, verbosity, etc.
   - `run_db_tests.sh`: Specialized script for database tests
   - `fix_postgres_collation.sh`: Script to fix collation issues

5. **Async Testing**: We use async patterns for testing asynchronous code:
   - Async test functions with `pytest.mark.asyncio`
   - Async fixtures for database sessions
   - Proper cleanup of resources after tests

### Frontend Testing

1. **Component Testing**: We test web components with shadow DOM:
   - Custom helper functions for querying shadow DOM
   - Lifecycle management with `beforeEach` and `afterEach`
   - Event simulation and assertion

2. **Memory Management**: We optimize tests to prevent memory leaks:
   - Run tests in isolation
   - Reduce Node.js memory limit
   - Force garbage collection
   - Simplify test cases

3. **Test Structure**: We follow a consistent test structure:
   - Create components in `beforeEach`
   - Clean up in `afterEach`
   - Test specific behaviors
   - Use shadow DOM-aware queries

4. **Test Runner Script**: We use a custom script for running tests:
   - `run-tests.sh`: Runs tests with optimized memory settings
   - Options for specific test files or directories

## Component Relationships

### Backend

1. **User -> Items**: One-to-many relationship
   - A user can have multiple items
   - Items belong to a single user
   - Deleting a user cascades to delete their items

2. **Authentication -> User**: One-to-one relationship
   - Authentication service uses user data for token generation
   - JWT tokens contain user information

### Frontend

1. **App -> Pages**: One-to-many relationship
   - The app component renders different pages based on routing
   - Pages are top-level components

2. **Pages -> Components**: One-to-many relationship
   - Pages compose multiple components
   - Components can be reused across pages
