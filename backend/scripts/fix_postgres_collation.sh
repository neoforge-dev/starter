#!/bin/bash

# Script to fix PostgreSQL collation issues by recreating the container with proper locale settings
# Usage: ./scripts/fix_postgres_collation.sh

set -e

echo "Fixing PostgreSQL collation issues..."

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose -f backend/docker-compose.dev.yml down

# Create a temporary docker-compose override file with proper locale settings
echo "Creating docker-compose override file with proper locale settings..."
cat > backend/docker-compose.override.yml << EOF
version: "3.8"

services:
  db:
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
      - LANG=en_US.utf8
      - LC_COLLATE=en_US.utf8
      - LC_CTYPE=en_US.utf8
    command: postgres -c 'max_connections=100' -c 'shared_buffers=256MB' -c 'client_encoding=UTF8' -c 'default_text_search_config=pg_catalog.english'
    volumes:
      - postgres_data:/var/lib/postgresql/data
EOF

# Remove the existing volume to ensure clean state
echo "Removing existing PostgreSQL data volume..."
docker volume rm neoforge_postgres_data || true

# Start the containers with the new configuration
echo "Starting containers with fixed configuration..."
docker compose -f backend/docker-compose.dev.yml up -d db

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Create the test database with proper encoding and collation
echo "Creating test database with proper encoding and collation..."
docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "DROP DATABASE IF EXISTS test_db;"
docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "CREATE DATABASE test_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE=template0;"

# Verify the database was created successfully
echo "Verifying test database..."
docker compose -f backend/docker-compose.dev.yml exec db psql -U postgres -c "SELECT datname, datcollate, datctype FROM pg_database WHERE datname = 'test_db';"

# Initialize the test database schema
echo "Initializing test database schema..."
docker compose -f backend/docker-compose.dev.yml run --rm api python -m app.db.init_db

echo "PostgreSQL collation issues fixed successfully!"
echo "You can now run tests with: ./scripts/run_tests.sh" 