.PHONY: setup serve dev dev-build test clean frontend backend test-lf beep test-frontend test-frontend-watch test-frontend-coverage test-frontend-visual test-frontend-a11y test-frontend-perf test-frontend-all

setup: ## Initial setup of development environment
	@echo "Creating development environment..."
	cp .env.example .env
	docker compose -f backend/docker-compose.dev.yml build
	cd frontend && npm install
	mkdir -p frontend/public/icons

frontend: ## Start frontend development server
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

backend: ## Start backend development server
	@echo "Starting backend development server..."
	docker compose -f backend/docker-compose.dev.yml up api

serve: frontend ## Alias for frontend

dev: ## Start full development environment
	@echo "Starting development services..."
	make -j2 frontend backend

dev-build: ## Rebuild and start development environment
	@echo "Rebuilding development environment..."
	docker compose -f backend/docker-compose.dev.yml build
	cd frontend && npm install
	make dev

test-frontend: ## Run frontend tests
	@echo "Running frontend tests..."
	cd frontend && npm run test

test-frontend-watch: ## Run frontend tests in watch mode
	@echo "Running frontend tests in watch mode..."
	cd frontend && npm run test:watch

test-frontend-coverage: ## Run frontend tests with coverage
	@echo "Running frontend tests with coverage..."
	cd frontend && npm run test:coverage

test-frontend-visual: ## Run frontend visual tests
	@echo "Running frontend visual tests..."
	cd frontend && npm run test:visual

test-frontend-a11y: ## Run frontend accessibility tests
	@echo "Running frontend accessibility tests..."
	cd frontend && npm run test:a11y

test-frontend-perf: ## Run frontend performance tests
	@echo "Running frontend performance tests..."
	cd frontend && npm run test:perf

test-frontend-all: ## Run all frontend tests
	@echo "Running all frontend tests..."
	make test-frontend
	make test-frontend-visual
	make test-frontend-a11y
	make test-frontend-perf

test: ## Run all tests backend
	@echo "Running backend tests..."
	docker compose -f backend/docker-compose.dev.yml run --rm api pytest --maxfail=5

clean: ## Clean up development environment
	@echo "Cleaning up..."
	docker compose -f backend/docker-compose.dev.yml down -v
	rm -rf frontend/node_modules frontend/dist

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test-lf:
	docker-compose run --rm frontend npm run test:unit -- --bail 1
	@echo "\a" # System beep

beep:
	@echo "\a"

.DEFAULT_GOAL := help
