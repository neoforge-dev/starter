#!/bin/bash

# Zero-Downtime Deployment Script for NeoForge
# Implements blue-green deployment strategy with health checks and rollback capability

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$DEPLOY_DIR")"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.blue-green.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
CURRENT_SLOT=""
TARGET_SLOT=""
TIMEOUT=300
HEALTH_CHECK_TIMEOUT=120
DRY_RUN=false
SKIP_TESTS=false
ROLLBACK=false

# Logging function
log() {
    local level=$1
    shift
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case $level in
        INFO)  echo -e "${GREEN}[$timestamp] INFO:${NC} $*" ;;
        WARN)  echo -e "${YELLOW}[$timestamp] WARN:${NC} $*" ;;
        ERROR) echo -e "${RED}[$timestamp] ERROR:${NC} $*" ;;
        DEBUG) echo -e "${BLUE}[$timestamp] DEBUG:${NC} $*" ;;
    esac
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Zero-downtime deployment script for NeoForge using blue-green strategy.

OPTIONS:
    -h, --help              Show this help message
    -d, --dry-run           Show what would be done without executing
    -s, --skip-tests        Skip health checks and tests
    -r, --rollback          Rollback to previous deployment
    -t, --timeout SECONDS   Deployment timeout (default: 300)
    --health-timeout SEC    Health check timeout (default: 120)

EXAMPLES:
    # Deploy new version
    $0

    # Dry run deployment
    $0 --dry-run

    # Rollback to previous version
    $0 --rollback

    # Deploy with custom timeout
    $0 --timeout 600
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --health-timeout)
            HEALTH_CHECK_TIMEOUT="$2"
            shift 2
            ;;
        *)
            log ERROR "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Function to execute or show command
execute() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log DEBUG "Would execute: $*"
    else
        log DEBUG "Executing: $*"
        "$@"
    fi
}

# Function to check if service is healthy
check_service_health() {
    local service=$1
    local timeout=${2:-60}
    local start_time=$(date +%s)

    log INFO "Checking health of $service (timeout: ${timeout}s)"

    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if [[ $elapsed -gt $timeout ]]; then
            log ERROR "Health check timeout for $service after ${timeout}s"
            return 1
        fi

        # Check Docker container health
        local health_status=$(docker compose -f "$COMPOSE_FILE" ps --format json | jq -r ".[] | select(.Service == \"$service\") | .Health" 2>/dev/null || echo "unknown")

        if [[ "$health_status" == "healthy" ]]; then
            log INFO "$service is healthy after ${elapsed}s"
            return 0
        elif [[ "$health_status" == "unhealthy" ]]; then
            log ERROR "$service is unhealthy"
            return 1
        fi

        log DEBUG "$service health status: $health_status (${elapsed}s elapsed)"
        sleep 5
    done
}

# Function to get current active slot
get_current_slot() {
    local traefik_labels=$(docker compose -f "$COMPOSE_FILE" ps traefik --format json 2>/dev/null | jq -r '.[0].Labels // {}' 2>/dev/null || echo "{}")

    # Check which frontend is currently enabled in Traefik
    local blue_enabled=$(docker inspect $(docker compose -f "$COMPOSE_FILE" ps -q frontend-blue) 2>/dev/null | jq -r '.[0].Config.Labels["traefik.enable"] // "false"' 2>/dev/null || echo "false")
    local green_enabled=$(docker inspect $(docker compose -f "$COMPOSE_FILE" ps -q frontend-green) 2>/dev/null | jq -r '.[0].Config.Labels["traefik.enable"] // "false"' 2>/dev/null || echo "false")

    if [[ "$blue_enabled" == "true" ]]; then
        echo "blue"
    elif [[ "$green_enabled" == "true" ]]; then
        echo "green"
    else
        # Default to blue if neither is clearly active
        echo "blue"
    fi
}

