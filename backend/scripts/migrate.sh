#!/bin/sh
set -e
exec python -c "import sys; from alembic.config import main; sys.exit(main())" upgrade head

# Initialize migrations if they don't exist
if [ ! -d "app/migrations/versions" ]; then
    echo "Initializing migrations directory..."
    mkdir -p app/migrations/versions
fi

# Check if we need to create a new migration
if [ "$1" = "new" ]; then
    if [ -z "$2" ]; then
        echo "Error: Migration name required"
        echo "Usage: ./scripts/migrate.sh new <migration_name>"
        exit 1
    fi
    echo "Creating new migration: $2"
    docker compose run --rm api alembic revision --autogenerate -m "$2"
    exit 0
fi

# Run migrations
echo "Running migrations..."
docker compose run --rm api alembic upgrade head
