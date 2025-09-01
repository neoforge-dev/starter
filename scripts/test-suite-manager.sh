#!/bin/bash
# Comprehensive Test Suite Manager for NeoForge Development
# Manages both backend and frontend tests with optimization strategies

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Test execution metrics
START_TIME=$(date +%s)

log() {
    local color=$1
    shift
    echo -e "${!color}$*${NC}"
}

show_usage() {
    echo "NeoForge Test Suite Manager"
    echo "============================"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  fast          - Run fast unit tests (~10s)"
    echo "  smoke         - Run smoke tests (~30s)"
    echo "  integration   - Run integration tests (~2-3min)"
    echo "  full          - Run complete test suite (~5-8min)"
    echo "  ci            - Run CI-optimized tests (~3-5min)"
    echo "  watch         - Run tests in watch mode"
    echo "  coverage      - Run tests with coverage analysis"
    echo "  fix           - Run and fix failing tests automatically"
    echo ""
    echo "Options:"
    echo "  --backend-only    Run only backend tests"
    echo "  --frontend-only   Run only frontend tests"
    echo "  --parallel        Run backend and frontend tests in parallel"
    echo "  --verbose         Show detailed output"
    echo "  --bail-fast       Stop on first failure"
    echo ""
    echo "Examples:"
    echo "  $0 fast                    # Quick unit tests"
    echo "  $0 integration --parallel  # Parallel integration tests"
    echo "  $0 full --verbose          # Complete suite with details"
}

check_requirements() {
    log BLUE "🔍 Checking requirements..."

    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_ROOT/docker-compose.yml" ]]; then
        log RED "❌ Not in NeoForge project root directory"
        exit 1
    fi

    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        log RED "❌ Node.js not found"
        exit 1
    fi

    # Check Python
    if ! command -v python &> /dev/null; then
        log RED "❌ Python not found"
        exit 1
    fi

    log GREEN "✓ Requirements check passed"
}

run_backend_tests() {
    local mode=$1
    local options=${2:-""}

    log BLUE "🐍 Running backend tests ($mode mode)..."
    cd "$BACKEND_DIR"

    case "$mode" in
        "fast"|"unit")
            ./scripts/test-fast.sh unit
            ;;
        "smoke")
            ./scripts/test-fast.sh quick
            ;;
        "integration")
            ./scripts/test-fast.sh integration
            ;;
        "full")
            ./scripts/test-fast.sh all
            ;;
        "coverage")
            ./scripts/test-fast.sh coverage
            ;;
        *)
            log RED "Unknown backend test mode: $mode"
            return 1
            ;;
    esac

    log GREEN "✓ Backend tests completed"
}

run_frontend_tests() {
    local mode=$1
    local options=${2:-""}

    log BLUE "🌐 Running frontend tests ($mode mode)..."
    cd "$FRONTEND_DIR"

    case "$mode" in
        "fast"|"unit")
            node scripts/test-fast.js unit
            ;;
        "smoke")
            node scripts/test-fast.js quick
            ;;
        "integration")
            node scripts/test-fast.js integration
            ;;
        "full")
            node scripts/test-fast.js all
            ;;
        "coverage")
            node scripts/test-fast.js coverage
            ;;
        "accessibility")
            node scripts/test-fast.js accessibility
            ;;
        *)
            log RED "Unknown frontend test mode: $mode"
            return 1
            ;;
    esac

    log GREEN "✓ Frontend tests completed"
}

run_parallel_tests() {
    local mode=$1

    log PURPLE "⚡ Running parallel tests ($mode mode)..."

    # Run backend and frontend tests in parallel
    run_backend_tests "$mode" &
    BACKEND_PID=$!

    run_frontend_tests "$mode" &
    FRONTEND_PID=$!

    # Wait for both to complete
    wait $BACKEND_PID
    BACKEND_RESULT=$?

    wait $FRONTEND_PID
    FRONTEND_RESULT=$?

    if [[ $BACKEND_RESULT -eq 0 && $FRONTEND_RESULT -eq 0 ]]; then
        log GREEN "✓ All parallel tests passed"
        return 0
    else
        log RED "❌ Some parallel tests failed"
        return 1
    fi
}

show_metrics() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))

    log PURPLE "📊 Test Execution Metrics"
    log PURPLE "========================="
    log PURPLE "Total Duration: ${minutes}m ${seconds}s"

    # Show test counts if possible
    if [[ -f "$BACKEND_DIR/test-results.json" ]]; then
        log PURPLE "Backend Tests: $(jq -r '.stats.tests' "$BACKEND_DIR/test-results.json" 2>/dev/null || echo "N/A")"
    fi

    if [[ -f "$FRONTEND_DIR/test-results.json" ]]; then
        log PURPLE "Frontend Tests: $(jq -r '.numTotalTests' "$FRONTEND_DIR/test-results.json" 2>/dev/null || echo "N/A")"
    fi
}

main() {
    local command=${1:-"fast"}
    local backend_only=false
    local frontend_only=false
    local parallel=false
    local verbose=false
    local bail_fast=false

    # Parse options
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                backend_only=true
                shift
                ;;
            --frontend-only)
                frontend_only=true
                shift
                ;;
            --parallel)
                parallel=true
                shift
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            --bail-fast)
                bail_fast=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log RED "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Show header
    log BLUE "🚀 NeoForge Test Suite Manager"
    log BLUE "==============================="
    log BLUE "Command: $command"
    if $parallel; then log BLUE "Mode: Parallel execution"; fi
    if $verbose; then log BLUE "Verbosity: Enhanced"; fi
    echo ""

    # Check requirements
    check_requirements

    case "$command" in
        "fast"|"unit")
            log YELLOW "Running fast unit tests (estimate: ~10-15 seconds)"
            ;;
        "smoke")
            log YELLOW "Running smoke tests (estimate: ~30-45 seconds)"
            ;;
        "integration")
            log YELLOW "Running integration tests (estimate: ~2-3 minutes)"
            ;;
        "full")
            log YELLOW "Running full test suite (estimate: ~5-8 minutes)"
            ;;
        "coverage")
            log YELLOW "Running coverage analysis (estimate: ~3-5 minutes)"
            ;;
        "ci")
            command="integration" # Map CI to integration for now
            log YELLOW "Running CI-optimized tests (estimate: ~3-5 minutes)"
            ;;
        *)
            log RED "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac

    # Execute tests based on options
    if $parallel && ! $backend_only && ! $frontend_only; then
        run_parallel_tests "$command"
    elif $backend_only; then
        run_backend_tests "$command"
    elif $frontend_only; then
        run_frontend_tests "$command"
    else
        # Sequential execution (default)
        if ! $frontend_only; then
            run_backend_tests "$command"
        fi
        if ! $backend_only; then
            run_frontend_tests "$command"
        fi
    fi

    # Show final results
    echo ""
    show_metrics
    log GREEN "🎉 Test suite execution completed successfully!"
}

# Handle script interruption
trap 'log RED "Test execution interrupted"; exit 1' INT TERM

# Run main function
main "$@"
