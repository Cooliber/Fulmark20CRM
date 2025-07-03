#!/bin/bash

# HVAC Docker Manager Script
# "Pasja rodzi profesjonalizm" - Professional HVAC Docker Management
# 
# Advanced Docker management for HVAC-Enhanced TwentyCRM
# Provides comprehensive container lifecycle management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_hvac() {
    echo -e "${PURPLE}🏗️  HVAC: $1${NC}"
}

print_docker() {
    echo -e "${CYAN}🐳 Docker: $1${NC}"
}

# Configuration
COMPOSE_FILE="docker-compose.localhost.yml"
PROJECT_NAME="hvac-twentycrm"

# Function to show usage
show_usage() {
    echo "HVAC Docker Manager - Professional Container Management"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start       Start all HVAC services"
    echo "  stop        Stop all HVAC services"
    echo "  restart     Restart all HVAC services"
    echo "  status      Show status of all services"
    echo "  logs        Show logs for all services"
    echo "  health      Check health of all services"
    echo "  clean       Clean up containers and volumes"
    echo "  rebuild     Rebuild and restart all services"
    echo "  backup      Backup database and volumes"
    echo "  restore     Restore from backup"
    echo "  monitor     Real-time monitoring dashboard"
    echo ""
    echo "Service-specific commands:"
    echo "  start-service [service]    Start specific service"
    echo "  stop-service [service]     Stop specific service"
    echo "  logs-service [service]     Show logs for specific service"
    echo "  shell [service]            Open shell in service container"
    echo ""
    echo "Available services: twenty-server, twenty-front, postgres, redis, weaviate"
    echo ""
    echo "Examples:"
    echo "  $0 start                   # Start all services"
    echo "  $0 logs-service postgres   # Show PostgreSQL logs"
    echo "  $0 shell twenty-server     # Open shell in backend container"
    echo "  $0 health                  # Check all services health"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check if compose file exists
check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file '$COMPOSE_FILE' not found."
        print_info "Please run './scripts/setupkurde.sh' first to create the configuration."
        exit 1
    fi
}

# Function to start all services
start_services() {
    print_docker "Starting HVAC-Enhanced TwentyCRM services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    print_info "Waiting for services to be ready..."
    sleep 30
    
    check_health
}

# Function to stop all services
stop_services() {
    print_docker "Stopping HVAC-Enhanced TwentyCRM services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    print_status "All services stopped"
}

# Function to restart all services
restart_services() {
    print_docker "Restarting HVAC-Enhanced TwentyCRM services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart
    
    print_info "Waiting for services to be ready..."
    sleep 20
    
    check_health
}

# Function to show service status
show_status() {
    print_docker "HVAC-Enhanced TwentyCRM Service Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

# Function to show logs
show_logs() {
    print_docker "HVAC-Enhanced TwentyCRM Service Logs:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f --tail=100
}

# Function to check health
check_health() {
    print_docker "Checking HVAC system health..."
    echo ""
    
    services=("twenty-server" "twenty-front" "postgres" "redis" "weaviate")
    all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps "$service" | grep -q "Up"; then
            # Check if service is actually responding
            case $service in
                "twenty-server")
                    if curl -s http://localhost:3001/healthz > /dev/null 2>&1; then
                        print_status "$service: Healthy"
                    else
                        print_warning "$service: Running but not responding"
                        all_healthy=false
                    fi
                    ;;
                "twenty-front")
                    if curl -s http://localhost:3002 > /dev/null 2>&1; then
                        print_status "$service: Healthy"
                    else
                        print_warning "$service: Running but not responding"
                        all_healthy=false
                    fi
                    ;;
                "postgres")
                    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T postgres pg_isready -U twenty > /dev/null 2>&1; then
                        print_status "$service: Healthy"
                    else
                        print_warning "$service: Running but not ready"
                        all_healthy=false
                    fi
                    ;;
                "redis")
                    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T redis redis-cli ping > /dev/null 2>&1; then
                        print_status "$service: Healthy"
                    else
                        print_warning "$service: Running but not responding"
                        all_healthy=false
                    fi
                    ;;
                "weaviate")
                    if curl -s http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
                        print_status "$service: Healthy"
                    else
                        print_warning "$service: Running but not ready"
                        all_healthy=false
                    fi
                    ;;
            esac
        else
            print_error "$service: Not running"
            all_healthy=false
        fi
    done
    
    echo ""
    if [ "$all_healthy" = true ]; then
        print_status "All HVAC services are healthy!"
        echo ""
        echo "📱 Access URLs:"
        echo "   Frontend:     http://localhost:3002"
        echo "   Backend API:  http://localhost:3001"
        echo "   GraphQL:      http://localhost:3001/graphql"
        echo "   Weaviate:     http://localhost:8080"
    else
        print_warning "Some services are not healthy. Check the logs for details."
    fi
}

# Function to clean up
clean_up() {
    print_warning "This will remove all containers, networks, and volumes."
    read -p "Are you sure? (y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        print_docker "Cleaning up HVAC Docker environment..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Function to rebuild services
rebuild_services() {
    print_docker "Rebuilding HVAC-Enhanced TwentyCRM services..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    print_info "Waiting for services to be ready..."
    sleep 30
    
    check_health
}

# Function to backup data
backup_data() {
    print_docker "Creating HVAC data backup..."
    
    backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL
    print_info "Backing up PostgreSQL database..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T postgres pg_dump -U twenty default > "$backup_dir/postgres_backup.sql"
    
    # Backup Weaviate data
    print_info "Backing up Weaviate data..."
    docker cp "${PROJECT_NAME}_weaviate_1:/var/lib/weaviate" "$backup_dir/weaviate_data" 2>/dev/null || print_warning "Weaviate backup failed"
    
    print_status "Backup created in $backup_dir"
}

# Main script logic
case "${1:-}" in
    "start")
        check_docker
        check_compose_file
        start_services
        ;;
    "stop")
        check_docker
        check_compose_file
        stop_services
        ;;
    "restart")
        check_docker
        check_compose_file
        restart_services
        ;;
    "status")
        check_docker
        check_compose_file
        show_status
        ;;
    "logs")
        check_docker
        check_compose_file
        show_logs
        ;;
    "health")
        check_docker
        check_compose_file
        check_health
        ;;
    "clean")
        check_docker
        check_compose_file
        clean_up
        ;;
    "rebuild")
        check_docker
        check_compose_file
        rebuild_services
        ;;
    "backup")
        check_docker
        check_compose_file
        backup_data
        ;;
    *)
        show_usage
        ;;
esac
