#!/bin/bash

# Script to run backend tests with various options
# Usage: ./scripts/run_tests_fixed.sh [options] [test_path]

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Default values
COVERAGE=0
VERBOSE=0
MARKERS=""
MAXFAIL=0
TEST_PATH=""
REBUILD=0
CREATE_DB=0
FIX_COLLATION=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--coverage)
      COVERAGE=1
      shift
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    -m|--markers)
      MARKERS="$2"
      shift 2
      ;;
    -f|--maxfail)
      MAXFAIL="$2"
      shift 2
      ;;
    -r|--rebuild)
      REBUILD=1
      shift
      ;;
    -d|--create-db)
      CREATE_DB=1
      shift
      ;;
    --fix-collation)
      FIX_COLLATION=1
      shift
      ;;
    -h|--help)
      echo "Usage: ./scripts/run_tests_fixed.sh [options] [test_path]"
      echo ""
      echo "Options:"
      echo "  -c, --coverage       Run tests with coverage report"
      echo "  -v, --verbose        Run tests in verbose mode"
      echo "  -m, --markers VALUE  Run tests with specific markers"
      echo "  -f, --maxfail VALUE  Stop after N failures"
      echo "  -r, --rebuild        Rebuild Docker containers before running tests"
      echo "  -d, --create-db      Create/recreate test database before running tests"
      echo "  --fix-collation      Fix PostgreSQL collation issues (recreates containers)"
      echo "  -h, --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./scripts/run_tests_fixed.sh                           # Run all tests"
      echo "  ./scripts/run_tests_fixed.sh -c                        # Run all tests with coverage"
      echo "  ./scripts/run_tests_fixed.sh tests/test_api            # Run API tests"
      echo "  ./scripts/run_tests_fixed.sh -m 'not slow'             # Run tests that are not marked as slow"
      echo "  ./scripts/run_tests_fixed.sh -f 1 tests/test_api       # Run API tests, stop after first failure"
      echo "  ./scripts/run_tests_fixed.sh --fix-collation           # Fix PostgreSQL collation issues and run tests"
      exit 0
      ;;
    *)
      TEST_PATH="$1"
      shift
      ;;
  esac
done

# Change to backend directory
cd "$BACKEND_DIR"

# Fix PostgreSQL collation issues if requested
if [ $FIX_COLLATION -eq 1 ]; then
  echo "Fixing PostgreSQL collation issues..."
  "$SCRIPT_DIR/fix_postgres_collation.sh"
  # After fixing collation, we should create the database
  CREATE_DB=1
fi

# Build command arguments
ARGS=""

if [ $VERBOSE -eq 1 ]; then
  ARGS="$ARGS -v"
fi

if [ $COVERAGE -eq 1 ]; then
  ARGS="$ARGS --cov=app --cov-report=term-missing"
fi

if [ ! -z "$MARKERS" ]; then
  ARGS="$ARGS -m \"$MARKERS\""
fi

if [ $MAXFAIL -gt 0 ]; then
  ARGS="$ARGS --maxfail=$MAXFAIL"
fi

if [ ! -z "$TEST_PATH" ]; then
  ARGS="$ARGS $TEST_PATH"
fi

# Rebuild containers if requested
if [ $REBUILD -eq 1 ]; then
  echo "Rebuilding Docker containers..."
  docker compose -f docker-compose.dev.yml build
fi

# Create/recreate test database if requested
if [ $CREATE_DB -eq 1 ]; then
  echo "Creating/recreating test database..."
  docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;" || {
    echo "Error: Could not drop test database. Make sure the database service is running."
    echo "Try running: docker compose -f docker-compose.dev.yml up -d db"
    exit 1
  }
  docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;" || {
    echo "Error: Could not create test database."
    exit 1
  }
  docker compose -f docker-compose.dev.yml run --rm -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/test_db api python -m app.db.init_db || {
    echo "Error: Could not initialize test database."
    exit 1
  }
fi

# Set environment variables for the test container
ENV_VARS="-e PYTHONPATH=/app \
  -e environment=test \
  -e debug=1 \
  -e testing=1 \
  -e secret_key=test_secret_key_replace_in_production_7e1a34bd93b148f0 \
  -e SECRET_KEY=test_secret_key_replace_in_production_7e1a34bd93b148f0 \
  -e database_url=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  -e database_url_for_env=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  -e DATABASE_URL_FOR_ENV=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  -e redis_url=redis://redis:6379/1 \
  -e REDIS_URL=redis://redis:6379/1 \
  -e JWT_SECRET=test-secret-123 \
  -e JWT_ALGORITHM=HS256"

# Check if test service exists in docker-compose.dev.yml
if grep -q "test:" docker-compose.dev.yml; then
  # Run the tests using the test service
  echo "Running tests with: pytest $ARGS"
  docker compose -f docker-compose.dev.yml run --rm $ENV_VARS test pytest $ARGS
else
  # Fallback to using the api service
  echo "Test service not found, using api service instead."
  echo "Running tests with: pytest $ARGS"
  docker compose -f docker-compose.dev.yml run --rm $ENV_VARS api pytest $ARGS
fi

# Print success message
echo "Tests completed successfully!" 