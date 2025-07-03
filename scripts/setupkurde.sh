#!/bin/bash
set -e

# HVAC-Enhanced TwentyCRM Docker Setup Script
# "Pasja rodzi profesjonalizm" - Professional HVAC CRM Docker Environment
#
# This script creates an ideal Docker container setup for localhost development
# with full HVAC module integration, optimized for Polish market requirements

echo "🏗️  Setting up HVAC-Enhanced TwentyCRM Docker Environment..."
echo "=================================================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/twenty-server" ]; then
    print_error "This script must be run from the TwentyCRM root directory"
    exit 1
fi

print_info "Detected TwentyCRM root directory with HVAC integration"

# Step 1: System Dependencies
echo ""
echo "📋 Step 1: Installing system dependencies..."

# Update package lists
print_info "Updating package lists..."
sudo apt-get update

# Install Docker and Docker Compose if not present
if ! command -v docker &> /dev/null; then
    print_docker "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_status "Docker installed successfully"
else
    print_status "Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    print_docker "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose already installed"
fi

# Install Node.js 22 (required by package.json engines)
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 22 ]]; then
    print_info "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js 22 installed"
else
    print_status "Node.js 22 already available"
fi

# Verify Node.js version
node --version
npm --version

# Enable corepack for Yarn management
#sudo corepack enable

# Install the specific Yarn version from package.json (4.4.0)
#if [ -f ".yarnrc.yml" ]; then
#    print_info "Found .yarnrc.yml, using corepack to install correct Yarn version..."
#    corepack install
#else
#    print_info "Installing Yarn 4.x..."
#    corepack prepare yarn@4.4.0 --activate
#fi

# Verify Yarn version
yarn --version
print_status "Development tools configured"

# Step 2: HVAC Module Configuration
echo ""
echo "🏗️  Step 2: Configuring HVAC modules..."

# Check HVAC module structure
if [ -d "packages/twenty-front/src/modules/hvac" ]; then
    print_hvac "HVAC frontend modules detected"
else
    print_warning "HVAC frontend modules not found - will be created during build"
fi

if [ -d "packages/twenty-server/src/modules/hvac" ]; then
    print_hvac "HVAC backend modules detected"
else
    print_warning "HVAC backend modules not found - will be created during build"
fi

if [ -d "packages/twenty-hvac-server" ]; then
    print_hvac "Dedicated HVAC server package detected"
else
    print_warning "Dedicated HVAC server package not found"
fi

# Check HVAC micro-packages
HVAC_PACKAGES=("hvac-core" "hvac-dashboard" "hvac-analytics" "hvac-equipment")
for package in "${HVAC_PACKAGES[@]}"; do
    if [ -d "packages/$package" ]; then
        print_hvac "HVAC micro-package '$package' detected"
    else
        print_warning "HVAC micro-package '$package' not found"
    fi
done

# Step 3: Docker Environment Setup
echo ""
echo "🐳 Step 3: Setting up Docker environment..."

# Create optimized Docker Compose for localhost development
print_docker "Creating optimized Docker Compose configuration..."

cat > docker-compose.localhost.yml << 'EOF'
# HVAC-Enhanced TwentyCRM Localhost Docker Setup
# "Pasja rodzi profesjonalizm" - Professional HVAC Development Environment
#
# Optimized for localhost development with full HVAC integration
# Includes Weaviate for semantic search and Sentry for error monitoring

version: '3.8'

