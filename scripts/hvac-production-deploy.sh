#!/bin/bash

# HVAC Production Deployment Script
# "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM
# 
# This script handles safe production deployment with:
# - Health checks before and after deployment
# - Database migrations
# - Cache warming
# - Rollback capabilities
# - Performance monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="/var/log/hvac-deployment.log"
BACKUP_DIR="/var/backups/hvac"
HEALTH_CHECK_URL="http://localhost:3001/hvac/production/health"
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$DEPLOYMENT_LOG"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# Error handling
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
        log_error "Check logs at $DEPLOYMENT_LOG for details"
        
        # Attempt rollback if deployment was in progress
        if [ "${DEPLOYMENT_STARTED:-false}" = "true" ]; then
            log_warn "Attempting automatic rollback..."
            rollback_deployment
        fi
    fi
    exit $exit_code
}

trap cleanup EXIT

# Health check function
check_health() {
    local url=$1
    local max_attempts=${2:-$MAX_HEALTH_CHECK_ATTEMPTS}
    local interval=${3:-$HEALTH_CHECK_INTERVAL}
    
    log_info "Checking health at $url"
    
    for ((i=1; i<=max_attempts; i++)); do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "Health check passed (attempt $i/$max_attempts)"
            return 0
        fi
        
        log_warn "Health check failed (attempt $i/$max_attempts)"
        if [ $i -lt $max_attempts ]; then
            sleep $interval
        fi
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "🔍 Running pre-deployment checks..."
    
    # Check if services are running
    if ! systemctl is-active --quiet twenty-server; then
        log_error "Twenty server is not running"
        return 1
    fi
    
    # Check database connectivity
    if ! npm run db:check > /dev/null 2>&1; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Check current health
    if ! check_health "$HEALTH_CHECK_URL" 5 5; then
        log_error "Current system health check failed"
        return 1
    fi
    
    # Check disk space
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=1048576 # 1GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        log_error "Insufficient disk space. Available: ${available_space}KB, Required: ${required_space}KB"
        return 1
    fi
    
    # Check memory
    local available_memory=$(free | awk 'NR==2{printf "%.0f", $7/1024}')
    local required_memory=512 # 512MB
    
    if [ "$available_memory" -lt "$required_memory" ]; then
        log_error "Insufficient memory. Available: ${available_memory}MB, Required: ${required_memory}MB"
        return 1
    fi
    
    log_success "✅ Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log_info "📦 Creating backup..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/hvac_backup_$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    log_info "Backing up database..."
    if command -v pg_dump > /dev/null; then
        pg_dump "$DATABASE_URL" > "$backup_path/database.sql"
    else
        log_warn "pg_dump not found, skipping database backup"
    fi
    
    # Backup application files
    log_info "Backing up application files..."
    tar -czf "$backup_path/application.tar.gz" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=build \
        "$PROJECT_ROOT"
    
    # Backup environment configuration
    if [ -f "$PROJECT_ROOT/.env" ]; then
        cp "$PROJECT_ROOT/.env" "$backup_path/env.backup"
    fi
    
    echo "$backup_path" > "$BACKUP_DIR/latest_backup.txt"
    log_success "✅ Backup created at $backup_path"
}

# Install dependencies and build
build_application() {
    log_info "🔨 Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run build
    log_info "Building application..."
    npm run build
    
    # Run tests
    log_info "Running tests..."
    npm run test:unit || {
        log_error "Unit tests failed"
        return 1
    }
    
    log_success "✅ Application built successfully"
}

# Run database migrations
run_migrations() {
    log_info "🗄️ Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Check for pending migrations
    if npm run db:migrate:status | grep -q "pending"; then
        log_info "Pending migrations found, applying..."
        npm run db:migrate
        log_success "✅ Database migrations completed"
    else
        log_info "No pending migrations"
    fi
}

# Deploy application
deploy_application() {
    log_info "🚀 Deploying application..."
    
    DEPLOYMENT_STARTED=true
    
    # Stop services gracefully
    log_info "Stopping services..."
    systemctl stop twenty-server || true
    
    # Wait for graceful shutdown
    sleep 5
    
    # Start services
    log_info "Starting services..."
    systemctl start twenty-server
    
    # Wait for startup
    sleep 10
    
    log_success "✅ Application deployed"
}

