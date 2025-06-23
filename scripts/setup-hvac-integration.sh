#!/bin/bash

# HVAC CRM Integration Setup Script
# "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM
# This script sets up the Twenty CRM integration with existing HVAC backend

set -e

echo "🏗️  Setting up HVAC CRM Integration..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/twenty-server" ]; then
    print_error "This script must be run from the Twenty CRM root directory"
    exit 1
fi

print_info "Detected Twenty CRM root directory"

# Step 1: Copy HVAC environment files
echo ""
echo "📋 Step 1: Setting up environment configuration..."

# Backend environment
if [ -f "packages/twenty-server/.env.hvac" ]; then
    print_info "Copying HVAC backend environment configuration..."
    cp packages/twenty-server/.env.hvac packages/twenty-server/.env
    print_status "Backend environment configured"
else
    print_error "HVAC backend environment file not found!"
    exit 1
fi

# Frontend environment
if [ -f "packages/twenty-front/.env.hvac" ]; then
    print_info "Copying HVAC frontend environment configuration..."
    cp packages/twenty-front/.env.hvac packages/twenty-front/.env.local
    print_status "Frontend environment configured"
else
    print_error "HVAC frontend environment file not found!"
    exit 1
fi

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
print_info "Installing Twenty CRM dependencies..."
yarn install
print_status "Dependencies installed"

# Step 3: Check HVAC backend services
echo ""
echo "🔍 Step 3: Checking HVAC backend services..."

# Check if HVAC backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_status "HVAC FastAPI backend is running on port 8000"
else
    print_warning "HVAC FastAPI backend is not running on port 8000"
    print_info "Please start your HVAC backend before proceeding"
fi

# Check if Weaviate is running
if curl -s http://localhost:8080/v1/.well-known/ready > /dev/null 2>&1; then
    print_status "Weaviate is running on port 8080"
else
    print_warning "Weaviate is not running on port 8080"
    print_info "Please start Weaviate before proceeding"
fi

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is running"
else
    print_warning "Redis is not running"
    print_info "Please start Redis before proceeding"
fi

# Check if PostgreSQL is running
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_status "PostgreSQL is running on port 5432"
else
    print_warning "PostgreSQL is not running on port 5432"
    print_info "Please start PostgreSQL before proceeding"
fi

# Step 4: Database setup
echo ""
echo "🗄️  Step 4: Setting up database..."

# Check if database exists
DB_NAME="hvac_crm"
DB_USER="hvac_user"

if psql -h localhost -U $DB_USER -d $DB_NAME -c '\q' > /dev/null 2>&1; then
    print_status "HVAC database exists and is accessible"
else
    print_warning "HVAC database not accessible"
    print_info "Creating HVAC database..."
    
    # Create database and user (requires postgres superuser)
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD 'hvac_password_2024';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF
    
    if [ $? -eq 0 ]; then
        print_status "HVAC database created successfully"
    else
        print_error "Failed to create HVAC database"
        print_info "Please create the database manually or check PostgreSQL permissions"
    fi
fi

# Step 5: Run Twenty CRM migrations
echo ""
echo "🔄 Step 5: Running Twenty CRM database migrations..."
cd packages/twenty-server
yarn database:migrate
if [ $? -eq 0 ]; then
    print_status "Twenty CRM migrations completed"
else
    print_error "Twenty CRM migrations failed"
    exit 1
fi
cd ../..

# Step 6: Seed database with HVAC-specific data
echo ""
echo "🌱 Step 6: Seeding database with HVAC data..."
cd packages/twenty-server
yarn database:seed
if [ $? -eq 0 ]; then
    print_status "Database seeded successfully"
else
    print_warning "Database seeding failed - continuing anyway"
fi
cd ../..

# Step 7: Build the application
echo ""
echo "🔨 Step 7: Building the application..."
yarn build
if [ $? -eq 0 ]; then
    print_status "Application built successfully"
else
    print_error "Application build failed"
    exit 1
fi

# Step 8: Create HVAC-specific configuration
echo ""
echo "⚙️  Step 8: Creating HVAC-specific configuration..."

# Create HVAC workspace configuration
cat > hvac-workspace-config.json << EOF
{
  "workspaceName": "Fulmark HVAC CRM",
  "workspaceDescription": "Professional HVAC Customer Relationship Management System",
  "companyName": "Fulmark HVAC",
  "industry": "HVAC Services",
  "locale": "pl_PL",
  "timezone": "Europe/Warsaw",
  "currency": "PLN",
  "features": {
    "hvacScheduling": true,
    "hvacMaintenance": true,
    "hvacInventory": true,
    "semanticSearch": true,
    "aiInsights": true,
    "customer360": true
  }
}
EOF

print_status "HVAC workspace configuration created"

# Step 9: Final checks
echo ""
echo "🔍 Step 9: Final system checks..."

# Check if all required ports are available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        print_warning "Port $port is already in use (expected for $service)"
    else
        print_info "Port $port is available for $service"
    fi
}

check_port 3001 "Twenty CRM Backend"
check_port 3002 "Twenty CRM Frontend"
check_port 8000 "HVAC FastAPI Backend"
check_port 8080 "Weaviate"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

# Step 10: Generate startup script
echo ""
echo "🚀 Step 10: Generating startup script..."

cat > start-hvac-crm.sh << 'EOF'
#!/bin/bash

# HVAC CRM Startup Script
echo "🚀 Starting HVAC CRM System..."

# Start Twenty CRM (frontend and backend)
echo "Starting Twenty CRM..."
yarn start &

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Twenty CRM Backend is running on http://localhost:3001"
else
    echo "❌ Twenty CRM Backend failed to start"
fi

if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Twenty CRM Frontend is running on http://localhost:3002"
else
    echo "❌ Twenty CRM Frontend failed to start"
fi

echo ""
echo "🎉 HVAC CRM System is ready!"
echo "Frontend: http://localhost:3002"
echo "Backend API: http://localhost:3001"
echo "GraphQL Playground: http://localhost:3001/graphql"
echo ""
echo "Press Ctrl+C to stop all services"
wait
EOF

chmod +x start-hvac-crm.sh
print_status "Startup script created: ./start-hvac-crm.sh"

# Final success message
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 HVAC CRM Integration Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Ensure your HVAC backend services are running:"
echo "   - HVAC FastAPI Backend (port 8000)"
echo "   - Weaviate (port 8080)"
echo "   - Redis (port 6379)"
echo "   - PostgreSQL (port 5432)"
echo ""
echo "2. Start the HVAC CRM system:"
echo "   ./start-hvac-crm.sh"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3002"
echo "   Backend API: http://localhost:3001"
echo "   GraphQL: http://localhost:3001/graphql"
echo ""
echo "4. Configure your HVAC-specific settings in the admin panel"
echo ""
echo -e "${BLUE}Pasja rodzi profesjonalizm! 🏗️${NC}"
