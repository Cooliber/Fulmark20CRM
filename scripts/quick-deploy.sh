#!/bin/bash

# =============================================================================
# HVAC CRM Quick Deployment Script
# =============================================================================
# This script provides quick deployment options for different environments
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Function for local development deployment
deploy_local() {
    print_status "Starting local development deployment..."
    
    # Create local environment file
    if [ ! -f ".env.local" ]; then
        print_status "Creating local environment file..."
        cp packages/twenty-docker/.env.example .env.local
        
        # Generate secrets
        APP_SECRET=$(openssl rand -base64 32)
        PG_PASSWORD=$(openssl rand -hex 16)
        
        cat >> .env.local << EOL

# === Local Development Configuration ===
SERVER_URL=http://localhost:3000
TAG=latest

# === Generated Secrets ===
APP_SECRET=$APP_SECRET
PG_DATABASE_PASSWORD=$PG_PASSWORD

# === HVAC Configuration ===
HVAC_ENABLED=true
HVAC_SENTRY_DSN=
HVAC_WEAVIATE_URL=http://localhost:8080

# === Storage Configuration ===
STORAGE_TYPE=local

# === Development Settings ===
NODE_ENV=development
EOL
        print_success "Environment file created: .env.local"
    fi
    
    # Start services
    print_status "Starting Docker containers..."
    docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.local up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check health
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000/healthz >/dev/null 2>&1; then
            print_success "Application is ready!"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Application failed to start properly"
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.local logs
        exit 1
    fi
    
    echo ""
    print_success "Local deployment completed!"
    echo "🌐 Access your HVAC CRM at: http://localhost:3000"
    echo "📊 View logs: docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.local logs -f"
}

# Function for production deployment
deploy_production() {
    print_status "Starting production deployment..."
    
    # Check if production environment file exists
    if [ ! -f ".env.production" ]; then
        print_error "Production environment file not found!"
        print_status "Creating template .env.production file..."
        
        cp packages/twenty-docker/.env.example .env.production
        
        # Generate secrets
        APP_SECRET=$(openssl rand -base64 32)
        PG_PASSWORD=$(openssl rand -hex 16)
        
        cat >> .env.production << EOL

# === Production Configuration ===
# IMPORTANT: Update these values for production!
SERVER_URL=https://your-domain.com
TAG=latest

# === Generated Secrets ===
APP_SECRET=$APP_SECRET
PG_DATABASE_PASSWORD=$PG_PASSWORD

# === HVAC Configuration ===
HVAC_ENABLED=true
HVAC_SENTRY_DSN=your_sentry_dsn_here
HVAC_WEAVIATE_URL=http://localhost:8080

# === Storage Configuration ===
STORAGE_TYPE=local
# For production, consider using S3:
# STORAGE_TYPE=s3
# STORAGE_S3_REGION=us-east-1
# STORAGE_S3_NAME=your-bucket-name
# STORAGE_S3_ENDPOINT=

# === Email Configuration ===
# EMAIL_FROM_ADDRESS=noreply@your-domain.com
# EMAIL_FROM_NAME=HVAC CRM System
# EMAIL_SYSTEM_ADDRESS=system@your-domain.com
# EMAIL_DRIVER=smtp
# EMAIL_SMTP_HOST=smtp.your-provider.com
# EMAIL_SMTP_PORT=587
# EMAIL_SMTP_USER=your-smtp-user
# EMAIL_SMTP_PASSWORD=your-smtp-password

# === Production Settings ===
NODE_ENV=production
EOL
        
        print_warning "Please edit .env.production with your production settings before deploying!"
        print_status "Required changes:"
        echo "  - Update SERVER_URL with your domain"
        echo "  - Configure email settings"
        echo "  - Set up Sentry DSN for error tracking"
        echo "  - Configure storage (S3 recommended for production)"
        exit 1
    fi
    
    # Validate production environment
    if grep -q "your-domain.com" .env.production; then
        print_error "Please update SERVER_URL in .env.production with your actual domain!"
        exit 1
    fi
    
    # Start production services
    print_status "Starting production containers..."
    docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.production up -d
    
    print_success "Production deployment started!"
    print_warning "Make sure to configure:"
    echo "  - Reverse proxy (Nginx/Apache)"
    echo "  - SSL certificates"
    echo "  - Firewall rules"
    echo "  - Backup strategy"
}

# Function to stop services
stop_services() {
    print_status "Stopping HVAC CRM services..."
    
    if [ -f ".env.local" ]; then
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.local down
    fi
    
    if [ -f ".env.production" ]; then
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.production down
    fi
    
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    local env_file=".env.local"
    
    if [ "$1" = "production" ]; then
        env_file=".env.production"
    fi
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found"
        exit 1
    fi
    
    docker compose -f packages/twenty-docker/docker-compose.yml --env-file $env_file logs -f
}

# Function to show status
show_status() {
    print_status "HVAC CRM Service Status:"
    echo ""
    
    if [ -f ".env.local" ]; then
        echo "Local Development:"
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.local ps
        echo ""
    fi
    
    if [ -f ".env.production" ]; then
        echo "Production:"
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file .env.production ps
        echo ""
    fi
}

# Function to update application
update_app() {
    print_status "Updating HVAC CRM application..."
    
    # Pull latest changes
    git pull origin main
    
    # Rebuild and restart containers
    local env_file=".env.local"
    if [ "$1" = "production" ]; then
        env_file=".env.production"
    fi
    
    if [ -f "$env_file" ]; then
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file $env_file pull
        docker compose -f packages/twenty-docker/docker-compose.yml --env-file $env_file up -d
        print_success "Application updated successfully!"
    else
        print_error "Environment file $env_file not found"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "HVAC CRM Quick Deployment Script"
    echo "================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  local       Deploy for local development"
    echo "  production  Deploy for production (requires .env.production)"
    echo "  stop        Stop all services"
    echo "  logs        Show logs (add 'production' for prod logs)"
    echo "  status      Show service status"
    echo "  update      Update application (add 'production' for prod)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local                 # Start local development"
    echo "  $0 logs                  # Show local logs"
    echo "  $0 logs production       # Show production logs"
    echo "  $0 update production     # Update production deployment"
    echo ""
}

# Main execution
case "${1:-help}" in
    "local")
        check_dependencies
        deploy_local
        ;;
    "production")
        check_dependencies
        deploy_production
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "status")
        show_status
        ;;
    "update")
        update_app "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
