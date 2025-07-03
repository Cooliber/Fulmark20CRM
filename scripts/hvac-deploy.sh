#!/bin/bash

# HVAC CRM Deployment Script
# "Pasja rodzi profesjonalizm" - Professional deployment automation
#
# This script provides comprehensive deployment automation for HVAC CRM
# following Twenty CRM standards and Polish business requirements.

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/hvac-deploy-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Configuration
ENVIRONMENTS=("development" "staging" "production")
DEPLOYMENT_MODES=("local" "docker" "kubernetes" "vps")

# Default values
ENVIRONMENT="development"
MODE="local"
SKIP_TESTS=false
SKIP_BUILD=false
FORCE_DEPLOY=false
DRY_RUN=false
BACKUP_BEFORE_DEPLOY=true

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -m|--mode)
                MODE="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --force)
                FORCE_DEPLOY=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-backup)
                BACKUP_BEFORE_DEPLOY=false
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
}

# Show help
show_help() {
    cat << EOF
HVAC CRM Deployment Script
"Pasja rodzi profesjonalizm" - Professional deployment automation

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV    Target environment (development|staging|production)
    -m, --mode MODE         Deployment mode (local|docker|kubernetes|vps)
    --skip-tests           Skip running tests
    --skip-build           Skip build process
    --force                Force deployment without confirmations
    --dry-run              Show what would be done without executing
    --no-backup            Skip backup before deployment
    -h, --help             Show this help message

Examples:
    $0 -e development -m local
    $0 -e production -m docker --force
    $0 -e staging -m kubernetes --dry-run

Environments:
    development    Local development environment
    staging        Staging environment for testing
    production     Production environment

Deployment Modes:
    local          Local development with hot reload
    docker         Docker containers deployment
    kubernetes     Kubernetes cluster deployment
    vps            VPS deployment with Docker Compose

EOF
}

# Validate arguments
validate_args() {
    if [[ ! " ${ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
        error "Invalid environment: $ENVIRONMENT. Must be one of: ${ENVIRONMENTS[*]}"
    fi

    if [[ ! " ${DEPLOYMENT_MODES[@]} " =~ " ${MODE} " ]]; then
        error "Invalid deployment mode: $MODE. Must be one of: ${DEPLOYMENT_MODES[*]}"
    fi

    if [[ "$ENVIRONMENT" == "production" && "$FORCE_DEPLOY" == false && "$DRY_RUN" == false ]]; then
        warning "Production deployment requires --force flag or --dry-run for safety"
        read -p "Continue with production deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for $MODE deployment..."

    # Common prerequisites
    command -v git >/dev/null 2>&1 || error "Git is required but not installed"
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"

    # Mode-specific prerequisites
    case $MODE in
        docker|vps)
            command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
            command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required but not installed"
            ;;
        kubernetes)
            command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
            command -v helm >/dev/null 2>&1 || error "Helm is required but not installed"
            ;;
    esac

    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18.0.0"
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_NODE_VERSION') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $REQUIRED_NODE_VERSION or higher is required. Current: $NODE_VERSION"
    fi

    success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    log "Setting up environment for $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    # Create environment file
    ENV_FILE=".env.${ENVIRONMENT}"
    if [[ ! -f "$ENV_FILE" ]]; then
        log "Creating environment file: $ENV_FILE"
        cp ".env.example" "$ENV_FILE"
        
        # Generate secrets
        JWT_SECRET=$(openssl rand -hex 32)
        POSTGRES_PASSWORD=$(openssl rand -hex 16)
        REDIS_PASSWORD=$(openssl rand -hex 16)
        
        # Update environment file
        sed -i.bak \
            -e "s/your-jwt-secret-here/$JWT_SECRET/" \
            -e "s/your-postgres-password/$POSTGRES_PASSWORD/" \
            -e "s/your-redis-password/$REDIS_PASSWORD/" \
            "$ENV_FILE"
        
        rm "${ENV_FILE}.bak"
        success "Environment file created with generated secrets"
    fi

    # Environment-specific configurations
    case $ENVIRONMENT in
        development)
            export NODE_ENV=development
            export DEBUG=true
            export LOG_LEVEL=debug
            ;;
        staging)
            export NODE_ENV=staging
            export DEBUG=false
            export LOG_LEVEL=info
            ;;
        production)
            export NODE_ENV=production
            export DEBUG=false
            export LOG_LEVEL=warn
            ;;
    esac

    success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log "Skipping dependency installation (--skip-build)"
        return
    fi

    log "Installing dependencies..."
    cd "$PROJECT_ROOT"

    # Clean install
    if [[ -d "node_modules" ]]; then
        rm -rf node_modules
    fi

    npm ci --production=false
    success "Dependencies installed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log "Skipping tests (--skip-tests)"
        return
    fi

    log "Running tests..."
    cd "$PROJECT_ROOT"

    # Unit tests
    npm run test:unit

    # Integration tests
    npm run test:integration

    # HVAC-specific tests
    npm run test:hvac

    # E2E tests for staging and production
    if [[ "$ENVIRONMENT" != "development" ]]; then
        npm run test:e2e:hvac
    fi

    success "All tests passed"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        log "Skipping build (--skip-build)"
        return
    fi

    log "Building application for $ENVIRONMENT..."
    cd "$PROJECT_ROOT"

    # Build frontend
    npm run build:front

    # Build server
    npm run build:server

    # Build HVAC module
    npm run build:hvac

    # Optimize bundle
    if [[ "$ENVIRONMENT" == "production" ]]; then
        npm run optimize:bundle
    fi

    success "Application built successfully"
}

