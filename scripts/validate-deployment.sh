#!/bin/bash

# =============================================================================
# HVAC CRM Deployment Validation Script
# =============================================================================
# This script validates that your HVAC CRM deployment is working correctly
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

# Configuration
TARGET_URL=""
VPS_HOST=""
VPS_USER="root"
SSH_KEY_PATH=""

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    print_status "Testing: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            print_success "✓ $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "✗ $test_name (unexpected success)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            print_success "✓ $test_name (expected failure)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_error "✗ $test_name"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
}

# Function to collect validation info
collect_validation_info() {
    echo "🔍 HVAC CRM Deployment Validation"
    echo "=================================="
    echo ""
    
    read -p "Enter the URL to validate (e.g., https://hvac.yourdomain.com): " TARGET_URL
    
    if [[ $TARGET_URL == https://* ]]; then
        # Extract domain for SSH testing
        DOMAIN=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
        read -p "Enter VPS IP/hostname for SSH tests (leave empty to skip): " VPS_HOST
        
        if [ -n "$VPS_HOST" ]; then
            read -p "Enter VPS username (default: root): " input_user
            VPS_USER=${input_user:-root}
            read -p "Enter SSH key path (leave empty for password auth): " SSH_KEY_PATH
        fi
    fi
    
    echo ""
    print_status "Validation Configuration:"
    echo "  Target URL: $TARGET_URL"
    echo "  VPS Host: ${VPS_HOST:-N/A}"
    echo "  VPS User: ${VPS_USER:-N/A}"
    echo ""
}

# Function to test web accessibility
test_web_accessibility() {
    print_status "Testing web accessibility..."
    
    # Test main page
    run_test "Main page accessibility" \
        "curl -f -s -o /dev/null '$TARGET_URL'" \
        "success"
    
    # Test health endpoint
    run_test "Health endpoint" \
        "curl -f -s -o /dev/null '$TARGET_URL/healthz'" \
        "success"
    
    # Test GraphQL endpoint
    run_test "GraphQL endpoint" \
        "curl -f -s -o /dev/null -X POST '$TARGET_URL/graphql' -H 'Content-Type: application/json' -d '{\"query\":\"query { __typename }\"}'" \
        "success"
    
    # Test HTTPS redirect (if HTTPS)
    if [[ $TARGET_URL == https://* ]]; then
        HTTP_URL=$(echo "$TARGET_URL" | sed 's/https:/http:/')
        run_test "HTTP to HTTPS redirect" \
            "curl -s -o /dev/null -w '%{http_code}' '$HTTP_URL' | grep -q '301\\|302'" \
            "success"
    fi
}

# Function to test SSL certificate
test_ssl_certificate() {
    if [[ $TARGET_URL == https://* ]]; then
        print_status "Testing SSL certificate..."
        
        DOMAIN=$(echo "$TARGET_URL" | sed 's|https://||' | sed 's|/.*||')
        
        # Test SSL certificate validity
        run_test "SSL certificate validity" \
            "echo | openssl s_client -servername '$DOMAIN' -connect '$DOMAIN:443' 2>/dev/null | openssl x509 -noout -dates | grep -q 'notAfter'" \
            "success"
        
        # Test SSL certificate expiry (not expired)
        run_test "SSL certificate not expired" \
            "echo | openssl s_client -servername '$DOMAIN' -connect '$DOMAIN:443' 2>/dev/null | openssl x509 -noout -checkend 86400" \
            "success"
        
        # Test SSL grade
        print_status "Checking SSL configuration..."
        if command -v curl >/dev/null 2>&1; then
            SSL_LABS_URL="https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&startNew=on&all=done"
            print_status "SSL Labs test initiated for $DOMAIN (this may take a few minutes)"
        fi
    fi
}

# Function to test application functionality
test_application_functionality() {
    print_status "Testing application functionality..."
    
    # Test if the page contains expected content
    run_test "Application loads correctly" \
        "curl -s '$TARGET_URL' | grep -q -i 'twenty\\|crm\\|hvac'" \
        "success"
    
    # Test API responsiveness
    run_test "API responds to introspection query" \
        "curl -s -X POST '$TARGET_URL/graphql' -H 'Content-Type: application/json' -d '{\"query\":\"query IntrospectionQuery { __schema { types { name } } }\"}' | grep -q 'types'" \
        "success"
    
    # Test static assets loading
    run_test "Static assets accessible" \
        "curl -f -s -o /dev/null '$TARGET_URL/favicon.ico'" \
        "success"
}

# Function to test server infrastructure (if SSH access available)
test_server_infrastructure() {
    if [ -z "$VPS_HOST" ]; then
        print_warning "Skipping server infrastructure tests (no SSH access configured)"
        return
    fi
    
    print_status "Testing server infrastructure..."
    
    SSH_CMD="ssh"
    if [ -n "$SSH_KEY_PATH" ]; then
        SSH_CMD="ssh -i $SSH_KEY_PATH"
    fi
    
    # Test SSH connectivity
    run_test "SSH connectivity" \
        "$SSH_CMD -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST 'echo test' 2>/dev/null" \
        "success"
    
    if [ $? -eq 0 ]; then
        # Test Docker containers
        run_test "Docker containers running" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'docker ps | grep -q twenty'" \
            "success"
        
        # Test database connectivity
        run_test "Database connectivity" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'docker exec \$(docker ps -q -f name=db) pg_isready -U postgres'" \
            "success"
        
        # Test Redis connectivity
        run_test "Redis connectivity" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'docker exec \$(docker ps -q -f name=redis) redis-cli ping | grep -q PONG'" \
            "success"
        
        # Test disk space
        run_test "Sufficient disk space (>10% free)" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'df / | tail -1 | awk \"{print \\\$5}\" | sed \"s/%//\" | awk \"{if(\\\$1 < 90) exit 0; else exit 1}\"'" \
            "success"
        
        # Test memory usage
        run_test "Reasonable memory usage (<90%)" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'free | grep Mem | awk \"{printf(\\\"%.0f\\\", \\\$3/\\\$2*100)}\" | awk \"{if(\\\$1 < 90) exit 0; else exit 1}\"'" \
            "success"
        
        # Test backup script exists
        run_test "Backup script exists" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'test -f /usr/local/bin/hvac-backup.sh'" \
            "success"
        
        # Test monitoring script exists
        run_test "Monitoring script exists" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'test -f /usr/local/bin/hvac-monitor.sh'" \
            "success"
        
        # Test Nginx configuration
        run_test "Nginx configuration valid" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'nginx -t'" \
            "success"
        
        # Test firewall status
        run_test "Firewall is active" \
            "$SSH_CMD $VPS_USER@$VPS_HOST 'ufw status | grep -q \"Status: active\"'" \
            "success"
    fi
}

# Function to test performance
test_performance() {
    print_status "Testing performance..."
    
    # Test response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$TARGET_URL")
    if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
        print_success "✓ Response time acceptable ($RESPONSE_TIME seconds)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "⚠ Response time slow ($RESPONSE_TIME seconds)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    # Test concurrent connections
    print_status "Testing concurrent connections..."
    for i in {1..5}; do
        curl -s -o /dev/null "$TARGET_URL" &
    done
    wait
    
    run_test "Handles concurrent requests" \
        "curl -f -s -o /dev/null '$TARGET_URL'" \
        "success"
}

# Function to generate validation report
generate_report() {
    echo ""
    echo "📊 Validation Report"
    echo "===================="
    echo ""
    echo "Target URL: $TARGET_URL"
    echo "Test Date: $(date)"
    echo ""
    echo "Results:"
    echo "  ✓ Tests Passed: $TESTS_PASSED"
    echo "  ✗ Tests Failed: $TESTS_FAILED"
    echo "  📊 Total Tests: $TESTS_TOTAL"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "🎉 All tests passed! Your HVAC CRM deployment is working correctly."
        echo ""
        print_status "Your HVAC CRM is ready for use:"
        echo "  🌐 Access: $TARGET_URL"
        echo "  📚 Documentation: See DEPLOYMENT_README.md"
        echo "  🔧 Management: Use scripts/quick-deploy.sh for updates"
    else
        print_warning "⚠️  Some tests failed. Please review the issues above."
        echo ""
        print_status "Common solutions:"
        echo "  - Check server logs: docker compose logs"
        echo "  - Verify environment configuration"
        echo "  - Ensure all services are running"
        echo "  - Check firewall and network settings"
    fi
    
    # Calculate success rate
    SUCCESS_RATE=$(( TESTS_PASSED * 100 / TESTS_TOTAL ))
    echo ""
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        echo "Status: 🟢 Excellent"
    elif [ $SUCCESS_RATE -ge 75 ]; then
        echo "Status: 🟡 Good"
    elif [ $SUCCESS_RATE -ge 50 ]; then
        echo "Status: 🟠 Needs Attention"
    else
        echo "Status: 🔴 Critical Issues"
    fi
}

# Main execution
main() {
    echo "🔍 HVAC CRM Deployment Validation"
    echo "=================================="
    echo ""
    
    collect_validation_info
    
    # Check if curl is available
    if ! command -v curl >/dev/null 2>&1; then
        print_error "curl is required for validation. Please install curl."
        exit 1
    fi
    
    # Run validation tests
    test_web_accessibility
    test_ssl_certificate
    test_application_functionality
    test_server_infrastructure
    test_performance
    
    # Generate report
    generate_report
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
