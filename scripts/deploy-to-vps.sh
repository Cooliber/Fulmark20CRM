#!/bin/bash

# =============================================================================
# HVAC CRM VPS Deployment Script
# =============================================================================
# This script automates the deployment of your HVAC CRM application to a VPS
# It handles server setup, Docker installation, SSL certificates, and deployment
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Cooliber/Fulmark20CRM.git"
APP_NAME="hvac-crm"
DOMAIN=""
EMAIL=""
VPS_USER="root"
VPS_HOST=""
SSH_KEY_PATH=""
DEPLOY_DIR="/opt/hvac-crm"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to collect deployment information
collect_deployment_info() {
    echo "🚀 HVAC CRM VPS Deployment Setup"
    echo "=================================="
    echo ""
    
    # VPS Connection Details
    if [ -z "$VPS_HOST" ]; then
        read -p "Enter your VPS IP address or hostname: " VPS_HOST
    fi
    
    if [ -z "$VPS_USER" ]; then
        read -p "Enter VPS username (default: root): " input_user
        VPS_USER=${input_user:-root}
    fi
    
    if [ -z "$SSH_KEY_PATH" ]; then
        read -p "Enter path to SSH private key (leave empty for password auth): " SSH_KEY_PATH
    fi
    
    # Domain and SSL
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name (e.g., hvac.yourdomain.com): " DOMAIN
    fi
    
    if [ -z "$EMAIL" ]; then
        read -p "Enter your email for SSL certificate: " EMAIL
    fi
    
    echo ""
    print_status "Configuration Summary:"
    echo "  VPS Host: $VPS_HOST"
    echo "  VPS User: $VPS_USER"
    echo "  Domain: $DOMAIN"
    echo "  Email: $EMAIL"
    echo "  Deploy Directory: $DEPLOY_DIR"
    echo ""
    
    read -p "Continue with deployment? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
}

# Function to check local dependencies
check_local_dependencies() {
    print_status "Checking local dependencies..."
    
    if ! command_exists ssh; then
        print_error "SSH client not found. Please install OpenSSH client."
        exit 1
    fi
    
    if ! command_exists scp; then
        print_error "SCP not found. Please install OpenSSH client."
        exit 1
    fi
    
    print_success "Local dependencies check passed"
}

# Function to test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to VPS..."
    
    SSH_CMD="ssh"
    if [ -n "$SSH_KEY_PATH" ]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH"
    fi
    
    if $SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        print_success "SSH connection established"
    else
        print_error "Failed to connect to VPS. Please check your credentials and network connection."
        exit 1
    fi
}

# Function to create deployment script for VPS
create_vps_setup_script() {
    print_status "Creating VPS setup script..."
    
    cat > /tmp/vps-setup.sh << 'EOF'
#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Update system
print_status "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx

# Install Docker
print_status "Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi

# Install Docker Compose (standalone)
print_status "Installing Docker Compose..."
if ! command -v docker-compose >/dev/null 2>&1; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3000
print_success "Firewall configured"

print_success "VPS setup completed successfully!"
EOF

    chmod +x /tmp/vps-setup.sh
}

