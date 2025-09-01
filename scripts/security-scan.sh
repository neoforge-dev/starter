#!/bin/bash

# NeoForge Security Scanning Automation
# This script runs comprehensive security scans on the codebase

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🔒 NeoForge Security Scanning Automation"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    local missing_deps=()

    if ! command -v trivy &> /dev/null; then
        missing_deps+=("trivy")
    fi

    if ! command -v checkov &> /dev/null; then
        missing_deps+=("checkov")
    fi

    if ! command -v bandit &> /dev/null; then
        missing_deps+=("bandit")
    fi

    if ! command -v safety &> /dev/null; then
        missing_deps+=("safety")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Missing security tools: ${missing_deps[*]}"
        print_warning "Please install them to run full security scans"
        echo "Install with:"
        echo "  pip install bandit safety"
        echo "  brew install trivy"
        echo "  pip install checkov"
    fi
}

# Run container vulnerability scanning
scan_containers() {
    print_status "Scanning container images for vulnerabilities..."

    if command -v trivy &> /dev/null; then
        # Scan backend image
        if [ -f "backend/Dockerfile" ]; then
            print_status "Scanning backend container..."
            trivy image --format json --output backend-trivy-report.json neoforge/backend:latest || true
        fi

        # Scan frontend image
        if [ -f "frontend/Dockerfile" ]; then
            print_status "Scanning frontend container..."
            trivy image --format json --output frontend-trivy-report.json neoforge/frontend:latest || true
        fi
    else
        print_warning "Trivy not installed, skipping container scanning"
    fi
}

# Run infrastructure as code security scanning
scan_infrastructure() {
    print_status "Scanning infrastructure code for security issues..."

    if command -v checkov &> /dev/null; then
        # Scan Kubernetes manifests
        if [ -d "k8s" ]; then
            print_status "Scanning Kubernetes manifests..."
            checkov -f k8s/ --framework kubernetes --output json --output-file k8s-checkov-report.json || true
        fi

        # Scan Terraform files
        if [ -d "deploy/terraform" ]; then
            print_status "Scanning Terraform configurations..."
            checkov -d deploy/terraform/ --framework terraform --output json --output-file terraform-checkov-report.json || true
        fi
    else
        print_warning "Checkov not installed, skipping infrastructure scanning"
    fi
}

# Run Python security scanning
scan_python_code() {
    print_status "Scanning Python code for security vulnerabilities..."

    if command -v bandit &> /dev/null; then
        print_status "Running Bandit security linter..."
        bandit -r backend/app -f json -o backend-bandit-report.json || true
    else
        print_warning "Bandit not installed, skipping Python security scanning"
    fi

    if command -v safety &> /dev/null; then
        print_status "Checking Python dependencies for known vulnerabilities..."
        safety check --json --output backend-safety-report.json || true
    else
        print_warning "Safety not installed, skipping dependency vulnerability check"
    fi
}

# Run JavaScript/Node.js security scanning
scan_javascript_code() {
    print_status "Scanning JavaScript code for security issues..."

    if [ -f "frontend/package.json" ]; then
        cd frontend

        # Check for npm audit
        if command -v npm &> /dev/null; then
            print_status "Running npm audit..."
            npm audit --audit-level=moderate --json > ../frontend-npm-audit-report.json || true
        fi

        # Check for yarn audit if using yarn
        if [ -f "yarn.lock" ] && command -v yarn &> /dev/null; then
            print_status "Running yarn audit..."
            yarn audit --level moderate --json > ../frontend-yarn-audit-report.json || true
        fi

        cd ..
    fi
}

