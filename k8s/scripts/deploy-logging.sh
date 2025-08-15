#!/bin/bash
set -e

# NeoForge Logging System Deployment Script
echo "🚀 Deploying NeoForge Centralized Logging System"
echo "================================================="

# Configuration
NAMESPACE="neoforge-logging"
TIMEOUT="300s"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check storage class
    if ! kubectl get storageclass neoforge-ssd &> /dev/null; then
        log_warning "Storage class 'neoforge-ssd' not found, using default"
        # Update storage class in manifests to default
        find ../k8s -name "*.yaml" -exec sed -i 's/storageClassName: neoforge-ssd/storageClassName: standard/g' {} \;
    fi
    
    log_success "Prerequisites check completed"
}

# Deploy namespace and RBAC
deploy_namespace() {
    log_info "Deploying namespace and RBAC..."
    kubectl apply -f ../logging-namespace.yaml
    kubectl wait --for=condition=Complete --timeout=$TIMEOUT namespace/$NAMESPACE || true
    log_success "Namespace and RBAC deployed"
}

# Deploy Elasticsearch
deploy_elasticsearch() {
    log_info "Deploying Elasticsearch..."
    kubectl apply -f ../elasticsearch-deployment.yaml
    
    log_info "Waiting for Elasticsearch to be ready..."
    kubectl wait --for=condition=Ready --timeout=$TIMEOUT \
        pod -l app=elasticsearch,component=search-engine -n $NAMESPACE
    
    # Wait for Elasticsearch service to be healthy
    log_info "Checking Elasticsearch health..."
    for i in {1..30}; do
        if kubectl exec -n $NAMESPACE deployment/elasticsearch -- \
            curl -f http://localhost:9200/_cluster/health 2>/dev/null; then
            log_success "Elasticsearch is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Elasticsearch health check failed"
            exit 1
        fi
        sleep 10
    done
}

# Setup index templates and policies
setup_elasticsearch_policies() {
    log_info "Setting up Elasticsearch index templates and ILM policies..."
    kubectl apply -f ../log-policies.yaml
    
    # Apply ILM policies
    kubectl exec -n $NAMESPACE deployment/elasticsearch -- \
        curl -X PUT http://localhost:9200/_ilm/policy/application-logs-policy \
        -H "Content-Type: application/json" \
        -d @/tmp/application-logs-policy.json || true
    
    # Apply index templates
    kubectl exec -n $NAMESPACE deployment/elasticsearch -- \
        curl -X PUT http://localhost:9200/_index_template/neoforge-logs-template \
        -H "Content-Type: application/json" \
        -d @/tmp/neoforge-logs-template.json || true
    
    log_success "Elasticsearch policies configured"
}

# Deploy Fluent Bit
deploy_fluent_bit() {
    log_info "Deploying Fluent Bit DaemonSet..."
    kubectl apply -f ../fluent-bit-daemonset.yaml
    
    log_info "Waiting for Fluent Bit to be ready..."
    kubectl wait --for=condition=Ready --timeout=$TIMEOUT \
        pod -l app=fluent-bit,component=log-collector -n $NAMESPACE
    
    log_success "Fluent Bit deployed and ready"
}

# Deploy Kibana
deploy_kibana() {
    log_info "Deploying Kibana..."
    kubectl apply -f ../kibana-deployment.yaml
    
    log_info "Waiting for Kibana to be ready..."
    kubectl wait --for=condition=Ready --timeout=$TIMEOUT \
        pod -l app=kibana,component=visualization -n $NAMESPACE
    
    # Wait for Kibana service to be healthy
    log_info "Checking Kibana health..."
    for i in {1..20}; do
        if kubectl exec -n $NAMESPACE deployment/kibana -- \
            curl -f http://localhost:5601/api/status 2>/dev/null; then
            log_success "Kibana is healthy"
            break
        fi
        if [ $i -eq 20 ]; then
            log_error "Kibana health check failed"
            exit 1
        fi
        sleep 15
    done
}

