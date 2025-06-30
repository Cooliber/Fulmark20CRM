#!/bin/bash

# HVAC CRM Backup Script
# "Pasja rodzi profesjonalizm" - Professional backup automation
#
# This script provides comprehensive backup functionality for HVAC CRM
# including database, application files, and configuration.

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Default configuration
BACKUP_DIR="/opt/backups/hvac-crm"
RETENTION_DAYS=30
COMPRESS=true
ENCRYPT=false
REMOTE_BACKUP=false
BACKUP_TYPE="full"
DRY_RUN=false

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="hvac_crm"
DB_USER="postgres"
DB_PASSWORD=""

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--backup-dir)
                BACKUP_DIR="$2"
                shift 2
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            -t|--type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --no-compress)
                COMPRESS=false
                shift
                ;;
            --encrypt)
                ENCRYPT=true
                shift
                ;;
            --remote)
                REMOTE_BACKUP=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --db-host)
                DB_HOST="$2"
                shift 2
                ;;
            --db-port)
                DB_PORT="$2"
                shift 2
                ;;
            --db-name)
                DB_NAME="$2"
                shift 2
                ;;
            --db-user)
                DB_USER="$2"
                shift 2
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
HVAC CRM Backup Script
"Pasja rodzi profesjonalizm" - Professional backup automation

Usage: $0 [OPTIONS]

Options:
    -d, --backup-dir DIR     Backup directory (default: /opt/backups/hvac-crm)
    -r, --retention DAYS     Retention period in days (default: 30)
    -t, --type TYPE         Backup type (full|database|files) (default: full)
    --no-compress           Disable compression
    --encrypt               Enable encryption
    --remote                Enable remote backup
    --dry-run               Show what would be done without executing
    --db-host HOST          Database host (default: localhost)
    --db-port PORT          Database port (default: 5432)
    --db-name NAME          Database name (default: hvac_crm)
    --db-user USER          Database user (default: postgres)
    -h, --help              Show this help message

Backup Types:
    full        Complete backup (database + files)
    database    Database only
    files       Application files only

Examples:
    $0                                    # Full backup with defaults
    $0 -t database --encrypt             # Database backup with encryption
    $0 -d /custom/backup --retention 7   # Custom location, 7 days retention
    $0 --dry-run                         # Show what would be backed up

EOF
}

