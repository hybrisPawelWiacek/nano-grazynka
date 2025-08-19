# Anonymous Session Improvement Plan for nano-grazynka MVP

**Date**: August 19, 2025  
**Priority**: High (Security)  
**Estimated Effort**: 8-12 hours total  
**Risk Level**: Low (phased approach maintains backward compatibility)

## Executive Summary

This plan addresses critical security vulnerabilities in the current anonymous session implementation while maintaining MVP simplicity. The current localStorage-based approach exposes session IDs to XSS attacks. We'll implement a pragmatic, phased migration to HTTP-only cookies without disrupting existing users.

## Current State Analysis

### What We Have (Working)
- ✅ Secure session ID generation (crypto.randomUUID)
- ✅ Rate limiting by session ID (20 requests for anonymous)
- ✅ Usage limits (5 notes per anonymous session)
- ✅ Database persistence for sessions
- ✅ Migration logic for anonymous → authenticated transfer
- ✅ Flexible backend (accepts session from header or body)

### Critical Issues
1. **Security Risk**: localStorage is XSS-vulnerable (any JS can read it)
2. **No Expiration**: Sessions persist forever, causing DB bloat
3. **Manual Migration**: Users lose data if they don't manually migrate
4. **Duplicate Code**: Session logic scattered across multiple files

## Phased Implementation Plan

### Phase 1: Hybrid Cookie Support (4 hours) 🚀 **START HERE**

Add cookie support WITHOUT breaking existing localStorage users.

#### Backend Changes

**1. Install Fastify Cookie Plugin**
```bash
cd backend && npm install @fastify/cookie
```

**2. Configure Cookie Support** (`backend/src/presentation/api/server.ts`)
- Register cookie plugin with secure defaults
- Settings: `httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax'`

**3. Update Session Middleware** (`backend/src/presentation/api/middleware/anonymousUsageLimit.ts`)
```typescript
// Check priority: Cookie → Header → Body → Create New
const sessionId = 
  request.cookies.anonymous_session ||
  request.headers['x-session-id'] ||
  request.body?.sessionId;
```

**4. Set Cookie on First Request** (`backend/src/presentation/api/routes/voiceNotes.ts`)
```typescript
// When we receive a session via header, set it as cookie
if (sessionId && !request.cookies.anonymous_session) {
  reply.setCookie('anonymous_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });
}
```

#### Frontend Changes
**None required** - Existing localStorage continues working!

#### Testing
1. New users get cookies automatically
2. Existing users with localStorage still work
3. Cookie-based sessions persist across refreshes

---

### Phase 2: Auto-Migration & Cleanup (3 hours)

Improve UX and add session management.

#### Database Changes

**1. Add Expiration Field**
```sql
-- Migration: add_session_expiration
ALTER TABLE AnonymousSession 
ADD COLUMN expiresAt DATETIME;

-- Set default expiration for existing sessions (7 days from now)
UPDATE AnonymousSession 
SET expiresAt = datetime('now', '+7 days') 
WHERE expiresAt IS NULL;
```

**2. Update Prisma Schema**
```prisma
model AnonymousSession {
  id          String   @id @default(uuid())
  sessionId   String   @unique
  usageCount  Int      @default(0)
  expiresAt   DateTime @default(dbgenerated("datetime('now', '+7 days')"))
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([expiresAt])
}
```

#### Backend Changes

**1. Auto-Migration on Login** (`backend/src/presentation/api/routes/auth.ts`)
```typescript
// In login/signup endpoints, after successful auth:
const anonymousSessionId = 
  request.cookies.anonymous_session ||
  request.headers['x-session-id'];

if (anonymousSessionId) {
  await migrateAnonymousToUser.execute({
    sessionId: anonymousSessionId,
    userId: user.id
  });
  
  // Clear anonymous cookie
  reply.clearCookie('anonymous_session');
}
```

**2. Session Cleanup Endpoint** (`backend/src/presentation/api/routes/admin.ts`)
```typescript
// Manual cleanup endpoint (call periodically or via cron)
fastify.post('/api/admin/cleanup-sessions', async (request, reply) => {
  const deleted = await prisma.anonymousSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  
  return { deleted: deleted.count };
});
```

#### Frontend Changes

**1. Clear localStorage on Login** (`frontend/contexts/AuthContext.tsx`)
```typescript
// After successful login:
localStorage.removeItem('anonymousSessionId');
localStorage.removeItem('anonymousUsageCount');
```

---

### Phase 3: Cookie-Only Implementation (2 hours) - **FUTURE**

