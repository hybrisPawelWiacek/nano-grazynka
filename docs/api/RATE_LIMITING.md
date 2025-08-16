# Rate Limiting Documentation

## Overview
The application implements rate limiting to prevent abuse and ensure fair usage across all user types. The system uses a per-minute request bucket with different limits based on authentication status and user tier.

## Rate Limits by User Type

| User Type | Requests per Minute | Use Case |
|-----------|--------------------:|----------|
| **Anonymous Users** | 20 | Unauthenticated users with session ID |
| **Free Tier** | 10 | Registered users on free plan |
| **Pro Tier** | 60 | Professional subscription users |
| **Business Tier** | 120 | Business subscription users |

## Excluded Endpoints

The following endpoints are excluded from rate limiting to ensure smooth operation:

### Status Polling
- **GET** `/api/voice-notes/:id` - Status polling during transcription processing
  - Excluded to prevent 429 errors during the upload → process → poll flow
  - Critical for real-time status updates without consuming rate limit quota

## Frontend Rate Limit Handling

The frontend intelligently handles rate limits to provide a seamless user experience:

### 1. Rate Limit Tracking
```typescript
// In lib/api/client.ts
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

// After each response, headers are parsed:
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 2025-08-16T12:00:00.000Z
```

### 2. Smart Polling Adjustment
- When `remaining < 3`: Polling interval increases to 5 seconds
- When `remaining = 0`: Polling pauses until reset time
- After reset: Normal polling resumes automatically

### 3. User-Friendly Error Messages
- Shows countdown timer: "Rate limit reached. Retrying in 47 seconds..."
- Auto-retry after the Retry-After duration
- Manual "Try Again" button enabled after cooldown

### 4. Library Page Recovery
```typescript
// Special handling for Library page
if (error.status === 429) {
  const retryAfter = error.retryAfter || 60;
  setRetryCountdown(retryAfter);
  // Countdown timer with auto-retry
}
```

## Response Headers

All rate-limited responses include standardized headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Maximum requests allowed | `20` |
| `X-RateLimit-Remaining` | Requests remaining in current window | `15` |
| `X-RateLimit-Reset` | ISO timestamp when limit resets | `2025-08-16T12:00:00.000Z` |
| `Retry-After` | Seconds to wait (only on 429 responses) | `45` |

## Implementation Details

### Backend Middleware
Location: `backend/src/presentation/api/middleware/rateLimit.ts`

```typescript
// Anonymous users get 20 requests/minute
if (isAnonymous) {
  return applyRateLimit(request, reply, identifier, 20);
}
```

### Frontend API Client
Location: `frontend/lib/api/client.ts`

```typescript
export function getRateLimitStatus(): RateLimitInfo | null {
  return currentRateLimit;
}
```

### Usage Sync
Location: `frontend/contexts/AuthContext.tsx`

On mount, the AuthContext syncs with backend to ensure accurate usage counts:
```typescript
useEffect(() => {
  if (sessionId) {
    getAnonymousUsage(sessionId)
      .then(usage => {
        setAnonymousUsageCount(usage.usageCount);
        localStorage.setItem('anonymousUsageCount', String(usage.usageCount));
      });
  }
}, [sessionId]);
```

## Common Scenarios

### Upload Flow (Anonymous User)
1. **Upload**: 1 request
2. **Process**: 1 request  
3. **Polling**: 0 requests (excluded from rate limit)
4. **Get Result**: 1 request
5. **Navigate to Library**: 1 request
6. **Load Notes**: 1 request

**Total**: 5 requests (well within 20/minute limit)

### Rate Limit Hit Recovery
1. User hits rate limit (429 response)
2. Frontend shows countdown timer
3. User can wait or navigate away
4. After reset time, auto-retry occurs
5. Request succeeds, normal flow resumes

## Testing Rate Limits

### Manual Testing
```bash
# Test rate limiting with curl
for i in {1..25}; do
  curl -H "x-session-id: test-session" \
       http://localhost:3101/api/voice-notes
  sleep 2
done
```

### Automated Testing
```javascript
// tests/scripts/test-rate-limiting.js
const testRateLimit = async () => {
  const sessionId = 'test-session-id';
  
  // Make 20 requests rapidly
  for (let i = 0; i < 20; i++) {
    await fetch('/api/voice-notes', {
      headers: { 'x-session-id': sessionId }
    });
  }
  
  // 21st request should return 429
  const response = await fetch('/api/voice-notes', {
    headers: { 'x-session-id': sessionId }
  });
  
  console.assert(response.status === 429, 'Rate limit not enforced');
};
```

## Troubleshooting

### Issue: 429 Errors in Library After Upload
**Cause**: Rate limit exhausted during upload/processing flow  
**Solution**: Polling endpoint excluded from rate limiting

### Issue: Usage Counter Mismatch
**Cause**: localStorage out of sync with backend  
**Solution**: AuthContext now syncs on mount

### Issue: Stuck at "Rate limit reached"
**Cause**: Frontend not parsing Retry-After header  
**Solution**: Added countdown timer with auto-retry logic

## Best Practices

1. **Always check rate limit status** before making bulk requests
2. **Use getRateLimitStatus()** to adjust application behavior
3. **Implement exponential backoff** for retries
4. **Cache responses** when possible to reduce API calls
5. **Batch operations** to minimize request count

## Future Improvements

- [ ] Implement sliding window rate limiting
- [ ] Add per-endpoint rate limits
- [ ] Create rate limit dashboard for users
- [ ] Add webhook notifications for rate limit approaches
- [ ] Implement request queuing for better UX

---

*Last Updated: August 16, 2025*  
*Related: [API Contract](./api-contract.md) | [Authentication](../architecture/AUTHENTICATION.md)*