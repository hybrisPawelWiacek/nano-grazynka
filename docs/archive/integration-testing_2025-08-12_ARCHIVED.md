---
ARCHIVED: August 12, 2025
STATUS: Reference material for Docker-first testing approach
NOTE: This document contains valuable Docker testing patterns and troubleshooting guides.
      See TEST_PLAN.md for current test strategy.
---

# Integration Testing Guide

## Overview
This document defines the integration testing strategy for nano-Grazynka, with a focus on Docker-first testing to catch environment-specific issues early.

## Testing Principles

1. **Docker-First**: Always test in Docker environment before considering a feature complete
2. **Contract Testing**: Verify API contracts between frontend and backend
3. **End-to-End Flow**: Test complete user workflows, not just individual endpoints
4. **Environment Parity**: Development tests should mirror production environment

## Required Testing Before Merge

### 1. Prisma Client Generation
```bash
# Must be included in Dockerfile
RUN npx prisma generate

# Verify in docker-compose logs
docker compose logs backend | grep "Prisma Client"
```

### 2. API Contract Tests

#### Upload Flow Test
```bash
# Test file upload through Docker
curl -X POST http://localhost:3101/api/voice-notes \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-audio.mp3" \
  -F "title=Test Upload"

# Expected response structure
{
  "voiceNote": {
    "id": "...",
    "status": "pending",
    ...
  },
  "message": "Voice note uploaded successfully"
}
```

#### Processing Flow Test
```bash
# Trigger processing
curl -X POST http://localhost:3101/api/voice-notes/{id}/process \
  -H "Content-Type: application/json" \
  -d '{"language": "EN"}'

# Expected response
{
  "voiceNote": {
    "status": "processing",
    ...
  },
  "message": "Processing started"
}
```

## Docker Testing Checklist

### Pre-Deploy Checklist
- [ ] `docker compose build --no-cache` completes successfully
- [ ] `docker compose up` starts all services without errors
- [ ] Backend health check returns `database: "connected"`
- [ ] Frontend can reach backend at `http://backend:3101`
- [ ] File uploads work through frontend UI
- [ ] Processing completes successfully
- [ ] Database persists data in `/data` volume

### Environment Variables
```yaml
# .env file must include
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:3101
API_URL_INTERNAL=http://backend:3101
```

## Integration Test Suite

### 1. Frontend-Backend Contract Tests

```typescript
// tests/integration/contract.test.ts
describe('API Contract Tests', () => {
  test('Upload endpoint returns expected structure', async () => {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    const response = await fetch('http://localhost:3101/api/voice-notes', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // Verify nested structure
    expect(data).toHaveProperty('voiceNote');
    expect(data.voiceNote).toHaveProperty('id');
    expect(data.voiceNote).toHaveProperty('status', 'pending');
  });
  
  test('Field names match contract', async () => {
    const response = await fetch('http://localhost:3101/api/voice-notes/123');
    const data = await response.json();
    
    // Verify camelCase in responses
    expect(data).toHaveProperty('createdAt'); // NOT created_at
    expect(data).toHaveProperty('fileSize');  // NOT file_size
  });
});
```

### 2. Docker Network Tests

```typescript
// tests/integration/docker-network.test.ts
describe('Docker Network Tests', () => {
  test('Frontend can reach backend through Docker network', async () => {
    // Run from frontend container
    const response = await fetch('http://backend:3101/health');
    expect(response.ok).toBe(true);
  });
  
  test('Backend can connect to database', async () => {
    const health = await fetch('http://localhost:3101/health');
    const data = await health.json();
    expect(data.database).toBe('connected');
  });
});
```

### 3. File Upload Integration

```typescript
// tests/integration/upload.test.ts
describe('File Upload Integration', () => {
  test('Complete upload flow works in Docker', async () => {
    // 1. Upload file
    const uploadResponse = await uploadFile('test.mp3');
    expect(uploadResponse.status).toBe(201);
    
    const { voiceNote } = await uploadResponse.json();
    expect(voiceNote.status).toBe('pending');
    
    // 2. Verify file saved
    const filePath = `/data/uploads/${voiceNote.id}.mp3`;
    expect(fs.existsSync(filePath)).toBe(true);
    
    // 3. Verify database record
    const getResponse = await fetch(`/api/voice-notes/${voiceNote.id}`);
    expect(getResponse.ok).toBe(true);
  });
});
```

