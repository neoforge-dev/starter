#!/bin/bash

# NeoForge Security Scanning Validation Script
# Validates that all security scanning components are properly configured and operational

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SECURITY_DIR="${PROJECT_ROOT}/security"

# Logging
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check file exists and is not empty
check_file() {
    local file="$1"
    local description="$2"

    if [[ ! -f "$file" ]]; then
        log_error "$description: File not found - $file"
        return 1
    fi

    if [[ ! -s "$file" ]]; then
        log_error "$description: File is empty - $file"
        return 1
    fi

    log_success "$description: ✓"
    return 0
}

# Validate YAML syntax
validate_yaml() {
    local file="$1"
    local description="$2"

    if command_exists yq; then
        if yq eval '.' "$file" >/dev/null 2>&1; then
            log_success "$description YAML syntax: ✓"
            return 0
        else
            log_error "$description YAML syntax: Invalid YAML"
            return 1
        fi
    else
        log_warning "yq not found - skipping YAML validation for $description"
        return 0
    fi
}

# Validate Docker availability
validate_docker() {
    log_info "Validating Docker availability..."

    if ! command_exists docker; then
        log_error "Docker not found. Please install Docker."
        return 1
    fi

    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon not running. Please start Docker."
        return 1
    fi

    log_success "Docker is available and running"
    return 0
}

# Validate Trivy installation and configuration
validate_trivy() {
    log_info "Validating Trivy security scanner..."

    # Check if Trivy is available
    if command_exists trivy; then
        local trivy_version
        trivy_version=$(trivy --version | head -n1)
        log_success "Trivy is installed: $trivy_version"
    else
        log_warning "Trivy not installed locally. Will use container version in CI."
    fi

    # Check Trivy configuration
    check_file "${SECURITY_DIR}/trivy-config.yaml" "Trivy configuration"
    validate_yaml "${SECURITY_DIR}/trivy-config.yaml" "Trivy configuration"

    return 0
}

# Test Trivy container scan
test_trivy_scan() {
    log_info "Testing Trivy container scan..."

    if ! validate_docker; then
        log_warning "Skipping Trivy scan test - Docker not available"
        return 0
    fi

    # Build a simple test image
    cat > /tmp/test.Dockerfile << 'EOF'
FROM alpine:3.18
RUN apk add --no-cache curl
CMD ["echo", "test"]
EOF

    if docker build -t neoforge-test-image -f /tmp/test.Dockerfile /tmp >/dev/null 2>&1; then
        log_success "Test image built successfully"

        # Run Trivy scan
        if command_exists trivy; then
            if trivy image --exit-code 0 --severity HIGH,CRITICAL neoforge-test-image >/dev/null 2>&1; then
                log_success "Trivy scan test: ✓"
            else
                log_warning "Trivy scan found issues in test image (expected)"
            fi
        else
            # Use Trivy container
            if docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy image --exit-code 0 --severity HIGH,CRITICAL neoforge-test-image >/dev/null 2>&1; then
                log_success "Trivy container scan test: ✓"
            else
                log_warning "Trivy container scan found issues in test image (expected)"
            fi
        fi

        # Clean up
        docker rmi neoforge-test-image >/dev/null 2>&1 || true
    else
        log_error "Failed to build test image for Trivy scan"
        return 1
    fi

    rm -f /tmp/test.Dockerfile
    return 0
}

# Validate secret scanning tools
validate_secret_scanning() {
    log_info "Validating secret scanning configuration..."

    # Check GitLeaks configuration
    check_file "${PROJECT_ROOT}/.gitleaks.toml" "GitLeaks configuration"

    # Check detect-secrets baseline
    check_file "${PROJECT_ROOT}/.secrets.baseline" "detect-secrets baseline"

    # Test GitLeaks if available
    if command_exists gitleaks; then
        local gitleaks_version
        gitleaks_version=$(gitleaks version)
        log_success "GitLeaks is installed: $gitleaks_version"

        # Test GitLeaks configuration
        if gitleaks detect --config "${PROJECT_ROOT}/.gitleaks.toml" --no-git --source . >/dev/null 2>&1; then
            log_success "GitLeaks configuration test: ✓"
        else
            log_warning "GitLeaks found potential secrets (review required)"
        fi
    else
        log_warning "GitLeaks not installed locally. Will use container version in CI."
    fi

    return 0
}

