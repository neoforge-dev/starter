#!/bin/bash

# NeoForge Kubernetes Deployment Script
# This script automates the deployment of NeoForge to a Kubernetes cluster

set -euo pipefail

# Configuration
NAMESPACE=${NAMESPACE:-neoforge}
ENVIRONMENT=${ENVIRONMENT:-production}
HELM_RELEASE=${HELM_RELEASE:-neoforge}
KUBECTL_CONTEXT=${KUBECTL_CONTEXT:-""}
DRY_RUN=${DRY_RUN:-false}
VERBOSE=${VERBOSE:-false}
SKIP_PREFLIGHT=${SKIP_PREFLIGHT:-false}
IMAGE_TAG=${IMAGE_TAG:-latest}

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

# Help function
show_help() {
    cat << EOF
NeoForge Kubernetes Deployment Script

Usage: $0 [OPTIONS] [COMMAND]

Commands:
    deploy          Deploy NeoForge to Kubernetes (default)
    upgrade         Upgrade existing deployment
    rollback        Rollback to previous release
    destroy         Remove NeoForge from Kubernetes
    status          Show deployment status
    logs            Show application logs
    port-forward    Setup port forwarding for development

Options:
    -n, --namespace     Kubernetes namespace (default: neoforge)
    -e, --environment   Environment (production, staging, development)
    -r, --release       Helm release name (default: neoforge)
    -c, --context       Kubectl context to use
    -t, --tag           Docker image tag (default: latest)
    -d, --dry-run       Run in dry-run mode
    -v, --verbose       Enable verbose output
    -s, --skip-preflight Skip preflight checks
    -h, --help          Show this help message

Examples:
    $0 deploy                                   # Deploy to production
    $0 deploy -e staging -t v1.2.3              # Deploy to staging with specific tag
    $0 upgrade -r neoforge-staging               # Upgrade staging release
    $0 rollback --environment production         # Rollback production deployment
    $0 destroy --namespace neoforge-dev          # Destroy development deployment

Environment Variables:
    NAMESPACE           Kubernetes namespace
    ENVIRONMENT         Deployment environment
    HELM_RELEASE        Helm release name
    KUBECTL_CONTEXT     Kubectl context
    IMAGE_TAG           Docker image tag
    DRY_RUN            Dry run mode (true/false)
    VERBOSE            Verbose output (true/false)
    SKIP_PREFLIGHT     Skip preflight checks (true/false)

EOF
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -r|--release)
                HELM_RELEASE="$2"
                shift 2
                ;;
            -c|--context)
                KUBECTL_CONTEXT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -s|--skip-preflight)
                SKIP_PREFLIGHT=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|upgrade|rollback|destroy|status|logs|port-forward)
                COMMAND="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Default command
    if [[ -z "$COMMAND" ]]; then
        COMMAND="deploy"
    fi
}

# Set kubectl context if provided
set_kubectl_context() {
    if [[ -n "$KUBECTL_CONTEXT" ]]; then
        log_info "Setting kubectl context to: $KUBECTL_CONTEXT"
        kubectl config use-context "$KUBECTL_CONTEXT"
    fi
}

# Preflight checks
preflight_checks() {
    if [[ "$SKIP_PREFLIGHT" == "true" ]]; then
        log_warning "Skipping preflight checks"
        return 0
    fi
    
    log_info "Running preflight checks..."
    
    # Check if kubectl is installed and working
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace '$NAMESPACE' does not exist, creating..."
        kubectl create namespace "$NAMESPACE" || {
            log_error "Failed to create namespace '$NAMESPACE'"
            exit 1
        }
    fi
    
    # Check node resources
    log_info "Checking cluster resources..."
    kubectl top nodes || log_warning "Could not get node metrics (metrics-server may not be installed)"
    
    # Check storage classes
    log_info "Checking storage classes..."
    kubectl get storageclass || log_warning "No storage classes found"
    
    log_success "Preflight checks completed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images with tag: $IMAGE_TAG"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would build images with tag $IMAGE_TAG"
        return 0
    fi
    
    # Build backend image
    docker build -t "neoforge/backend:$IMAGE_TAG" -f backend/Dockerfile backend/ || {
        log_error "Failed to build backend image"
        exit 1
    }
    
    # Build frontend image
    docker build -t "neoforge/frontend:$IMAGE_TAG" -f frontend/Dockerfile frontend/ || {
        log_error "Failed to build frontend image"
        exit 1
    }
    
    log_success "Images built successfully"
}

