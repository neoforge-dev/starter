#!/bin/bash

# NeoForge Deployment Smoke Tests
# Comprehensive post-deployment validation suite

set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:80}"
TIMEOUT="${TIMEOUT:-30}"
RETRIES="${RETRIES:-5}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Retry function with timeout
retry_with_timeout() {
    local retries=$1
    local delay=$2
    local timeout=$3
    local command="${@:4}"
    
    for i in $(seq 1 $retries); do
        if timeout $timeout bash -c "$command"; then
            return 0
        fi
        if [ $i -lt $retries ]; then
            log_warning "Attempt $i failed, retrying in ${delay}s..."
            sleep $delay
        fi
    done
    return 1
}

# Test functions
test_api_health() {
    log_info "Testing API health endpoint..."
    
    if retry_with_timeout $RETRIES 3 $TIMEOUT "curl -sf $API_BASE_URL/health"; then
        log_success "✅ API health check passed"
        return 0
    else
        log_error "❌ API health check failed"
        return 1
    fi
}

test_frontend_availability() {
    log_info "Testing frontend availability..."
    
    if retry_with_timeout $RETRIES 3 $TIMEOUT "curl -sf $FRONTEND_BASE_URL/ -o /dev/null"; then
        log_success "✅ Frontend availability check passed"
        return 0
    else
        log_error "❌ Frontend availability check failed"
        return 1
    fi
}

test_database_connectivity() {
    log_info "Testing database connectivity..."
    
    if retry_with_timeout $RETRIES 5 $TIMEOUT "curl -sf $API_BASE_URL/api/v1/health/db"; then
        log_success "✅ Database connectivity test passed"
        return 0
    else
        log_warning "⚠️  Database connectivity test failed (endpoint may not exist)"
        return 1
    fi
}

test_redis_connectivity() {
    log_info "Testing Redis connectivity..."
    
    if retry_with_timeout $RETRIES 5 $TIMEOUT "curl -sf $API_BASE_URL/api/v1/health/cache"; then
        log_success "✅ Redis connectivity test passed"
        return 0
    else
        log_warning "⚠️  Redis connectivity test failed (endpoint may not exist)"
        return 1
    fi
}

test_critical_endpoints() {
    log_info "Testing critical API endpoints..."
    
    local endpoints=(
        "/api/v1/status"
        "/docs"
        "/metrics"
    )
    
    local passed=0
    local total=${#endpoints[@]}
    
    for endpoint in "${endpoints[@]}"; do
        if retry_with_timeout 3 2 $TIMEOUT "curl -sf $API_BASE_URL$endpoint -o /dev/null"; then
            log_success "✅ API endpoint $endpoint accessible"
            ((passed++))
        else
            log_warning "⚠️  API endpoint $endpoint not accessible"
        fi
    done
    
    if [ $passed -eq $total ]; then
        log_success "✅ All critical endpoints accessible"
        return 0
    elif [ $passed -gt 0 ]; then
        log_warning "⚠️  $passed/$total critical endpoints accessible"
        return 0
    else
        log_error "❌ No critical endpoints accessible"
        return 1
    fi
}

test_performance() {
    log_info "Testing response performance..."
    
    local response_time
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$API_BASE_URL/health" 2>/dev/null || echo "999")
    
    if command -v bc >/dev/null 2>&1; then
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            log_success "✅ Health endpoint response time: ${response_time}s"
            return 0
        else
            log_warning "⚠️  Health endpoint slow response: ${response_time}s (>2s threshold)"
            return 1
        fi
    else
        log_info "Health endpoint response time: ${response_time}s (bc not available for comparison)"
        return 0
    fi
}

test_load_capacity() {
    log_info "Testing basic load capacity..."
    
    local start_time end_time duration
    start_time=$(date +%s.%3N 2>/dev/null || date +%s)
    
    # Run concurrent requests
    local pids=()
    for i in {1..10}; do
        curl -s "$API_BASE_URL/health" > /dev/null &
        pids+=($!)
        curl -s "$FRONTEND_BASE_URL/" > /dev/null &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    end_time=$(date +%s.%3N 2>/dev/null || date +%s)
    
    if command -v bc >/dev/null 2>&1; then
        duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "N/A")
        log_success "✅ 20 concurrent requests completed in ${duration}s"
    else
        log_success "✅ 20 concurrent requests completed"
    fi
    
    return 0
}

