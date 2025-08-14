#!/bin/bash

# Health Check Script for NeoForge Production
# Validates all services and provides detailed status report

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.blue-green.yml"
TIMEOUT=30

# Health check results
HEALTH_STATUS=()
OVERALL_HEALTHY=true

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

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local timeout=${4:-$TIMEOUT}
    
    log DEBUG "Checking $name: $url"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" -m "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        log INFO "✅ $name: Healthy (HTTP $response)"
        HEALTH_STATUS+=("$name:HEALTHY")
        return 0
    else
        log ERROR "❌ $name: Unhealthy (HTTP $response, expected $expected_status)"
        HEALTH_STATUS+=("$name:UNHEALTHY")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check Docker service health
check_docker_service() {
    local service=$1
    local compose_file=${2:-$COMPOSE_FILE}
    
    log DEBUG "Checking Docker service: $service"
    
    # Check if service is running
    local running=$(docker compose -f "$compose_file" ps --format json | jq -r ".[] | select(.Service == \"$service\") | .State" 2>/dev/null || echo "unknown")
    
    if [[ "$running" != "running" ]]; then
        log ERROR "❌ $service: Not running (State: $running)"
        HEALTH_STATUS+=("$service:DOWN")
        OVERALL_HEALTHY=false
        return 1
    fi
    
    # Check health status if available
    local health=$(docker compose -f "$compose_file" ps --format json | jq -r ".[] | select(.Service == \"$service\") | .Health" 2>/dev/null || echo "unknown")
    
    case $health in
        "healthy")
            log INFO "✅ $service: Healthy"
            HEALTH_STATUS+=("$service:HEALTHY")
            return 0
            ;;
        "unhealthy")
            log ERROR "❌ $service: Unhealthy"
            HEALTH_STATUS+=("$service:UNHEALTHY")
            OVERALL_HEALTHY=false
            return 1
            ;;
        "starting")
            log WARN "⚠️  $service: Starting"
            HEALTH_STATUS+=("$service:STARTING")
            return 0
            ;;
        *)
            log INFO "✅ $service: Running (no health check)"
            HEALTH_STATUS+=("$service:RUNNING")
            return 0
            ;;
    esac
}

# Function to check database connectivity
check_database() {
    log DEBUG "Checking database connectivity"
    
    local db_check=$(docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U postgres 2>/dev/null || echo "failed")
    
    if [[ "$db_check" == *"accepting connections"* ]]; then
        log INFO "✅ Database: Connection healthy"
        HEALTH_STATUS+=("database:HEALTHY")
        return 0
    else
        log ERROR "❌ Database: Connection failed"
        HEALTH_STATUS+=("database:UNHEALTHY")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    log DEBUG "Checking Redis connectivity"
    
    local redis_check=$(docker compose -f "$COMPOSE_FILE" exec -T cache redis-cli ping 2>/dev/null || echo "failed")
    
    if [[ "$redis_check" == "PONG" ]]; then
        log INFO "✅ Redis: Connection healthy"
        HEALTH_STATUS+=("redis:HEALTHY")
        return 0
    else
        log ERROR "❌ Redis: Connection failed"
        HEALTH_STATUS+=("redis:UNHEALTHY")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    log DEBUG "Checking disk space"
    
    local disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [[ $disk_usage -lt 80 ]]; then
        log INFO "✅ Disk Space: ${disk_usage}% used"
        HEALTH_STATUS+=("disk:HEALTHY")
        return 0
    elif [[ $disk_usage -lt 90 ]]; then
        log WARN "⚠️  Disk Space: ${disk_usage}% used (Warning threshold)"
        HEALTH_STATUS+=("disk:WARNING")
        return 0
    else
        log ERROR "❌ Disk Space: ${disk_usage}% used (Critical threshold)"
        HEALTH_STATUS+=("disk:CRITICAL")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check memory usage
check_memory_usage() {
    log DEBUG "Checking memory usage"
    
    local memory_usage=$(free | awk '/^Mem:/{printf("%.0f", $3/$2*100)}')
    
    if [[ $memory_usage -lt 85 ]]; then
        log INFO "✅ Memory: ${memory_usage}% used"
        HEALTH_STATUS+=("memory:HEALTHY")
        return 0
    elif [[ $memory_usage -lt 95 ]]; then
        log WARN "⚠️  Memory: ${memory_usage}% used (Warning threshold)"
        HEALTH_STATUS+=("memory:WARNING")
        return 0
    else
        log ERROR "❌ Memory: ${memory_usage}% used (Critical threshold)"
        HEALTH_STATUS+=("memory:CRITICAL")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check load average
check_load_average() {
    log DEBUG "Checking system load"
    
    local load_1min=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    local load_percentage=$(echo "$load_1min * 100 / $cpu_count" | bc -l | awk '{printf "%.0f", $0}')
    
    if [[ $load_percentage -lt 80 ]]; then
        log INFO "✅ Load Average: ${load_1min} (${load_percentage}% of ${cpu_count} cores)"
        HEALTH_STATUS+=("load:HEALTHY")
        return 0
    elif [[ $load_percentage -lt 100 ]]; then
        log WARN "⚠️  Load Average: ${load_1min} (${load_percentage}% of ${cpu_count} cores)"
        HEALTH_STATUS+=("load:WARNING")
        return 0
    else
        log ERROR "❌ Load Average: ${load_1min} (${load_percentage}% of ${cpu_count} cores)"
        HEALTH_STATUS+=("load:CRITICAL")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to check container resource usage
check_container_resources() {
    log DEBUG "Checking container resource usage"
    
    local high_memory_containers=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemPerc}}" | awk 'NR>1 && $2+0 > 90 {print $1}')
    local high_cpu_containers=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | awk 'NR>1 && $2+0 > 90 {print $1}')
    
    if [[ -z "$high_memory_containers" && -z "$high_cpu_containers" ]]; then
        log INFO "✅ Container Resources: All containers within limits"
        HEALTH_STATUS+=("containers:HEALTHY")
        return 0
    else
        if [[ -n "$high_memory_containers" ]]; then
            log ERROR "❌ High Memory Containers: $high_memory_containers"
        fi
        if [[ -n "$high_cpu_containers" ]]; then
            log ERROR "❌ High CPU Containers: $high_cpu_containers"
        fi
        HEALTH_STATUS+=("containers:UNHEALTHY")
        OVERALL_HEALTHY=false
        return 1
    fi
}

