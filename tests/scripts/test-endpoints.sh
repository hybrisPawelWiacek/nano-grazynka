#!/bin/bash

echo "🧪 Testing High Priority Endpoints"
echo ""

# Test validation without userId
echo "1️⃣ Testing upload without userId (should return 400)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3101/api/voice-notes \
  -F "audio=@backend/zabka.m4a;type=audio/mp4" \
  -F "language=pl" 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "400" ]; then
  echo "✅ Correctly rejected with 400"
  echo "   Message: $(echo "$BODY" | grep -o '"message":"[^"]*"' | cut -d: -f2)"
else
  echo "❌ Expected 400, got $HTTP_STATUS"
fi

echo ""

# Test with valid upload
echo "2️⃣ Testing valid upload..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3101/api/voice-notes \
  -F "audio=@backend/zabka.m4a;type=audio/mp4" \
  -F "userId=test-endpoints" \
  -F "language=pl" 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "201" ]; then
  VOICE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d: -f2 | tr -d '"')
  echo "✅ Upload succeeded with ID: $VOICE_ID"
else
  echo "❌ Upload failed with status $HTTP_STATUS"
  exit 1
fi

echo ""

# Process the voice note
echo "3️⃣ Processing voice note..."
curl -s -X POST "http://localhost:3101/api/voice-notes/$VOICE_ID/process" \
  -H "Content-Type: application/json" \
  -d '{"language": "pl"}' > /dev/null

echo "✅ Processing triggered"
sleep 5
echo ""

# Test reprocess endpoint
echo "4️⃣ Testing reprocess endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "http://localhost:3101/api/voice-notes/$VOICE_ID/reprocess" \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Extract key business insights",
    "userPrompt": "Focus on action items",
    "language": "PL"
  }' 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Reprocess endpoint works (status 200)"
else
  echo "❌ Reprocess failed with status $HTTP_STATUS"
fi

echo ""

# Test export endpoint
echo "5️⃣ Testing export endpoint (markdown)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:3101/api/voice-notes/$VOICE_ID/export?format=markdown" 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Export endpoint works (status 200)"
else
  echo "❌ Export failed with status $HTTP_STATUS"
fi

echo ""

# Test export endpoint JSON
echo "6️⃣ Testing export endpoint (JSON)..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:3101/api/voice-notes/$VOICE_ID/export?format=json" 2>/dev/null)

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ JSON export works (status 200)"
else
  echo "❌ JSON export failed with status $HTTP_STATUS"
fi

echo ""
echo "✨ All endpoint tests completed!"