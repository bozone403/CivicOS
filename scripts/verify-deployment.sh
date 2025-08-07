#!/bin/bash

# CivicOS Deployment Verification Script
# This script verifies that all critical endpoints and functionality are working

set -e

# Configuration
API_BASE_URL="https://civicos.onrender.com"
CLIENT_BASE_URL="https://civicos.ca"
TIMEOUT=30
RETRY_ATTEMPTS=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# HTTP request function with retry
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    local headers="Content-Type: application/json"
    if [ ! -z "$token" ]; then
        headers="$headers, Authorization: Bearer $token"
    fi
    
    for i in $(seq 1 $RETRY_ATTEMPTS); do
        if [ "$method" = "GET" ]; then
            response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
                -H "$headers" \
                -m $TIMEOUT \
                "$API_BASE_URL$endpoint")
        else
            response=$(curl -s -w "%{http_code}" -o /tmp/response.json \
                -H "$headers" \
                -d "$data" \
                -m $TIMEOUT \
                -X $method \
                "$API_BASE_URL$endpoint")
        fi
        
        http_code="${response: -3}"
        
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 500 ]; then
            return 0
        fi
        
        if [ $i -lt $RETRY_ATTEMPTS ]; then
            log_warning "Request failed (attempt $i/$RETRY_ATTEMPTS), retrying..."
            sleep 2
        fi
    done
    
    return 1
}

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local expected_code=$4
    local data=$5
    local token=$6
    
    log_info "Testing $name..."
    
    if make_request "$method" "$endpoint" "$data" "$token"; then
        response_code=$(cat /tmp/response.json | tail -c 3)
        if [ "$response_code" = "$expected_code" ]; then
            log_success "$name passed"
            return 0
        else
            log_error "$name failed - Expected $expected_code, got $response_code"
            return 1
        fi
    else
        log_error "$name failed - Request timeout or network error"
        return 1
    fi
}

# Main verification function
verify_deployment() {
    local failed_tests=0
    local total_tests=0
    
    log_info "Starting CivicOS deployment verification..."
    log_info "API Base URL: $API_BASE_URL"
    log_info "Client Base URL: $CLIENT_BASE_URL"
    
    # Test 1: Health check
    total_tests=$((total_tests + 1))
    if test_endpoint "Health Check" "GET" "/health" "200"; then
        log_success "Health check passed"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 2: Authentication endpoints
    total_tests=$((total_tests + 1))
    if test_endpoint "Auth Register" "POST" "/api/auth/register" "400" \
        '{"email":"test@example.com","password":"test"}' ""; then
        log_success "Auth register endpoint accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 3: Social endpoints (should return 401 without token)
    total_tests=$((total_tests + 1))
    if test_endpoint "Social Follow (Unauthorized)" "POST" "/api/social/follow" "401" \
        '{"userId":"test"}' ""; then
        log_success "Social follow endpoint accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 4: Voting endpoints
    total_tests=$((total_tests + 1))
    if test_endpoint "Voting Items" "GET" "/api/voting/items" "401" "" ""; then
        log_success "Voting endpoints accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 5: News endpoints
    total_tests=$((total_tests + 1))
    if test_endpoint "News Feed" "GET" "/api/news" "200" "" ""; then
        log_success "News endpoints accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 6: Politicians endpoints
    total_tests=$((total_tests + 1))
    if test_endpoint "Politicians List" "GET" "/api/politicians" "200" "" ""; then
        log_success "Politicians endpoints accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 7: Legal endpoints
    total_tests=$((total_tests + 1))
    if test_endpoint "Legal Search" "GET" "/api/legal/search?query=test" "200" "" ""; then
        log_success "Legal endpoints accessible"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 8: Database connectivity
    total_tests=$((total_tests + 1))
    if test_endpoint "Database Health" "GET" "/api/health" "200" "" ""; then
        log_success "Database connectivity verified"
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 9: Rate limiting
    total_tests=$((total_tests + 1))
    local rate_limit_hit=false
    for i in {1..6}; do
        if ! make_request "POST" "/api/auth/login" '{"email":"test","password":"test"}' ""; then
            rate_limit_hit=true
            break
        fi
    done
    
    if [ "$rate_limit_hit" = true ]; then
        log_success "Rate limiting working"
    else
        log_warning "Rate limiting may not be working"
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 10: CORS headers
    total_tests=$((total_tests + 1))
    cors_response=$(curl -s -I -H "Origin: https://civicos.ca" "$API_BASE_URL/health" | grep -i "access-control-allow-origin" || true)
    if [ ! -z "$cors_response" ]; then
        log_success "CORS headers present"
    else
        log_warning "CORS headers may be missing"
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 11: SSL/TLS
    total_tests=$((total_tests + 1))
    ssl_info=$(echo | openssl s_client -connect civicos.onrender.com:443 -servername civicos.onrender.com 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || true)
    if [ ! -z "$ssl_info" ]; then
        log_success "SSL/TLS certificate valid"
    else
        log_warning "SSL/TLS certificate may be invalid"
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 12: Response times
    total_tests=$((total_tests + 1))
    start_time=$(date +%s.%N)
    if make_request "GET" "/health" "" ""; then
        end_time=$(date +%s.%N)
        response_time=$(echo "$end_time - $start_time" | bc)
        if (( $(echo "$response_time < 2.0" | bc -l) )); then
            log_success "Response time acceptable: ${response_time}s"
        else
            log_warning "Response time slow: ${response_time}s"
            failed_tests=$((failed_tests + 1))
        fi
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Summary
    echo ""
    log_info "=== DEPLOYMENT VERIFICATION SUMMARY ==="
    log_info "Total tests: $total_tests"
    log_info "Failed tests: $failed_tests"
    log_info "Success rate: $(( (total_tests - failed_tests) * 100 / total_tests ))%"
    
    if [ $failed_tests -eq 0 ]; then
        log_success "🎉 All tests passed! Deployment is healthy."
        exit 0
    else
        log_error "❌ $failed_tests tests failed. Deployment may have issues."
        exit 1
    fi
}

# Run verification
verify_deployment 