# NeoForge Backend Testing Setup

This document explains the testing setup for the NeoForge backend application and the changes made to ensure all tests run properly inside Docker containers.

## Overview

The NeoForge backend testing infrastructure is designed to run all tests inside Docker containers to ensure consistent environments and proper isolation. This approach has several advantages:

1. Tests run in the same environment regardless of the developer's local setup
2. Dependencies are consistently managed
3. Database and Redis services are properly isolated
4. Test results are reproducible

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