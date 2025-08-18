#!/bin/bash

# Simple Comprehensive Test Runner
# Runs all test suites and generates report

echo "======================================"
echo "nano-Grazynka Comprehensive Test Suite"
echo "======================================"
echo "Date: $(date)"
echo "Environment: Docker Local"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Change to project root
cd "$(dirname "$0")/../.."

# Results tracking
TOTAL=0
PASSED=0
FAILED=0

# Create results directory
mkdir -p imp_docs/testing/results

# Test report file
REPORT_FILE="imp_docs/testing/results/TEST_RESULTS_$(date +%Y_%m_%d_%H%M).md"

# Function to run test
run_test() {
    local test_name=$1
    local test_cmd=$2
    TOTAL=$((TOTAL + 1))
    
    echo -e "${BLUE}Running: $test_name${NC}"
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Start report
echo "# nano-Grazynka Test Results" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "**Date**: $(date)" >> $REPORT_FILE
echo "**Environment**: Docker Local" >> $REPORT_FILE
echo "" >> $REPORT_FILE

echo "## Pre-flight Checks"
echo ""

# Check services
run_test "Backend health check" "curl -s http://localhost:3101/health | grep healthy"
run_test "Frontend accessibility" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3100 | grep 200"
run_test "Database connection" "docker exec nano-grazynka_cc-backend-1 sqlite3 /data/nano-grazynka.db 'SELECT 1;'"

echo ""
echo "## Suite 1: Smoke Tests"
echo ""

run_test "Backend /health endpoint" "curl -s http://localhost:3101/health"
run_test "Backend /metrics endpoint" "curl -s http://localhost:3101/metrics"
run_test "Frontend loads" "curl -s http://localhost:3100 | grep -q 'nano-Grazynka'"

echo ""
echo "## Suite 2: Authentication Tests"
echo ""

run_test "Authentication flow" "node tests/scripts/test-auth.js"
run_test "Anonymous upload" "node tests/scripts/test-anonymous-upload.js"
run_test "Session management" "node tests/scripts/test-sessions.js"

echo ""
echo "## Suite 3: Backend API Tests"
echo ""

run_test "Backend API comprehensive" "node tests/scripts/test-backend-api.js"
run_test "Endpoint validation" "./tests/scripts/test-endpoints.sh"

echo ""
echo "## Suite 7: Entity Project System Tests"
echo ""

run_test "Entity Project API" "./tests/scripts/test-entity-project-api.sh"
run_test "Entity authenticated flow" "./tests/scripts/test-entity-project-authenticated.sh"
run_test "Simple entity operations" "./tests/scripts/test-entity-simple.sh"

echo ""
echo "======================================"
echo "TEST EXECUTION SUMMARY"
echo "======================================"
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

# Calculate pass rate
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "Pass Rate: $PASS_RATE%"
    
    # Append summary to report
    echo "" >> $REPORT_FILE
    echo "## Summary" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "- **Total Tests**: $TOTAL" >> $REPORT_FILE
    echo "- **Passed**: $PASSED ✅" >> $REPORT_FILE
    echo "- **Failed**: $FAILED ❌" >> $REPORT_FILE
    echo "- **Pass Rate**: $PASS_RATE%" >> $REPORT_FILE
    
    if [ $PASS_RATE -ge 95 ]; then
        echo -e "${GREEN}✅ EXCELLENT: System ready for production${NC}"
        echo "" >> $REPORT_FILE
        echo "✅ **System Ready**: $PASS_RATE% pass rate indicates system is ready for production" >> $REPORT_FILE
    elif [ $PASS_RATE -ge 80 ]; then
        echo -e "${YELLOW}⚠️ GOOD: Minor issues need fixing${NC}"
        echo "" >> $REPORT_FILE
        echo "⚠️ **Minor Issues**: $PASS_RATE% pass rate - fix P1 issues before deployment" >> $REPORT_FILE
    else
        echo -e "${RED}❌ NEEDS WORK: Critical issues detected${NC}"
        echo "" >> $REPORT_FILE
        echo "❌ **Critical Issues**: $PASS_RATE% pass rate - significant fixes required" >> $REPORT_FILE
    fi
fi

echo ""
echo "Report saved to: $REPORT_FILE"

# Exit with failure if any tests failed
exit $FAILED