# Validate arguments and environment
validate_environment() {
    log "Validating environment..."

    # Check if backup directory exists or can be created
    if [[ ! -d "$BACKUP_DIR" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            mkdir -p "$BACKUP_DIR" || error "Cannot create backup directory: $BACKUP_DIR"
        fi
    fi

    # Check required tools
    command -v pg_dump >/dev/null 2>&1 || error "pg_dump is required but not installed"
    
    if [[ "$COMPRESS" == true ]]; then
        command -v gzip >/dev/null 2>&1 || error "gzip is required for compression"
    fi

    if [[ "$ENCRYPT" == true ]]; then
        command -v gpg >/dev/null 2>&1 || error "gpg is required for encryption"
    fi

    # Validate backup type
    if [[ ! "$BACKUP_TYPE" =~ ^(full|database|files)$ ]]; then
        error "Invalid backup type: $BACKUP_TYPE. Must be one of: full, database, files"
    fi

    success "Environment validation passed"
}

# Get database password
get_db_password() {
    if [[ -z "$DB_PASSWORD" ]]; then
        # Try to get from environment
        if [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
            DB_PASSWORD="$POSTGRES_PASSWORD"
        elif [[ -n "${DATABASE_PASSWORD:-}" ]]; then
            DB_PASSWORD="$DATABASE_PASSWORD"
        elif [[ -f "$PROJECT_ROOT/.env" ]]; then
            # Try to extract from .env file
            DB_PASSWORD=$(grep "^POSTGRES_PASSWORD=" "$PROJECT_ROOT/.env" | cut -d'=' -f2 | tr -d '"')
        fi
    fi

    if [[ -z "$DB_PASSWORD" ]]; then
        read -s -p "Enter database password: " DB_PASSWORD
        echo
    fi
}

# Create database backup
backup_database() {
    log "Creating database backup..."

    local backup_file="$BACKUP_DIR/database_${TIMESTAMP}.sql"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would create database backup at $backup_file"
        return
    fi

    # Set password for pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Create database backup
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --file="$backup_file" || error "Database backup failed"

    # Compress if requested
    if [[ "$COMPRESS" == true ]]; then
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi

    # Encrypt if requested
    if [[ "$ENCRYPT" == true ]]; then
        gpg --symmetric --cipher-algo AES256 "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi

    success "Database backup created: $backup_file"
}

# Create application files backup
backup_files() {
    log "Creating application files backup..."

    local backup_file="$BACKUP_DIR/files_${TIMESTAMP}.tar"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would create files backup at $backup_file"
        return
    fi

    # Create tar archive
    tar -cf "$backup_file" \
        -C "$PROJECT_ROOT" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=build \
        --exclude=coverage \
        --exclude=.next \
        --exclude=logs \
        --exclude=tmp \
        . || error "Files backup failed"

    # Compress if requested
    if [[ "$COMPRESS" == true ]]; then
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi

    # Encrypt if requested
    if [[ "$ENCRYPT" == true ]]; then
        gpg --symmetric --cipher-algo AES256 "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi

    success "Files backup created: $backup_file"
}

# Create configuration backup
backup_configuration() {
    log "Creating configuration backup..."

    local config_dir="$BACKUP_DIR/config_${TIMESTAMP}"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would create configuration backup at $config_dir"
        return
    fi

    mkdir -p "$config_dir"

    # Backup environment files (without sensitive data)
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        # Remove sensitive data from env backup
        grep -v -E "(PASSWORD|SECRET|KEY|TOKEN)" "$PROJECT_ROOT/.env" > "$config_dir/env.backup" || true
    fi

    # Backup Docker configurations
    if [[ -d "$PROJECT_ROOT/docker" ]]; then
        cp -r "$PROJECT_ROOT/docker" "$config_dir/"
    fi

    # Backup scripts
    if [[ -d "$PROJECT_ROOT/scripts" ]]; then
        cp -r "$PROJECT_ROOT/scripts" "$config_dir/"
    fi

    # Create archive
    tar -czf "$config_dir.tar.gz" -C "$BACKUP_DIR" "config_${TIMESTAMP}"
    rm -rf "$config_dir"

    success "Configuration backup created: $config_dir.tar.gz"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."

    local manifest_file="$BACKUP_DIR/manifest_${TIMESTAMP}.json"
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would create manifest at $manifest_file"
        return
    fi

    cat > "$manifest_file" << EOF
{
    "backup_id": "${TIMESTAMP}",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "type": "${BACKUP_TYPE}",
    "compressed": ${COMPRESS},
    "encrypted": ${ENCRYPT},
    "database": {
        "host": "${DB_HOST}",
        "port": "${DB_PORT}",
        "name": "${DB_NAME}",
        "user": "${DB_USER}"
    },
    "files": [
$(find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f | sed 's/.*/"&"/' | paste -sd, -)
    ],
    "retention_days": ${RETENTION_DAYS},
    "created_by": "$(whoami)",
    "hostname": "$(hostname)",
    "version": "$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF

    success "Backup manifest created: $manifest_file"
}

# Upload to remote storage
upload_remote() {
    if [[ "$REMOTE_BACKUP" == false ]]; then
        return
    fi

    log "Uploading to remote storage..."

    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would upload backups to remote storage"
        return
    fi

    # This would integrate with cloud storage (AWS S3, Google Cloud, etc.)
    # For now, just log the action
    warning "Remote backup not implemented yet"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would remove backups older than $RETENTION_DAYS days"
        find "$BACKUP_DIR" -name "*.sql*" -o -name "*.tar*" -o -name "*.json" | \
            xargs ls -la | head -10
        return
    fi

    # Remove old database backups
    find "$BACKUP_DIR" -name "database_*.sql*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Remove old file backups
    find "$BACKUP_DIR" -name "files_*.tar*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Remove old configuration backups
    find "$BACKUP_DIR" -name "config_*.tar*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    # Remove old manifests
    find "$BACKUP_DIR" -name "manifest_*.json" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    success "Old backups cleaned up"
}

# Generate backup report
generate_report() {
    log "Generating backup report..."

    local report_file="$BACKUP_DIR/backup_report_${DATE}.txt"
    
    cat > "$report_file" << EOF
HVAC CRM Backup Report
Generated: $(date)
Backup ID: ${TIMESTAMP}
Type: ${BACKUP_TYPE}

Backup Details:
- Directory: ${BACKUP_DIR}
- Compressed: ${COMPRESS}
- Encrypted: ${ENCRYPT}
- Remote: ${REMOTE_BACKUP}

Files Created:
$(find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f -exec ls -lh {} \; 2>/dev/null || echo "No files found")

Disk Usage:
$(du -sh "$BACKUP_DIR" 2>/dev/null || echo "Cannot calculate disk usage")

Status: SUCCESS
EOF

    success "Backup report generated: $report_file"
}

# Main backup function
perform_backup() {
    log "Starting HVAC CRM backup (type: $BACKUP_TYPE)..."

    case $BACKUP_TYPE in
        "full")
            get_db_password
            backup_database
            backup_files
            backup_configuration
            ;;
        "database")
            get_db_password
            backup_database
            ;;
        "files")
            backup_files
            backup_configuration
            ;;
    esac

    create_manifest
    upload_remote
    cleanup_old_backups
    generate_report

    success "HVAC CRM backup completed successfully!"
}

# Main execution
main() {
    parse_args "$@"
    validate_environment
    perform_backup
}

# Run main function with all arguments
main "$@"