# Function to deploy to VPS
deploy_to_vps() {
    print_status "Deploying application to VPS..."
    
    SSH_CMD="ssh"
    SCP_CMD="scp"
    if [ -n "$SSH_KEY_PATH" ]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH"
        SCP_CMD="scp -i $SSH_KEY_PATH"
    fi
    
    # Copy and run setup script
    print_status "Running VPS setup..."
    $SCP_CMD /tmp/vps-setup.sh $VPS_USER@$VPS_HOST:/tmp/
    $SSH_CMD $VPS_USER@$VPS_HOST "chmod +x /tmp/vps-setup.sh && /tmp/vps-setup.sh"
    
    # Create deployment directory
    print_status "Creating deployment directory..."
    $SSH_CMD $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR && cd $DEPLOY_DIR"
    
    # Clone repository
    print_status "Cloning repository..."
    $SSH_CMD $VPS_USER@$VPS_HOST "cd $DEPLOY_DIR && git clone $REPO_URL . || (git fetch origin && git reset --hard origin/main)"
    
    # Create environment file
    print_status "Creating environment configuration..."
    $SSH_CMD $VPS_USER@$VPS_HOST "cd $DEPLOY_DIR && cp packages/twenty-docker/.env.example .env"
    
    # Generate secrets and configure environment
    $SSH_CMD $VPS_USER@$VPS_HOST "cd $DEPLOY_DIR && cat >> .env << EOL

# === Production Configuration ===
SERVER_URL=https://$DOMAIN
TAG=latest

# === Randomly generated secrets ===
APP_SECRET=\$(openssl rand -base64 32)
PG_DATABASE_PASSWORD=\$(openssl rand -hex 16)

# === HVAC Configuration ===
HVAC_ENABLED=true
HVAC_SENTRY_DSN=
HVAC_WEAVIATE_URL=http://localhost:8080
HVAC_WEAVIATE_API_KEY=

# === Storage Configuration ===
STORAGE_TYPE=local

# === Email Configuration (Optional) ===
# EMAIL_FROM_ADDRESS=noreply@$DOMAIN
# EMAIL_FROM_NAME=HVAC CRM System
# EMAIL_SYSTEM_ADDRESS=system@$DOMAIN
# EMAIL_DRIVER=smtp
EOL"
    
    # Start the application
    print_status "Starting HVAC CRM application..."
    $SSH_CMD $VPS_USER@$VPS_HOST "cd $DEPLOY_DIR && docker compose -f packages/twenty-docker/docker-compose.yml up -d"
    
    print_success "Application deployed successfully!"
}

# Function to configure Nginx and SSL
configure_nginx_ssl() {
    print_status "Configuring Nginx and SSL certificate..."

    SSH_CMD="ssh"
    if [ -n "$SSH_KEY_PATH" ]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH"
    fi

    # Create Nginx configuration
    $SSH_CMD $VPS_USER@$VPS_HOST "cat > /etc/nginx/sites-available/$APP_NAME << 'EOL'
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;

    # Proxy to application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # GraphQL endpoint
    location /graphql {
        proxy_pass http://localhost:3000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /healthz {
        proxy_pass http://localhost:3000/healthz;
        access_log off;
    }
}
EOL"

    # Enable the site
    $SSH_CMD $VPS_USER@$VPS_HOST "ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/"
    $SSH_CMD $VPS_USER@$VPS_HOST "rm -f /etc/nginx/sites-enabled/default"

    # Test Nginx configuration
    $SSH_CMD $VPS_USER@$VPS_HOST "nginx -t"

    # Reload Nginx
    $SSH_CMD $VPS_USER@$VPS_HOST "systemctl reload nginx"

    # Obtain SSL certificate
    print_status "Obtaining SSL certificate..."
    $SSH_CMD $VPS_USER@$VPS_HOST "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL"

    print_success "Nginx and SSL configured successfully!"
}

