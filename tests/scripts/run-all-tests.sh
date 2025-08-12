#!/bin/bash

echo "🧪 nano-Grazynka Comprehensive Test Suite"
echo "========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

run_test() {
    local name=$1
    local command=$2
    
    echo -n "Running $name... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📋 Pre-flight Checks"
echo "--------------------"

echo -n "Checking Docker... "
if docker compose ps | grep -q "running\|Up"; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "Please start Docker: docker compose up"
    exit 1
fi

echo -n "Checking backend health... "
if curl -s http://localhost:3101/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Unhealthy${NC}"
    exit 1
fi

echo -n "Checking frontend... "
if curl -s http://localhost:3100 | grep -q "nano-Grażynka"; then
    echo -e "${GREEN}✅ Available${NC}"
else
    echo -e "${YELLOW}⚠️  Not available${NC}"
fi

echo ""
echo "🧪 Running Test Suites"
echo "----------------------"

echo ""
echo "1️⃣  Smoke Tests"
run_test "Backend health" "curl -s http://localhost:3101/health | grep -q healthy"
run_test "Frontend loads" "curl -s http://localhost:3100 | grep -q nano"
run_test "Database connected" "curl -s http://localhost:3101/ready | grep -q ready"

echo ""
echo "2️⃣  API Tests"
run_test "Anonymous upload" "node test-anonymous-upload.js"
run_test "Usage limits" "node test-anonymous-limit.js"

echo ""
echo "3️⃣  Backend Tests"
if [ -f "../backend_api_test.py" ]; then
    run_test "Python API tests" "python3 ../backend_api_test.py"
else
    echo -e "${YELLOW}⚠️  Python tests not found${NC}"
    ((SKIPPED++))
fi

echo ""
echo "4️⃣  Integration Tests"
if [ -f "../integration/api-integration.test.js" ]; then
    run_test "API integration" "cd .. && npm test -- integration"
else
    echo -e "${YELLOW}⚠️  Integration tests not configured${NC}"
    ((SKIPPED++))
fi

echo ""
echo "5️⃣  E2E Tests (Playwright)"
if command -v playwright &> /dev/null; then
    echo -e "${YELLOW}⚠️  Playwright tests require manual run${NC}"
    echo "   Run: npx playwright test"
    ((SKIPPED++))
else
    echo -e "${YELLOW}⚠️  Playwright not installed${NC}"
    ((SKIPPED++))
fi

echo ""
echo "========================================="
echo "📊 Test Summary"
echo "========================================="
echo -e "Passed:  ${GREEN}$PASSED${NC}"
echo -e "Failed:  ${RED}$FAILED${NC}"
echo -e "Skipped: ${YELLOW}$SKIPPED${NC}"

TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASSED * 100 / TOTAL))
    echo "Pass Rate: $PASS_RATE%"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Known Issues:"
    echo "- Anonymous session management in frontend"
    echo "- Status polling authentication"
    echo ""
    echo "Run individual test suites for details:"
    echo "  node tests/scripts/test-anonymous-upload.js"
    echo "  python3 backend_api_test.py"
    echo "  npx playwright test"
    exit 1
fi