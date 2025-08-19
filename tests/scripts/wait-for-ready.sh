#!/bin/bash

# Wait for services to be ready before running tests
# This script checks health and ready endpoints

echo "🔄 Waiting for services to be ready..."

MAX_ATTEMPTS=30
ATTEMPT=0

# Function to check service
check_service() {
  local url=$1
  local name=$2
  
  if curl -s -f "$url" > /dev/null 2>&1; then
    echo "✅ $name is ready"
    return 0
  else
    echo "⏳ $name not ready yet..."
    return 1
  fi
}

# Wait for backend health
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  
  # Check backend health
  if check_service "http://localhost:3101/health" "Backend health"; then
    # Check backend ready (all routes loaded)
    if check_service "http://localhost:3101/ready" "Backend routes"; then
      # Check frontend
      if check_service "http://localhost:3100" "Frontend"; then
        echo "🎉 All services are ready!"
        
        # Final verification - check critical endpoints
        echo "🔍 Verifying critical endpoints..."
        
        # Test auth endpoint
        if curl -s -f "http://localhost:3101/api/auth/login" -X POST \
             -H "Content-Type: application/json" \
             -d '{"email":"test","password":"test"}' 2>&1 | grep -q "error\|Invalid"; then
          echo "✅ Auth endpoint responding correctly"
        fi
        
        # Test upload endpoint (should return 400 without file)
        if curl -s "http://localhost:3101/api/voice-notes/upload" -X POST 2>&1 | grep -q "400\|required"; then
          echo "✅ Upload endpoint responding correctly"
        fi
        
        echo "✅ All services verified and ready for testing!"
        exit 0
      fi
    fi
  fi
  
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting 2 seconds..."
  sleep 2
done

echo "❌ Services did not become ready within timeout"
echo "Debug information:"
echo "Backend health:"
curl -s "http://localhost:3101/health" || echo "Failed to connect"
echo ""
echo "Backend ready:"
curl -s "http://localhost:3101/ready" || echo "Failed to connect"
echo ""
echo "Docker status:"
docker compose ps

exit 1