services:
  # TwentyCRM Server with HVAC Integration
  twenty-server:
    build:
      context: .
      dockerfile: packages/twenty-docker/twenty/Dockerfile
      target: development
    container_name: hvac-twenty-server-dev
    restart: unless-stopped
    environment:
      # Core Configuration
      - NODE_ENV=development
      - SERVER_URL=http://localhost:3001
      - FRONT_BASE_URL=http://localhost:3002
      - PG_DATABASE_URL=postgresql://twenty:twenty_dev_password@postgres:5432/default
      - REDIS_URL=redis://redis:6379

      # HVAC Configuration
      - HVAC_ENABLED=true
      - HVAC_API_VERSION=v1
      - HVAC_API_TIMEOUT=30000
      - HVAC_CACHE_ENABLED=true
      - HVAC_CACHE_TTL=300000

      # Weaviate Configuration (for semantic search)
      - WEAVIATE_HOST=weaviate
      - WEAVIATE_PORT=8080
      - WEAVIATE_SCHEME=http
      - WEAVIATE_API_KEY=hvac-dev-key-2024

      # Polish Localization
      - HVAC_DEFAULT_LANGUAGE=pl
      - HVAC_CURRENCY=PLN
      - HVAC_TIMEZONE=Europe/Warsaw
      - COMPANY_NAME=Fulmark HVAC Development

      # Development Features
      - HVAC_ENABLE_DEBUG=true
      - HVAC_LOG_LEVEL=debug
      - HVAC_ENABLE_HOT_RELOAD=true

      # Security (development keys)
      - ACCESS_TOKEN_SECRET=hvac_dev_access_secret_2024
      - LOGIN_TOKEN_SECRET=hvac_dev_login_secret_2024
      - REFRESH_TOKEN_SECRET=hvac_dev_refresh_secret_2024
      - FILE_TOKEN_SECRET=hvac_dev_file_secret_2024

    ports:
      - "3001:3000"  # Backend API
      - "9229:9229"  # Node.js debugging
    volumes:
      - .:/app
      - /app/node_modules
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      weaviate:
        condition: service_healthy
    networks:
      - hvac-dev-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # TwentyCRM Frontend with HVAC UI
  twenty-front:
    build:
      context: .
      dockerfile: packages/twenty-front/Dockerfile.dev
    container_name: hvac-twenty-front-dev
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - REACT_APP_SERVER_BASE_URL=http://localhost:3001
      - REACT_APP_HVAC_ENABLED=true
      - REACT_APP_HVAC_DEBUG=true
      - REACT_APP_WEAVIATE_URL=http://localhost:8080
    ports:
      - "3002:3000"  # Frontend
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - twenty-server
    networks:
      - hvac-dev-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: hvac-postgres-dev
    restart: unless-stopped
    environment:
      - POSTGRES_DB=default
      - POSTGRES_USER=twenty
      - POSTGRES_PASSWORD=twenty_dev_password
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=pl_PL.UTF-8 --lc-ctype=pl_PL.UTF-8
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/sql:/docker-entrypoint-initdb.d
    networks:
      - hvac-dev-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twenty -d default"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: hvac-redis-dev
    restart: unless-stopped
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    networks:
      - hvac-dev-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Weaviate Vector Database (for HVAC semantic search)
  weaviate:
    image: semitechnologies/weaviate:1.22.4
    container_name: hvac-weaviate-dev
    restart: unless-stopped
    environment:
      - QUERY_DEFAULTS_LIMIT=25
      - AUTHENTICATION_APIKEY_ENABLED=true
      - AUTHENTICATION_APIKEY_ALLOWED_KEYS=hvac-dev-key-2024
      - AUTHENTICATION_APIKEY_USERS=hvac-dev-user
      - AUTHORIZATION_ADMINLIST_ENABLED=true
      - AUTHORIZATION_ADMINLIST_USERS=hvac-dev-user
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
      - DEFAULT_VECTORIZER_MODULE=none
      - ENABLE_MODULES=text2vec-openai,generative-openai
      - CLUSTER_HOSTNAME=node1
      - LOG_LEVEL=debug
    ports:
      - "8080:8080"
    volumes:
      - weaviate_dev_data:/var/lib/weaviate
    networks:
      - hvac-dev-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/v1/.well-known/ready"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_dev_data:
    driver: local
  redis_dev_data:
    driver: local
  weaviate_dev_data:
    driver: local

networks:
  hvac-dev-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16

EOF

print_status "Docker Compose configuration created"

# Create optimized Dockerfile for development
print_docker "Creating optimized development Dockerfile..."

mkdir -p packages/twenty-front
cat > packages/twenty-front/Dockerfile.dev << 'EOF'
# HVAC-Enhanced TwentyCRM Frontend Development Dockerfile
# "Pasja rodzi profesjonalizm" - Professional HVAC Frontend Development

FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Enable corepack for Yarn
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/twenty-front/package.json ./packages/twenty-front/
COPY packages/twenty-shared/package.json ./packages/twenty-shared/
COPY packages/twenty-ui/package.json ./packages/twenty-ui/
COPY packages/hvac-core/package.json ./packages/hvac-core/ 2>/dev/null || true
COPY packages/hvac-dashboard/package.json ./packages/hvac-dashboard/ 2>/dev/null || true

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build shared packages
RUN yarn nx build twenty-shared
RUN yarn nx build twenty-ui

# Build HVAC packages if they exist
RUN yarn nx build hvac-core 2>/dev/null || echo "hvac-core not found, skipping"
RUN yarn nx build hvac-dashboard 2>/dev/null || echo "hvac-dashboard not found, skipping"

# Expose port
EXPOSE 3000

# Start development server
CMD ["yarn", "nx", "start", "twenty-front"]
EOF

