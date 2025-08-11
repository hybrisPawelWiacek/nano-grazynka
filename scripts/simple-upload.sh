#!/bin/bash

# Simple curl test
echo "Testing upload endpoint with zabka.m4a..."

curl -X POST http://localhost:3101/api/voice-notes \
  -H "Content-Type: multipart/form-data" \
  -F "file=@zabka.m4a;type=audio/m4a" \
  -F "title=Zabka Recording" \
  -F "language=PL" \
  -F "tags=test" \
  -v 2>&1 | head -50

echo -e "\n\nChecking backend logs..."
docker compose logs backend --tail=20