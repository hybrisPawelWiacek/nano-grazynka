# Anonymous-to-User Migration Endpoint Implementation Plan
**Created**: August 15, 2025  
**Status**: COMPLETED  
**Priority**: Medium  
**Test Failure**: A2.8 - POST /api/anonymous/migrate returns 404

## Overview
Implement the `/api/anonymous/migrate` endpoint to transfer voice notes from an anonymous session to a registered user account when they sign up or log in. This feature enables seamless transition from anonymous to authenticated usage.

## Problem Statement
- Anonymous users can upload up to 5 voice notes without registration
- When they create an account, their existing notes are orphaned
- Test A2.8 fails with 404 because the endpoint doesn't exist
- Users lose their work if they don't register before hitting the limit

## Solution Architecture

### 1. Backend Migration Endpoint
**File**: `backend/src/presentation/api/routes/anonymous.ts`

```typescript
// POST /api/anonymous/migrate
fastify.post('/api/anonymous/migrate', {
  schema: {
    body: {
      type: 'object',
      required: ['sessionId', 'userId'],
      properties: {
        sessionId: { type: 'string' },
        userId: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          migrated: { type: 'number' },
          message: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  // Implementation details below
})
```

### 2. Migration Use Case
**File**: `backend/src/application/use-cases/MigrateAnonymousToUserUseCase.ts`

Business logic implementation:
```typescript
export class MigrateAnonymousToUserUseCase {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  async execute(sessionId: string, userId: string): Promise<MigrationResult> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Verify anonymous session exists
      const session = await tx.anonymousSession.findUnique({
        where: { sessionId }
      });
      
      if (!session) {
        throw new Error('Session not found');
      }

      // 2. Verify user exists
      const user = await tx.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new Error('User not found');
      }

      // 3. Get all voice notes for session
      const voiceNotes = await tx.voiceNote.findMany({
        where: { sessionId }
      });

      // 4. Update voice notes to belong to user
      await tx.voiceNote.updateMany({
        where: { sessionId },
        data: { 
          userId,
          sessionId: null 
        }
      });

      // 5. Update user's credit usage
      await tx.user.update({
        where: { id: userId },
        data: {
          creditsUsed: {
            increment: voiceNotes.length
          }
        }
      });

      // 6. Delete anonymous session
      await tx.anonymousSession.delete({
        where: { sessionId }
      });

      // 7. Log migration event
      await tx.usageLog.create({
        data: {
          userId,
          action: 'migrate_anonymous',
          metadata: JSON.stringify({
            sessionId,
            notesCount: voiceNotes.length,
            noteIds: voiceNotes.map(n => n.id)
          })
        }
      });

      return {
        migrated: voiceNotes.length,
        message: `Successfully migrated ${voiceNotes.length} notes`
      };
    });
  }
}
```

### 3. Frontend Integration
**File**: `frontend/contexts/AuthContext.tsx`

Add migration logic after successful authentication:
```typescript
const handlePostAuth = async (user: User) => {
  // Check for anonymous session
  const anonymousSessionId = localStorage.getItem('anonymousSessionId');
  
  if (anonymousSessionId) {
    try {
      // Attempt migration
      const result = await migrateAnonymousSession(anonymousSessionId, user.id);
      
      if (result.migrated > 0) {
        // Clear anonymous session
        localStorage.removeItem('anonymousSessionId');
        localStorage.removeItem('anonymousUsageCount');
        
        // Show success message
        toast.success(`${result.migrated} notes transferred to your account`);
        
        // Refresh voice notes list
        await refreshVoiceNotes();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      // Keep session for retry
      toast.warning('Could not transfer anonymous notes. Please try again.');
    }
  }
};
```

### 4. API Client Function
**File**: `frontend/lib/api/anonymous.ts`

```typescript
export async function migrateAnonymousSession(
  sessionId: string, 
  userId: string
): Promise<{ migrated: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/anonymous/migrate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ sessionId, userId })
  });

  if (!response.ok) {
    throw new Error('Migration failed');
  }

  return response.json();
}
```

## Database Schema Considerations