## Common Integration Issues

### Issue 1: Prisma Client Not Generated
**Symptom**: `@prisma/client did not initialize yet`
**Solution**: Add `RUN npx prisma generate` to Dockerfile
**Test**: Check container logs for Prisma initialization

### Issue 2: Frontend Can't Reach Backend
**Symptom**: `Failed to fetch` errors in frontend
**Solution**: Use Docker network name `backend` instead of `localhost`
**Test**: `docker compose exec frontend ping backend`

### Issue 3: File Permissions
**Symptom**: Cannot write to `/data/uploads`
**Solution**: Ensure volume mounts have correct permissions
**Test**: `docker compose exec backend ls -la /data`

### Issue 4: Environment Variables Not Loaded
**Symptom**: API keys not working
**Solution**: Check `.env` file and docker-compose environment section
**Test**: `docker compose exec backend env | grep OPENAI`

## Testing Commands

### Quick Test Suite
```bash
# Run all integration tests in Docker
npm run test:integration:docker

# Test specific flow
npm run test:upload:docker
npm run test:process:docker

# Full E2E test
npm run test:e2e:docker
```

### Manual Testing Script
```bash
#!/bin/bash
# integration-test.sh

echo "1. Building Docker images..."
docker compose build --no-cache

echo "2. Starting services..."
docker compose up -d

echo "3. Waiting for services..."
sleep 10

echo "4. Testing health endpoint..."
curl http://localhost:3101/health

echo "5. Testing file upload..."
curl -X POST http://localhost:3101/api/voice-notes \
  -F "file=@test.mp3" \
  -F "title=Integration Test"

echo "6. Checking logs..."
docker compose logs --tail=50

echo "7. Cleanup..."
docker compose down
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Create .env file
        run: |
          echo "OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }}" > .env
          echo "NEXT_PUBLIC_API_URL=http://localhost:3101" >> .env
          echo "API_URL_INTERNAL=http://backend:3101" >> .env
      
      - name: Build Docker images
        run: docker compose build
      
      - name: Run services
        run: docker compose up -d
      
      - name: Wait for services
        run: sleep 15
      
      - name: Run integration tests
        run: |
          docker compose exec -T backend npm run test:integration
          docker compose exec -T frontend npm run test:integration
      
      - name: Check service health
        run: |
          curl -f http://localhost:3101/health || exit 1
          curl -f http://localhost:3100 || exit 1
      
      - name: Cleanup
        if: always()
        run: docker compose down -v
```

## Performance Testing

### Load Testing with k6
```javascript
// tests/performance/upload-load.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function() {
  const params = {
    headers: { 'Content-Type': 'multipart/form-data' },
  };
  
  const response = http.post(
    'http://localhost:3101/api/voice-notes',
    {
      file: open('test.mp3', 'b'),
      title: 'Load test',
    },
    params
  );
  
  check(response, {
    'status is 201': (r) => r.status === 201,
    'has voiceNote': (r) => JSON.parse(r.body).voiceNote !== undefined,
  });
}
```

## Debugging Integration Issues

### View Container Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs backend -f --tail=100

# Search for errors
docker compose logs | grep ERROR
```

### Access Container Shell
```bash
# Backend container
docker compose exec backend sh

# Check database
docker compose exec backend npx prisma studio

# Check file system
docker compose exec backend ls -la /data/uploads
```

### Network Debugging
```bash
# List networks
docker network ls

# Inspect network
docker network inspect nano-grazynka_default

# Test connectivity
docker compose exec frontend curl http://backend:3101/health
```

## Best Practices

1. **Always test in Docker** before marking feature complete
2. **Include Prisma generate** in all Docker builds
3. **Use Docker network names** for inter-service communication
4. **Test both success and error paths**
5. **Verify file persistence** across container restarts
6. **Check logs** for hidden errors that don't fail requests
7. **Test with production-like data** (various file sizes, languages)
8. **Document any environment-specific workarounds**