# Deploy function
deploy() {
    log_info "Deploying NeoForge to namespace: $NAMESPACE"
    log_info "Environment: $ENVIRONMENT"
    log_info "Image tag: $IMAGE_TAG"
    
    # Build images
    build_images
    
    # Create secrets (if they don't exist)
    create_secrets
    
    # Deploy using kubectl
    deploy_with_kubectl
    
    # Wait for rollout
    wait_for_rollout
    
    # Run post-deployment checks
    post_deployment_checks
    
    log_success "Deployment completed successfully!"
}

# Create Kubernetes secrets
create_secrets() {
    log_info "Creating secrets..."
    
    if kubectl get secret app-secret -n "$NAMESPACE" &> /dev/null; then
        log_info "Secret 'app-secret' already exists, skipping creation"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would create secrets"
        return 0
    fi
    
    # Generate random secrets if not provided
    SECRET_KEY=${SECRET_KEY:-$(openssl rand -hex 32)}
    JWT_SECRET_KEY=${JWT_SECRET_KEY:-$(openssl rand -hex 32)}
    DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
    REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -base64 32)}
    
    kubectl create secret generic app-secret \
        --from-literal=SECRET_KEY="$SECRET_KEY" \
        --from-literal=JWT_SECRET_KEY="$JWT_SECRET_KEY" \
        --from-literal=DATABASE_URL="postgresql+asyncpg://postgres:$DB_PASSWORD@postgres:5432/neoforge" \
        --from-literal=REDIS_URL="redis://:$REDIS_PASSWORD@redis:6379/0" \
        --from-literal=POSTGRES_PASSWORD="$DB_PASSWORD" \
        --from-literal=REDIS_PASSWORD="$REDIS_PASSWORD" \
        --from-literal=SMTP_PASSWORD="${SMTP_PASSWORD:-changeme}" \
        -n "$NAMESPACE" || {
        log_error "Failed to create app-secret"
        exit 1
    }
    
    log_success "Secrets created successfully"
}

# Deploy with kubectl
deploy_with_kubectl() {
    log_info "Deploying with kubectl..."
    
    local kubectl_args=""
    if [[ "$DRY_RUN" == "true" ]]; then
        kubectl_args="--dry-run=client"
    fi
    
    # Apply in order
    kubectl apply $kubectl_args -f k8s/namespace.yaml
    kubectl apply $kubectl_args -f k8s/storage-class.yaml
    kubectl apply $kubectl_args -f k8s/rbac.yaml
    kubectl apply $kubectl_args -f k8s/app-configmap.yaml
    kubectl apply $kubectl_args -f k8s/app-secret.yaml
    
    # Database
    kubectl apply $kubectl_args -f k8s/postgres-configmap.yaml
    kubectl apply $kubectl_args -f k8s/postgres-secret.yaml
    kubectl apply $kubectl_args -f k8s/postgres-storage.yaml
    kubectl apply $kubectl_args -f k8s/postgres-deployment.yaml
    kubectl apply $kubectl_args -f k8s/postgres-service.yaml
    
    # Redis
    kubectl apply $kubectl_args -f k8s/redis-configmap.yaml
    kubectl apply $kubectl_args -f k8s/redis-secret.yaml
    kubectl apply $kubectl_args -f k8s/redis-deployment.yaml
    kubectl apply $kubectl_args -f k8s/redis-service.yaml
    
    # Application
    kubectl apply $kubectl_args -f k8s/api-deployment.yaml
    kubectl apply $kubectl_args -f k8s/api-service.yaml
    kubectl apply $kubectl_args -f k8s/celery-deployment.yaml
    kubectl apply $kubectl_args -f k8s/frontend-configmap.yaml
    kubectl apply $kubectl_args -f k8s/frontend-deployment.yaml
    kubectl apply $kubectl_args -f k8s/frontend-service.yaml
    
    # Networking
    kubectl apply $kubectl_args -f k8s/network-policies.yaml
    kubectl apply $kubectl_args -f k8s/ingress.yaml
    
    # Autoscaling
    kubectl apply $kubectl_args -f k8s/hpa.yaml
    
    # Monitoring (if enabled)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        kubectl apply $kubectl_args -f k8s/monitoring-configmaps.yaml
        kubectl apply $kubectl_args -f k8s/monitoring.yaml
    fi
    
    log_success "Kubernetes resources applied successfully"
}

