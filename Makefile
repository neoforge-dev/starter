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

test: ## Run tests
	@echo "Running tests..."
	docker compose -f backend/docker-compose.dev.yml run --rm test
	
test-lf:
	docker compose -f backend/docker-compose.dev.yml run --rm test pytest -v --cov=app --lf -x

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	docker compose -f backend/docker-compose.dev.yml run --rm test pytest -v --cov=app --watch

test-cov:
	pytest --cov=app --cov-report=term-missing

test-cov-html:
	pytest --cov=app --cov-report=html
	@echo "Coverage report is available at coverage_html/index.html"

test-clean:
	rm -rf .coverage coverage_html .pytest_cache .testmondata
	find . -type d -name "__pycache__" -exec rm -rf {} +

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