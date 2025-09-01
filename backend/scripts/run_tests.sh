#!/bin/bash

# Script to run backend tests with various options
# Usage: ./scripts/run_tests.sh [options] [test_path]

set -e

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
      echo "Usage: ./scripts/run_tests.sh [options] [test_path]"
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
      echo "  ./scripts/run_tests.sh                           # Run all tests"
      echo "  ./scripts/run_tests.sh -c                        # Run all tests with coverage"
      echo "  ./scripts/run_tests.sh tests/test_api            # Run API tests"
      echo "  ./scripts/run_tests.sh -m 'not slow'             # Run tests that are not marked as slow"
      echo "  ./scripts/run_tests.sh -f 1 tests/test_api       # Run API tests, stop after first failure"
      echo "  ./scripts/run_tests.sh --fix-collation           # Fix PostgreSQL collation issues and run tests"
      exit 0
      ;;
    *)
      TEST_PATH="$1"
      shift
      ;;
  esac
done

# Fix PostgreSQL collation issues if requested
if [ $FIX_COLLATION -eq 1 ]; then
  echo "Fixing PostgreSQL collation issues..."
  ./scripts/fix_postgres_collation.sh
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
  docker compose -f backend/docker-compose.dev.yml build
fi

# Create/recreate test database if requested
if [ $CREATE_DB -eq 1 ]; then
  echo "Creating/recreating test database..."
  docker compose -f backend/docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"
  docker compose -f backend/docker-compose.dev.yml exec -T db psql -U postgres -c "CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;"
  docker compose -f backend/docker-compose.dev.yml run --rm api python -m app.db.init_db
fi

# Run the tests
echo "Running tests with: pytest $ARGS"
docker compose -f backend/docker-compose.dev.yml run --rm api pytest $ARGS

# Print success message
echo "Tests completed successfully!"