# Wait for rollout to complete
wait_for_rollout() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would wait for rollout"
        return 0
    fi
    
    log_info "Waiting for rollout to complete..."
    
    # Wait for deployments
    kubectl rollout status deployment/postgres -n "$NAMESPACE" --timeout=600s
    kubectl rollout status deployment/redis -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/api -n "$NAMESPACE" --timeout=600s
    kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/celery-worker -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/celery-email-worker -n "$NAMESPACE" --timeout=300s
    
    log_success "All deployments rolled out successfully"
}

# Post-deployment checks
post_deployment_checks() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would run post-deployment checks"
        return 0
    fi
    
    log_info "Running post-deployment checks..."
    
    # Check pod status
    kubectl get pods -n "$NAMESPACE"
    
    # Check services
    kubectl get services -n "$NAMESPACE"
    
    # Check ingress
    kubectl get ingress -n "$NAMESPACE"
    
    # Health check
    log_info "Checking application health..."
    local api_pod=$(kubectl get pods -n "$NAMESPACE" -l app=api -o jsonpath='{.items[0].metadata.name}')
    if kubectl exec -n "$NAMESPACE" "$api_pod" -- curl -f http://localhost:8000/health; then
        log_success "Health check passed"
    else
        log_warning "Health check failed"
    fi
    
    log_success "Post-deployment checks completed"
}

# Upgrade function
upgrade() {
    log_info "Upgrading NeoForge deployment..."
    
    # Build new images
    build_images
    
    # Update deployments with new image
    if [[ "$DRY_RUN" != "true" ]]; then
        kubectl set image deployment/api api=neoforge/backend:$IMAGE_TAG -n "$NAMESPACE"
        kubectl set image deployment/frontend frontend=neoforge/frontend:$IMAGE_TAG -n "$NAMESPACE"
        kubectl set image deployment/celery-worker celery-worker=neoforge/backend:$IMAGE_TAG -n "$NAMESPACE"
        kubectl set image deployment/celery-email-worker celery-email-worker=neoforge/backend:$IMAGE_TAG -n "$NAMESPACE"
    fi
    
    # Wait for rollout
    wait_for_rollout
    
    log_success "Upgrade completed successfully!"
}

# Rollback function
rollback() {
    log_info "Rolling back NeoForge deployment..."
    
    if [[ "$DRY_RUN" != "true" ]]; then
        kubectl rollout undo deployment/api -n "$NAMESPACE"
        kubectl rollout undo deployment/frontend -n "$NAMESPACE"
        kubectl rollout undo deployment/celery-worker -n "$NAMESPACE"
        kubectl rollout undo deployment/celery-email-worker -n "$NAMESPACE"
    fi
    
    # Wait for rollout
    wait_for_rollout
    
    log_success "Rollback completed successfully!"
}

