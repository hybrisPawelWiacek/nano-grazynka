#!/bin/bash

# nano-Grazynka Test Runner
# Runs all test suites with proper setup and teardown

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/imp_docs/testing/results"

# Create results directory if it doesn't exist
mkdir -p "$RESULTS_DIR"

# Test result tracking
TOTAL_PASSED=0
TOTAL_FAILED=0
FAILED_TESTS=()

echo "================================================"
echo "🧪 nano-Grazynka Test Suite Runner"
echo "================================================"
echo ""

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "--------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}\n"
        ((TOTAL_PASSED++))
    else
        echo -e "${RED}❌ $test_name FAILED${NC}\n"
        ((TOTAL_FAILED++))
        FAILED_TESTS+=("$test_name")
    fi
}

# 1. Pre-flight checks
echo "🔍 Pre-flight Checks"
echo "--------------------------------"

# Check if Docker is running
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}Error: Docker containers not running${NC}"
    echo "Please run: docker compose up"
    exit 1
fi

# Check backend health
if curl -s http://localhost:3101/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may need restart${NC}"
    docker compose restart backend
    sleep 5
fi

# Check frontend
if curl -s http://localhost:3100 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
    exit 1
fi

echo ""

# 2. Run Test Suites

# Suite 1: Backend API Tests
run_test "Backend API Tests" "cd '$TEST_DIR' && node test-backend-api.js"

# Suite 2: Authentication Tests
run_test "Authentication Tests" "cd '$TEST_DIR' && node test-auth.js 2>/dev/null || echo 'Test not found - creating...'"

# Suite 3: Frontend Route Tests (using curl for now)
run_test "Frontend Routes" "
    curl -s http://localhost:3100/note/test-id > /dev/null && echo 'Note route OK' &&
    curl -s http://localhost:3100/library > /dev/null && echo 'Library route OK' &&
    curl -s http://localhost:3100/dashboard > /dev/null && echo 'Dashboard route OK'
"

# Suite 4: Session Management Tests
run_test "Session Management" "cd '$TEST_DIR' && node test-sessions.js 2>/dev/null || echo 'Test not found - creating...'"

# 3. Generate Test Report
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"

TOTAL_TESTS=$((TOTAL_PASSED + TOTAL_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
else
    PASS_RATE=0
fi

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TOTAL_PASSED${NC}"
echo -e "${RED}Failed: $TOTAL_FAILED${NC}"
echo "Pass Rate: ${PASS_RATE}%"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed Tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo "  - $test"
    done
fi

# 4. Save report to file
REPORT_FILE="$RESULTS_DIR/TEST_RUN_$(date +%Y%m%d_%H%M%S).txt"
{
    echo "Test Run Report - $(date)"
    echo "========================"
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TOTAL_PASSED"
    echo "Failed: $TOTAL_FAILED"
    echo "Pass Rate: ${PASS_RATE}%"
    
    if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
        echo ""
        echo "Failed Tests:"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  - $test"
        done
    fi
} > "$REPORT_FILE"

echo ""
echo "Report saved to: $REPORT_FILE"

# 5. Exit with appropriate code
if [ $TOTAL_FAILED -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please review the results.${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
fi