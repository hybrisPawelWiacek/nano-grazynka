import { PrismaClient } from '@prisma/client';

export interface LoginAttempt {
  id?: string;
  email: string;
  ipAddress: string;
  success: boolean;
  attemptedAt: Date;
}

export interface AccountLockStatus {
  isLocked: boolean;
  lockedUntil?: Date;
  remainingAttempts: number;
}

export class LoginAttemptService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;
  private readonly ATTEMPT_WINDOW_MINUTES = 15; // Track attempts within 15-minute window

  constructor(private readonly prisma: PrismaClient) {}

  async recordLoginAttempt(email: string, ipAddress: string, success: boolean): Promise<void> {
    try {
      await this.prisma.loginAttempt.create({
        data: {
          email: email.toLowerCase(),
          ipAddress,
          success,
          attemptedAt: new Date(),
        },
      });

      // Clean up old attempts periodically (keep last 50 per email)
      const oldAttempts = await this.prisma.loginAttempt.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { attemptedAt: 'desc' },
        skip: 50,
      });

      if (oldAttempts.length > 0) {
        await this.prisma.loginAttempt.deleteMany({
          where: {
            id: { in: oldAttempts.map((a: any) => a.id) },
          },
        });
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error);
      // Don't throw - this shouldn't block the login process
    }
  }

  async getAccountLockStatus(email: string, _ipAddress?: string): Promise<AccountLockStatus> {
    try {
      const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MINUTES * 60 * 1000);
      
      // Get recent failed attempts for this email
      const recentFailedAttempts = await this.prisma.loginAttempt.findMany({
        where: {
          email: email.toLowerCase(),
          success: false,
          attemptedAt: { gte: windowStart },
        },
        orderBy: { attemptedAt: 'desc' },
      });

      // Check if there are too many failed attempts
      if (recentFailedAttempts.length >= this.MAX_FAILED_ATTEMPTS) {
        const latestFailedAttempt = recentFailedAttempts[0];
        const lockedUntil = new Date(
          latestFailedAttempt.attemptedAt.getTime() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
        
        const isStillLocked = new Date() < lockedUntil;
        
        return {
          isLocked: isStillLocked,
          lockedUntil: isStillLocked ? lockedUntil : undefined,
          remainingAttempts: 0,
        };
      }

      // Account is not locked, return remaining attempts
      return {
        isLocked: false,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS - recentFailedAttempts.length,
      };
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      // On error, allow the attempt (fail open for availability)
      return {
        isLocked: false,
        remainingAttempts: this.MAX_FAILED_ATTEMPTS,
      };
    }
  }

  async clearFailedAttempts(email: string): Promise<void> {
    try {
      // When user successfully logs in, clear their recent failed attempts
      const windowStart = new Date(Date.now() - this.ATTEMPT_WINDOW_MINUTES * 60 * 1000);
      
      await this.prisma.loginAttempt.deleteMany({
        where: {
          email: email.toLowerCase(),
          success: false,
          attemptedAt: { gte: windowStart },
        },
      });
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
      // Don't throw - this shouldn't block the login process
    }
  }

  async getRecentAttempts(email: string, limit: number = 10): Promise<LoginAttempt[]> {
    try {
      const attempts = await this.prisma.loginAttempt.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { attemptedAt: 'desc' },
        take: limit,
      });

      return attempts.map((attempt: any) => ({
        id: attempt.id,
        email: attempt.email,
        ipAddress: attempt.ipAddress,
        success: attempt.success,
        attemptedAt: attempt.attemptedAt,
      }));
    } catch (error) {
      console.error('Failed to get recent login attempts:', error);
      return [];
    }
  }

  // Utility method to get client IP from request
  static getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}