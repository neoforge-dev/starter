# NeoForge Technical Context

## Technologies Used

### Frontend
- **Framework**: Lit 4.0 (lightweight web component library)
- **Languages**: JavaScript (ES6+), HTML, CSS
- **Testing**: Vitest
- **Build Tools**: Vite, npm
- **UI Patterns**: Atomic Design
- **PWA Features**: Service Workers, Web Manifest

### Backend
- **Framework**: FastAPI (async Python)
- **Languages**: Python 3.10+
- **Database ORM**: SQLModel
- **Database**: PostgreSQL
- **Caching**: Redis
- **Testing**: pytest, pytest-asyncio
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger (auto-generated)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**:
  - Development: Docker Compose
  - Production: Nomad
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **CDN**: Cloudflare
- **Storage**: S3-compatible object storage

## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- Python 3.10+
- Git

### Local Development Environment
```bash
# Clone repository
git clone https://github.com/your-org/neoforge.git
cd neoforge

# Start development environment
docker-compose up -d

# Frontend development
cd frontend
npm install
npm run dev

# Backend development (alternative to Docker approach)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key
- `DEBUG`: Enable/disable debug mode
- `ENVIRONMENT`: Development/Staging/Production

### Common Commands
```bash
# Run frontend tests
cd frontend
npm run test:unit

# Run backend tests (IMPORTANT: Always use Docker for backend tests)
cd backend
make test                # Run all tests
make test-api            # Run API tests only
make test-db             # Run database tests only
make test-core           # Run core module tests only
make test-coverage       # Run tests with coverage report
make rebuild-test        # Rebuild test containers and run tests
make test-with-db        # Create/recreate test database and run tests
make fix-collation       # Fix PostgreSQL collation issues and run tests
make init-test-env       # Initialize test environment

# Alternative direct script usage
cd backend
./scripts/run_tests_fixed.sh -v                # Run all tests verbosely
./scripts/run_tests_fixed.sh -v -c             # Run all tests with coverage
./scripts/run_tests_fixed.sh -v tests/api      # Run API tests only
./scripts/init_test_env.sh                     # Initialize test environment

# Build frontend for production
cd frontend
npm run build

# Database migrations
cd backend
alembic upgrade head
```

## Technical Constraints

### Performance Requirements
- Page load time < 2 seconds
- API response time < 200ms for standard endpoints
- Support for 1000+ concurrent users

### Browser Support
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### Mobile Support
- iOS Safari 14+
- Android Chrome 90+
- PWA installation support

### Security Requirements
- HTTPS throughout
- OWASP Top 10 compliance
- Regular security audits
- Content Security Policy implementation

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