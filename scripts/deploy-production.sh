#!/bin/bash

# NeoForge Production Deployment Script
# This script deploys the complete production infrastructure to Kubernetes

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="neoforge"
BACKEND_IMAGE="neoforge/backend:latest"
FRONTEND_IMAGE="neoforge/frontend:latest"
REGISTRY_SECRET_NAME="neoforge-registry-secret"

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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if kubectl is installed and configured
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check if we're connected to a cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Not connected to a Kubernetes cluster"
        exit 1
    fi

    # Check if Docker is running (for building images)
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi

    print_status "Prerequisites check passed"
}

# Create namespace
create_namespace() {
    print_step "Creating namespace: $NAMESPACE"

    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    print_status "Namespace created/updated"
}

# Create secrets
create_secrets() {
    print_step "Creating secrets..."

    # Database secrets
    kubectl create secret generic neoforge-secrets \
        --namespace="$NAMESPACE" \
        --from-literal=database-url="postgresql://user:password@postgres:5432/neoforge" \
        --from-literal=redis-url="redis://redis:6379/0" \
        --from-literal=secret-key="your-super-secret-key-change-in-production" \
        --from-literal=stripe-secret-key="sk_test_..." \
        --from-literal=stripe-publishable-key="pk_test_..." \
        --from-literal=stripe-webhook-secret="whsec_..." \
        --dry-run=client -o yaml | kubectl apply -f -

    print_status "Secrets created/updated"
}

# Build and push Docker images
build_and_push_images() {
    print_step "Building and pushing Docker images..."

    # Build backend image
    print_status "Building backend image..."
    cd "$PROJECT_ROOT/backend"
    docker build -t "$BACKEND_IMAGE" .

    # Build frontend image
    print_status "Building frontend image..."
    cd "$PROJECT_ROOT/frontend"
    docker build -t "$FRONTEND_IMAGE" .

    # Push images (assuming registry is configured)
    print_status "Pushing images to registry..."
    docker push "$BACKEND_IMAGE"
    docker push "$FRONTEND_IMAGE"

    cd "$PROJECT_ROOT"
    print_status "Images built and pushed"
}

# Deploy infrastructure components
deploy_infrastructure() {
    print_step "Deploying infrastructure components..."

    # Deploy PostgreSQL
    print_status "Deploying PostgreSQL..."
    kubectl apply -f k8s/postgres-deployment.yaml
    kubectl apply -f k8s/postgres-service.yaml

    # Deploy Redis
    print_status "Deploying Redis..."
    kubectl apply -f k8s/redis-deployment.yaml
    kubectl apply -f k8s/redis-service.yaml

    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n "$NAMESPACE"

    print_status "Infrastructure components deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    print_step "Deploying monitoring stack..."

    # Deploy Prometheus
    print_status "Deploying Prometheus..."
    kubectl apply -f k8s/prometheus-config.yaml
    kubectl apply -f k8s/prometheus-deployment.yaml
    kubectl apply -f k8s/prometheus-service.yaml

    # Deploy Grafana (if you have a Grafana deployment file)
    # kubectl apply -f k8s/grafana-deployment.yaml
    # kubectl apply -f k8s/grafana-service.yaml

    print_status "Monitoring stack deployed"
}

# Deploy application
deploy_application() {
    print_step "Deploying application..."

    # Deploy backend
    print_status "Deploying backend..."
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/backend-service.yaml

    # Deploy frontend
    print_status "Deploying frontend..."
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/frontend-service.yaml

    # Deploy ingress
    print_status "Deploying ingress..."
    kubectl apply -f k8s/ingress.yaml

    print_status "Application deployed"
}

# Wait for deployments to be ready
wait_for_deployments() {
    print_step "Waiting for deployments to be ready..."

    # Wait for backend
    print_status "Waiting for backend deployment..."
    kubectl wait --for=condition=available --timeout=300s deployment/neoforge-backend -n "$NAMESPACE"

    # Wait for frontend
    print_status "Waiting for frontend deployment..."
    kubectl wait --for=condition=available --timeout=300s deployment/neoforge-frontend -n "$NAMESPACE"

    print_status "All deployments are ready"
}

