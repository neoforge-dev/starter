#!/bin/bash

# Script to run database tests
# Usage: ./scripts/run_db_tests.sh [options]

set -e

# Default values
VERBOSE=0
FIX_COLLATION=0

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    --fix-collation)
      FIX_COLLATION=1
      shift
      ;;
    -h|--help)
      echo "Usage: ./scripts/run_db_tests.sh [options]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose        Run tests in verbose mode"
      echo "  --fix-collation      Fix PostgreSQL collation issues before running tests"
      echo "  -h, --help           Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

# Fix collation if requested
if [ $FIX_COLLATION -eq 1 ]; then
  echo "Fixing PostgreSQL collation issues..."
  ./scripts/fix_postgres_collation.sh
fi

# Build command arguments
ARGS="tests/test_db"

if [ $VERBOSE -eq 1 ]; then
  ARGS="$ARGS -v"
fi

# Run the tests
echo "Running database tests..."
./scripts/run_tests.sh $ARGS

echo "Database tests completed successfully!" 