#!/bin/bash

# Script to initialize the test environment
# Usage: ./scripts/init_test_env.sh

set -e

echo "Initializing test environment..."

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Build Docker images
echo "Building Docker images..."
docker compose -f docker-compose.dev.yml build

# Start the database and Redis services
echo "Starting database and Redis services..."
docker compose -f docker-compose.dev.yml up -d db redis

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
docker compose -f docker-compose.dev.yml ps | grep -q "db.*healthy" || {
  echo "Waiting for database to be healthy..."
  sleep 10
}
docker compose -f docker-compose.dev.yml ps | grep -q "redis.*healthy" || {
  echo "Waiting for Redis to be healthy..."
  sleep 5
}

# Create test database
echo "Creating test database..."
docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"
docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;"

# Run migrations
echo "Running migrations..."
docker compose -f docker-compose.dev.yml run --rm \
  -e PYTHONPATH=/app \
  -e environment=test \
  -e debug=1 \
  -e testing=1 \
  -e secret_key=test_secret_key_replace_in_production_7e1a34bd93b148f0 \
  -e SECRET_KEY=test_secret_key_replace_in_production_7e1a34bd93b148f0 \
  -e database_url=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/test_db \
  api python -m alembic upgrade head

echo "Test environment initialized successfully!"
echo "You can now run tests with: make test" 