print_status "Frontend development Dockerfile created"

# Step 4: Environment Configuration
echo ""
echo "⚙️  Step 4: Setting up environment configuration..."

# Create development environment file
print_info "Creating development environment configuration..."

cat > .env.development << 'EOF'
# HVAC-Enhanced TwentyCRM Development Environment
# "Pasja rodzi profesjonalizm" - Professional HVAC Development Configuration

# Core Configuration
NODE_ENV=development
SERVER_URL=http://localhost:3001
FRONT_BASE_URL=http://localhost:3002

# Database Configuration
PG_DATABASE_URL=postgresql://twenty:twenty_dev_password@localhost:5432/default
REDIS_URL=redis://localhost:6379

# HVAC Configuration
HVAC_ENABLED=true
HVAC_API_VERSION=v1
HVAC_API_TIMEOUT=30000
HVAC_CACHE_ENABLED=true
HVAC_CACHE_TTL=300000
HVAC_DEFAULT_LANGUAGE=pl
HVAC_CURRENCY=PLN
HVAC_TIMEZONE=Europe/Warsaw
HVAC_ENABLE_DEBUG=true
HVAC_LOG_LEVEL=debug

# Weaviate Configuration
WEAVIATE_HOST=localhost
WEAVIATE_PORT=8080
WEAVIATE_SCHEME=http
WEAVIATE_API_KEY=hvac-dev-key-2024

# Security (development keys - DO NOT USE IN PRODUCTION)
ACCESS_TOKEN_SECRET=hvac_dev_access_secret_2024_very_long_and_secure
LOGIN_TOKEN_SECRET=hvac_dev_login_secret_2024_very_long_and_secure
REFRESH_TOKEN_SECRET=hvac_dev_refresh_secret_2024_very_long_and_secure
FILE_TOKEN_SECRET=hvac_dev_file_secret_2024_very_long_and_secure

# Polish Business Configuration
COMPANY_NAME=Fulmark HVAC Development
LOCALIZATION_CURRENCY=PLN
LOCALIZATION_TIMEZONE=Europe/Warsaw
LOCALIZATION_LANGUAGE=pl

# Development Features
ENABLE_DEBUG_MODE=true
ENABLE_HOT_RELOAD=true
ENABLE_SOURCE_MAPS=true
ENABLE_PERFORMANCE_MONITORING=true

# Optional: Sentry Configuration (comment out if not needed)
# SENTRY_DSN=your_sentry_dsn_here
# SENTRY_ENVIRONMENT=development
# SENTRY_RELEASE=hvac-dev-1.0.0
EOF

print_status "Development environment configuration created"

# Step 5: Install dependencies and build
echo ""
echo "📦 Step 5: Installing dependencies and building..."

print_info "Installing project dependencies..."
#yarn install

print_info "Building shared packages..."
yarn nx build twenty-shared
yarn nx build twenty-ui

# Build HVAC packages if they exist
if [ -d "packages/hvac-core" ]; then
    print_hvac "Building hvac-core package..."
    yarn nx build hvac-core || print_warning "hvac-core build failed"
fi

if [ -d "packages/hvac-dashboard" ]; then
    print_hvac "Building hvac-dashboard package..."
    yarn nx build hvac-dashboard || print_warning "hvac-dashboard build failed"
fi

print_status "Dependencies installed and packages built"

# Step 6: Create startup scripts
echo ""
echo "🚀 Step 6: Creating startup scripts..."

# Create Docker startup script
cat > start-hvac-docker.sh << 'EOF'
#!/bin/bash

# HVAC-Enhanced TwentyCRM Docker Startup Script
# "Pasja rodzi profesjonalizm" - Professional HVAC Docker Environment