test_security_headers() {
    log_info "Testing security headers..."
    
    local backend_headers frontend_headers
    backend_headers=$(curl -I "$API_BASE_URL/health" 2>/dev/null || echo "")
    frontend_headers=$(curl -I "$FRONTEND_BASE_URL/" 2>/dev/null || echo "")
    
    local security_score=0
    
    # Check backend security headers
    if echo "$backend_headers" | grep -qi "x-content-type-options"; then
        log_success "✅ Backend has X-Content-Type-Options header"
        ((security_score++))
    else
        log_warning "⚠️  Backend missing X-Content-Type-Options header"
    fi
    
    if echo "$backend_headers" | grep -qi "x-frame-options"; then
        log_success "✅ Backend has X-Frame-Options header"
        ((security_score++))
    else
        log_warning "⚠️  Backend missing X-Frame-Options header"
    fi
    
    # Check frontend security headers
    if echo "$frontend_headers" | grep -qi "x-frame-options\|content-security-policy"; then
        log_success "✅ Frontend has security headers"
        ((security_score++))
    else
        log_warning "⚠️  Frontend missing security headers"
    fi
    
    if [ $security_score -gt 0 ]; then
        log_success "✅ Security headers check completed ($security_score/3 headers found)"
        return 0
    else
        log_warning "⚠️  No security headers detected"
        return 1
    fi
}

# Main test suite
run_smoke_tests() {
    log_info "🧪 Starting NeoForge deployment smoke tests..."
    log_info "API Base URL: $API_BASE_URL"
    log_info "Frontend Base URL: $FRONTEND_BASE_URL"
    log_info "Timeout: ${TIMEOUT}s, Retries: $RETRIES"
    echo ""
    
    local tests=(
        "test_api_health"
        "test_frontend_availability"
        "test_database_connectivity"
        "test_redis_connectivity"
        "test_critical_endpoints"
        "test_performance"
        "test_load_capacity"
        "test_security_headers"
    )
    
    local passed=0
    local failed=0
    local warnings=0
    local total=${#tests[@]}
    
    for test in "${tests[@]}"; do
        echo "----------------------------------------"
        if $test; then
            ((passed++))
        else
            # Check if it was a warning (exit code handled in functions)
            if [[ "$test" == "test_database_connectivity" ]] || [[ "$test" == "test_redis_connectivity" ]]; then
                ((warnings++))
            else
                ((failed++))
            fi
        fi
        echo ""
    done
    
    echo "========================================"
    log_info "📊 Smoke Test Results Summary:"
    log_success "✅ Passed: $passed"
    [ $warnings -gt 0 ] && log_warning "⚠️  Warnings: $warnings"
    [ $failed -gt 0 ] && log_error "❌ Failed: $failed"
    log_info "Total: $total"
    echo ""
    
    if [ $failed -eq 0 ]; then
        log_success "🎉 All critical smoke tests passed!"
        if [ $warnings -gt 0 ]; then
            log_warning "⚠️  Some non-critical warnings detected"
            return 2  # Success with warnings
        fi
        return 0  # Complete success
    else
        log_error "💥 $failed critical tests failed"
        return 1  # Failure
    fi
}

# Help function
show_help() {
    cat << EOF
NeoForge Deployment Smoke Tests

Usage: $0 [OPTIONS]

Options:
    --api-url URL       API base URL (default: http://localhost:8000)
    --frontend-url URL  Frontend base URL (default: http://localhost:80)
    --timeout SECONDS   Request timeout (default: 30)
    --retries COUNT     Number of retries (default: 5)
    --help             Show this help message

Examples:
    $0                                          # Run with defaults
    $0 --api-url https://api.example.com       # Test production API
    $0 --timeout 60 --retries 10               # Increase timeouts
    
Environment Variables:
    API_BASE_URL       Override API base URL
    FRONTEND_BASE_URL  Override frontend base URL
    TIMEOUT           Override request timeout
    RETRIES           Override retry count

Exit Codes:
    0  All tests passed
    1  Critical tests failed
    2  All tests passed with warnings

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --api-url)
                API_BASE_URL="$2"
                shift 2
                ;;
            --frontend-url)
                FRONTEND_BASE_URL="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --retries)
                RETRIES="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    parse_args "$@"
    
    # Validate URLs
    if [[ ! "$API_BASE_URL" =~ ^https?:// ]]; then
        log_error "Invalid API URL: $API_BASE_URL"
        exit 1
    fi
    
    if [[ ! "$FRONTEND_BASE_URL" =~ ^https?:// ]]; then
        log_error "Invalid frontend URL: $FRONTEND_BASE_URL"
        exit 1
    fi
    
    run_smoke_tests
}

# Run main function
main "$@"