# Create backup
create_backup() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == false ]]; then
        log "Skipping backup (--no-backup)"
        return
    fi

    log "Creating backup before deployment..."
    
    BACKUP_DIR="/tmp/hvac-backup-${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"

    # Backup database (if running)
    if docker ps | grep -q postgres; then
        docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres hvac_crm > "$BACKUP_DIR/database.sql"
        success "Database backup created"
    fi

    # Backup application files
    tar -czf "$BACKUP_DIR/application.tar.gz" -C "$PROJECT_ROOT" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=build \
        .

    success "Backup created at $BACKUP_DIR"
}

# Deploy based on mode
deploy() {
    log "Starting deployment in $MODE mode..."

    case $MODE in
        local)
            deploy_local
            ;;
        docker)
            deploy_docker
            ;;
        kubernetes)
            deploy_kubernetes
            ;;
        vps)
            deploy_vps
            ;;
    esac
}

# Local deployment
deploy_local() {
    log "Deploying locally..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would start local development server"
        return
    fi

    # Start development server
    npm run dev:hvac

    success "Local deployment completed"
}

# Docker deployment
deploy_docker() {
    log "Deploying with Docker..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would build and start Docker containers"
        return
    fi

    # Build Docker images
    docker-compose -f docker/production/docker-compose.prod.yml build

    # Start containers
    docker-compose -f docker/production/docker-compose.prod.yml up -d

    # Wait for health checks
    wait_for_health_checks

    success "Docker deployment completed"
}

# Kubernetes deployment
deploy_kubernetes() {
    log "Deploying to Kubernetes..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would deploy to Kubernetes cluster"
        return
    fi

    # Deploy with Helm
    helm upgrade --install hvac-crm ./k8s/helm-chart \
        --namespace hvac-crm \
        --create-namespace \
        --values ./k8s/values-${ENVIRONMENT}.yaml

    success "Kubernetes deployment completed"
}

# VPS deployment
deploy_vps() {
    log "Deploying to VPS..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would deploy to VPS"
        return
    fi

    # Use existing VPS deployment script
    ./scripts/deploy-to-vps.sh

    success "VPS deployment completed"
}

# Wait for health checks
wait_for_health_checks() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            success "Health checks passed"
            return
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    error "Health checks failed after $max_attempts attempts"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."

    # Run database migrations
    if [[ "$MODE" != "local" ]]; then
        npm run db:migrate
    fi

    # Clear caches
    npm run cache:clear

    # Warm up caches
    npm run cache:warmup

    # Send deployment notification
    send_deployment_notification

    success "Post-deployment tasks completed"
}

# Send deployment notification
send_deployment_notification() {
    log "Sending deployment notification..."
    
    # This would integrate with Slack, email, or other notification systems
    # For now, just log the deployment
    cat << EOF > "/tmp/deployment-${TIMESTAMP}.json"
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "mode": "$MODE",
    "version": "$(git rev-parse HEAD)",
    "deployer": "$(whoami)",
    "status": "success"
}
EOF

    success "Deployment notification sent"
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/hvac-deploy-*.log
    
    success "Cleanup completed"
}

# Main execution
main() {
    log "Starting HVAC CRM deployment..."
    log "Environment: $ENVIRONMENT, Mode: $MODE"
    
    parse_args "$@"
    validate_args
    check_prerequisites
    setup_environment
    install_dependencies
    run_tests
    build_application
    create_backup
    deploy
    post_deployment
    
    success "HVAC CRM deployment completed successfully!"
    log "Deployment log saved to: $LOG_FILE"
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function with all arguments
main "$@"