# Destroy function
destroy() {
    log_warning "This will completely remove NeoForge from namespace: $NAMESPACE"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Aborted"
        exit 0
    fi
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Delete in reverse order
        kubectl delete -f k8s/monitoring.yaml --ignore-not-found=true
        kubectl delete -f k8s/monitoring-configmaps.yaml --ignore-not-found=true
        kubectl delete -f k8s/hpa.yaml --ignore-not-found=true
        kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
        kubectl delete -f k8s/network-policies.yaml --ignore-not-found=true
        kubectl delete -f k8s/frontend-service.yaml --ignore-not-found=true
        kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found=true
        kubectl delete -f k8s/frontend-configmap.yaml --ignore-not-found=true
        kubectl delete -f k8s/celery-deployment.yaml --ignore-not-found=true
        kubectl delete -f k8s/api-service.yaml --ignore-not-found=true
        kubectl delete -f k8s/api-deployment.yaml --ignore-not-found=true
        kubectl delete -f k8s/redis-service.yaml --ignore-not-found=true
        kubectl delete -f k8s/redis-deployment.yaml --ignore-not-found=true
        kubectl delete -f k8s/redis-secret.yaml --ignore-not-found=true
        kubectl delete -f k8s/redis-configmap.yaml --ignore-not-found=true
        kubectl delete -f k8s/postgres-service.yaml --ignore-not-found=true
        kubectl delete -f k8s/postgres-deployment.yaml --ignore-not-found=true
        kubectl delete -f k8s/postgres-storage.yaml --ignore-not-found=true
        kubectl delete -f k8s/postgres-secret.yaml --ignore-not-found=true
        kubectl delete -f k8s/postgres-configmap.yaml --ignore-not-found=true
        kubectl delete -f k8s/app-secret.yaml --ignore-not-found=true
        kubectl delete -f k8s/app-configmap.yaml --ignore-not-found=true
        kubectl delete -f k8s/rbac.yaml --ignore-not-found=true
        kubectl delete -f k8s/storage-class.yaml --ignore-not-found=true
        
        # Delete namespace (optional)
        read -p "Delete namespace '$NAMESPACE'? (yes/no): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            kubectl delete namespace "$NAMESPACE"
        fi
    fi
    
    log_success "Destruction completed"
}

# Status function
status() {
    log_info "NeoForge deployment status:"
    
    echo "=== Namespaces ==="
    kubectl get namespaces | grep -E "(NAME|$NAMESPACE)" || true
    
    echo "=== Deployments ==="
    kubectl get deployments -n "$NAMESPACE" || true
    
    echo "=== Pods ==="
    kubectl get pods -n "$NAMESPACE" || true
    
    echo "=== Services ==="
    kubectl get services -n "$NAMESPACE" || true
    
    echo "=== Ingress ==="
    kubectl get ingress -n "$NAMESPACE" || true
    
    echo "=== PVCs ==="
    kubectl get pvc -n "$NAMESPACE" || true
    
    echo "=== HPA ==="
    kubectl get hpa -n "$NAMESPACE" || true
}

# Logs function
logs() {
    log_info "Showing application logs..."
    
    # Show logs from all API pods
    kubectl logs -l app=api -n "$NAMESPACE" --tail=100 -f
}

# Port forward function
port_forward() {
    log_info "Setting up port forwarding..."
    
    echo "Available services:"
    kubectl get services -n "$NAMESPACE"
    
    log_info "Port forwarding API (8000 -> 8000)"
    kubectl port-forward service/api 8000:8000 -n "$NAMESPACE" &
    
    log_info "Port forwarding Frontend (3000 -> 80)"
    kubectl port-forward service/frontend 3000:80 -n "$NAMESPACE" &
    
    log_info "Port forwarding Grafana (3001 -> 3000)"
    kubectl port-forward service/grafana 3001:3000 -n neoforge-monitoring &
    
    log_info "Port forwarding Prometheus (9090 -> 9090)"
    kubectl port-forward service/prometheus 9090:9090 -n neoforge-monitoring &
    
    log_info "Port forwarding setup complete. Press Ctrl+C to stop all forwards."
    wait
}

# Main execution
main() {
    parse_args "$@"
    
    if [[ "$VERBOSE" == "true" ]]; then
        set -x
    fi
    
    log_info "Starting NeoForge deployment script"
    log_info "Command: $COMMAND"
    log_info "Namespace: $NAMESPACE"
    log_info "Environment: $ENVIRONMENT"
    
    set_kubectl_context
    
    case $COMMAND in
        deploy)
            preflight_checks
            deploy
            ;;
        upgrade)
            preflight_checks
            upgrade
            ;;
        rollback)
            rollback
            ;;
        destroy)
            destroy
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        port-forward)
            port_forward
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
    
    log_success "Script completed successfully"
}

# Run main function
main "$@"