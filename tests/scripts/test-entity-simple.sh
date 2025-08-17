#!/bin/bash

# Simplified Entity Project Test
# Tests just the core functionality

set -e

# Configuration
API_URL="http://localhost:3101"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-entity-$TIMESTAMP@example.com"
TEST_PASSWORD="TestPass123!"

echo "========================================="
echo "Simplified Entity Project Test"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Step 1: Register user and get token
echo "Step 1: Registering user..."
register_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\", \"name\": \"Test User\"}" \
    "$API_URL/api/auth/register")

http_code=$(echo "$register_response" | tail -n1)
body=$(echo "$register_response" | sed '$d')

echo "Registration HTTP Code: $http_code"

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    
    if [ -z "$TOKEN" ]; then
        # Try login
        echo "No token from registration, trying login..."
        login_response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}" \
            "$API_URL/api/auth/login")
        
        login_http_code=$(echo "$login_response" | tail -n1)
        login_body=$(echo "$login_response" | sed '$d')
        
        if [ "$login_http_code" = "200" ]; then
            TOKEN=$(echo "$login_body" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
            echo "Login successful"
        else
            echo "Login failed: HTTP $login_http_code"
            echo "Response: $login_body"
            exit 1
        fi
    fi
else
    echo "Registration failed: HTTP $http_code"
    echo "Response: $body"
    exit 1
fi

if [ -z "$TOKEN" ]; then
    echo "ERROR: No token received"
    exit 1
fi

echo "Token acquired: ${TOKEN:0:20}..."

# Step 2: Create a project
echo ""
echo "Step 2: Creating project..."
project_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\": \"Test Project $TIMESTAMP\", \"description\": \"Test project for entity system\"}" \
    "$API_URL/api/projects")

project_http_code=$(echo "$project_response" | tail -n1)
project_body=$(echo "$project_response" | sed '$d')

echo "Project creation HTTP Code: $project_http_code"

if [ "$project_http_code" = "201" ] || [ "$project_http_code" = "200" ]; then
    PROJECT_ID=$(echo "$project_body" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
    echo "Project created with ID: $PROJECT_ID"
else
    echo "Project creation failed: HTTP $project_http_code"
    echo "Response: $project_body"
    exit 1
fi

# Step 3: Create an entity
echo ""
echo "Step 3: Creating entity (Microsoft)..."
entity_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "Microsoft",
        "type": "company",
        "value": "Microsoft",
        "description": "Microsoft Corporation",
        "aliases": ["MSFT", "MS"]
    }' \
    "$API_URL/api/entities")

entity_http_code=$(echo "$entity_response" | tail -n1)
entity_body=$(echo "$entity_response" | sed '$d')

echo "Entity creation HTTP Code: $entity_http_code"

if [ "$entity_http_code" = "201" ] || [ "$entity_http_code" = "200" ]; then
    ENTITY_ID=$(echo "$entity_body" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
    echo "Entity created with ID: $ENTITY_ID"
else
    echo "Entity creation failed: HTTP $entity_http_code"
    echo "Response: $entity_body"
fi

# Step 4: Associate entity with project
if [ -n "$ENTITY_ID" ] && [ -n "$PROJECT_ID" ]; then
    echo ""
    echo "Step 4: Associating entity with project..."
    assoc_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"entityIds\": [\"$ENTITY_ID\"]}" \
        "$API_URL/api/projects/$PROJECT_ID/entities")
    
    assoc_http_code=$(echo "$assoc_response" | tail -n1)
    assoc_body=$(echo "$assoc_response" | sed '$d')
    
    echo "Association HTTP Code: $assoc_http_code"
    if [ "$assoc_http_code" != "200" ]; then
        echo "Association response: $assoc_body"
    fi
fi

# Step 5: Upload voice note with project
echo ""
echo "Step 5: Uploading voice note with project context..."

# Find audio file
if [ -f "tests/test-data/zabka.m4a" ]; then
    AUDIO_FILE="tests/test-data/zabka.m4a"
    echo "Using audio file: $AUDIO_FILE"
    
    upload_response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -F "audio=@$AUDIO_FILE" \
        -F "projectId=$PROJECT_ID" \
        -F "transcriptionModel=gpt-4o-transcribe" \
        "$API_URL/api/voice-notes")
    
    upload_http_code=$(echo "$upload_response" | tail -n1)
    upload_body=$(echo "$upload_response" | sed '$d')
    
    echo "Upload HTTP Code: $upload_http_code"
    
    if [ "$upload_http_code" = "201" ] || [ "$upload_http_code" = "200" ]; then
        VOICE_NOTE_ID=$(echo "$upload_body" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
        echo "Voice note uploaded with ID: $VOICE_NOTE_ID"
        
        # Trigger processing
        echo "Triggering processing..."
        process_response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "{\"projectId\": \"$PROJECT_ID\"}" \
            "$API_URL/api/voice-notes/$VOICE_NOTE_ID/process")
        
        process_http_code=$(echo "$process_response" | tail -n1)
        echo "Processing trigger HTTP Code: $process_http_code"
        
        # Wait and check status
        echo "Waiting for processing..."
        sleep 10
        
        status_response=$(curl -s -X GET \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL/api/voice-notes/$VOICE_NOTE_ID?includeTranscription=true")
        
        echo ""
        echo "Voice note status:"
        echo "$status_response" | python3 -m json.tool 2>/dev/null || echo "$status_response"
        
        # Extract transcription
        transcription=$(echo "$status_response" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('transcription', {}).get('text', ''))" 2>/dev/null || echo "")
        
        if [ -n "$transcription" ]; then
            echo ""
            echo "Transcription content:"
            echo "$transcription"
            
            # Check for Microsoft
            if echo "$transcription" | grep -qi "microsoft"; then
                echo ""
                echo "✓ SUCCESS: Found 'Microsoft' in transcription!"
            else
                echo ""
                echo "✗ ISSUE: 'Microsoft' not found in transcription"
            fi
        else
            echo "No transcription found"
        fi
    else
        echo "Upload failed: HTTP $upload_http_code"
        echo "Response: $upload_body"
    fi
else
    echo "ERROR: zabka.m4a not found"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="