Complete migration to cookies (implement after Phase 1 & 2 are stable).

#### Frontend Changes

**1. Remove localStorage Usage**
- Delete `frontend/lib/anonymousSession.ts`
- Update `AuthContext` to use server-side session
- Remove all `x-session-id` header additions

**2. Server-Side Session Check**
```typescript
// Use Next.js cookies() for session validation
import { cookies } from 'next/headers';

export async function getSessionId() {
  const cookieStore = cookies();
  return cookieStore.get('anonymous_session')?.value;
}
```

---

## Implementation Checklist

### Phase 1 (Immediate Priority)
- [ ] Install @fastify/cookie package
- [ ] Configure cookie plugin in server.ts
- [ ] Update anonymousUsageLimit middleware
- [ ] Add cookie setting in voiceNotes route
- [ ] Test with existing localStorage users
- [ ] Test with new cookie users
- [ ] Deploy and monitor

### Phase 2 (Within 1 Week)
- [ ] Create database migration for expiresAt
- [ ] Update Prisma schema
- [ ] Implement auto-migration on login
- [ ] Add session cleanup endpoint
- [ ] Update frontend to clear localStorage on auth
- [ ] Test migration flow
- [ ] Schedule cleanup job (manual or cron)

### Phase 3 (After Stability Confirmed)
- [ ] Remove localStorage code from frontend
- [ ] Update all API calls to rely on cookies
- [ ] Remove x-session-id header logic
- [ ] Add CSRF protection (optional for MVP)
- [ ] Full testing of cookie-only flow

## Security Improvements

### What This Fixes
1. **XSS Protection**: HTTP-only cookies can't be accessed by JavaScript
2. **Automatic Handling**: Browser sends cookies automatically
3. **Expiration**: Sessions auto-expire after 7 days
4. **Clean Migration**: Users don't lose data when signing up

### What We're NOT Adding (MVP Focus)
- ❌ Redis session store (SQLite is fine for MVP)
- ❌ Complex CSRF tokens (can add later)
- ❌ Session fingerprinting (unnecessary complexity)
- ❌ JWT for anonymous sessions (overkill)

## Testing Strategy

### Phase 1 Tests
```javascript
// Test 1: Existing localStorage user
- User with localStorage session uploads file
- Verify backend accepts x-session-id header
- Verify cookie is set in response

// Test 2: New user gets cookie
- New user uploads file
- Verify cookie is set
- Verify subsequent requests use cookie

// Test 3: Cookie persistence
- Upload file (get cookie)
- Refresh page
- Upload another file
- Verify same session used
```

### Phase 2 Tests
```javascript
// Test 4: Auto-migration
- Anonymous user uploads 2 files
- User signs up
- Verify files transferred to account
- Verify anonymous session deleted

// Test 5: Session expiration
- Create old session (backdated)
- Run cleanup
- Verify session deleted
```

## Rollback Plan

If issues arise at any phase:

1. **Phase 1 Rollback**: Remove cookie plugin, revert to header-only
2. **Phase 2 Rollback**: Keep cookies but disable auto-migration
3. **Phase 3 Rollback**: Re-enable localStorage as fallback

## Success Metrics

- ✅ No disruption to existing users
- ✅ New users get more secure cookie-based sessions
- ✅ Successful auto-migration rate > 95%
- ✅ Database session count stabilizes (cleanup working)
- ✅ Zero session-related security incidents

## Code Snippets

### Complete Cookie Configuration (server.ts)
```typescript
import fastifyCookie from '@fastify/cookie';

// In server initialization
await fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || 'change-this-secret-in-production',
  parseOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  }
});
```

### Updated Session Check Logic
```typescript
function getSessionId(request: FastifyRequest): string | undefined {
  // Priority: Cookie > Header > Body
  return request.cookies?.anonymous_session ||
         (request.headers['x-session-id'] as string) ||
         (request.body as any)?.sessionId;
}
```

## Notes

- **Why Cookies Over localStorage**: Cookies are the industry standard for session management because they're automatically included in requests and can be secured with httpOnly flag.
- **Why Phased Approach**: Reduces risk, maintains backward compatibility, allows gradual migration.
- **Why 7-Day Expiration**: Balances user convenience with security. Long enough for casual users, short enough to limit exposure.
- **Why Not JWT**: JWTs are overkill for anonymous sessions. Simple session IDs are sufficient and more efficient.

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Next.js 15 Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication)
- [Fastify Cookie Plugin](https://github.com/fastify/fastify-cookie)

---

**Document Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 implementation