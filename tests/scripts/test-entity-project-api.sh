#!/bin/bash

# Entity Project System Comprehensive Test Script
# Tests the full implementation of Entity and Project functionality
# Created: August 16, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3101"
TIMESTAMP=$(date +%s)
PROJECT_NAME="Test Project $TIMESTAMP"
SESSION_ID="test-session-$TIMESTAMP"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test result tracking
declare -a TEST_RESULTS

# Function to print test result
print_test_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: ${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        TEST_RESULTS+=("✓ $test_name: PASSED")
    else
        echo -e "${RED}✗${NC} $test_name: ${RED}FAILED${NC}"
        echo -e "  ${YELLOW}Details: $details${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        TEST_RESULTS+=("✗ $test_name: FAILED - $details")
    fi
}

# Function to make API call and check response
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "x-session-id: $SESSION_ID" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "x-session-id: $SESSION_ID" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $http_code: $body" >&2
        return 1
    fi
}

echo "========================================="
echo "Entity Project System Test Suite"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Session ID: $SESSION_ID"
echo "API URL: $API_URL"
echo ""

# Test 1: Create a Project
echo "Test 1: Create Project"
project_data='{
    "name": "'"$PROJECT_NAME"'",
    "description": "Test project for Entity system validation"
}'

project_response=$(api_call POST "/api/projects" "$project_data" "201" 2>&1) || {
    print_test_result "Create Project" "FAIL" "$project_response"
    exit 1
}

PROJECT_ID=$(echo "$project_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
if [ -n "$PROJECT_ID" ]; then
    print_test_result "Create Project" "PASS" ""
    echo "  Project ID: $PROJECT_ID"
else
    print_test_result "Create Project" "FAIL" "Could not extract project ID"
    exit 1
fi

# Test 2: Create Entities
echo ""
echo "Test 2: Create Entities"

# Entity 1: Żabka (company)
entity1_data='{
    "name": "Żabka",
    "type": "company",
    "value": "Żabka",
    "description": "Polish convenience store chain",
    "aliases": ["Zabka", "żabka"]
}'

entity1_response=$(api_call POST "/api/entities" "$entity1_data" "201" 2>&1) || {
    print_test_result "Create Entity: Żabka" "FAIL" "$entity1_response"
}
ENTITY1_ID=$(echo "$entity1_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
if [ -n "$ENTITY1_ID" ]; then
    print_test_result "Create Entity: Żabka" "PASS" ""
else
    print_test_result "Create Entity: Żabka" "FAIL" "Could not extract entity ID"
fi

# Entity 2: Claude API (technical)
entity2_data='{
    "name": "Claude API",
    "type": "technical",
    "value": "Claude API",
    "description": "Anthropic Claude AI API",
    "aliases": ["Claude SDK", "Anthropic API"]
}'

entity2_response=$(api_call POST "/api/entities" "$entity2_data" "201" 2>&1) || {
    print_test_result "Create Entity: Claude API" "FAIL" "$entity2_response"
}
ENTITY2_ID=$(echo "$entity2_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
if [ -n "$ENTITY2_ID" ]; then
    print_test_result "Create Entity: Claude API" "PASS" ""
else
    print_test_result "Create Entity: Claude API" "FAIL" "Could not extract entity ID"
fi

# Entity 3: Dario Amodei (person)
entity3_data='{
    "name": "Dario Amodei",
    "type": "person",
    "value": "Dario Amodei",
    "description": "CEO of Anthropic",
    "aliases": ["Dario", "Amodei"]
}'

entity3_response=$(api_call POST "/api/entities" "$entity3_data" "201" 2>&1) || {
    print_test_result "Create Entity: Dario Amodei" "FAIL" "$entity3_response"
}
ENTITY3_ID=$(echo "$entity3_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
if [ -n "$ENTITY3_ID" ]; then
    print_test_result "Create Entity: Dario Amodei" "PASS" ""
else
    print_test_result "Create Entity: Dario Amodei" "FAIL" "Could not extract entity ID"
fi

# Entity 4: RLHF (technical)
entity4_data='{
    "name": "RLHF",
    "type": "technical",
    "value": "RLHF",
    "description": "Reinforcement Learning from Human Feedback",
    "aliases": ["Reinforcement Learning from Human Feedback"]
}'

