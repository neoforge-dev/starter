# NeoForge Backend Testing Setup

This document explains the testing setup for the NeoForge backend application and the changes made to ensure all tests run properly inside Docker containers.

## Overview

The NeoForge backend testing infrastructure is designed to run all tests inside Docker containers to ensure consistent environments and proper isolation. This approach has several advantages:

1. Tests run in the same environment regardless of the developer's local setup
2. Dependencies are consistently managed
3. Database and Redis services are properly isolated
4. Test results are reproducible

## Current Test Status

**Coverage**: 90% (exceeds 80% target)
- **Tests**: 270 passing, 1 skipped, 2 deferred health tests
- **Key modules**:
  - `deps` module: 68% coverage (improved with 5 new tests)
  - `queue` module: 81% coverage (added fallback Redis test)
  - `health` module: Basic health check test added
- **Deferred tests**: 2 complex health check tests requiring advanced mocking

## Key Components

### Docker Setup

- **docker-compose.dev.yml**: Defines the services needed for testing, including:
  - `api`: The main application service
  - `db`: PostgreSQL database service with proper collation settings
  - `redis`: Redis service for caching and queue management
  - `test`: Dedicated service for running tests

- **Dockerfile**: Defines the container images for development and testing, ensuring all dependencies are installed

### Test Runner Scripts

- **run_tests_fixed.sh**: Main script for running tests inside Docker containers
  - Supports various options like coverage reporting, verbosity control, and test markers
  - Properly sets environment variables for the test container
  - Handles database creation and initialization
  - Works from any directory using absolute paths
  - Includes improved error handling
  - Automatically detects whether to use the test or api service

- **init_test_env.sh**: Script to initialize the test environment
  - Builds Docker images
  - Starts database and Redis services
  - Creates test database with proper collation settings
  - Runs database migrations
  - Works from any directory using absolute paths
  - Includes improved error handling and timeout management

### Makefile

The Makefile provides convenient commands for running tests:

- `make init-test-env`: Initialize the test environment
- `make test`: Run all tests
- `make test-db`: Run database tests only
- `make test-api`: Run API tests only
- `make test-core`: Run core module tests only
- `make test-coverage`: Run tests with coverage report
- `make rebuild-test`: Rebuild containers and run tests
- `make test-with-db`: Create/recreate test database and run tests
- `make fix-collation`: Fix PostgreSQL collation issues and run tests

## Changes Made

The following changes were made to fix the Docker testing setup:

1. **Updated Dockerfile**:
   - Added explicit installation of test dependencies
   - Ensured all required packages are installed in the development stage
   - Added copying of test configuration files

2. **Updated docker-compose.dev.yml**:
   - Added environment variables in both lowercase and uppercase formats
   - Configured the test service with proper environment variables
   - Ensured proper volume mounting for test artifacts

3. **Created run_tests_fixed.sh**:
   - Fixed path to docker-compose.dev.yml using absolute paths
   - Added proper environment variable handling
   - Used the dedicated test service instead of the api service
   - Added fallback to api service if test service is not available
   - Improved error handling and reporting
   - Made the script work from any directory

4. **Created init_test_env.sh**:
   - Added script to initialize the test environment
   - Ensured database and Redis services are started and healthy
   - Created test database with proper collation settings
   - Ran database migrations
   - Improved error handling and timeout management
   - Made the script work from any directory

5. **Updated Makefile**:
   - Added convenient commands for running different types of tests
   - Added command to initialize the test environment
   - Simplified common testing operations

6. **Updated Documentation**:
   - Added testing instructions to README.md
   - Updated tests/README.md with new testing approach
   - Updated TESTING.md (this file) to document the testing setup

## Environment Variables

The following environment variables are set for the test container:

- `PYTHONPATH=/app`: Ensures Python can find the application modules
- `environment=test`: Sets the application environment to test
- `debug=1`: Enables debug mode
- `testing=1`: Enables testing mode
- `secret_key=test_secret_key_replace_in_production_7e1a34bd93b148f0`: Sets the secret key
- `SECRET_KEY=test_secret_key_replace_in_production_7e1a34bd93b148f0`: Sets the secret key (uppercase)
- `database_url=postgresql+asyncpg://postgres:postgres@db:5432/test_db`: Sets the database URL
- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/test_db`: Sets the database URL (uppercase)
- `redis_url=redis://redis:6379/1`: Sets the Redis URL
- `REDIS_URL=redis://redis:6379/1`: Sets the Redis URL (uppercase)
- `JWT_SECRET=test-secret-123`: Sets the JWT secret
- `JWT_ALGORITHM=HS256`: Sets the JWT algorithm

## Running Tests

To run tests, follow these steps:

1. Initialize the test environment:
   ```bash
   cd backend
   make init-test-env
   ```

2. Run tests using Make:
   ```bash
   make test
   ```

3. Or run specific test suites:
   ```bash
   make test-db     # Database tests
   make test-api    # API tests
   make test-core   # Core module tests
   ```

4. Or run tests directly:
   ```bash
   ./scripts/run_tests_fixed.sh -v
   ```

## Troubleshooting

If you encounter issues with the testing setup, try the following:

