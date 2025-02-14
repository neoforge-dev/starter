.PHONY: setup serve dev dev-build test clean frontend backend test-lf beep

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

test: ## Run tests
	@echo "Running tests..."
	# cd frontend && npm test:fast
	docker compose -f backend/docker-compose.dev.yml run --rm api pytest

clean: ## Clean up development environment
	@echo "Cleaning up..."
	docker compose -f backend/docker-compose.dev.yml down -v
	rm -rf frontend/node_modules frontend/dist

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test-lf: ## Run only the last failed tests
	@echo "Running last failed tests..."
	docker compose -f backend/docker-compose.dev.yml run --rm api pytest --lf

beep: ## Emit a beep notification
	@echo "Beep! You've reached the failure threshold. Please check your tests!"

.DEFAULT_GOAL := help