entity4_response=$(api_call POST "/api/entities" "$entity4_data" "201" 2>&1) || {
    print_test_result "Create Entity: RLHF" "FAIL" "$entity4_response"
}
ENTITY4_ID=$(echo "$entity4_response" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
if [ -n "$ENTITY4_ID" ]; then
    print_test_result "Create Entity: RLHF" "PASS" ""
else
    print_test_result "Create Entity: RLHF" "FAIL" "Could not extract entity ID"
fi

# Test 3: Associate Entities with Project
echo ""
echo "Test 3: Associate Entities with Project"

if [ -n "$ENTITY1_ID" ] && [ -n "$ENTITY2_ID" ] && [ -n "$ENTITY3_ID" ] && [ -n "$ENTITY4_ID" ]; then
    assoc_data='{
        "entityIds": ["'"$ENTITY1_ID"'", "'"$ENTITY2_ID"'", "'"$ENTITY3_ID"'", "'"$ENTITY4_ID"'"]
    }'
    
    assoc_response=$(api_call POST "/api/projects/$PROJECT_ID/entities" "$assoc_data" "200" 2>&1) || {
        print_test_result "Associate Entities with Project" "FAIL" "$assoc_response"
    }
    
    if [ $? -eq 0 ]; then
        print_test_result "Associate Entities with Project" "PASS" ""
    fi
else
    print_test_result "Associate Entities with Project" "FAIL" "Missing entity IDs"
fi

# Test 4: Get Project Entities
echo ""
echo "Test 4: Verify Project Entities"

entities_response=$(api_call GET "/api/projects/$PROJECT_ID/entities" "" "200" 2>&1) || {
    print_test_result "Get Project Entities" "FAIL" "$entities_response"
}

if echo "$entities_response" | grep -q "Żabka" && \
   echo "$entities_response" | grep -q "Claude API" && \
   echo "$entities_response" | grep -q "Dario Amodei" && \
   echo "$entities_response" | grep -q "RLHF"; then
    print_test_result "Get Project Entities" "PASS" ""
else
    print_test_result "Get Project Entities" "FAIL" "Not all entities found in project"
fi

# Test 5: Upload Voice Note with Project Context
echo ""
echo "Test 5: Upload Voice Note with Project Context"

# Check if zabka.m4a exists - primary location is tests/test-data/
if [ -f "tests/test-data/zabka.m4a" ]; then
    AUDIO_FILE="tests/test-data/zabka.m4a"
elif [ -f "tests/scripts/zabka.m4a" ]; then
    AUDIO_FILE="tests/scripts/zabka.m4a"
elif [ -f "zabka.m4a" ]; then
    AUDIO_FILE="zabka.m4a"
else
    print_test_result "Upload Voice Note" "FAIL" "zabka.m4a not found in tests/test-data/"
    AUDIO_FILE=""
fi

if [ -n "$AUDIO_FILE" ]; then
    echo "  Using audio file: $AUDIO_FILE"
    
    # Upload with project context
    upload_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "x-session-id: $SESSION_ID" \
        -F "audio=@$AUDIO_FILE" \
        -F "projectId=$PROJECT_ID" \
        -F "transcriptionModel=whisper-1" \
        "$API_URL/api/voice-notes")
    
    upload_http_code=$(echo "$upload_response" | tail -n1)
    upload_body=$(echo "$upload_response" | head -n-1)
    
    if [ "$upload_http_code" = "201" ] || [ "$upload_http_code" = "200" ]; then
        VOICE_NOTE_ID=$(echo "$upload_body" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
        if [ -n "$VOICE_NOTE_ID" ]; then
            print_test_result "Upload Voice Note" "PASS" ""
            echo "  Voice Note ID: $VOICE_NOTE_ID"
            
            # Trigger processing for the uploaded voice note
            echo "  Triggering processing..."
            process_response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "x-session-id: $SESSION_ID" \
                -d "{\"projectId\": \"$PROJECT_ID\"}" \
                "$API_URL/api/voice-notes/$VOICE_NOTE_ID/process")
            
            process_http_code=$(echo "$process_response" | tail -n1)
            process_body=$(echo "$process_response" | head -n-1)
            
            if [ "$process_http_code" = "200" ] || [ "$process_http_code" = "202" ]; then
                echo "  Processing triggered successfully"
            else
                echo "  Warning: Processing trigger returned HTTP $process_http_code"
            fi
        else
            print_test_result "Upload Voice Note" "FAIL" "Could not extract voice note ID"
        fi
    else
        print_test_result "Upload Voice Note" "FAIL" "HTTP $upload_http_code: $upload_body"
    fi