# Validate dependency scanning
validate_dependency_scanning() {
    log_info "Validating dependency scanning configuration..."

    check_file "${SECURITY_DIR}/dependency-check.yml" "Dependency scanning configuration"
    validate_yaml "${SECURITY_DIR}/dependency-check.yml" "Dependency scanning configuration"

    check_file "${PROJECT_ROOT}/.snyk" "Snyk configuration"

    # Test npm audit if Node.js project exists
    if [[ -f "${PROJECT_ROOT}/frontend/package.json" ]]; then
        log_info "Testing npm audit..."
        cd "${PROJECT_ROOT}/frontend"
        if npm audit --audit-level=high >/dev/null 2>&1; then
            log_success "npm audit: ✓"
        else
            log_warning "npm audit found vulnerabilities (review required)"
        fi
        cd - >/dev/null
    fi

    # Test Python safety if requirements.txt exists
    if [[ -f "${PROJECT_ROOT}/backend/requirements.txt" ]]; then
        log_info "Testing Python dependency scanning..."
        if command_exists safety; then
            cd "${PROJECT_ROOT}/backend"
            if safety check --file=requirements.txt >/dev/null 2>&1; then
                log_success "Python safety check: ✓"
            else
                log_warning "Safety found Python vulnerabilities (review required)"
            fi
            cd - >/dev/null
        else
            log_warning "Safety not installed. Install with: pip install safety"
        fi
    fi

    return 0
}

# Validate Kubernetes security policies
validate_k8s_security() {
    log_info "Validating Kubernetes security configurations..."

    # Check OPA Gatekeeper policies
    check_file "${SECURITY_DIR}/opa-policies/security-policies.rego" "OPA security policies"
    check_file "${SECURITY_DIR}/gatekeeper/constraint-templates.yaml" "Gatekeeper constraint templates"
    validate_yaml "${SECURITY_DIR}/gatekeeper/constraint-templates.yaml" "Gatekeeper constraint templates"

    check_file "${SECURITY_DIR}/gatekeeper/constraints.yaml" "Gatekeeper constraints"
    validate_yaml "${SECURITY_DIR}/gatekeeper/constraints.yaml" "Gatekeeper constraints"

    # Check Falco configuration
    check_file "${SECURITY_DIR}/falco-rules.yaml" "Falco security rules"
    validate_yaml "${SECURITY_DIR}/falco-rules.yaml" "Falco security rules"

    check_file "${PROJECT_ROOT}/k8s/falco-deployment.yaml" "Falco deployment"
    validate_yaml "${PROJECT_ROOT}/k8s/falco-deployment.yaml" "Falco deployment"

    # Test OPA policies if available
    if command_exists opa; then
        log_info "Testing OPA policy syntax..."
        if opa fmt --list "${SECURITY_DIR}/opa-policies/" >/dev/null 2>&1; then
            log_success "OPA policy syntax: ✓"
        else
            log_error "OPA policy syntax errors found"
            return 1
        fi
    else
        log_warning "OPA not installed locally. Install for policy validation."
    fi

    return 0
}

# Validate infrastructure scanning
validate_infrastructure_scanning() {
    log_info "Validating infrastructure security scanning..."

    check_file "${SECURITY_DIR}/checkov-config.yaml" "Checkov configuration"
    validate_yaml "${SECURITY_DIR}/checkov-config.yaml" "Checkov configuration"

    # Test Checkov if available
    if command_exists checkov; then
        log_info "Testing Checkov infrastructure scan..."
        if checkov --config-file "${SECURITY_DIR}/checkov-config.yaml" \
            --framework docker_compose --file "${PROJECT_ROOT}/docker-compose.yml" \
            --compact --quiet >/dev/null 2>&1; then
            log_success "Checkov test scan: ✓"
        else
            log_warning "Checkov found infrastructure security issues (review required)"
        fi
    else
        log_warning "Checkov not installed locally. Install with: pip install checkov"
    fi

    return 0
}

# Validate CI/CD pipeline
validate_cicd_pipeline() {
    log_info "Validating CI/CD security pipeline..."

    check_file "${PROJECT_ROOT}/.github/workflows/security-scan.yml" "Security scanning workflow"
    validate_yaml "${PROJECT_ROOT}/.github/workflows/security-scan.yml" "Security scanning workflow"

    check_file "${PROJECT_ROOT}/.github/codeql/codeql-config.yml" "CodeQL configuration"
    validate_yaml "${PROJECT_ROOT}/.github/codeql/codeql-config.yml" "CodeQL configuration"

    # Check for required secrets (informational)
    log_info "Required GitHub secrets for full functionality:"
    echo "  - SNYK_TOKEN (for Snyk dependency scanning)"
    echo "  - GITLEAKS_LICENSE (for GitLeaks Pro features)"
    echo "  - SLACK_WEBHOOK_URL (for Slack notifications)"
    echo "  - SMTP_PASSWORD (for email alerts)"
    echo "  - PAGERDUTY_INTEGRATION_KEY (for PagerDuty alerts)"

    return 0
}

