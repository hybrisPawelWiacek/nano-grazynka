# UX Rearchitecture Plan: Public Homepage with Anonymous Usage

## Executive Summary

Transform nano-Grazynka from a login-first experience to a public-first application where users can immediately try the service without creating an account. This follows the proven SaaS pattern of "Try → Love → Sign up" to improve conversion rates.

## Current State Analysis

### Problems with Current Architecture
1. **High Friction Entry**: Users must create account before seeing value
2. **Poor Conversion Flow**: Login page is the first interaction
3. **No Product Discovery**: Users can't explore features without commitment
4. **Mandatory Authentication**: Every route except /login and /register is protected

### Current Technical Implementation
- **Middleware**: Protects "/" and redirects to /login without token
- **Backend**: Requires userId for all operations
- **Database**: All records tied to user accounts
- **Frontend**: AuthContext assumes authenticated state

## Proposed Solution

### User Journey
```
1. Land on Homepage → See full app interface
2. Upload audio file → Process without login
3. View results → Experience value
4. Hit usage limit (5) → Prompted to create account
5. Sign up → Continue with unlimited usage (or per tier)
```

## Implementation Plan

### Phase 1: Frontend Changes (2-3 hours)

#### 1.1 Middleware Updates
```typescript
// frontend/middleware.ts
const protectedRoutes = [
  // Remove '/' from this list
  '/dashboard',
  '/settings',
  '/billing',
];
```

#### 1.2 Anonymous Session Management
Create new file: `frontend/lib/anonymousSession.ts`
```typescript
// Generate and manage anonymous session IDs
export const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('anonymousSessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('anonymousSessionId', sessionId);
    localStorage.setItem('anonymousUsageCount', '0');
  }
  return sessionId;
};

export const incrementUsageCount = () => {
  const count = parseInt(localStorage.getItem('anonymousUsageCount') || '0');
  localStorage.setItem('anonymousUsageCount', String(count + 1));
  return count + 1;
};

export const getUsageCount = () => {
  return parseInt(localStorage.getItem('anonymousUsageCount') || '0');
};

export const clearAnonymousSession = () => {
  localStorage.removeItem('anonymousSessionId');
  localStorage.removeItem('anonymousUsageCount');
};
```

#### 1.3 AuthContext Modifications
Update `frontend/src/contexts/AuthContext.tsx`:
- Add `isAnonymous` state
- Support anonymous mode operations
- Handle session-based usage tracking

#### 1.4 Homepage UI Updates
Modify `frontend/app/page.tsx`:
- Show full upload interface for anonymous users
- Display usage counter: "3 of 5 free transcriptions used"
- Add benefits sidebar for creating account
- Show login/register CTAs prominently

#### 1.5 Conversion Modal Component
Create `frontend/components/ConversionModal.tsx`:
```typescript
// Modal shown when anonymous user hits limit
- "You've used all 5 free transcriptions!"
- Benefits of creating account
- Sign up / Login buttons
- Option to dismiss (but block further uploads)
```

### Phase 2: Backend Changes (3-4 hours)

#### 2.1 Database Schema Updates
```sql
-- Add sessionId column to VoiceNote table
ALTER TABLE "VoiceNote" ADD COLUMN "sessionId" TEXT;

-- Create index for sessionId lookups
CREATE INDEX "VoiceNote_sessionId_idx" ON "VoiceNote"("sessionId");

-- Create AnonymousSession tracking table
CREATE TABLE "AnonymousSession" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT UNIQUE NOT NULL,
  "usageCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP
);
```

#### 2.2 API Endpoint Modifications

**POST /api/voice-notes/upload**
```typescript
// Accept either userId OR sessionId
interface UploadRequest {
  userId?: string;      // Optional for authenticated users
  sessionId?: string;   // Optional for anonymous users
  // ... other fields
}

// Validation logic
if (!userId && !sessionId) {
  throw new Error('Either userId or sessionId required');
}

// Usage limit check
if (sessionId) {
  const usage = await getAnonymousUsage(sessionId);
  if (usage >= 5) {
    return res.status(403).json({ 
      error: 'Anonymous usage limit reached. Please sign up to continue.' 
    });
  }
  await incrementAnonymousUsage(sessionId);
}
```

#### 2.3 New Endpoints

**GET /api/anonymous/usage**
```typescript
// Check anonymous usage count
{
  sessionId: string
} → {
  usageCount: number,
  remaining: number,
  limit: 5
}
```

**POST /api/anonymous/migrate**
```typescript
// Migrate anonymous sessions to user account after signup
{
  sessionId: string,
  userId: string
} → {
  migratedCount: number
}
```

### Phase 3: Migration & Data Management (1-2 hours)

#### 3.1 Data Migration Strategy
- Anonymous records stay linked to sessionId
- Optional migration when user signs up
- Cleanup job for old anonymous sessions (>30 days)