# Run health checks
run_health_checks() {
    print_step "Running health checks..."

    # Backend health check
    BACKEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app=neoforge-backend -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$BACKEND_POD" ]; then
        print_status "Checking backend health..."
        kubectl exec -n "$NAMESPACE" "$BACKEND_POD" -- curl -f http://localhost:8000/health || {
            print_warning "Backend health check failed"
        }
    fi

    # Frontend health check
    FRONTEND_POD=$(kubectl get pods -n "$NAMESPACE" -l app=neoforge-frontend -o jsonpath='{.items[0].metadata.name}')
    if [ -n "$FRONTEND_POD" ]; then
        print_status "Checking frontend health..."
        kubectl exec -n "$NAMESPACE" "$FRONTEND_POD" -- curl -f http://localhost:80/ || {
            print_warning "Frontend health check failed"
        }
    fi

    print_status "Health checks completed"
}

# Display deployment information
display_deployment_info() {
    print_step "Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Information:"
    echo "=========================="

    # Get service information
    echo "Services:"
    kubectl get services -n "$NAMESPACE" -o wide

    echo ""
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide

    echo ""
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE" -o wide

    echo ""
    echo "🔗 Access URLs:"
    # Get ingress host
    INGRESS_HOST=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}')
    if [ -n "$INGRESS_HOST" ]; then
        echo "Frontend: https://$INGRESS_HOST"
        echo "Backend API: https://$INGRESS_HOST/api/v1"
        echo "API Docs: https://$INGRESS_HOST/docs"
    else
        echo "Frontend: http://localhost:30080 (if using port forwarding)"
        echo "Backend API: http://localhost:30080/api/v1"
    fi

    echo ""
    echo "📈 Monitoring:"
    echo "Prometheus: http://localhost:30090 (if port forwarded)"
    echo "Grafana: http://localhost:30091 (if deployed)"

    echo ""
    echo "🔧 Useful Commands:"
    echo "View logs: kubectl logs -n $NAMESPACE deployment/neoforge-backend"
    echo "Scale backend: kubectl scale -n $NAMESPACE deployment neoforge-backend --replicas=5"
    echo "Port forward: kubectl port-forward -n $NAMESPACE svc/neoforge-backend 8080:8000"
}

# Main deployment function
deploy() {
    print_status "🚀 Starting NeoForge production deployment..."

    check_prerequisites
    create_namespace
    create_secrets
    build_and_push_images
    deploy_infrastructure
    deploy_monitoring
    deploy_application
    wait_for_deployments
    run_health_checks
    display_deployment_info

    print_status "✅ NeoForge production deployment completed successfully!"
}

# Rollback function
rollback() {
    print_step "Rolling back deployment..."

    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true

    print_status "Rollback completed"
}

# Show usage
usage() {
    echo "NeoForge Production Deployment Script"
    echo ""
    echo "Usage:"
    echo "  $0 deploy    - Deploy NeoForge to production"
    echo "  $0 rollback  - Rollback the deployment"
    echo "  $0 status    - Show deployment status"
    echo "  $0 logs      - Show recent logs"
    echo ""
    echo "Environment Variables:"
    echo "  NAMESPACE    - Kubernetes namespace (default: neoforge)"
    echo "  BACKEND_IMAGE - Backend Docker image (default: neoforge/backend:latest)"
    echo "  FRONTEND_IMAGE - Frontend Docker image (default: neoforge/frontend:latest)"
}

# Status function
status() {
    print_step "Checking deployment status..."

    echo "Namespace: $NAMESPACE"
    echo ""

    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide

    echo ""
    echo "Services:"
    kubectl get services -n "$NAMESPACE" -o wide

    echo ""
    echo "Deployments:"
    kubectl get deployments -n "$NAMESPACE" -o wide

    echo ""
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE" -o wide
}

# Logs function
logs() {
    print_step "Showing recent logs..."

    echo "Backend logs:"
    kubectl logs -n "$NAMESPACE" --tail=100 -l app=neoforge-backend

    echo ""
    echo "Frontend logs:"
    kubectl logs -n "$NAMESPACE" --tail=100 -l app=neoforge-frontend
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        status
        ;;
    "logs")
        logs
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac