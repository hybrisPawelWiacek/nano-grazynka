#!/bin/bash

echo "🧪 Testing Reprocess Endpoint..."
echo ""

# First upload a file
echo "1️⃣ Uploading test audio file..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3101/api/voice-notes \
  -F "audio=@zabka.m4a;type=audio/mp4" \
  -F "userId=test-reprocess" \
  -F "language=pl")

# Extract the ID using grep and sed
VOICE_NOTE_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')

if [ -z "$VOICE_NOTE_ID" ]; then
  echo "❌ Upload failed or couldn't extract ID"
  echo "Response: $UPLOAD_RESPONSE"
  exit 1
fi

echo "✅ Uploaded successfully! ID: $VOICE_NOTE_ID"
echo ""

# Process the voice note
echo "2️⃣ Processing voice note..."
curl -s -X POST "http://localhost:3101/api/voice-notes/$VOICE_NOTE_ID/process" \
  -H "Content-Type: application/json" \
  -d '{"language": "pl"}' > /dev/null

echo "✅ Processing triggered!"
echo ""

# Wait for processing
echo "⏳ Waiting for processing to complete..."
sleep 3

# Test reprocess endpoint
echo "3️⃣ Testing reprocess endpoint..."
REPROCESS_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3101/api/voice-notes/$VOICE_NOTE_ID/reprocess" \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are a specialized assistant for extracting key business insights.",
    "userPrompt": "Focus on identifying action items and business opportunities.",
    "language": "PL"
  }')

# Extract status code (last line)
STATUS_CODE=$(echo "$REPROCESS_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$REPROCESS_RESPONSE" | sed '$d')

if [ "$STATUS_CODE" -eq 200 ] || [ "$STATUS_CODE" -eq 201 ]; then
  echo "✅ Reprocess successful! Status: $STATUS_CODE"
  echo "Response: $RESPONSE_BODY"
else
  echo "❌ Reprocess failed! Status: $STATUS_CODE"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

echo ""
echo "4️⃣ Fetching updated voice note..."
FINAL_RESPONSE=$(curl -s "http://localhost:3101/api/voice-notes/$VOICE_NOTE_ID?includeTranscription=true&includeSummary=true")

# Check if summary exists
if echo "$FINAL_RESPONSE" | grep -q '"summary"'; then
  echo "✅ Voice note has been reprocessed with new summary!"
else
  echo "⚠️  No summary found in response"
fi

echo ""
echo "✨ Reprocess endpoint test completed!"