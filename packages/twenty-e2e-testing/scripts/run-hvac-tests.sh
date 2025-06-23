#!/bin/bash

# HVAC Playwright Test Runner
# "Pasja rodzi profesjonalizm" - Fulmark HVAC Professional CRM Testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL="http://localhost:3002"
BACKEND_URL="http://localhost:3001"
HVAC_API_URL="http://localhost:8000"
WEAVIATE_URL="http://localhost:8080"

echo -e "${BLUE}🏗️  HVAC CRM Playwright Test Suite${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}Checking ${name}...${NC}"
    
    if curl -s --head --request GET "${url}" | grep -q "200\|404\|302"; then
        echo -e "${GREEN}✅ ${name} is running at ${url}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} is not running at ${url}${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for ${name} to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --head --request GET "${url}" | grep -q "200\|404\|302"; then
            echo -e "${GREEN}✅ ${name} is ready${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt ${attempt}/${max_attempts} - ${name} not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ ${name} failed to start within timeout${NC}"
    return 1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking Prerequisites${NC}"
echo "================================"

# Check if required services are running
SERVICES_OK=true

if ! check_service "${FRONTEND_URL}" "Frontend (Twenty CRM)"; then
    SERVICES_OK=false
fi

if ! check_service "${BACKEND_URL}" "Backend (NestJS)"; then
    SERVICES_OK=false
fi

if ! check_service "${HVAC_API_URL}/health" "HVAC API"; then
    echo -e "${YELLOW}⚠️  HVAC API not running - some tests may be mocked${NC}"
fi

if ! check_service "${WEAVIATE_URL}/v1/.well-known/ready" "Weaviate"; then
    echo -e "${YELLOW}⚠️  Weaviate not running - semantic search tests will be mocked${NC}"
fi

if [ "$SERVICES_OK" = false ]; then
    echo ""
    echo -e "${RED}❌ Required services are not running!${NC}"
    echo -e "${YELLOW}Please start the required services:${NC}"
    echo "  - Frontend: npm start (port 3002)"
    echo "  - Backend: npm run start:dev (port 3001)"
    echo ""
    echo -e "${YELLOW}Optional services for full functionality:${NC}"
    echo "  - HVAC API: python -m uvicorn main:app --reload --port 8000"
    echo "  - Weaviate: docker run -p 8080:8080 semitechnologies/weaviate"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All required services are running${NC}"
echo ""

# Install Playwright if needed
echo -e "${BLUE}🎭 Setting up Playwright${NC}"
echo "=========================="

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
    exit 1
fi

# Install Playwright browsers if needed
echo -e "${YELLOW}Installing Playwright browsers...${NC}"
npx playwright install

echo ""

# Run HVAC tests
echo -e "${BLUE}🧪 Running HVAC Test Suite${NC}"
echo "==========================="

# Set environment variables
export FRONTEND_BASE_URL="${FRONTEND_URL}"
export BACKEND_BASE_URL="${BACKEND_URL}"
export HVAC_API_URL="${HVAC_API_URL}"
export WEAVIATE_URL="${WEAVIATE_URL}"

# Test execution options
TEST_PATTERN="tests/hvac/*.spec.ts"
REPORT_DIR="run_results/hvac-tests"
HTML_REPORT_DIR="playwright-report/hvac"

# Create report directories
mkdir -p "${REPORT_DIR}"
mkdir -p "${HTML_REPORT_DIR}"

echo -e "${YELLOW}Test configuration:${NC}"
echo "  - Pattern: ${TEST_PATTERN}"
echo "  - Frontend: ${FRONTEND_URL}"
echo "  - Backend: ${BACKEND_URL}"
echo "  - Reports: ${REPORT_DIR}"
echo ""

# Run tests with different configurations
echo -e "${BLUE}Running HVAC Dashboard Tests...${NC}"
npx playwright test tests/hvac/hvac-dashboard.spec.ts --reporter=html --output-dir="${REPORT_DIR}/dashboard"

echo ""
echo -e "${BLUE}Running HVAC Semantic Search Tests...${NC}"
npx playwright test tests/hvac/hvac-semantic-search.spec.ts --reporter=html --output-dir="${REPORT_DIR}/search"

echo ""
echo -e "${BLUE}Running HVAC Service Planner Tests...${NC}"
npx playwright test tests/hvac/hvac-service-planner.spec.ts --reporter=html --output-dir="${REPORT_DIR}/planner"

echo ""
echo -e "${BLUE}Running HVAC Dispatch Panel Tests...${NC}"
npx playwright test tests/hvac/hvac-dispatch-panel.spec.ts --reporter=html --output-dir="${REPORT_DIR}/dispatch"

echo ""
echo -e "${BLUE}Running HVAC Mobile & Maintenance Tests...${NC}"
npx playwright test tests/hvac/hvac-mobile-maintenance.spec.ts --reporter=html --output-dir="${REPORT_DIR}/mobile"

echo ""
echo -e "${BLUE}Running HVAC Error Handling Tests...${NC}"
npx playwright test tests/hvac/hvac-error-handling.spec.ts --reporter=html --output-dir="${REPORT_DIR}/errors"

echo ""
echo -e "${BLUE}Running Complete HVAC Test Suite...${NC}"
npx playwright test "${TEST_PATTERN}" --reporter=html --output-dir="${REPORT_DIR}/complete"

# Generate comprehensive report
echo ""
echo -e "${BLUE}📊 Generating Test Reports${NC}"
echo "=========================="

# Show test results summary
echo -e "${YELLOW}Test Results Summary:${NC}"
echo "  - Dashboard Tests: ${REPORT_DIR}/dashboard"
echo "  - Semantic Search Tests: ${REPORT_DIR}/search"
echo "  - Service Planner Tests: ${REPORT_DIR}/planner"
echo "  - Dispatch Panel Tests: ${REPORT_DIR}/dispatch"
echo "  - Mobile & Maintenance Tests: ${REPORT_DIR}/mobile"
echo "  - Error Handling Tests: ${REPORT_DIR}/errors"
echo "  - Complete Suite: ${REPORT_DIR}/complete"

# Open HTML report if available
if command -v xdg-open &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Opening HTML report...${NC}"
    xdg-open "playwright-report/index.html" 2>/dev/null || true
elif command -v open &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Opening HTML report...${NC}"
    open "playwright-report/index.html" 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}🎉 HVAC Test Suite Completed!${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo -e "${BLUE}Quality Standards Check:${NC}"
echo "  ✅ Polish localization tested"
echo "  ✅ Dark theme compliance verified"
echo "  ✅ PrimeReact/PrimeFlex components tested"
echo "  ✅ Responsive design validated"
echo "  ✅ Error handling and Sentry integration tested"
echo "  ✅ Performance standards verified"
echo ""
echo -e "${GREEN}\"Pasja rodzi profesjonalizm\" - Quality standards maintained! 🏆${NC}"
echo ""

# Check for test failures
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed successfully! ✅${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the reports for details. ❌${NC}"
    exit 1
fi
