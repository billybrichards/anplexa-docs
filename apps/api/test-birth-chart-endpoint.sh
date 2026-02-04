#!/bin/bash

###############################################################################
# Birth Chart API Endpoint Test Script
#
# Tests the POST /api/birth-chart/calculate endpoint
# Requires: curl, jq (for JSON parsing)
# Usage: ./test-birth-chart-endpoint.sh [PORT]
###############################################################################

set -e

# Configuration
API_HOST="${API_HOST:-localhost}"
API_PORT="${1:-3000}"
BASE_URL="http://${API_HOST}:${API_PORT}"
ENDPOINT="${BASE_URL}/api/birth-chart/calculate"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

###############################################################################
# Helper Functions
###############################################################################

print_test_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " TEST: $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_pass() {
    echo -e "${GREEN}✓ PASSED${NC}: $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAILED${NC}: $1"
    ((TESTS_FAILED++))
}

run_test() {
    ((TESTS_RUN++))
}

###############################################################################
# Test Cases
###############################################################################

test_valid_birth_chart_known_time() {
    print_test_header "Valid Birth Chart with Known Time"
    run_test

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test-user-123",
            "birthDate": "1990-01-15",
            "birthTime": "14:30",
            "timeZone": "America/New_York",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "placeName": "New York",
            "country": "USA"
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -eq 201 ]; then
        print_pass "HTTP Status 201"

        # Check required fields
        if echo "$BODY" | jq -e '.sunSign' > /dev/null 2>&1; then
            SUN_SIGN=$(echo "$BODY" | jq -r '.sunSign')
            print_pass "Response contains sunSign: $SUN_SIGN"
        else
            print_fail "Missing sunSign field"
        fi

        if echo "$BODY" | jq -e '.moonSign' > /dev/null 2>&1; then
            MOON_SIGN=$(echo "$BODY" | jq -r '.moonSign')
            print_pass "Response contains moonSign: $MOON_SIGN"
        else
            print_fail "Missing moonSign field"
        fi

        if echo "$BODY" | jq -e '.risingSign' > /dev/null 2>&1; then
            RISING_SIGN=$(echo "$BODY" | jq -r '.risingSign')
            print_pass "Response contains risingSign: $RISING_SIGN"
        else
            print_fail "Missing risingSign field"
        fi

        if echo "$BODY" | jq -e '.birthChart.id' > /dev/null 2>&1; then
            CHART_ID=$(echo "$BODY" | jq -r '.birthChart.id')
            print_pass "Response contains birthChart.id: ${CHART_ID:0:8}..."
        else
            print_fail "Missing birthChart.id field"
        fi

    else
        print_fail "Expected HTTP 201, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
}

test_valid_birth_chart_unknown_time() {
    print_test_header "Valid Birth Chart with Unknown Time"
    run_test

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test-user-456",
            "birthDate": "1985-06-22",
            "birthTime": null,
            "timeZone": "America/Los_Angeles",
            "latitude": 34.0522,
            "longitude": -118.2437,
            "placeName": "Los Angeles",
            "country": "USA"
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -eq 201 ]; then
        print_pass "HTTP Status 201"

        if echo "$BODY" | jq -e '.sunSign' > /dev/null 2>&1; then
            print_pass "Response contains sunSign (time not required)"
        else
            print_fail "Missing sunSign field"
        fi
    else
        print_fail "Expected HTTP 201, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
}

test_missing_required_fields() {
    print_test_header "Invalid Request - Missing Required Fields"
    run_test

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test-user-789",
            "birthDate": "1995-03-10"
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -eq 400 ]; then
        print_pass "HTTP Status 400 (validation error)"

        if echo "$BODY" | grep -q "Validation error"; then
            print_pass "Error message indicates validation failure"
        elif echo "$BODY" | grep -q "error"; then
            print_pass "Response contains error field"
        else
            print_fail "Response doesn't indicate error"
        fi
    else
        print_fail "Expected HTTP 400, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
}

test_invalid_date_format() {
    print_test_header "Invalid Request - Wrong Date Format"
    run_test

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{
            "userId": "test-user-999",
            "birthDate": "01/15/1990",
            "birthTime": "14:30",
            "timeZone": "America/New_York",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "placeName": "New York",
            "country": "USA"
        }')

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -eq 400 ]; then
        print_pass "HTTP Status 400 (validation or domain error)"
    else
        print_fail "Expected HTTP 400, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
}

test_health_check() {
    print_test_header "API Server Health Check"
    run_test

    RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" -eq 200 ]; then
        print_pass "Server is healthy"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    else
        print_fail "Server health check failed"
        echo "Cannot connect to API server at ${BASE_URL}"
        echo "Make sure the server is running:"
        echo "  pnpm --filter @anplexa/api dev"
        exit 1
    fi
}

###############################################################################
# Main Test Runner
###############################################################################

main() {
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     Birth Chart API Endpoint Test Suite                        ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Testing endpoint: $ENDPOINT"
    echo ""

    # Check if server is running
    test_health_check

    # Run test cases
    test_valid_birth_chart_known_time
    test_valid_birth_chart_unknown_time
    test_missing_required_fields
    test_invalid_date_format

    # Print summary
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " TEST SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Tests Run:    $TESTS_RUN"
    echo -e "  ${GREEN}Passed:       $TESTS_PASSED${NC}"
    echo -e "  ${RED}Failed:       $TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
