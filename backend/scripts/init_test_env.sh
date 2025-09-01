#!/bin/bash

# Script to initialize the test environment
# Usage: ./scripts/init_test_env.sh

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Initializing test environment..."

# Ensure Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Change to backend directory
cd "$BACKEND_DIR"

# Build Docker images
echo "Building Docker images..."
docker compose -f docker-compose.dev.yml build || {
  echo "Error: Failed to build Docker images."
  exit 1
}

# Start the database and Redis services
echo "Starting database and Redis services..."
docker compose -f docker-compose.dev.yml up -d db redis || {
  echo "Error: Failed to start database and Redis services."
  exit 1
}

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! docker compose -f docker-compose.dev.yml ps | grep -q "db.*healthy"; do
  echo "Waiting for database to be healthy... ($(($RETRY_COUNT+1))/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Error: Database service did not become healthy within the timeout period."
    exit 1
  fi
done

RETRY_COUNT=0
while ! docker compose -f docker-compose.dev.yml ps | grep -q "redis.*healthy"; do
  echo "Waiting for Redis to be healthy... ($(($RETRY_COUNT+1))/$MAX_RETRIES)"
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Error: Redis service did not become healthy within the timeout period."
    exit 1
  fi
done

# Create test database
echo "Creating test database..."
docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;" || {
  echo "Error: Could not drop test database."
  exit 1
}
docker compose -f docker-compose.dev.yml exec -T db psql -U postgres -c "CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;" || {
  echo "Error: Could not create test database."
  exit 1
}

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
  api python -m alembic upgrade head || {
    echo "Error: Failed to run database migrations."
    exit 1
  }

echo "Test environment initialized successfully!"
echo "You can now run tests with: make test"
