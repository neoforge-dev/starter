#!/bin/bash

# NeoForge Production Deployment Script
# Complete production deployment with security, monitoring, and backup systems

set -euo pipefail

# Configuration
NAMESPACE=${NAMESPACE:-neoforge}
ENVIRONMENT=${ENVIRONMENT:-production}
CLUSTER_NAME=${CLUSTER_NAME:-neoforge-prod}
REGION=${REGION:-us-east-1}
BACKUP_BUCKET=${BACKUP_BUCKET:-neoforge-backups-${ENVIRONMENT}}

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
NeoForge Production Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    deploy          Full production deployment
    security        Deploy security hardening only
    monitoring      Deploy monitoring stack only
    backup          Deploy backup system only
    validate        Validate deployment
    rollback        Rollback to previous version
    destroy         Destroy production deployment

Options:
    -n, --namespace     Kubernetes namespace (default: neoforge)
    -e, --environment   Environment (production, staging)
    -c, --cluster       Cluster name
    -r, --region        AWS region (default: us-east-1)
    -b, --backup-bucket S3 backup bucket name
    -h, --help          Show this help message

Examples:
    $0 deploy                                    # Full production deployment
    $0 deploy -e staging -c neoforge-staging     # Deploy to staging
    $0 security                                  # Deploy security only
    $0 validate                                  # Validate current deployment
    $0 rollback                                  # Rollback deployment

Environment Variables:
    NAMESPACE           Kubernetes namespace
    ENVIRONMENT         Deployment environment
    CLUSTER_NAME        Kubernetes cluster name
    REGION              AWS region
    BACKUP_BUCKET       S3 backup bucket name

Prerequisites:
    - kubectl configured and authenticated
    - AWS CLI configured with appropriate permissions
    - Helm installed
    - Docker images built and pushed to registry
    - Required secrets created in AWS Secrets Manager

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
            -c|--cluster)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -b|--backup-bucket)
                BACKUP_BUCKET="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|security|monitoring|backup|validate|rollback|destroy)
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

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed or not in PATH"
        exit 1
    fi

    # Check Helm
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed or not in PATH"
        exit 1
    fi

    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check AWS connectivity
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "Cannot connect to AWS"
        exit 1
    fi

    log_success "Prerequisites validation completed"
}

# Setup AWS resources
setup_aws_resources() {
    log_info "Setting up AWS resources..."

    # Create S3 backup bucket
    if ! aws s3api head-bucket --bucket "$BACKUP_BUCKET" 2>/dev/null; then
        log_info "Creating S3 backup bucket: $BACKUP_BUCKET"
        aws s3api create-bucket \
            --bucket "$BACKUP_BUCKET" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || true

        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$BACKUP_BUCKET" \
            --versioning-configuration Status=Enabled

        # Set lifecycle policy
        aws s3api put-bucket-lifecycle-configuration \
            --bucket "$BACKUP_BUCKET" \
            --lifecycle-configuration '{
                "Rules": [
                    {
                        "ID": "DeleteOldBackups",
                        "Status": "Enabled",
                        "Filter": {
                            "Prefix": "database/"
                        },
                        "Expiration": {
                            "Days": 30
                        }
                    },
                    {
                        "ID": "DeleteOldRedisBackups",
                        "Status": "Enabled",
                        "Filter": {
                            "Prefix": "redis/"
                        },
                        "Expiration": {
                            "Days": 7
                        }
                    }
                ]
            }'
    else
        log_info "S3 backup bucket already exists: $BACKUP_BUCKET"
    fi

    # Create IAM policy for backup access
    cat > /tmp/backup-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::$BACKUP_BUCKET",
                "arn:aws:s3:::$BACKUP_BUCKET/*"
            ]
        }
    ]
}
EOF

    aws iam create-policy \
        --policy-name "neoforge-backup-policy" \
        --policy-document file:///tmp/backup-policy.json 2>/dev/null || true

    log_success "AWS resources setup completed"
}

# Deploy security hardening
deploy_security() {
    log_info "Deploying security hardening..."

    # Apply security policies
    kubectl apply -f k8s/security-hardening.yaml

    # Wait for security policies to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=neoforge --timeout=300s -n "$NAMESPACE" 2>/dev/null || true

    log_success "Security hardening deployed"
}

# Deploy monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."

    # Create monitoring namespace if it doesn't exist
    kubectl create namespace neoforge-monitoring --dry-run=client -o yaml | kubectl apply -f -

    # Deploy monitoring components
    kubectl apply -f k8s/monitoring.yaml
    kubectl apply -f k8s/advanced-monitoring.yaml

    # Wait for monitoring components
    kubectl wait --for=condition=available deployment/prometheus -n neoforge-monitoring --timeout=300s 2>/dev/null || true
    kubectl wait --for=condition=available deployment/grafana -n neoforge-monitoring --timeout=300s 2>/dev/null || true

    log_success "Monitoring stack deployed"
}

# Deploy backup system
deploy_backup() {
    log_info "Deploying backup system..."

    # Create Velero namespace
    kubectl create namespace velero --dry-run=client -o yaml | kubectl apply -f -

    # Deploy backup components
    kubectl apply -f k8s/backup-recovery.yaml

    # Create backup credentials secret
    kubectl create secret generic backup-credentials \
        --from-literal=aws-access-key-id="$AWS_ACCESS_KEY_ID" \
        --from-literal=aws-secret-access-key="$AWS_SECRET_ACCESS_KEY" \
        --from-file=credentials=<(aws configure export-credentials --format env) \
        -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

    log_success "Backup system deployed"
}

