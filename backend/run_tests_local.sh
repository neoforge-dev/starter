#!/bin/bash

# Local Test Runner Script
# This script runs tests locally with proper Docker service configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Starting Local Test Infrastructure Setup...${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start required Docker services
echo -e "${YELLOW}🚀 Starting required Docker services...${NC}"
cd /Users/bogdan/work/neoforge-dev/neoforge-starter
docker compose up -d db db_test cache

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker compose ps --filter "name=neoforge-starter-db_test" --format "{{.State}}" | grep -q "running" && \
       docker compose ps --filter "name=neoforge-starter-cache" --format "{{.State}}" | grep -q "running"; then
        echo -e "${GREEN}✅ Services are ready!${NC}"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts - waiting for services..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Services failed to start within timeout${NC}"
    exit 1
fi

# Load test environment variables
echo -e "${YELLOW}🔧 Loading test environment...${NC}"
cd /Users/bogdan/work/neoforge-dev/neoforge-starter/backend
export $(cat .env.test | grep -v '^#' | xargs)

# Verify database connectivity
echo -e "${YELLOW}🔌 Testing database connectivity...${NC}"
timeout 10 python -c "
import asyncio
import asyncpg
async def test_db():
    try:
        conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:55433/neoforge_test')
        await conn.execute('SELECT 1')
        await conn.close()
        print('✅ Database connection successful')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        exit(1)
asyncio.run(test_db())
"

# Run tests with proper configuration
echo -e "${YELLOW}🧪 Running tests...${NC}"

# Default: run all tests if no arguments provided
if [ $# -eq 0 ]; then
    pytest -v --tb=short --maxfail=10
else
    # Run specific tests passed as arguments
    pytest "$@" -v --tb=short --maxfail=10
fi

echo -e "${GREEN}🎉 Test execution completed!${NC}"