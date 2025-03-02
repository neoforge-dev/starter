# NeoForge Backend Testing Guide

This document provides a comprehensive guide to testing the NeoForge backend application. It covers the testing setup, how to run tests, and best practices for writing effective tests.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Setup](#testing-setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Fixtures](#test-fixtures)
6. [Mocking](#mocking)
7. [Database Testing](#database-testing)
8. [API Testing](#api-testing)
9. [Common Issues and Solutions](#common-issues-and-solutions)
10. [Best Practices](#best-practices)

## Testing Philosophy

Our testing approach follows these principles:

- **Test-driven development**: Write tests before implementing features
- **Comprehensive coverage**: Aim for at least 80% code coverage
- **Isolated tests**: Each test should be independent and not rely on the state from other tests
- **Fast execution**: Tests should run quickly to provide rapid feedback
- **Realistic scenarios**: Tests should reflect real-world usage patterns

## Testing Setup

### Tools and Libraries

- **pytest**: Test runner and assertion library
- **pytest-asyncio**: Support for testing asynchronous code
- **pytest-cov**: Code coverage reporting
- **factory-boy**: Test data generation
- **httpx**: HTTP client for testing API endpoints

### Test Environment

Tests run in a Docker container with:
- A dedicated PostgreSQL database (`test_db`)
- A dedicated Redis instance (database 1)
- Environment variables set for testing

### Directory Structure

```
backend/
├── app/                # Application code
├── tests/              # Test code
│   ├── conftest.py     # Test fixtures and configuration
│   ├── factories.py    # Test data factories
│   ├── test_api/       # API tests
│   ├── test_core/      # Core module tests
│   ├── test_db/        # Database tests
│   └── test_services/  # Service tests
├── pytest.ini          # Pytest configuration
└── docker-compose.dev.yml  # Docker setup including test service
```

## Running Tests

### Using Docker (Recommended)

The simplest way to run tests is using Docker Compose:

```bash
# Run all tests
docker compose -f backend/docker-compose.dev.yml run --rm test

# Run specific tests
docker compose -f backend/docker-compose.dev.yml run --rm api pytest tests/test_api/test_users.py -v

# Run tests with specific markers
docker compose -f backend/docker-compose.dev.yml run --rm api pytest -m "not slow" -v

# Run tests with coverage report
docker compose -f backend/docker-compose.dev.yml run --rm api pytest --cov=app --cov-report=term-missing
```

### Using Make Commands

We provide Make commands for common testing operations:

```bash
# Run all tests
make test

# Run tests with coverage
make test-cov

# Run specific tests
make test ARGS="tests/test_api/test_users.py -v"
```

### Running Tests Locally

If you prefer to run tests outside Docker:

1. Ensure you have a PostgreSQL database named `test_db` running
2. Set up environment variables (see `.env.test`)
3. Run tests with pytest:

```bash
# Install test dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

## Writing Tests

### Test File Structure

Each test file should follow this structure:

```python
import pytest
from app.your_module import YourClass

# Test fixtures specific to this file (if needed)
@pytest.fixture
def your_fixture():
    # Setup
    yield your_test_object
    # Teardown (optional)

# Group tests in classes for organization
class TestYourClass:
    # Test a specific function or behavior
    async def test_your_function(self, your_fixture, db):
        # Arrange
        # Act
        result = await your_fixture.your_function()
        # Assert
        assert result == expected_value
```

### Asynchronous Testing

Most of our codebase uses async/await. Use the `async def` syntax for test functions and the `await` keyword when calling async functions:

```python
async def test_async_function(self, client):
    response = await client.get("/api/endpoint")
    assert response.status_code == 200
```

### Test Naming

Follow these naming conventions:
- Test files: `test_*.py`
- Test classes: `Test*`
- Test functions: `test_*`

Use descriptive names that explain what is being tested:

```python
# Good
async def test_user_creation_with_valid_data_succeeds(self, client):
    # Test code

# Bad
async def test_user(self, client):
    # Test code
```

## Test Fixtures

We use pytest fixtures to set up test dependencies. Common fixtures are defined in `conftest.py`:

### Global Fixtures

- `event_loop`: Event loop for async tests
- `test_settings`: Test configuration
- `engine`: Database engine
- `db`: Database session
- `redis`: Redis connection
- `client`: HTTP client for API testing
- `regular_user`: Regular user for testing
- `superuser`: Admin user for testing
- `regular_user_headers`: Authentication headers for regular user
- `superuser_headers`: Authentication headers for admin user

### Using Fixtures

```python
async def test_get_current_user(self, client, regular_user, regular_user_headers):
    response = await client.get("/api/users/me", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == regular_user.email
```

### Creating Custom Fixtures

Create custom fixtures for specific test requirements:

```python
@pytest.fixture
async def test_items(db, regular_user):
    """Create test items for a user."""
    items = []
    for i in range(3):
        item = Item(name=f"Test Item {i}", owner_id=regular_user.id)
        db.add(item)
    await db.commit()
    for item in items:
        await db.refresh(item)
    yield items
    # Cleanup
    for item in items:
        await db.delete(item)
    await db.commit()
```

## Mocking

Use `unittest.mock` or pytest's monkeypatch for mocking:

```python
from unittest.mock import patch, MagicMock

async def test_external_service(self, client):
    # Mock the external service
    with patch("app.services.external.ExternalService.get_data") as mock_get_data:
        mock_get_data.return_value = {"key": "value"}
        
        # Test code that uses the external service
        response = await client.get("/api/external-data")
        assert response.status_code == 200
        assert response.json() == {"key": "value"}
```

For monkeypatching:

```python
async def test_with_monkeypatch(self, monkeypatch):
    # Replace a function or attribute
    monkeypatch.setattr("app.services.email.send_email", lambda *args, **kwargs: None)
    
    # Test code that uses send_email
```

## Database Testing

### Using the Database Fixture

The `db` fixture provides a transaction-based database session:

```python
async def test_create_user(self, db):
    user = User(email="test@example.com", hashed_password="hashedpass")
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    assert user.id is not None
    assert user.email == "test@example.com"
```

### Using Factories

We use factory_boy to create test data:

```python
from tests.factories import UserFactory

async def test_with_factory(self, db):
    # Create a user with default values
    user = await UserFactory.create(session=db)
    
    # Create a user with specific values
    admin = await UserFactory.create(session=db, is_superuser=True)
    
    assert user.is_superuser is False
    assert admin.is_superuser is True
```

## API Testing

### Testing API Endpoints

Use the `client` fixture to test API endpoints:

```python
async def test_create_item(self, client, regular_user_headers):
    response = await client.post(
        "/api/items/",
        headers=regular_user_headers,
        json={"name": "Test Item", "description": "Test Description"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Item"
    assert data["description"] == "Test Description"
    assert "id" in data
```

### Testing Authentication

Test both authenticated and unauthenticated requests:

```python
async def test_get_items_authenticated(self, client, regular_user_headers):
    response = await client.get("/api/items/", headers=regular_user_headers)
    assert response.status_code == 200

async def test_get_items_unauthenticated(self, client):
    response = await client.get("/api/items/")
    assert response.status_code == 401
```

## Common Issues and Solutions

### Missing Dependencies

If you encounter a "ModuleNotFoundError" like:

```
ModuleNotFoundError: No module named 'psutil'
```

Ensure all dependencies are installed in the Docker container:

1. Add the missing dependency to `pyproject.toml`
2. Update the Dockerfile to install the dependency
3. Rebuild the Docker image:

```bash
docker compose -f backend/docker-compose.dev.yml build
```

### Database Connection Issues

If tests fail with database connection errors:

1. Ensure the database container is running
2. Check that the test database exists:

```bash
docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'test_db'"
```

3. If it doesn't exist, create it:

```bash
docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "CREATE DATABASE test_db"
```

### Redis Connection Issues

If tests fail with Redis connection errors:

1. Ensure the Redis container is running
2. Check Redis connection:

```bash
docker compose -f backend/docker-compose.dev.yml exec redis redis-cli ping
```

### Test Isolation Issues

If tests interfere with each other:

1. Ensure each test properly cleans up after itself
2. Use function-scoped fixtures instead of session-scoped ones
3. Reset the database state between tests

## Best Practices

1. **Write focused tests**: Each test should verify one specific behavior
2. **Use descriptive names**: Test names should describe what's being tested
3. **Isolate tests**: Tests should not depend on each other
4. **Clean up after tests**: Use fixtures with cleanup code
5. **Mock external dependencies**: Don't rely on external services in tests
6. **Test edge cases**: Include tests for error conditions and edge cases
7. **Keep tests fast**: Optimize slow tests or mark them with `@pytest.mark.slow`
8. **Maintain test coverage**: Aim for at least 80% code coverage
9. **Review test failures**: Treat test failures as important issues
10. **Update tests when code changes**: Keep tests in sync with implementation

By following this guide, you'll be able to write effective tests for the NeoForge backend application. If you have any questions or need further assistance, please reach out to the team. 