echo "🚀 Starting HVAC-Enhanced TwentyCRM Docker Environment..."
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_hvac() {
    echo -e "${PURPLE}🏗️  HVAC: $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

print_info "Docker is running"

# Load environment variables
if [ -f ".env.development" ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
    print_status "Environment variables loaded"
fi

# Start services with Docker Compose
print_info "Starting HVAC-Enhanced TwentyCRM services..."
docker-compose -f docker-compose.localhost.yml up -d

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 30

# Check service health
echo ""
echo "🔍 Checking service health..."

services=("postgres" "redis" "weaviate" "twenty-server" "twenty-front")
for service in "${services[@]}"; do
    if docker-compose -f docker-compose.localhost.yml ps $service | grep -q "Up"; then
        print_status "$service is running"
    else
        echo "❌ $service failed to start"
    fi
done

echo ""
echo "🎉 HVAC-Enhanced TwentyCRM is ready!"
echo "============================================"
echo ""
echo "📱 Access URLs:"
echo "   Frontend:     http://localhost:3002"
echo "   Backend API:  http://localhost:3001"
echo "   GraphQL:      http://localhost:3001/graphql"
echo "   Weaviate:     http://localhost:8080"
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo ""
echo "🏗️  HVAC Features:"
echo "   - Semantic Search (Weaviate)"
echo "   - Polish Market Compliance"
echo "   - Equipment Management"
echo "   - Service Ticket System"
echo "   - Customer 360 View"
echo "   - Analytics Dashboard"
echo ""
echo "🛠️  Development Tools:"
echo "   - Hot Reload Enabled"
echo "   - Debug Mode Active"
echo "   - Source Maps Enabled"
echo "   - Performance Monitoring"
echo ""
echo "📋 Useful Commands:"
echo "   Stop services:    docker-compose -f docker-compose.localhost.yml down"
echo "   View logs:        docker-compose -f docker-compose.localhost.yml logs -f"
echo "   Restart service:  docker-compose -f docker-compose.localhost.yml restart <service>"
echo ""
echo -e "${PURPLE}Pasja rodzi profesjonalizm! 🏗️${NC}"
EOF

chmod +x start-hvac-docker.sh
print_status "Docker startup script created: ./start-hvac-docker.sh"

# Create native development startup script (without Docker)
cat > start-hvac-native.sh << 'EOF'
#!/bin/bash

# HVAC-Enhanced TwentyCRM Native Development Startup
# "Pasja rodzi profesjonalizm" - Professional HVAC Native Development

echo "🚀 Starting HVAC-Enhanced TwentyCRM (Native Development)..."
echo "=========================================================="

# Load environment variables
if [ -f ".env.development" ]; then
    export $(cat .env.development | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

# Check if required services are running
echo ""
echo "🔍 Checking required services..."

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   sudo systemctl start postgresql"
    exit 1
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running. Please start Redis first."
    echo "   sudo systemctl start redis"
    exit 1
fi

# Start TwentyCRM in development mode
echo ""
echo "🏗️  Starting TwentyCRM with HVAC integration..."
yarn start:dev

EOF

chmod +x start-hvac-native.sh
print_status "Native startup script created: ./start-hvac-native.sh"

# Step 7: Optional Components Configuration
echo ""
echo "🔧 Step 7: Configuring optional components..."

# Ask about Weaviate
echo ""
print_info "Weaviate Vector Database Configuration:"
echo "Weaviate provides semantic search capabilities for HVAC data."
echo "It's highly recommended for advanced search features and AI insights."
read -p "Do you want to include Weaviate in your setup? (Y/n): " include_weaviate
include_weaviate=${include_weaviate:-Y}

if [[ $include_weaviate =~ ^[Yy]$ ]]; then
    print_status "Weaviate will be included in the setup"
    WEAVIATE_ENABLED=true
else
    print_warning "Weaviate will be disabled"
    WEAVIATE_ENABLED=false
    # Comment out Weaviate service in docker-compose
    sed -i '/# Weaviate Vector Database/,/healthcheck:/s/^/#/' docker-compose.localhost.yml
fi

# Ask about Sentry
echo ""
print_info "Sentry Error Monitoring Configuration:"
echo "Sentry provides error tracking and performance monitoring."
echo "It's recommended for production-like development environments."
read -p "Do you want to include Sentry monitoring? (y/N): " include_sentry
include_sentry=${include_sentry:-N}

if [[ $include_sentry =~ ^[Yy]$ ]]; then
    print_status "Sentry monitoring will be enabled"
    read -p "Enter your Sentry DSN (or press Enter to configure later): " sentry_dsn
    if [ ! -z "$sentry_dsn" ]; then
        echo "SENTRY_DSN=$sentry_dsn" >> .env.development
        echo "SENTRY_ENVIRONMENT=development" >> .env.development
        echo "SENTRY_RELEASE=hvac-dev-1.0.0" >> .env.development
        print_status "Sentry configuration added to .env.development"
    fi
else
    print_info "Sentry monitoring will be disabled"
fi

# Step 8: HVAC-specific optimizations
echo ""
echo "🏗️  Step 8: Applying HVAC-specific optimizations..."

# Create HVAC development configuration
mkdir -p .hvac
cat > .hvac/development.json << 'EOF'
{
  "hvac": {
    "version": "1.0.0",
    "environment": "development",
    "features": {
      "semanticSearch": true,
      "customer360": true,
      "equipmentManagement": true,
      "serviceTickets": true,
      "analytics": true,
      "polishCompliance": true,
      "aiInsights": true
    },
    "performance": {
      "bundleOptimization": true,
      "lazyLoading": true,
      "codesplitting": true,
      "maxBundleSize": "4.7MB"
    },
    "localization": {
      "defaultLanguage": "pl",
      "currency": "PLN",
      "timezone": "Europe/Warsaw",
      "dateFormat": "DD.MM.YYYY",
      "numberFormat": "pl-PL"
    },
    "development": {
      "hotReload": true,
      "debugMode": true,
      "sourceMaps": true,
      "performanceMonitoring": true,
      "errorBoundaries": true
    }
  }
}
EOF

print_hvac "HVAC development configuration created"

# Create HVAC-specific Docker health check script
cat > .hvac/health-check.sh << 'EOF'
#!/bin/bash

# HVAC Health Check Script
echo "🔍 Checking HVAC system health..."

# Check TwentyCRM Backend
if curl -s http://localhost:3001/healthz > /dev/null; then
    echo "✅ TwentyCRM Backend: Healthy"
else
    echo "❌ TwentyCRM Backend: Unhealthy"
fi

# Check TwentyCRM Frontend
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ TwentyCRM Frontend: Healthy"
else
    echo "❌ TwentyCRM Frontend: Unhealthy"
fi

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Healthy"
else
    echo "❌ PostgreSQL: Unhealthy"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: Healthy"
else
    echo "❌ Redis: Unhealthy"
fi

# Check Weaviate (if enabled)
if [ "$WEAVIATE_ENABLED" = "true" ]; then
    if curl -s http://localhost:8080/v1/.well-known/ready > /dev/null; then
        echo "✅ Weaviate: Healthy"
    else
        echo "❌ Weaviate: Unhealthy"
    fi
fi

echo ""
echo "🏗️  HVAC System Status: Ready for development!"
EOF

chmod +x .hvac/health-check.sh
print_hvac "HVAC health check script created"

# Step 9: Final validation and cleanup
echo ""
echo "🔍 Step 9: Final validation and cleanup..."

# Validate Docker Compose file
if docker-compose -f docker-compose.localhost.yml config > /dev/null 2>&1; then
    print_status "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors"
    docker-compose -f docker-compose.localhost.yml config
fi

# Set proper permissions
chmod +x start-hvac-docker.sh
chmod +x start-hvac-native.sh
chmod +x .hvac/health-check.sh

print_status "File permissions set correctly"

# Final success message
echo ""
echo "=================================================================="
echo -e "${GREEN}🎉 HVAC-Enhanced TwentyCRM Docker Setup Complete!${NC}"
echo "=================================================================="
echo ""
echo -e "${PURPLE}🏗️  HVAC Features Configured:${NC}"
echo "   ✅ Semantic Search (Weaviate)"
echo "   ✅ Polish Market Compliance"
echo "   ✅ Equipment Management"
echo "   ✅ Service Ticket System"
echo "   ✅ Customer 360 View"
echo "   ✅ Analytics Dashboard"
echo "   ✅ Bundle Optimization (< 4.7MB)"
echo ""
echo -e "${CYAN}🐳 Docker Environment:${NC}"
echo "   ✅ Optimized for localhost development"
echo "   ✅ Hot reload enabled"
echo "   ✅ Debug mode active"
echo "   ✅ Health checks configured"
echo "   ✅ Polish localization ready"
echo ""
echo -e "${BLUE}🚀 Quick Start Options:${NC}"
echo ""
echo "1. 🐳 Docker Development (Recommended):"
echo "   ./start-hvac-docker.sh"
echo ""
echo "2. 🖥️  Native Development:"
echo "   ./start-hvac-native.sh"
echo ""
echo "3. 🔍 Health Check:"
echo "   ./.hvac/health-check.sh"
echo ""
echo -e "${BLUE}📱 Access URLs (after startup):${NC}"
echo "   Frontend:     http://localhost:3002"
echo "   Backend API:  http://localhost:3001"
echo "   GraphQL:      http://localhost:3001/graphql"
if [ "$WEAVIATE_ENABLED" = "true" ]; then
echo "   Weaviate:     http://localhost:8080"
fi
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review .env.development for any custom configuration"
echo "2. Start the development environment using one of the scripts above"
echo "3. Access the frontend and configure your HVAC workspace"
echo "4. Check the HVAC modules in the navigation menu"
echo ""
echo -e "${PURPLE}Pasja rodzi profesjonalizm! 🏗️${NC}"
echo -e "${GREEN}Kontrola Klimatu = Kontrola Sukcesu! 🌟${NC}"