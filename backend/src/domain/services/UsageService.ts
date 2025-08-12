import { PrismaClient } from '@prisma/client';
import { UserEntity } from '../entities/User';
import { UserRepository } from '../../infrastructure/persistence/UserRepositoryImpl';

export class UsageService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaClient
  ) {}

  async checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; user: UserEntity }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if credits need to be reset
    if (user.shouldResetCredits()) {
      const resetUser = await this.userRepository.resetCredits(userId);
      return this.checkUsageLimit(resetUser);
    }

    // Check current usage
    const result = this.checkUsageLimit(user);
    
    // If allowed, increment usage
    if (result.allowed) {
      const updatedUser = await this.userRepository.incrementCredits(userId);
      await this.logUsage(userId, 'upload');
      return { allowed: true, user: updatedUser };
    }

    return result;
  }

  private checkUsageLimit(user: UserEntity): { allowed: boolean; user: UserEntity } {
    return {
      allowed: user.hasCreditsAvailable,
      user,
    };
  }

  async logUsage(userId: string, action: string, metadata?: any): Promise<void> {
    await this.prisma.usageLog.create({
      data: {
        userId,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async getUserUsageStats(userId: string): Promise<{
    currentMonth: {
      creditsUsed: number;
      creditsLimit: number;
      notesProcessed: number;
    };
    allTime: {
      totalNotes: number;
      totalMinutesTranscribed: number;
    };
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get current month stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyLogs = await this.prisma.usageLog.count({
      where: {
        userId,
        action: 'upload',
        timestamp: { gte: startOfMonth },
      },
    });

    // Get all-time stats
    const allNotes = await this.prisma.voiceNote.count({
      where: { userId },
    });

    const transcriptions = await this.prisma.transcription.findMany({
      where: {
        voiceNote: { userId },
      },
      select: { duration: true },
    });

    const totalMinutes = transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0) / 60;

    return {
      currentMonth: {
        creditsUsed: user.creditsUsed,
        creditsLimit: user.creditLimit,
        notesProcessed: monthlyLogs,
      },
      allTime: {
        totalNotes: allNotes,
        totalMinutesTranscribed: Math.round(totalMinutes),
      },
    };
  }
}