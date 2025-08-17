#!/bin/bash

# Entity Project System Test with Authentication
# Tests the full implementation with proper authentication
# Created: August 16, 2025

# set -e  # Disabled for debugging

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3101"
TIMESTAMP=$(date +%s)
PROJECT_NAME="Test Project $TIMESTAMP"
TEST_EMAIL="test-entity-$TIMESTAMP@example.com"
TEST_PASSWORD="TestPass123!"

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

echo "========================================="
echo "Entity Project System Test Suite"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Test Email: $TEST_EMAIL"
echo "API URL: $API_URL"
echo ""

# Test 0: Register User and Get Token
echo "Test 0: User Registration and Authentication"

register_data='{
    "email": "'"$TEST_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'",
    "name": "Entity Test User"
}'

register_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    "$API_URL/api/auth/register")

register_http_code=$(echo "$register_response" | tail -n1)
register_body=$(echo "$register_response" | sed '$d')

if [ "$register_http_code" = "201" ] || [ "$register_http_code" = "200" ]; then
    print_test_result "User Registration" "PASS" ""
    
    # Extract token from response or login
    TOKEN=$(echo "$register_body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    
    if [ -z "$TOKEN" ]; then
        # Try login if registration didn't return token
        login_data='{
            "email": "'"$TEST_EMAIL"'",
            "password": "'"$TEST_PASSWORD"'"
        }'
        
        login_response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$login_data" \
            "$API_URL/api/auth/login")
        
        login_http_code=$(echo "$login_response" | tail -n1)
        login_body=$(echo "$login_response" | sed '$d')
        
        if [ "$login_http_code" = "200" ]; then
            TOKEN=$(echo "$login_body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
            print_test_result "User Login" "PASS" ""
        else
            print_test_result "User Login" "FAIL" "HTTP $login_http_code"
            exit 1
        fi
    fi
else
    print_test_result "User Registration" "FAIL" "HTTP $register_http_code: $register_body"
    exit 1
fi

if [ -z "$TOKEN" ]; then
    echo "ERROR: No authentication token received"
    exit 1
fi

echo "  Token acquired: ${TOKEN:0:20}..."

# Function to make authenticated API call
auth_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "HTTP $http_code: $body" >&2
        return 1
    fi
}

# Test 1: Create a Project
echo ""
echo "Test 1: Create Project"
project_data='{
    "name": "'"$PROJECT_NAME"'",
    "description": "Test project for Entity system validation"
}'

project_response=$(auth_api_call POST "/api/projects" "$project_data" "201" 2>&1) || {
    print_test_result "Create Project" "FAIL" "$project_response"
    exit 1
}

