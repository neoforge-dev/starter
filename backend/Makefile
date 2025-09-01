.PHONY: test test-all test-db test-api test-core test-coverage rebuild-test clean-test init-test-env

# Initialize test environment
init-test-env:
	./scripts/init_test_env.sh

# Run all tests
test-all:
	./scripts/run_tests_fixed.sh -v

# Run database tests only
test-db:
	./scripts/run_tests_fixed.sh -v tests/test_db

# Run API tests only
test-api:
	./scripts/run_tests_fixed.sh -v tests/api

# Run core module tests only
test-core:
	./scripts/run_tests_fixed.sh -v tests/test_core

# Run tests with coverage report
test-coverage:
	./scripts/run_tests_fixed.sh -v -c

# Rebuild test containers and run tests
rebuild-test:
	./scripts/run_tests_fixed.sh -v -r

# Create/recreate test database and run tests
test-with-db:
	./scripts/run_tests_fixed.sh -v -d

# Fix PostgreSQL collation issues and run tests
fix-collation:
	./scripts/run_tests_fixed.sh -v --fix-collation

# Clean test artifacts
clean-test:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -f .coverage
	rm -f coverage.xml

# Default test command
test:
	./scripts/run_tests_fixed.sh -v