# Warm up cache
warm_cache() {
    log_info "🔥 Warming up cache..."
    
    # Wait for services to be fully ready
    if check_health "$HEALTH_CHECK_URL" 10 5; then
        # Trigger cache warming endpoints
        curl -sf "http://localhost:3001/hvac/production/cache/warm" > /dev/null 2>&1 || true
        
        # Pre-load common queries
        curl -sf "http://localhost:3001/api/customers?limit=10" > /dev/null 2>&1 || true
        curl -sf "http://localhost:3001/api/tickets?limit=10" > /dev/null 2>&1 || true
        curl -sf "http://localhost:3001/api/equipment?limit=10" > /dev/null 2>&1 || true
        
        log_success "✅ Cache warmed up"
    else
        log_warn "⚠️ Could not warm cache - health check failed"
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log_info "✅ Running post-deployment verification..."
    
    # Health check
    if ! check_health "$HEALTH_CHECK_URL"; then
        log_error "Post-deployment health check failed"
        return 1
    fi
    
    # API endpoint checks
    local endpoints=(
        "http://localhost:3001/health"
        "http://localhost:3001/hvac/health"
        "http://localhost:3001/hvac/production/dashboard"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -sf "$endpoint" > /dev/null 2>&1; then
            log_success "✅ $endpoint is responding"
        else
            log_error "❌ $endpoint is not responding"
            return 1
        fi
    done
    
    # Performance check
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$HEALTH_CHECK_URL")
    local max_response_time=2.0
    
    if (( $(echo "$response_time < $max_response_time" | bc -l) )); then
        log_success "✅ Response time acceptable: ${response_time}s"
    else
        log_warn "⚠️ Response time high: ${response_time}s (max: ${max_response_time}s)"
    fi
    
    log_success "✅ Post-deployment verification completed"
}

# Rollback function
rollback_deployment() {
    log_warn "🔄 Rolling back deployment..."
    
    local latest_backup_file="$BACKUP_DIR/latest_backup.txt"
    
    if [ -f "$latest_backup_file" ]; then
        local backup_path=$(cat "$latest_backup_file")
        
        if [ -d "$backup_path" ]; then
            log_info "Restoring from backup: $backup_path"
            
            # Stop services
            systemctl stop twenty-server || true
            
            # Restore application files
            if [ -f "$backup_path/application.tar.gz" ]; then
                cd "$PROJECT_ROOT"
                tar -xzf "$backup_path/application.tar.gz" --strip-components=1
            fi
            
            # Restore environment
            if [ -f "$backup_path/env.backup" ]; then
                cp "$backup_path/env.backup" "$PROJECT_ROOT/.env"
            fi
            
            # Restore database (if needed)
            # Note: Database rollback should be done carefully in production
            
            # Start services
            systemctl start twenty-server
            
            # Verify rollback
            if check_health "$HEALTH_CHECK_URL" 10 5; then
                log_success "✅ Rollback completed successfully"
            else
                log_error "❌ Rollback verification failed"
            fi
        else
            log_error "Backup directory not found: $backup_path"
        fi
    else
        log_error "No backup information found"
    fi
}

# Main deployment function
main() {
    log_info "🚀 Starting HVAC Production Deployment"
    log_info "Timestamp: $(date)"
    log_info "User: $(whoami)"
    log_info "Project: $PROJECT_ROOT"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Run deployment steps
    pre_deployment_checks
    create_backup
    build_application
    run_migrations
    deploy_application
    warm_cache
    post_deployment_verification
    
    log_success "🎉 HVAC Production Deployment completed successfully!"
    log_info "Deployment log: $DEPLOYMENT_LOG"
    
    # Send notification (if configured)
    if command -v notify-send > /dev/null; then
        notify-send "HVAC Deployment" "Production deployment completed successfully"
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            main
            ;;
        "rollback")
            rollback_deployment
            ;;
        "health-check")
            check_health "$HEALTH_CHECK_URL"
            ;;
        "backup")
            create_backup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health-check|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy      - Full production deployment (default)"
            echo "  rollback    - Rollback to previous version"
            echo "  health-check - Check system health"
            echo "  backup      - Create backup only"
            exit 1
            ;;
    esac
fi