# Function to get target slot
get_target_slot() {
    if [[ "$CURRENT_SLOT" == "blue" ]]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Function to run database migrations
run_migrations() {
    log INFO "Running database migrations"
    execute docker compose -f "$COMPOSE_FILE" run --rm migrator
}

# Function to build new images
build_images() {
    log INFO "Building Docker images"

    # Build backend
    log INFO "Building backend image"
    execute docker compose -f "$COMPOSE_FILE" build api-${TARGET_SLOT}

    # Build frontend
    log INFO "Building frontend image"
    execute docker compose -f "$COMPOSE_FILE" build frontend-${TARGET_SLOT}
}

# Function to scale up target slot
scale_up_target() {
    log INFO "Scaling up $TARGET_SLOT slot"

    # Scale up API
    execute docker compose -f "$COMPOSE_FILE" up -d --scale api-${TARGET_SLOT}=2 api-${TARGET_SLOT}

    # Scale up Frontend
    execute docker compose -f "$COMPOSE_FILE" up -d --scale frontend-${TARGET_SLOT}=2 frontend-${TARGET_SLOT}

    # Wait for services to be healthy
    if [[ "$SKIP_TESTS" != "true" ]]; then
        check_service_health "api-${TARGET_SLOT}" "$HEALTH_CHECK_TIMEOUT"
        check_service_health "frontend-${TARGET_SLOT}" "$HEALTH_CHECK_TIMEOUT"
    fi
}

# Function to switch traffic to target slot
switch_traffic() {
    log INFO "Switching traffic from $CURRENT_SLOT to $TARGET_SLOT"

    if [[ "$DRY_RUN" != "true" ]]; then
        # Enable target slot in Traefik
        docker compose -f "$COMPOSE_FILE" exec traefik \
            sh -c "curl -X PUT localhost:8080/api/http/routers/api-${TARGET_SLOT} -d '{\"rule\":\"Host(\`api.localhost\`) || PathPrefix(\`/api\`)\",\"priority\":200}'" 2>/dev/null || true

        docker compose -f "$COMPOSE_FILE" exec traefik \
            sh -c "curl -X PUT localhost:8080/api/http/routers/frontend-${TARGET_SLOT} -d '{\"rule\":\"Host(\`app.localhost\`)\",\"priority\":200}'" 2>/dev/null || true

        # Wait a moment for traffic to switch
        sleep 10

        # Disable current slot in Traefik
        docker compose -f "$COMPOSE_FILE" exec traefik \
            sh -c "curl -X DELETE localhost:8080/api/http/routers/api-${CURRENT_SLOT}" 2>/dev/null || true

        docker compose -f "$COMPOSE_FILE" exec traefik \
            sh -c "curl -X DELETE localhost:8080/api/http/routers/frontend-${CURRENT_SLOT}" 2>/dev/null || true
    fi

    log INFO "Traffic switched to $TARGET_SLOT slot"
}

# Function to scale down old slot
scale_down_old() {
    log INFO "Scaling down $CURRENT_SLOT slot"

    # Scale down old slot
    execute docker compose -f "$COMPOSE_FILE" up -d --scale api-${CURRENT_SLOT}=0 api-${CURRENT_SLOT}
    execute docker compose -f "$COMPOSE_FILE" up -d --scale frontend-${CURRENT_SLOT}=0 frontend-${CURRENT_SLOT}
}

# Function to run smoke tests
run_smoke_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log WARN "Skipping smoke tests"
        return 0
    fi

    log INFO "Running smoke tests against $TARGET_SLOT slot"

    # Basic health checks
    if ! curl -f http://localhost:80/health >/dev/null 2>&1; then
        log ERROR "Frontend health check failed"
        return 1
    fi

    if ! curl -f http://localhost:8080/health >/dev/null 2>&1; then
        log ERROR "API health check failed"
        return 1
    fi

    # Load test
    log INFO "Running basic load test"
    for i in {1..10}; do
        curl -s http://localhost:80 >/dev/null &
        curl -s http://localhost:8080/health >/dev/null &
    done
    wait

    log INFO "Smoke tests passed"
    return 0
}

# Function to rollback deployment
rollback_deployment() {
    log WARN "Rolling back deployment from $TARGET_SLOT to $CURRENT_SLOT"

    # Re-enable old slot
    scale_up_target() {
        local slot=$CURRENT_SLOT
        execute docker compose -f "$COMPOSE_FILE" up -d --scale api-${slot}=2 api-${slot}
        execute docker compose -f "$COMPOSE_FILE" up -d --scale frontend-${slot}=2 frontend-${slot}
    }

    # Switch traffic back
    switch_traffic

    # Scale down failed slot
    execute docker compose -f "$COMPOSE_FILE" up -d --scale api-${TARGET_SLOT}=0 api-${TARGET_SLOT}
    execute docker compose -f "$COMPOSE_FILE" up -d --scale frontend-${TARGET_SLOT}=0 frontend-${TARGET_SLOT}

    log INFO "Rollback completed"
}

# Function to cleanup old images
cleanup_old_images() {
    log INFO "Cleaning up old Docker images"
    execute docker system prune -f --filter "until=24h"
}

# Main deployment function
main() {
    log INFO "Starting zero-downtime deployment"

    # Pre-flight checks
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log ERROR "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        log ERROR "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        log ERROR "jq is required but not installed"
        exit 1
    fi

    # Get current and target slots
    CURRENT_SLOT=$(get_current_slot)
    TARGET_SLOT=$(get_target_slot)

    log INFO "Current slot: $CURRENT_SLOT"
    log INFO "Target slot: $TARGET_SLOT"

    if [[ "$ROLLBACK" == "true" ]]; then
        # Rollback deployment
        local temp_slot=$CURRENT_SLOT
        CURRENT_SLOT=$TARGET_SLOT
        TARGET_SLOT=$temp_slot
        rollback_deployment
        exit 0
    fi

    # Start deployment timer
    local start_time=$(date +%s)

    # Trap to handle rollback on failure
    trap 'log ERROR "Deployment failed, initiating rollback"; rollback_deployment; exit 1' ERR

    # Deployment steps
    if [[ "$DRY_RUN" != "true" ]]; then
        # Ensure base services are running
        execute docker compose -f "$COMPOSE_FILE" up -d db cache traefik

        # Run migrations
        run_migrations
    fi

    # Build new images
    build_images

    # Scale up target slot
    scale_up_target

    # Run smoke tests
    run_smoke_tests

    # Switch traffic
    switch_traffic

    # Verify deployment
    sleep 30
    run_smoke_tests

    # Scale down old slot
    scale_down_old

    # Cleanup
    cleanup_old_images

    # Calculate deployment time
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))

    log INFO "Deployment completed successfully in ${total_time}s"
    log INFO "Active slot is now: $TARGET_SLOT"

    # Remove error trap
    trap - ERR
}

# Run main function
main "$@"