# Deploy dashboards and alerting
deploy_dashboards() {
    log_info "Deploying dashboards and alerting..."
    kubectl apply -f ../logging-dashboards.yaml
    
    log_info "Waiting for ElastAlert to be ready..."
    kubectl wait --for=condition=Ready --timeout=$TIMEOUT \
        pod -l app=elastalert,component=alerting -n $NAMESPACE || true
    
    log_success "Dashboards and alerting deployed"
}

# Deploy security configuration
deploy_security() {
    log_info "Deploying security configuration..."
    kubectl apply -f ../logging-security.yaml
    
    log_success "Security configuration deployed"
}

# Run tests
run_tests() {
    log_info "Running logging system tests..."
    kubectl apply -f ../logging-tests.yaml
    
    log_info "Waiting for test job to complete..."
    kubectl wait --for=condition=Complete --timeout=$TIMEOUT \
        job/logging-system-test -n $NAMESPACE || true
    
    # Show test results
    log_info "Test results:"
    kubectl logs job/logging-system-test -n $NAMESPACE || true
    
    log_success "Tests completed"
}

# Display deployment summary
display_summary() {
    log_info "Deployment Summary"
    echo "=================="
    
    # Get service endpoints
    ES_SERVICE=$(kubectl get svc elasticsearch -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    KIBANA_SERVICE=$(kubectl get svc kibana -n $NAMESPACE -o jsonpath='{.spec.clusterIP}')
    
    echo "📊 Elasticsearch: http://$ES_SERVICE:9200"
    echo "📈 Kibana: http://$KIBANA_SERVICE:5601"
    echo ""
    
    # Get pod status
    echo "🔍 Pod Status:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    
    # Get storage usage
    echo "💾 Storage Usage:"
    kubectl get pvc -n $NAMESPACE
    echo ""
    
    # Get service status
    echo "🌐 Services:"
    kubectl get svc -n $NAMESPACE
    echo ""
    
    log_success "Logging system deployment completed successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Access Kibana at the service endpoint"
    echo "2. Configure index patterns: neoforge-logs-*, neoforge-security-*, etc."
    echo "3. Import dashboards and visualizations"
    echo "4. Set up alerting channels (Slack, email, PagerDuty)"
    echo "5. Update application code to use enhanced logging middleware"
    echo ""
    echo "📝 Documentation:"
    echo "- Kibana dashboards: Available in the logging-dashboards ConfigMap"
    echo "- Alert rules: Configured in ElastAlert"
    echo "- Log retention: Managed by ILM policies"
    echo "- Security: TLS, authentication, and network policies enabled"
}

# Cleanup function
cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    exit 1
}

# Main deployment function
main() {
    # Set trap for cleanup on error
    trap cleanup_on_error ERR
    
    log_info "Starting NeoForge Logging System deployment"
    
    check_prerequisites
    deploy_namespace
    deploy_elasticsearch
    setup_elasticsearch_policies
    deploy_fluent_bit
    deploy_kibana
    deploy_dashboards
    deploy_security
    run_tests
    display_summary
    
    log_success "🎉 NeoForge Logging System deployed successfully!"
}

# Script options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "cleanup")
        log_info "Cleaning up logging system..."
        kubectl delete namespace $NAMESPACE --ignore-not-found=true
        log_success "Cleanup completed"
        ;;
    "test")
        log_info "Running tests only..."
        run_tests
        ;;
    "status")
        log_info "Checking system status..."
        kubectl get all -n $NAMESPACE
        ;;
    "logs")
        log_info "Showing recent logs..."
        kubectl logs -l app=elasticsearch -n $NAMESPACE --tail=50
        kubectl logs -l app=fluent-bit -n $NAMESPACE --tail=50
        kubectl logs -l app=kibana -n $NAMESPACE --tail=50
        ;;
    *)
        echo "Usage: $0 {deploy|cleanup|test|status|logs}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the complete logging system (default)"
        echo "  cleanup - Remove the logging system"
        echo "  test    - Run system tests"
        echo "  status  - Show system status"
        echo "  logs    - Show recent logs"
        exit 1
        ;;
esac