#### 3.2 Cleanup Job
```typescript
// Daily cron job to clean old anonymous data
async function cleanupAnonymousSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await prisma.voiceNote.deleteMany({
    where: {
      sessionId: { not: null },
      createdAt: { lt: thirtyDaysAgo }
    }
  });
}
```

## Technical Considerations

### Security
- **Rate Limiting**: Implement IP-based rate limiting for anonymous uploads
- **File Size Limits**: Stricter limits for anonymous users (25MB vs 100MB)
- **Abuse Prevention**: Track IP addresses alongside sessionIds
- **CORS**: Ensure proper CORS headers for anonymous API calls

### Performance
- **Caching**: Cache anonymous session counts in Redis
- **Database Indexes**: Add indexes for sessionId queries
- **Cleanup**: Regular pruning of old anonymous data

### Analytics
- **Conversion Tracking**: Measure anonymous → registered conversion rate
- **Usage Patterns**: Track which features drive signups
- **Drop-off Points**: Identify where anonymous users leave

## Implementation Timeline

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1.1 | Update middleware | 30 min | High |
| 1.2 | Anonymous session management | 1 hour | High |
| 1.3 | AuthContext modifications | 1 hour | High |
| 1.4 | Homepage UI updates | 1 hour | High |
| 1.5 | Conversion modal | 30 min | Medium |
| 2.1 | Database schema updates | 1 hour | High |
| 2.2 | API endpoint modifications | 2 hours | High |
| 2.3 | New anonymous endpoints | 1 hour | Medium |
| 3.1 | Migration strategy | 1 hour | Low |
| 3.2 | Cleanup job | 30 min | Low |

**Total Estimated Time**: 8-10 hours

## Rollout Strategy

### Phase 1: Soft Launch
1. Deploy with feature flag
2. Test with internal users
3. Monitor for issues

### Phase 2: Gradual Rollout
1. Enable for 10% of traffic
2. Monitor conversion metrics
3. Increase to 50%, then 100%

### Phase 3: Optimization
1. A/B test conversion modal designs
2. Optimize usage limits (3 vs 5 vs 10)
3. Test different CTAs

## Success Metrics

### Primary KPIs
- **Conversion Rate**: Anonymous → Registered (target: 15-20%)
- **Time to First Value**: How quickly users try the service (target: <2 min)
- **Engagement**: % of anonymous users who use all 5 credits (target: 40%)

### Secondary Metrics
- Bounce rate reduction
- Average session duration increase
- Feature discovery rate
- Support ticket reduction

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Abuse/Spam | High | IP rate limiting, file size limits |
| Storage Costs | Medium | 30-day cleanup, smaller limits |
| Data Privacy | Medium | Clear data retention policy |
| Session Hijacking | Low | Secure sessionId generation |
| Browser Storage Issues | Low | Fallback to cookies |

## Alternative Approaches Considered

### 1. Single "Ghost" User
- **Pros**: Simpler implementation
- **Cons**: Shared data, security issues
- **Decision**: Rejected due to privacy concerns

### 2. IP-Based Tracking Only
- **Pros**: No client storage needed
- **Cons**: Issues with shared IPs, VPNs
- **Decision**: Use as supplementary, not primary

### 3. Time-Limited Demo Mode
- **Pros**: Simple to implement
- **Cons**: Poor user experience
- **Decision**: Usage-based is more intuitive

## Next Steps

1. **Review & Approval**: PM review of this plan
2. **Technical Spike**: Validate sessionId approach
3. **Design Mockups**: Create conversion flow designs
4. **Implementation**: Follow phased approach
5. **Testing**: Comprehensive testing plan
6. **Monitoring**: Set up analytics tracking
7. **Launch**: Gradual rollout with monitoring

## Appendix

### A. Reference Implementations
- **Loom**: 5 free recordings, then signup required
- **CloudConvert**: 25 free conversions per day
- **Figma**: 3 free projects, then upgrade

### B. Conversion Modal Copy
```
Title: "You've Discovered the Power of nano-Grazynka!"

Body: "You've used all 5 free transcriptions. Create a free account to:
- Continue with 5 monthly transcriptions
- Save and access all your transcriptions
- Get detailed analytics
- Priority processing

[Sign Up - It's Free] [Login] [Learn More]
```

### C. Database Migration Script
```sql
-- Run this after deploying new schema
UPDATE "VoiceNote" 
SET sessionId = NULL 
WHERE userId IS NOT NULL;

-- Create indexes
CREATE INDEX CONCURRENTLY "VoiceNote_sessionId_idx" 
ON "VoiceNote"("sessionId") 
WHERE sessionId IS NOT NULL;
```

---

**Document Version**: 1.0  
**Created**: August 12, 2025  
**Author**: Claude (AI Assistant)  
**Status**: DRAFT - Awaiting Review