1. Rebuild the Docker containers:
   ```bash
   make rebuild-test
   ```

2. Fix PostgreSQL collation issues:
   ```bash
   make fix-collation
   ```

3. Check the Docker logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs db
   docker compose -f docker-compose.dev.yml logs redis
   ```

4. Ensure the test database exists:
   ```bash
   docker compose -f docker-compose.dev.yml exec db psql -U postgres -c "\l"
   ```

5. Check environment variables:
   ```bash
   docker compose -f docker-compose.dev.yml run --rm test env | grep -E 'SECRET|DATABASE|REDIS'
   ```

6. If you get errors about the test service not being found, check if it's defined in docker-compose.dev.yml:
   ```bash
   grep -A 20 "test:" docker-compose.dev.yml
   ```

7. If the test service is not defined, the script will automatically fall back to using the api service.

---

## Practical Testing Commands

### Quick Commands with Make

```bash
# Run all tests
make test

# Run specific test suites
make test-db     # Database tests
make test-api    # API tests
make test-core   # Core module tests

# Run tests with coverage report
make test-coverage

# Rebuild containers and run tests
make rebuild-test

# Create/recreate test database and run tests
make test-with-db

# Fix PostgreSQL collation issues and run tests
make fix-collation
```

### Direct Test Execution

```bash
# Run all tests with verbose output
./scripts/run_tests_fixed.sh -v

# Run specific tests
./scripts/run_tests_fixed.sh -v tests/test_api

# Run tests with specific markers
./scripts/run_tests_fixed.sh -m "not db" -v

# Run tests with coverage report
./scripts/run_tests_fixed.sh -c -v
```

## Test Structure & Organization

The tests are organized by functionality:

- `tests/conftest.py`: Pytest fixtures used across multiple test files
- `tests/factories.py`: Factory classes for generating test data
- `tests/api/`: API endpoint tests
- `tests/core/`: Core functionality tests
- `tests/db/`: Database operation tests
- `tests/crud/`: Database CRUD operation tests
- `tests/models/`: Data model tests

## Test Data Generation

### Using Factories

We use factory classes for consistent test data:

```python
# Create a user with default attributes
user = await UserFactory.create(session=db_session)

# Create a user with custom attributes
admin = await UserFactory.create(
    session=db_session,
    email="admin@example.com",
    full_name="Admin User",
    is_superuser=True
)

# Create multiple users
users = await UserFactory.create_batch(session=db_session, size=5)
```

### UserCreateFactory

For testing registration endpoints:

```python
# Create a UserCreate schema with default attributes
user_create = UserCreateFactory()

# Create with custom attributes
custom_user = UserCreateFactory(
    email="custom@example.com",
    full_name="Custom User",
    password="custom_password",
    password_confirm="custom_password"
)
```

## Writing Tests

### API Tests

API tests use the `client` fixture:

```python
@pytest.mark.asyncio
async def test_read_users(client, normal_user_token_headers):
    response = await client.get("/api/v1/users/", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
```

### Database Tests

Database tests use the `db_session` fixture:

```python
@pytest.mark.asyncio
async def test_create_user(db_session):
    user_in = UserCreateFactory()
    user = await crud.user.create(db_session, obj_in=user_in)
    assert user.email == user_in.email
    assert user.is_active is True
```

### Mocking External Dependencies

```python
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_external_service():
    with patch("app.services.external.make_request") as mock_request:
        mock_request.return_value = {"status": "success"}
        result = await services.external.process_data()
        assert result["status"] == "success"
        mock_request.assert_called_once()
```

## Test Markers

Use pytest markers to categorize tests:

- `@pytest.mark.asyncio`: For asynchronous tests
- `@pytest.mark.slow`: For tests that take a long time to run
- `@pytest.mark.integration`: For tests that require external services

Run tests with specific markers:

```bash
./scripts/run_tests_fixed.sh -m "not slow" -v
```

## Best Practices

1. **Use factories**: Instead of creating model instances directly
2. **Keep tests isolated**: Each test should be independent
3. **Mock external dependencies**: Avoid calling external services
4. **Use descriptive names**: Test names should describe what they're testing
5. **Follow AAA pattern**: Arrange, Act, Assert
6. **Clean up after tests**: Use fixtures to clean up resources
7. **Test edge cases**: Don't just test the happy path
8. **Keep tests fast**: Slow tests discourage running them frequently

## Troubleshooting

### Database Connection Issues

1. Initialize test environment: `make init-test-env`
2. Rebuild Docker containers: `make rebuild-test`
3. Recreate test database: `make test-with-db`
4. Check Docker logs: `docker compose -f docker-compose.dev.yml logs db`

### Memory Issues

1. Run fewer tests at a time: `./scripts/run_tests_fixed.sh -v tests/test_api`
2. Increase Docker memory allocation in Docker Desktop settings

### Environment Variable Issues

Check environment variables in the test container:

```bash
docker compose -f docker-compose.dev.yml run --rm test env | grep -E 'SECRET|DATABASE|REDIS'
```

---

*For comprehensive testing setup details, see the sections above. For frontend testing, see `frontend/src/test/TESTING.md`.* 