# Function to setup monitoring and backup
setup_monitoring() {
    print_status "Setting up monitoring and backup scripts..."

    SSH_CMD="ssh"
    if [ -n "$SSH_KEY_PATH" ]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH"
    fi

    # Create backup script
    $SSH_CMD $VPS_USER@$VPS_HOST "cat > /usr/local/bin/hvac-backup.sh << 'EOL'
#!/bin/bash

BACKUP_DIR=\"/opt/backups/hvac-crm\"
DATE=\$(date +%Y%m%d_%H%M%S)
DEPLOY_DIR=\"$DEPLOY_DIR\"

mkdir -p \$BACKUP_DIR

# Backup database
docker exec \$(docker ps -q -f name=db) pg_dump -U postgres default > \$BACKUP_DIR/database_\$DATE.sql

# Backup application data
tar -czf \$BACKUP_DIR/app_data_\$DATE.tar.gz -C \$DEPLOY_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name \"*.sql\" -mtime +7 -delete
find \$BACKUP_DIR -name \"*.tar.gz\" -mtime +7 -delete

echo \"Backup completed: \$DATE\"
EOL"

    $SSH_CMD $VPS_USER@$VPS_HOST "chmod +x /usr/local/bin/hvac-backup.sh"

    # Create monitoring script
    $SSH_CMD $VPS_USER@$VPS_HOST "cat > /usr/local/bin/hvac-monitor.sh << 'EOL'
#!/bin/bash

DEPLOY_DIR=\"$DEPLOY_DIR\"
LOG_FILE=\"/var/log/hvac-monitor.log\"

cd \$DEPLOY_DIR

# Check if containers are running
if ! docker compose -f packages/twenty-docker/docker-compose.yml ps | grep -q \"Up\"; then
    echo \"\$(date): Containers not running, attempting restart\" >> \$LOG_FILE
    docker compose -f packages/twenty-docker/docker-compose.yml up -d
fi

# Check application health
if ! curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
    echo \"\$(date): Health check failed, restarting containers\" >> \$LOG_FILE
    docker compose -f packages/twenty-docker/docker-compose.yml restart
fi
EOL"

    $SSH_CMD $VPS_USER@$VPS_HOST "chmod +x /usr/local/bin/hvac-monitor.sh"

    # Setup cron jobs
    $SSH_CMD $VPS_USER@$VPS_HOST "cat > /tmp/crontab << 'EOL'
# HVAC CRM Backup - Daily at 2 AM
0 2 * * * /usr/local/bin/hvac-backup.sh

# HVAC CRM Monitoring - Every 5 minutes
*/5 * * * * /usr/local/bin/hvac-monitor.sh

# SSL Certificate Renewal - Twice daily
0 0,12 * * * /usr/bin/certbot renew --quiet
EOL"

    $SSH_CMD $VPS_USER@$VPS_HOST "crontab /tmp/crontab"

    print_success "Monitoring and backup configured!"
}

# Function to display deployment summary
show_deployment_summary() {
    echo ""
    echo "🎉 HVAC CRM Deployment Complete!"
    echo "================================="
    echo ""
    print_success "Your HVAC CRM application is now running at:"
    echo "  🌐 https://$DOMAIN"
    echo ""
    print_status "Deployment Details:"
    echo "  📁 Application Directory: $DEPLOY_DIR"
    echo "  🐳 Docker Containers: Running"
    echo "  🔒 SSL Certificate: Configured"
    echo "  📊 Monitoring: Enabled"
    echo "  💾 Backups: Scheduled daily at 2 AM"
    echo ""
    print_status "Useful Commands:"
    echo "  📋 View logs: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f packages/twenty-docker/docker-compose.yml logs -f'"
    echo "  🔄 Restart app: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f packages/twenty-docker/docker-compose.yml restart'"
    echo "  📊 Check status: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker compose -f packages/twenty-docker/docker-compose.yml ps'"
    echo "  💾 Manual backup: ssh $VPS_USER@$VPS_HOST '/usr/local/bin/hvac-backup.sh'"
    echo ""
    print_warning "Next Steps:"
    echo "  1. Visit https://$DOMAIN to access your HVAC CRM"
    echo "  2. Complete the initial setup wizard"
    echo "  3. Configure HVAC-specific settings in the admin panel"
    echo "  4. Set up your team and customer data"
    echo ""
}

# Main execution
main() {
    echo "🏗️  HVAC CRM VPS Deployment Script"
    echo "===================================="
    echo ""

    collect_deployment_info
    check_local_dependencies
    test_ssh_connection
    create_vps_setup_script
    deploy_to_vps
    configure_nginx_ssl
    setup_monitoring
    show_deployment_summary

    print_success "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"