# Deploy canary system
deploy_canary() {
    log_info "Deploying canary deployment system..."

    kubectl apply -f k8s/canary-deployment.yaml

    log_success "Canary deployment system deployed"
}

# Deploy production application
deploy_application() {
    log_info "Deploying NeoForge application..."

    # Apply production configuration
    kubectl apply -f k8s/production-deployment.yaml

    # Wait for deployments to be ready
    kubectl wait --for=condition=available deployment/api -n "$NAMESPACE" --timeout=600s
    kubectl wait --for=condition=available deployment/frontend -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=available deployment/postgres -n "$NAMESPACE" --timeout=600s
    kubectl wait --for=condition=available deployment/redis -n "$NAMESPACE" --timeout=300s

    log_success "NeoForge application deployed"
}

# Run post-deployment validation
validate_deployment() {
    log_info "Validating deployment..."

    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE"

    # Check services
    log_info "Checking services..."
    kubectl get services -n "$NAMESPACE"

    # Check ingress
    log_info "Checking ingress..."
    kubectl get ingress -n "$NAMESPACE"

    # Health check
    log_info "Running health checks..."
    local api_pod=$(kubectl get pods -n "$NAMESPACE" -l app=api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -n "$api_pod" ]]; then
        if kubectl exec -n "$NAMESPACE" "$api_pod" -- curl -f http://localhost:8000/health; then
            log_success "API health check passed"
        else
            log_warning "API health check failed"
        fi
    fi

    # Security validation
    log_info "Validating security policies..."
    kubectl get networkpolicies -n "$NAMESPACE"
    kubectl get podsecuritypolicies 2>/dev/null || log_info "Pod Security Policies not available in this cluster"

    # Monitoring validation
    log_info "Validating monitoring..."
    kubectl get pods -n neoforge-monitoring 2>/dev/null || log_warning "Monitoring namespace not found"

    log_success "Deployment validation completed"
}

# Full deployment process
deploy() {
    log_info "Starting NeoForge production deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    log_info "Cluster: $CLUSTER_NAME"
    log_info "Region: $REGION"

    validate_prerequisites
    setup_aws_resources
    deploy_security
    deploy_monitoring
    deploy_backup
    deploy_canary
    deploy_application
    validate_deployment

    log_success "NeoForge production deployment completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Verify application is accessible"
    log_info "2. Check monitoring dashboards"
    log_info "3. Configure DNS records"
    log_info "4. Set up SSL certificates"
    log_info "5. Configure backup schedules"
}

# Security-only deployment
security() {
    log_info "Deploying security hardening only..."
    validate_prerequisites
    deploy_security
    log_success "Security hardening deployment completed"
}

# Monitoring-only deployment
monitoring() {
    log_info "Deploying monitoring stack only..."
    validate_prerequisites
    deploy_monitoring
    log_success "Monitoring stack deployment completed"
}

# Backup-only deployment
backup() {
    log_info "Deploying backup system only..."
    validate_prerequisites
    setup_aws_resources
    deploy_backup
    log_success "Backup system deployment completed"
}

# Validation-only
validate() {
    log_info "Validating current deployment..."
    validate_deployment
    log_success "Validation completed"
}

# Rollback deployment
rollback() {
    log_warning "Rolling back to previous deployment..."

    # Rollback application
    kubectl rollout undo deployment/api -n "$NAMESPACE"
    kubectl rollout undo deployment/frontend -n "$NAMESPACE"

    # Wait for rollback to complete
    kubectl wait --for=condition=available deployment/api -n "$NAMESPACE" --timeout=300s
    kubectl wait --for=condition=available deployment/frontend -n "$NAMESPACE" --timeout=300s

    log_success "Rollback completed"
}

# Destroy deployment
destroy() {
    log_warning "This will completely remove NeoForge from namespace: $NAMESPACE"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Aborted"
        exit 0
    fi

    log_info "Destroying NeoForge deployment..."

    # Delete in reverse order
    kubectl delete -f k8s/production-deployment.yaml --ignore-not-found=true
    kubectl delete -f k8s/canary-deployment.yaml --ignore-not-found=true
    kubectl delete -f k8s/backup-recovery.yaml --ignore-not-found=true
    kubectl delete -f k8s/advanced-monitoring.yaml --ignore-not-found=true
    kubectl delete -f k8s/monitoring.yaml --ignore-not-found=true
    kubectl delete -f k8s/security-hardening.yaml --ignore-not-found=true

    # Delete namespace (optional)
    read -p "Delete namespace '$NAMESPACE'? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        kubectl delete namespace "$NAMESPACE"
    fi

    log_success "Destruction completed"
}

# Main execution
main() {
    parse_args "$@"

    case $COMMAND in
        deploy)
            deploy
            ;;
        security)
            security
            ;;
        monitoring)
            monitoring
            ;;
        backup)
            backup
            ;;
        validate)
            validate
            ;;
        rollback)
            rollback
            ;;
        destroy)
            destroy
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