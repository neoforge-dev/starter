# Tech Context

## Technologies Used

### Frontend
1. **Core Technologies**
   - Vanilla JavaScript (ES2020+)
   - Lit 3.0 for web components
   - HTML5 and CSS3
   - Web Components API

2. **Build Tools**
   - Vite for development and building
   - ESLint for code linting
   - Prettier for code formatting

3. **Testing Tools**
   - Vitest for unit testing
   - @open-wc/testing for web component testing
   - Sinon for mocking and spying

4. **Libraries**
   - lit-html for templating
   - lit-element for component base classes
   - page.js for routing
   - localforage for client-side storage

### Backend
1. **Core Technologies**
   - Python 3.10+
   - FastAPI for API framework
   - SQLModel for ORM
   - Pydantic for data validation

2. **Database**
   - PostgreSQL 15 for primary database
   - Redis for caching and queues

3. **Testing Tools**
   - Pytest for unit and integration testing
   - Factory Boy for test data generation
   - Coverage.py for test coverage

4. **Libraries**
   - Uvicorn for ASGI server
   - Alembic for database migrations
   - Python-jose for JWT handling
   - Passlib for password hashing

### Infrastructure
1. **Containerization**
   - Docker for containerization
   - Docker Compose for local development
   - Nomad for container orchestration

2. **CI/CD**
   - GitHub Actions for CI/CD pipelines
   - Makefile for common commands

3. **Monitoring**
   - Prometheus for metrics
   - Grafana for dashboards
   - Loki for log aggregation

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.10+
- Make

### Local Development
1. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Development**
   ```bash
   cd backend
   make setup
   make dev
   ```

3. **Full Stack Development**
   ```bash
   make setup
   make dev
   ```

## Technical Constraints

1. **Browser Compatibility**
   - Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
   - No IE11 support
   - Progressive enhancement for older browsers

2. **Performance Targets**
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3s
   - Lighthouse score > 90

3. **Deployment Constraints**
   - Single Digital Ocean droplet ($10/month)
   - 2GB RAM, 1 vCPU
   - 50GB SSD storage

4. **Security Requirements**
   - HTTPS only
   - JWT-based authentication
   - CSRF protection
   - Content Security Policy
   - Regular dependency updates

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "lit": "^4.0.0",
    "page": "^1.11.6",
    "marked": "^4.0.12",
    "chart.js": "^3.7.1"
  },
  "devDependencies": {
    "vite": "^2.8.6",
    "vitest": "^0.22.1",
    "@open-wc/testing": "^3.1.6",
    "eslint": "^8.9.0"
  }
}
```

### Backend Dependencies
```
fastapi==0.95.0
sqlmodel==0.0.8
alembic==1.10.2
pydantic==1.10.7
uvicorn==0.21.1
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
pytest==7.3.1
pytest-asyncio==0.21.0
httpx==0.24.0
```

## Integration Points

### External Services
- **Payment Processing**: Stripe API
- **Email Service**: SendGrid
- **File Storage**: AWS S3 / MinIO
- **Analytics**: Google Analytics 4
- **Maps**: MapBox API

### Internal APIs
- Authentication API (`/api/v1/auth/`)
- User Management API (`/api/v1/users/`)
- Projects API (`/api/v1/projects/`)
- Billing API (`/api/v1/billing/`)
- Reports API (`/api/v1/reports/`)

## Testing Infrastructure

### Backend Testing

1. **Pytest**: Main testing framework
   - `pytest-asyncio`: For testing async code
   - `pytest-cov`: For coverage reporting
   - `pytest-xdist`: For parallel test execution

2. **Factory Boy**: Test data generation
   - Integrated with SQLModel for database persistence
   - Used with Faker for random data generation

3. **Mock**: Mocking library for unit tests
   - Used to mock external dependencies
   - Allows testing components in isolation

4. **PostgreSQL Test Container**: Dedicated database for testing
   - Custom Docker image with proper locale settings
   - Initialization script for test database creation

5. **Test Runner Scripts**:
   - `backend/scripts/run_tests.sh`: Main test runner
   - `backend/scripts/run_db_tests.sh`: Database test runner
   - `backend/scripts/fix_postgres_collation.sh`: Collation fix script

### Frontend Testing

1. **Vitest**: Main testing framework
   - Compatible with Vite build system
   - Fast execution with watch mode

2. **Testing Library**: DOM testing utilities
   - Custom helpers for shadow DOM queries
   - Event simulation and assertion

3. **Custom Test Helpers**:
   - `component-test-helper.js`: Shadow DOM utilities
   - Memory optimization functions

4. **Test Runner Script**:
   - `frontend/run-tests.sh`: Optimized test execution

## Technical Constraints

### Backend

- Must follow async patterns with FastAPI
- Must use SQLModel for database interactions
- Must maintain 80% test coverage
- Must use type hints throughout the codebase
- Must follow PEP 8 style guide

### Frontend

- Must use native web components
- Must use shadow DOM for encapsulation
- Must be compatible with modern browsers
- Must follow ES6+ standards
- Must be accessible (WCAG 2.1 AA)

## Dependencies

### Backend Dependencies

- **fastapi**: Web framework
- **sqlmodel**: ORM
- **pydantic**: Data validation
- **alembic**: Database migrations
- **psycopg2-binary**: PostgreSQL driver
- **python-jose[cryptography]**: JWT handling
- **passlib[bcrypt]**: Password hashing
- **python-multipart**: Form data parsing
- **prometheus-client**: Metrics collection
- **psutil**: System metrics collection

### Backend Dev Dependencies

- **pytest**: Testing framework
- **pytest-asyncio**: Async testing
- **pytest-cov**: Coverage reporting
- **factory-boy**: Test data generation
- **faker**: Random data generation
- **black**: Code formatting
- **isort**: Import sorting
- **mypy**: Type checking
- **flake8**: Linting

### Frontend Dependencies

- **lit**: Web component library
- **lit-html**: HTML templating
- **lit-element**: Component base class
- **@open-wc/testing**: Web component testing utilities
- **@testing-library/dom**: DOM testing utilities

### Frontend Dev Dependencies

- **vite**: Build tool
- **vitest**: Testing framework
- **@vitest/coverage-c8**: Coverage reporting
- **eslint**: Linting
- **prettier**: Code formatting 