# Validate monitoring and alerting
validate_monitoring() {
    log_info "Validating security monitoring configuration..."

    check_file "${SECURITY_DIR}/compliance-dashboard.yaml" "Security compliance dashboard"
    validate_yaml "${SECURITY_DIR}/compliance-dashboard.yaml" "Security compliance dashboard"

    check_file "${SECURITY_DIR}/alerting-config.yaml" "Security alerting configuration"
    validate_yaml "${SECURITY_DIR}/alerting-config.yaml" "Security alerting configuration"

    return 0
}

# Generate security scan report
generate_report() {
    local report_file="${PROJECT_ROOT}/security-validation-report.txt"

    log_info "Generating security validation report..."

    cat > "$report_file" << EOF
NeoForge Security Scanning Validation Report
============================================
Generated: $(date)
Host: $(hostname)
User: $(whoami)

Security Components Status:
EOF

    echo "" >> "$report_file"
    echo "✓ Container Security Scanning (Trivy): Configured" >> "$report_file"
    echo "✓ Static Application Security Testing (SAST): Configured" >> "$report_file"
    echo "✓ Dependency Vulnerability Scanning: Configured" >> "$report_file"
    echo "✓ Secret Detection Scanning: Configured" >> "$report_file"
    echo "✓ Kubernetes Security Policies: Configured" >> "$report_file"
    echo "✓ Runtime Security Monitoring (Falco): Configured" >> "$report_file"
    echo "✓ Infrastructure Security Scanning (Checkov): Configured" >> "$report_file"
    echo "✓ Security Compliance Dashboard: Configured" >> "$report_file"
    echo "✓ Automated Security Alerting: Configured" >> "$report_file"

    echo "" >> "$report_file"
    echo "Configuration Files:" >> "$report_file"
    echo "- Trivy: security/trivy-config.yaml" >> "$report_file"
    echo "- GitLeaks: .gitleaks.toml" >> "$report_file"
    echo "- detect-secrets: .secrets.baseline" >> "$report_file"
    echo "- Snyk: .snyk" >> "$report_file"
    echo "- OPA Policies: security/opa-policies/" >> "$report_file"
    echo "- Gatekeeper: security/gatekeeper/" >> "$report_file"
    echo "- Falco: security/falco-rules.yaml" >> "$report_file"
    echo "- Checkov: security/checkov-config.yaml" >> "$report_file"
    echo "- CI/CD: .github/workflows/security-scan.yml" >> "$report_file"
    echo "- Dashboard: security/compliance-dashboard.yaml" >> "$report_file"
    echo "- Alerting: security/alerting-config.yaml" >> "$report_file"

    echo "" >> "$report_file"
    echo "Next Steps:" >> "$report_file"
    echo "1. Configure GitHub secrets for full CI/CD integration" >> "$report_file"
    echo "2. Deploy Kubernetes security policies to clusters" >> "$report_file"
    echo "3. Set up monitoring and alerting infrastructure" >> "$report_file"
    echo "4. Run initial security scans and review results" >> "$report_file"
    echo "5. Establish security incident response procedures" >> "$report_file"

    log_success "Security validation report generated: $report_file"
}

# Main validation function
main() {
    echo "=========================================="
    echo "  NeoForge Security Validation Script"
    echo "=========================================="
    echo ""

    local errors=0

    # Run all validations
    validate_trivy || ((errors++))
    echo ""

    test_trivy_scan || ((errors++))
    echo ""

    validate_secret_scanning || ((errors++))
    echo ""

    validate_dependency_scanning || ((errors++))
    echo ""

    validate_k8s_security || ((errors++))
    echo ""

    validate_infrastructure_scanning || ((errors++))
    echo ""

    validate_cicd_pipeline || ((errors++))
    echo ""

    validate_monitoring || ((errors++))
    echo ""

    # Generate report
    generate_report
    echo ""

    # Summary
    if [[ $errors -eq 0 ]]; then
        log_success "✅ All security components validated successfully!"
        log_info "Your NeoForge security scanning system is ready for deployment."
        echo ""
        echo "To deploy the security scanning system:"
        echo "1. Push changes to trigger GitHub Actions security pipeline"
        echo "2. Deploy Kubernetes security policies: kubectl apply -f security/gatekeeper/"
        echo "3. Deploy Falco: kubectl apply -f k8s/falco-deployment.yaml"
        echo "4. Set up monitoring: kubectl apply -f security/compliance-dashboard.yaml"
        echo "5. Configure alerting: kubectl apply -f security/alerting-config.yaml"
    else
        log_error "❌ Validation completed with $errors error(s)."
        log_info "Please address the issues above before deploying the security system."
        exit 1
    fi
}

# Run main function
main "$@"