# Run secrets scanning
scan_secrets() {
    print_status "Scanning for exposed secrets and credentials..."

    if command -v gitleaks &> /dev/null; then
        print_status "Running GitLeaks secrets scan..."
        gitleaks detect --source . --report-format json --report-path gitleaks-report.json || true
    else
        print_warning "GitLeaks not installed, skipping secrets scanning"
    fi

    # Simple grep-based secret detection as fallback
    print_status "Running basic secret pattern detection..."
    local secret_patterns=(
        "password.*="
        "secret.*="
        "key.*="
        "token.*="
        "api_key.*="
        "auth.*="
    )

    for pattern in "${secret_patterns[@]}"; do
        grep -r -i "$pattern" . --include="*.py" --include="*.js" --include="*.json" --include="*.yaml" --include="*.yml" \
            --exclude-dir=node_modules --exclude-dir=.git --exclude="*-report.json" || true
    done > basic-secret-scan.txt
}

# Generate security report summary
generate_report() {
    print_status "Generating security scan summary..."

    local timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    local report_file="security-scan-report-${timestamp}.md"

    cat > "$report_file" << EOF
# NeoForge Security Scan Report
Generated: $(date)

## Scan Summary

### Tools Used
- Container Scanning: $(command -v trivy &> /dev/null && echo "✅ Trivy" || echo "❌ Trivy")
- Infrastructure Scanning: $(command -v checkov &> /dev/null && echo "✅ Checkov" || echo "❌ Checkov")
- Python Security: $(command -v bandit &> /dev/null && echo "✅ Bandit" || echo "❌ Bandit")
- Dependency Security: $(command -v safety &> /dev/null && echo "✅ Safety" || echo "❌ Safety")
- Secrets Scanning: $(command -v gitleaks &> /dev/null && echo "✅ GitLeaks" || echo "❌ GitLeaks")

## Findings

### Container Vulnerabilities
$(if [ -f "backend-trivy-report.json" ]; then echo "- Backend container scan completed"; else echo "- Backend container scan not run"; fi)
$(if [ -f "frontend-trivy-report.json" ]; then echo "- Frontend container scan completed"; else echo "- Frontend container scan not run"; fi)

### Infrastructure Security
$(if [ -f "k8s-checkov-report.json" ]; then echo "- Kubernetes manifests scan completed"; else echo "- Kubernetes manifests scan not run"; fi)
$(if [ -f "terraform-checkov-report.json" ]; then echo "- Terraform configurations scan completed"; else echo "- Terraform configurations scan not run"; fi)

### Code Security
$(if [ -f "backend-bandit-report.json" ]; then echo "- Python code security scan completed"; else echo "- Python code security scan not run"; fi)
$(if [ -f "backend-safety-report.json" ]; then echo "- Python dependencies scan completed"; else echo "- Python dependencies scan not run"; fi)

### Secrets Detection
$(if [ -f "gitleaks-report.json" ]; then echo "- Git secrets scan completed"; else echo "- Git secrets scan not run"; fi)
$(if [ -f "basic-secret-scan.txt" ]; then echo "- Basic secret pattern scan completed"; else echo "- Basic secret pattern scan not run"; fi)

## Recommendations

1. **Install Missing Tools**: Ensure all security scanning tools are installed
2. **Review High-Severity Issues**: Address critical vulnerabilities immediately
3. **Implement Automated Scanning**: Set up CI/CD integration for regular scans
4. **Secrets Management**: Use proper secrets management (e.g., HashiCorp Vault, AWS Secrets Manager)
5. **Regular Updates**: Keep dependencies and base images updated

## Next Steps

1. Review detailed reports in JSON format
2. Address high-priority security issues
3. Implement automated security scanning in CI/CD
4. Set up security monitoring and alerting
5. Conduct regular security audits

---
*Generated by NeoForge Security Scanning Automation*
EOF

    print_status "Security scan report generated: $report_file"
}

# Main execution
main() {
    cd "$PROJECT_ROOT"

    print_status "Starting comprehensive security scan..."

    check_dependencies
    scan_containers
    scan_infrastructure
    scan_python_code
    scan_javascript_code
    scan_secrets
    generate_report

    print_status "Security scanning completed!"
    print_status "Check the generated report for detailed findings."
}

# Run main function
main "$@"