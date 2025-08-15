import { PrismaClient } from '@prisma/client';

export interface MigrateAnonymousToUserRequest {
  sessionId: string;
  userId: string;
}

export interface MigrateAnonymousToUserResponse {
  migrated: number;
  message: string;
}

export class MigrateAnonymousToUserUseCase {
  constructor(
    private readonly prisma: PrismaClient
  ) {}

  async execute(request: MigrateAnonymousToUserRequest): Promise<MigrateAnonymousToUserResponse> {
    const { sessionId, userId } = request;

    console.log('Starting anonymous to user migration', { sessionId, userId });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
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

        // 3. Get all voice notes for this session
        const voiceNotes = await tx.voiceNote.findMany({
          where: { sessionId }
        });

        console.log('Found voice notes to migrate', { 
          count: voiceNotes.length,
          sessionId,
          userId 
        });

        // 4. Update voice notes to belong to user
        if (voiceNotes.length > 0) {
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
        }

        // 6. Delete anonymous session
        await tx.anonymousSession.delete({
          where: { sessionId }
        });

        // 7. Log migration event (create usage log table entry if exists)
        try {
          await tx.usageLog.create({
            data: {
              userId,
              action: 'migrate_anonymous',
              metadata: JSON.stringify({
                sessionId,
                notesCount: voiceNotes.length,
                noteIds: voiceNotes.map(n => n.id),
                timestamp: new Date().toISOString()
              }),
              createdAt: new Date()
            }
          });
        } catch (error) {
          // UsageLog table might not exist, log but don't fail
          console.warn('Could not create usage log entry', { error });
        }

        return {
          migrated: voiceNotes.length,
          noteIds: voiceNotes.map(n => n.id)
        };
      });

      console.log('Migration completed successfully', { 
        migrated: result.migrated,
        sessionId,
        userId 
      });

      return {
        migrated: result.migrated,
        message: `Successfully migrated ${result.migrated} notes`
      };
    } catch (error) {
      console.error('Migration failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId 
      });
      
      if (error instanceof Error && error.message === 'Session not found') {
        throw new Error('Session not found');
      }
      
      if (error instanceof Error && error.message === 'User not found') {
        throw new Error('User not found');
      }
      
      throw new Error('Migration failed');
    }
  }
}