# Function to generate health report
generate_health_report() {
    echo ""
    echo "=================================="
    echo "     NEOFORGE HEALTH REPORT"
    echo "=================================="
    echo "Timestamp: $(date)"
    echo ""
    
    # Service Status Summary
    echo "SERVICE STATUS:"
    echo "---------------"
    for status in "${HEALTH_STATUS[@]}"; do
        IFS=':' read -r service state <<< "$status"
        case $state in
            "HEALTHY"|"RUNNING")
                echo -e "✅ ${service}: ${GREEN}${state}${NC}"
                ;;
            "STARTING"|"WARNING")
                echo -e "⚠️  ${service}: ${YELLOW}${state}${NC}"
                ;;
            *)
                echo -e "❌ ${service}: ${RED}${state}${NC}"
                ;;
        esac
    done
    
    echo ""
    echo "OVERALL STATUS:"
    echo "---------------"
    if [[ "$OVERALL_HEALTHY" == "true" ]]; then
        echo -e "✅ ${GREEN}SYSTEM HEALTHY${NC}"
        return 0
    else
        echo -e "❌ ${RED}SYSTEM UNHEALTHY${NC}"
        echo ""
        echo "RECOMMENDED ACTIONS:"
        echo "- Check service logs: docker-compose -f $COMPOSE_FILE logs [service]"
        echo "- Restart unhealthy services: docker-compose -f $COMPOSE_FILE restart [service]"
        echo "- Monitor resource usage: docker stats"
        echo "- Check disk space: df -h"
        return 1
    fi
}

# Main health check function
main() {
    log INFO "Starting NeoForge health check"
    
    # Check if Docker Compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log ERROR "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # System-level checks
    check_disk_space || true
    check_memory_usage || true
    check_load_average || true
    
    # Docker service checks
    check_docker_service "db" || true
    check_docker_service "cache" || true
    check_docker_service "traefik" || true
    
    # Check active slot services
    local active_slot=$(docker compose -f "$COMPOSE_FILE" ps --format json | jq -r '.[] | select(.Service | startswith("api-")) | select(.State == "running") | .Service' | head -1 | sed 's/api-//')
    
    if [[ -n "$active_slot" ]]; then
        log INFO "Active deployment slot: $active_slot"
        check_docker_service "api-${active_slot}" || true
        check_docker_service "frontend-${active_slot}" || true
    else
        log WARN "No active deployment slot detected"
    fi
    
    # Database and cache connectivity
    check_database || true
    check_redis || true
    
    # Container resource usage
    check_container_resources || true
    
    # HTTP endpoint checks
    check_http_endpoint "Frontend Health" "http://localhost:80/health" 200 || true
    check_http_endpoint "API Health" "http://localhost:8080/health" 200 || true
    
    # Generate final report
    generate_health_report
    
    # Exit with appropriate code
    if [[ "$OVERALL_HEALTHY" == "true" ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run health check
main "$@"