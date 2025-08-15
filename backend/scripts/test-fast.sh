#!/bin/bash
# Fast test execution script for development workflow

set -e

echo "🚀 NeoForge Fast Test Suite"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test modes
MODE=${1:-"unit"}

case "$MODE" in
  "unit")
    echo -e "${BLUE}Running unit tests (no database required)${NC}"
    echo "Duration estimate: ~1-2 seconds"
    python -m pytest unit_tests/ -v --no-cov --tb=short --durations=5
    ;;
    
  "quick")
    echo -e "${BLUE}Running quick test suite (critical tests only)${NC}"
    echo "Duration estimate: ~30 seconds"
    # Run unit tests first (fastest)
    python -m pytest unit_tests/ -v --no-cov --tb=short -q
    echo -e "${GREEN}✓ Unit tests passed${NC}"
    
    # Run smoke tests for core functionality
    python -m pytest tests/core/test_config.py tests/core/test_security.py -v --no-cov --tb=short -q
    echo -e "${GREEN}✓ Core smoke tests passed${NC}"
    ;;
    
  "integration")
    echo -e "${BLUE}Running integration tests (requires database)${NC}"
    echo "Duration estimate: ~3-5 minutes"
    
    # Check if database is available
    if ! python -c "import socket; sock = socket.socket(); sock.settimeout(5); result = sock.connect_ex(('db', 5432)); sock.close(); exit(result != 0)" 2>/dev/null; then
      echo -e "${YELLOW}Database not available - running with Docker Compose${NC}"
      docker compose run --rm api_test pytest tests/ -x --tb=short --maxfail=5
    else
      echo -e "${YELLOW}Database available - running direct tests${NC}"
      python -m pytest tests/ -x --tb=short --maxfail=5 --no-cov
    fi
    ;;
    
  "coverage")
    echo -e "${BLUE}Running tests with coverage analysis${NC}"
    echo "Duration estimate: ~5-10 minutes"
    
    if ! python -c "import socket; sock = socket.socket(); sock.settimeout(5); result = sock.connect_ex(('db', 5432)); sock.close(); exit(result != 0)" 2>/dev/null; then
      docker compose run --rm api_test pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
    else
      python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing
    fi
    ;;
    
  "all")
    echo -e "${BLUE}Running comprehensive test suite${NC}"
    echo "Duration estimate: ~8-15 minutes"
    
    # 1. Unit tests (fastest)
    echo -e "${YELLOW}Phase 1: Unit Tests${NC}"
    python -m pytest unit_tests/ -v --no-cov --tb=short
    echo -e "${GREEN}✓ Unit tests completed${NC}"
    
    # 2. Core functionality tests
    echo -e "${YELLOW}Phase 2: Core Tests${NC}"
    python -m pytest tests/test_*simple* -v --no-cov --tb=short
    echo -e "${GREEN}✓ Simple tests completed${NC}"
    
    # 3. Integration tests (if database available)
    echo -e "${YELLOW}Phase 3: Integration Tests${NC}"
    if ! python -c "import socket; sock = socket.socket(); sock.settimeout(5); result = sock.connect_ex(('db', 5432)); sock.close(); exit(result != 0)" 2>/dev/null; then
      docker compose run --rm api_test pytest tests/ --cov=app --cov-report=html
    else
      echo -e "${YELLOW}Database not available - skipping integration tests${NC}"
    fi
    ;;
    
  *)
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Available modes:"
    echo "  unit        - Unit tests only (~1-2s)"
    echo "  quick       - Critical tests (~30s)"
    echo "  integration - Full integration tests (~3-5min)"
    echo "  coverage    - Tests with coverage (~5-10min)"
    echo "  all         - Complete test suite (~8-15min)"
    echo ""
    echo "Usage: $0 [mode]"
    exit 1
    ;;
esac

echo -e "${GREEN}🎉 Test execution completed successfully!${NC}"