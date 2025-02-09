.PHONY: help setup dev test lint clean build deploy

help: ## Show this help message
	@echo 'Usage:'
	@echo '  make <target>'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup of development environment
	@echo "Creating development environment..."
	cp .env.example .env
	docker compose -f backend/docker-compose.dev.yml build

dev: ## Start development environment
	@echo "Starting development services..."
	docker compose -f backend/docker-compose.dev.yml up

dev-build: ## Rebuild and start development environment
	@echo "Rebuilding and starting development services..."
	docker compose -f backend/docker-compose.dev.yml up --build

test-setup: ## Setup test database
	@echo "Starting required services..."
	docker compose -f backend/docker-compose.dev.yml up -d db redis
	@echo "Setting up test database..."
	docker compose -f backend/docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"
	docker compose -f backend/docker-compose.dev.yml exec -T db psql -U postgres -c "CREATE DATABASE test_db;"
	docker compose -f backend/docker-compose.dev.yml run --rm migrate

test: test-setup ## Run all tests with coverage
	@echo "Running tests..."
	docker compose -f backend/docker-compose.dev.yml run --rm test

test-lf: test-setup ## Run only failed tests
	@echo "Running failed tests..."
	@docker compose -f backend/docker-compose.dev.yml run --rm test pytest -v --cov=app --lf -x --maxfail=1 && (make beep && make test) || exit 1

test-watch: test-setup ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	docker compose -f backend/docker-compose.dev.yml run --rm test pytest -v --cov=app --watch

test-cov: test-setup ## Generate coverage report
	@echo "Generating coverage report..."
	docker compose -f backend/docker-compose.dev.yml run --rm test pytest --cov=app --cov-report=term-missing --cov-report=html

test-clean: ## Clean test artifacts
	@echo "Cleaning test artifacts..."
	rm -rf .coverage coverage_html .pytest_cache .testmondata
	find . -type d -name "__pycache__" -exec rm -rf {} +
	docker compose -f backend/docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"

lint: ## Run linters
	@echo "Running linters..."
	docker compose -f backend/docker-compose.dev.yml run --rm api ruff check .
	docker compose -f backend/docker-compose.dev.yml run --rm api ruff format --check .
	docker compose -f backend/docker-compose.dev.yml run --rm api mypy .

format: ## Format code
	@echo "Formatting code..."
	docker compose -f backend/docker-compose.dev.yml run --rm api ruff check . --fix
	docker compose -f backend/docker-compose.dev.yml run --rm api ruff format .

clean: ## Clean up development environment
	@echo "Cleaning up..."
	docker compose -f backend/docker-compose.dev.yml down -v
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".coverage" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +

db-shell: ## Open database shell
	@echo "Opening database shell..."
	docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres app

redis-shell: ## Open Redis shell
	@echo "Opening Redis shell..."
	docker compose -f backend/docker-compose.dev.yml exec redis redis-cli

logs: ## View logs
	@echo "Viewing logs..."
	docker compose -f backend/docker-compose.dev.yml logs -f

health: ## Check service health
	@echo "Checking service health..."
	curl -f http://localhost:8000/health/detailed 

beep: ## Play alert sound
	@echo "Playing alert sound..."
	@if [ "$(shell uname)" = "Darwin" ]; then \
		afplay /System/Library/Sounds/Funk.aiff; \
	elif [ "$(shell uname)" = "Linux" ]; then \
		paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || \
		beep 2>/dev/null || \
		echo '\a'; \
	else \
		echo '\a'; \
	fi