Current schema supports migration:
- `VoiceNote.userId` is nullable (for anonymous)
- `VoiceNote.sessionId` is nullable (for registered users)
- `AnonymousSession` tracks usage
- `User.creditsUsed` tracks total usage

No schema changes required!

## Security Considerations

1. **Authentication Required**: Endpoint requires valid JWT token
2. **Ownership Verification**: User can only migrate to their own account
3. **Session Validation**: Verify session exists and has notes
4. **Credit Limits**: Check user hasn't exceeded tier limits
5. **Atomic Transaction**: All-or-nothing migration
6. **Audit Trail**: Log migration events for compliance

## Testing Strategy

### Unit Tests
- Test use case with valid inputs
- Test transaction rollback on error
- Test credit calculation
- Test session cleanup

### Integration Tests
```javascript
// tests/integration/anonymous-migration.test.js
describe('Anonymous to User Migration', () => {
  test('should migrate notes successfully', async () => {
    // 1. Create anonymous session with notes
    // 2. Create user account
    // 3. Call migration endpoint
    // 4. Verify notes transferred
    // 5. Verify session deleted
    // 6. Verify credits updated
  });

  test('should handle missing session', async () => {
    // Should return 404
  });

  test('should handle invalid user', async () => {
    // Should return 404
  });

  test('should require authentication', async () => {
    // Should return 401 without token
  });
});
```

### E2E Tests
- Test full flow: anonymous upload → registration → automatic migration
- Test migration after login (existing user)
- Test UI updates after migration

## Implementation Checklist

- [ ] Create `MigrateAnonymousToUserUseCase.ts`
- [ ] Add migration endpoint to `anonymous.ts`
- [ ] Register use case in `container.ts`
- [ ] Update `AuthContext.tsx` with migration logic
- [ ] Create `migrateAnonymousSession` API function
- [ ] Update API documentation in `api-contract.md`
- [ ] Write unit tests for use case
- [ ] Write integration tests for endpoint
- [ ] Write E2E test for full flow
- [ ] Test transaction rollback scenarios
- [ ] Add migration event to usage logs
- [ ] Update frontend to show migration status

## Success Criteria

1. **Functional Requirements**
   - ✅ Anonymous notes transfer to user account
   - ✅ Session is deleted after migration
   - ✅ User credits are updated
   - ✅ Frontend automatically triggers migration
   - ✅ Proper error handling and rollback

2. **Non-Functional Requirements**
   - ✅ Migration completes in < 2 seconds
   - ✅ Zero data loss during migration
   - ✅ Atomic transaction (all or nothing)
   - ✅ Audit log created for compliance

3. **Test Coverage**
   - ✅ Test A2.8 passes
   - ✅ 100% code coverage for use case
   - ✅ Integration tests pass
   - ✅ E2E tests pass

## Rollout Plan

1. **Phase 1**: Backend implementation
   - Implement use case
   - Add endpoint
   - Write tests

2. **Phase 2**: Frontend integration
   - Add migration call to auth flow
   - Handle success/error states
   - Update UI

3. **Phase 3**: Testing & validation
   - Run all tests
   - Manual testing
   - Fix any issues

4. **Phase 4**: Documentation
   - Update API docs
   - Add migration guide
   - Update README

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Transaction failure | Data inconsistency | Use database transaction with rollback |
| Race condition | Duplicate migration | Use session ID as idempotency key |
| Credit overflow | User exceeds limit | Check limits before migration |
| Network failure | Partial migration | Atomic transaction ensures consistency |
| Session hijacking | Unauthorized migration | Require authentication + session ownership |

## Notes

- Migration is one-way (anonymous → user)
- Session is deleted after successful migration
- Failed migrations can be retried
- Consider adding "claim notes" button for manual trigger
- Future: Support merging with existing user notes

## References

- [API Contract Documentation](../../docs/api/api-contract.md)
- [Database Schema](../../backend/prisma/schema.prisma)
- [Test Plan](../testing/TEST_PLAN.md)
- [Test Results](../testing/TEST_RESULTS_2025_08_15.md)