fi

# Test 6: Check Processing Status
if [ -n "$VOICE_NOTE_ID" ]; then
    echo ""
    echo "Test 6: Check Processing Status"
    echo "  Waiting for processing to complete..."
    
    max_attempts=30
    attempt=0
    processing_complete=false
    
    while [ $attempt -lt $max_attempts ]; do
        sleep 2
        status_response=$(api_call GET "/api/voice-notes/$VOICE_NOTE_ID" "" "200" 2>&1) || {
            echo "  Error checking status: $status_response"
            break
        }
        
        status=$(echo "$status_response" | grep -o '"status":"[^"]*' | sed 's/"status":"//')
        
        if [ "$status" = "completed" ]; then
            processing_complete=true
            break
        elif [ "$status" = "failed" ]; then
            print_test_result "Processing Status" "FAIL" "Processing failed"
            break
        fi
        
        attempt=$((attempt + 1))
        echo "  Status: $status (attempt $attempt/$max_attempts)"
    done
    
    if [ "$processing_complete" = true ]; then
        print_test_result "Processing Status" "PASS" ""
        
        # Test 7: Verify Entity Names in Transcription
        echo ""
        echo "Test 7: Verify Entity Names in Transcription"
        
        transcription=$(echo "$status_response" | grep -o '"transcription":"[^"]*' | sed 's/"transcription":"//')
        
        # Check for correct entity names (not misspelled versions)
        entity_check_passed=true
        
        # Check for Claude API (not "clawed API")
        if echo "$transcription" | grep -qi "claude"; then
            echo "  ✓ Found 'Claude' in transcription"
        else
            echo "  ✗ 'Claude' not found in transcription"
            entity_check_passed=false
        fi
        
        # Check for Żabka
        if echo "$transcription" | grep -qi "żabka\|zabka"; then
            echo "  ✓ Found 'Żabka' in transcription"
        else
            echo "  ✗ 'Żabka' not found in transcription"
            entity_check_passed=false
        fi
        
        # Check that it's NOT "clawed" or "Darry-o"
        if echo "$transcription" | grep -qi "clawed"; then
            echo "  ✗ Found incorrect 'clawed' in transcription"
            entity_check_passed=false
        fi
        
        if echo "$transcription" | grep -qi "darry"; then
            echo "  ✗ Found incorrect 'Darry' in transcription"
            entity_check_passed=false
        fi
        
        if [ "$entity_check_passed" = true ]; then
            print_test_result "Entity Names in Transcription" "PASS" ""
        else
            print_test_result "Entity Names in Transcription" "FAIL" "Entity context not properly applied"
        fi
    else
        print_test_result "Processing Status" "FAIL" "Processing did not complete in time"
    fi
fi

# Test 8: Check Entity Usage Tracking
echo ""
echo "Test 8: Entity Usage Tracking"

# Query database directly for EntityUsage records
if [ -n "$VOICE_NOTE_ID" ]; then
    usage_check=$(sqlite3 ./data/nano-grazynka.db "SELECT COUNT(*) FROM EntityUsage WHERE voiceNoteId='$VOICE_NOTE_ID';" 2>&1)
    
    if [ $? -eq 0 ] && [ "$usage_check" -gt 0 ]; then
        print_test_result "Entity Usage Tracking" "PASS" ""
        echo "  Found $usage_check EntityUsage records"
    else
        print_test_result "Entity Usage Tracking" "FAIL" "No EntityUsage records found"
    fi
else
    print_test_result "Entity Usage Tracking" "SKIP" "No voice note to check"
fi

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Tests: $TESTS_TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Failed Tests:"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == *"FAILED"* ]]; then
            echo "  $result"
        fi
    done
    exit 1
fi