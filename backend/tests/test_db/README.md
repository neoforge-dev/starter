# Database Tests

This directory contains tests that verify database functionality and operations.

## Overview

These tests ensure that:

1. Database connections work properly
2. Collation settings are correctly configured
3. Unicode characters are handled correctly
4. Case-insensitive searches work as expected
5. CRUD operations function correctly with SQLModel models

## Running Database Tests

To run the database tests, use the following command:

```bash
./scripts/run_tests.sh tests/test_db
```

If you encounter collation issues, you can fix them with:

```bash
./scripts/run_tests.sh --fix-collation tests/test_db
```

## Test Files

- `test_database_connection.py`: Basic database connectivity and collation tests
- `test_crud_operations.py`: Tests for Create, Read, Update, Delete operations
- `test_relationships.py`: Tests for model relationships and foreign keys
- `test_migrations.py`: Tests for database migrations

## Troubleshooting

### Collation Issues

If you encounter errors like `InvalidCatalogNameError` or issues with text sorting, you may need to fix the PostgreSQL collation settings:

1. Run `./scripts/fix_postgres_collation.sh` to recreate the PostgreSQL container with proper collation settings
2. Alternatively, run `./scripts/run_tests.sh --fix-collation` to fix collation and run tests

### Connection Issues

If tests can't connect to the database:

1. Ensure the PostgreSQL container is running: `docker compose -f backend/docker-compose.dev.yml ps`
2. Check the PostgreSQL logs: `docker compose -f backend/docker-compose.dev.yml logs db`
3. Verify the test database exists: `docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'test_db'"`