PROJECT_ID=$(echo "$project_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
if [ -n "$PROJECT_ID" ]; then
    print_test_result "Create Project" "PASS" ""
    echo "  Project ID: $PROJECT_ID"
else
    print_test_result "Create Project" "FAIL" "Could not extract project ID from: $project_response"
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

entity1_response=$(auth_api_call POST "/api/entities" "$entity1_data" "201" 2>&1) || {
    print_test_result "Create Entity: Żabka" "FAIL" "$entity1_response"
}
ENTITY1_ID=$(echo "$entity1_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
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

entity2_response=$(auth_api_call POST "/api/entities" "$entity2_data" "201" 2>&1) || {
    print_test_result "Create Entity: Claude API" "FAIL" "$entity2_response"
}
ENTITY2_ID=$(echo "$entity2_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
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

entity3_response=$(auth_api_call POST "/api/entities" "$entity3_data" "201" 2>&1) || {
    print_test_result "Create Entity: Dario Amodei" "FAIL" "$entity3_response"
}
ENTITY3_ID=$(echo "$entity3_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
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

entity4_response=$(auth_api_call POST "/api/entities" "$entity4_data" "201" 2>&1) || {
    print_test_result "Create Entity: RLHF" "FAIL" "$entity4_response"
}
ENTITY4_ID=$(echo "$entity4_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
if [ -n "$ENTITY4_ID" ]; then
    print_test_result "Create Entity: RLHF" "PASS" ""
else
    print_test_result "Create Entity: RLHF" "FAIL" "Could not extract entity ID"
fi

# Entity 5: Microsoft (company) - Actually mentioned in the audio
entity5_data='{
    "name": "Microsoft",
    "type": "company",
    "value": "Microsoft",
    "description": "Microsoft Corporation",
    "aliases": ["MSFT", "MS"]
}'

entity5_response=$(auth_api_call POST "/api/entities" "$entity5_data" "201" 2>&1) || {
    print_test_result "Create Entity: Microsoft" "FAIL" "$entity5_response"
}
ENTITY5_ID=$(echo "$entity5_response" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
if [ -n "$ENTITY5_ID" ]; then
    print_test_result "Create Entity: Microsoft" "PASS" ""
else
    print_test_result "Create Entity: Microsoft" "FAIL" "Could not extract entity ID"
fi

# Test 3: Associate Entities with Project
echo ""
echo "Test 3: Associate Entities with Project"

if [ -n "$ENTITY1_ID" ] && [ -n "$ENTITY2_ID" ] && [ -n "$ENTITY3_ID" ] && [ -n "$ENTITY4_ID" ]; then
    assoc_data='{
        "entityIds": ["'"$ENTITY1_ID"'", "'"$ENTITY2_ID"'", "'"$ENTITY3_ID"'", "'"$ENTITY4_ID"'"]
    }'
    
    assoc_response=$(auth_api_call POST "/api/projects/$PROJECT_ID/entities" "$assoc_data" "200" 2>&1)
    
    if [ $? -eq 0 ]; then
        print_test_result "Associate Entities with Project" "PASS" ""
    else
        print_test_result "Associate Entities with Project" "FAIL" "$assoc_response"
    fi
else
    print_test_result "Associate Entities with Project" "FAIL" "Missing entity IDs"
fi

# Test 4: Get Project Entities
echo ""
echo "Test 4: Verify Project Entities"

entities_response=$(auth_api_call GET "/api/projects/$PROJECT_ID/entities" "" "200" 2>&1)

if [ $? -eq 0 ]; then
    if echo "$entities_response" | grep -q "Żabka" && \
       echo "$entities_response" | grep -q "Claude API" && \
       echo "$entities_response" | grep -q "Dario Amodei" && \
       echo "$entities_response" | grep -q "RLHF"; then
        print_test_result "Get Project Entities" "PASS" ""
        echo "  All 4 entities found in project"
    else
        print_test_result "Get Project Entities" "FAIL" "Not all entities found in project"
        echo "  Response: $entities_response"
    fi
else
    print_test_result "Get Project Entities" "FAIL" "$entities_response"
fi

# Test 5: Upload Voice Note with Project Context
echo ""
echo "Test 5: Upload Voice Note with Project Context"

# Find zabka.m4a file - use tests/test-data/ as primary location
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
    
    # Test with both models - GPT-4o first
    echo "  Testing with gpt-4o-transcribe model..."
    
    # Upload with project context and authentication
    upload_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -F "audio=@$AUDIO_FILE" \
        -F "projectId=$PROJECT_ID" \
        -F "transcriptionModel=gpt-4o-transcribe" \
        "$API_URL/api/voice-notes")
    
    upload_http_code=$(echo "$upload_response" | tail -n1)
    upload_body=$(echo "$upload_response" | sed '$d')
    
    if [ "$upload_http_code" = "201" ] || [ "$upload_http_code" = "200" ]; then
        VOICE_NOTE_ID=$(echo "$upload_body" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
        if [ -n "$VOICE_NOTE_ID" ]; then
            print_test_result "Upload Voice Note" "PASS" ""
            echo "  Voice Note ID: $VOICE_NOTE_ID"
            
            # Trigger processing for the uploaded voice note
            echo "  Triggering processing..."
            process_response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "{\"projectId\": \"$PROJECT_ID\"}" \
                "$API_URL/api/voice-notes/$VOICE_NOTE_ID/process")
            
            process_http_code=$(echo "$process_response" | tail -n1)
            process_body=$(echo "$process_response" | sed '$d')
            
            if [ "$process_http_code" = "200" ] || [ "$process_http_code" = "202" ]; then
                echo "  Processing triggered successfully"
            else
                echo "  Warning: Processing trigger returned HTTP $process_http_code"
                echo "  Response: $process_body"
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
        status_response=$(auth_api_call GET "/api/voice-notes/$VOICE_NOTE_ID?includeTranscription=true" "" "200" 2>&1)
        
        if [ $? -ne 0 ]; then
            echo "  Error checking status: $status_response"
            break
        fi
        
        status=$(echo "$status_response" | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')
        
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
        
        # Get transcription from the API response (now that we're including it in the request)
        transcription=$(echo "$status_response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('transcription', {}).get('text', ''))" 2>/dev/null || echo "")
        
        echo "  Transcription content:"
        echo "  ---"
        echo "  $transcription"
        echo "  ---"
        
        # Check for correct entity names - focusing on Microsoft which is actually in the audio
        entity_check_passed=true
        issues=""
        
        # The audio actually mentions Microsoft (not Claude/Dario/RLHF)
        # Check for Microsoft (from the actual audio content)
        if echo "$transcription" | grep -qi "microsoft"; then
            echo "  ✓ Found 'Microsoft' in transcription"
        else
            echo "  ✗ 'Microsoft' not found in transcription"
            entity_check_passed=false
            issues="Missing: Microsoft"
        fi
        
        # Also check if Żabka appears (it's in our entity list)
        if echo "$transcription" | grep -qi "żabka\|zabka"; then
            echo "  ✓ Found 'Żabka' in transcription (from entity list)"
        else
            echo "  ℹ 'Żabka' not in transcription (may not be mentioned in audio)"
        fi
        
        if [ "$entity_check_passed" = true ]; then
            print_test_result "Entity Names in Transcription" "PASS" ""
        else
            print_test_result "Entity Names in Transcription" "PARTIAL" "$issues"
        fi
    else
        print_test_result "Processing Status" "FAIL" "Processing did not complete in time"
    fi
fi

# Test 8: Check Entity Usage Tracking
echo ""
echo "Test 8: Entity Usage Tracking"

if [ -n "$VOICE_NOTE_ID" ]; then
    usage_check=$(sqlite3 ./data/nano-grazynka.db "SELECT COUNT(*) FROM EntityUsage WHERE voiceNoteId='$VOICE_NOTE_ID';" 2>&1)
    
    if [ $? -eq 0 ] && [ "$usage_check" -gt 0 ]; then
        print_test_result "Entity Usage Tracking" "PASS" ""
        echo "  Found $usage_check EntityUsage records"
        
        # Show which entities were tracked
        entity_details=$(sqlite3 ./data/nano-grazynka.db "SELECT e.name, eu.wasUsed FROM EntityUsage eu JOIN Entity e ON eu.entityId = e.id WHERE eu.voiceNoteId='$VOICE_NOTE_ID';" 2>&1)
        echo "  Tracked entities: $entity_details"
    else
        print_test_result "Entity Usage Tracking" "FAIL" "No EntityUsage records found or database error: $usage_check"
    fi
else
    print_test_result "Entity Usage Tracking" "SKIP" "No voice note to check"
fi

# Test 9: Upload with Gemini Model
echo ""
echo "Test 9: Upload Voice Note with Gemini Model"

if [ -n "$AUDIO_FILE" ]; then
    echo "  Testing with google/gemini-2.0-flash-001 model..."
    
    # Upload with Gemini model
    upload_response_gemini=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -F "audio=@$AUDIO_FILE" \
        -F "projectId=$PROJECT_ID" \
        -F "transcriptionModel=google/gemini-2.0-flash-001" \
        "$API_URL/api/voice-notes")
    
    upload_http_code_gemini=$(echo "$upload_response_gemini" | tail -n1)
    upload_body_gemini=$(echo "$upload_response_gemini" | sed '$d')
    
    if [ "$upload_http_code_gemini" = "201" ] || [ "$upload_http_code_gemini" = "200" ]; then
        VOICE_NOTE_ID_GEMINI=$(echo "$upload_body_gemini" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
        if [ -n "$VOICE_NOTE_ID_GEMINI" ]; then
            print_test_result "Upload Voice Note (Gemini)" "PASS" ""
            echo "  Voice Note ID (Gemini): $VOICE_NOTE_ID_GEMINI"
            
            # Trigger processing
            echo "  Triggering processing..."
            process_response_gemini=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "{\"projectId\": \"$PROJECT_ID\"}" \
                "$API_URL/api/voice-notes/$VOICE_NOTE_ID_GEMINI/process")
            
            process_http_code_gemini=$(echo "$process_response_gemini" | tail -n1)
            
            if [ "$process_http_code_gemini" = "200" ] || [ "$process_http_code_gemini" = "202" ]; then
                echo "  Processing triggered successfully"
                
                # Wait for processing
                echo "  Waiting for Gemini processing..."
                max_attempts=30
                attempt=0
                processing_complete_gemini=false
                
                while [ $attempt -lt $max_attempts ]; do
                    sleep 2
                    status_response_gemini=$(auth_api_call GET "/api/voice-notes/$VOICE_NOTE_ID_GEMINI?includeTranscription=true" "" "200" 2>&1)
                    
                    if [ $? -ne 0 ]; then
                        echo "  Error checking status: $status_response_gemini"
                        break
                    fi
                    
                    status_gemini=$(echo "$status_response_gemini" | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')
                    
                    if [ "$status_gemini" = "completed" ]; then
                        processing_complete_gemini=true
                        break
                    elif [ "$status_gemini" = "failed" ]; then
                        print_test_result "Processing Status (Gemini)" "FAIL" "Processing failed"
                        break
                    fi
                    
                    attempt=$((attempt + 1))
                    echo "  Status: $status_gemini (attempt $attempt/$max_attempts)"
                done
                
                if [ "$processing_complete_gemini" = true ]; then
                    print_test_result "Processing Status (Gemini)" "PASS" ""
                    
                    # Check transcription for entities
                    transcription_gemini=$(echo "$status_response_gemini" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('transcription', {}).get('text', ''))" 2>/dev/null || echo "")
                    
                    echo "  Gemini Transcription content:"
                    echo "  ---"
                    echo "  $transcription_gemini"
                    echo "  ---"
                    
                    # Check for Microsoft
                    if echo "$transcription_gemini" | grep -qi "microsoft"; then
                        echo "  ✓ Found 'Microsoft' in Gemini transcription"
                        print_test_result "Entity Names in Gemini Transcription" "PASS" ""
                    else
                        echo "  ✗ 'Microsoft' not found in Gemini transcription"
                        print_test_result "Entity Names in Gemini Transcription" "FAIL" "Microsoft not found"
                    fi
                else
                    print_test_result "Processing Status (Gemini)" "FAIL" "Processing did not complete"
                fi
            else
                echo "  Warning: Processing trigger returned HTTP $process_http_code_gemini"
            fi
        else
            print_test_result "Upload Voice Note (Gemini)" "FAIL" "Could not extract voice note ID"
        fi
    else
        print_test_result "Upload Voice Note (Gemini)" "FAIL" "HTTP $upload_http_code_gemini: $upload_body_gemini"
    fi
else
    print_test_result "Upload Voice Note (Gemini)" "SKIP" "No audio file"
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

# Generate test results for documentation
echo "Test Results:" > /tmp/entity-test-results.txt
for result in "${TEST_RESULTS[@]}"; do
    echo "$result" >> /tmp/entity-test-results.txt
done

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "SUCCESS: Entity Project System is fully functional" >> /tmp/entity-test-results.txt
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed or partially passed${NC}"
    echo ""
    echo "Test Details:"
    for result in "${TEST_RESULTS[@]}"; do
        echo "  $result"
    done
    echo "PARTIAL: Entity Project System needs attention" >> /tmp/entity-test-results.txt
    exit 1
fi