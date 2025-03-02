# NeoForge Backend Testing Guide

This guide explains how to write and run tests for the NeoForge backend application.

## Test Structure

The tests are organized as follows:

- `tests/conftest.py`: Contains pytest fixtures used across multiple test files
- `tests/factories.py`: Contains factory classes for generating test data
- `tests/test_api/`: Contains tests for API endpoints
- `tests/test_core/`: Contains tests for core functionality
- `tests/test_crud/`: Contains tests for database operations
- `tests/test_models/`: Contains tests for data models

## Running Tests

We provide a convenient script to run tests with various options:

```bash
# Run all tests
./scripts/run_tests.sh

# Run tests with coverage report
./scripts/run_tests.sh --coverage

# Run tests with verbose output
./scripts/run_tests.sh --verbose

# Run tests with specific markers
./scripts/run_tests.sh --markers="not slow"

# Run tests and stop after first failure
./scripts/run_tests.sh --maxfail=1

# Rebuild Docker containers before running tests
./scripts/run_tests.sh --rebuild

# Create/recreate test database before running tests
./scripts/run_tests.sh --create-db

# Combine options
./scripts/run_tests.sh --coverage --verbose --markers="not slow"
```

## Test Factories

We use factory classes to generate test data. These factories make it easy to create model instances with sensible defaults while allowing customization when needed.

### UserFactory

Creates `User` model instances:

```python
# Create a user with default attributes
user = await UserFactory.create(session=db_session)

# Create a user with custom attributes
admin = await UserFactory.create(
    session=db_session,
    email="admin@example.com",
    full_name="Admin User",
    password="secure_password",
    is_superuser=True
)

# Create multiple users
users = await UserFactory.create_batch(session=db_session, size=5)
```

### UserCreateFactory

Creates `UserCreate` schema instances for testing registration endpoints:

```python
# Create a UserCreate schema with default attributes
user_create = UserCreateFactory()

# Create a UserCreate schema with custom attributes
custom_user = UserCreateFactory(
    email="custom@example.com",
    full_name="Custom User",
    password="custom_password",
    password_confirm="custom_password"
)
```

### ItemFactory

Creates `Item` model instances:

```python
# Create an item with default attributes
item = await ItemFactory.create(session=db_session)

# Create an item with an owner
user_item = await ItemFactory.create(session=db_session, owner=user)

# Create an item with custom attributes
custom_item = await ItemFactory.create(
    session=db_session,
    title="Custom Title",
    description="Custom Description"
)
```

## Writing Tests

### API Tests

API tests should use the `client` fixture to make requests to the API:

```python
@pytest.mark.asyncio
async def test_read_users(client, normal_user_token_headers):
    response = await client.get("/api/v1/users/", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
```

### Database Tests

Database tests should use the `db_session` fixture to interact with the database:

```python
@pytest.mark.asyncio
async def test_create_user(db_session):
    user_in = UserCreateFactory()
    user = await crud.user.create(db_session, obj_in=user_in)
    assert user.email == user_in.email
    assert user.is_active is True
```

### Mocking

For tests that require mocking external dependencies, use the `unittest.mock` module:

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

## Test Database

Tests that require database access use a separate test database. The database is created and initialized with the necessary tables before tests run.

If you're experiencing issues with the test database, you can recreate it using:

```bash
./scripts/run_tests.sh --create-db
```

## Markers

We use pytest markers to categorize tests:

- `@pytest.mark.asyncio`: For asynchronous tests
- `@pytest.mark.slow`: For tests that take a long time to run
- `@pytest.mark.integration`: For tests that require external services

You can run tests with specific markers using:

```bash
./scripts/run_tests.sh --markers="not slow"
```

## Best Practices

1. **Use factories**: Instead of creating model instances directly, use the factory classes.
2. **Keep tests isolated**: Each test should be independent of others.
3. **Mock external dependencies**: Use mocking to avoid calling external services.
4. **Use descriptive names**: Test names should describe what they're testing.
5. **Follow AAA pattern**: Arrange, Act, Assert.
6. **Clean up after tests**: Use fixtures to clean up resources after tests.
7. **Test edge cases**: Don't just test the happy path.
8. **Keep tests fast**: Slow tests discourage running them frequently.

## Troubleshooting

### Database Connection Issues

If you're experiencing database connection issues, try:

1. Rebuilding the Docker containers: `./scripts/run_tests.sh --rebuild`
2. Recreating the test database: `./scripts/run_tests.sh --create-db`
3. Checking the Docker logs: `docker-compose logs postgres`

### Memory Issues

If tests are failing due to memory issues, try:

1. Running fewer tests at once: `./scripts/run_tests.sh --markers="not slow"`
2. Increasing Docker memory allocation in your Docker settings

### Test Hanging

If tests are hanging, try:

1. Running with verbose output to see where it's stuck: `./scripts/run_tests.sh --verbose`
2. Adding timeouts to potentially problematic tests
3. Running tests one at a time to identify the problematic test 