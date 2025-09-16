import { z } from 'zod';

export const UserTier = z.enum(['free', 'pro', 'business']);
export type UserTier = z.infer<typeof UserTier>;

export const UserSchema = z.object({
  id: z.string().optional(),  // Remove cuid validation for now - accept any string ID
  email: z.string().email(),
  passwordHash: z.string().optional(),
  tier: UserTier.default('free'),
  creditsUsed: z.number().int().min(0).default(0),
  creditsResetDate: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
  lastLoginAt: z.date().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

export class UserEntity {
  private constructor(private readonly data: User) {}

  static create(data: Omit<User, 'id' | 'createdAt'>): UserEntity {
    const validatedData = UserSchema.parse({
      ...data,
      id: undefined,
      createdAt: new Date(),
    });
    return new UserEntity(validatedData);
  }

  static fromPersistence(data: User): UserEntity {
    const validatedData = UserSchema.parse(data);
    return new UserEntity(validatedData);
  }

  get id(): string | undefined {
    return this.data.id;
  }

  get email(): string {
    return this.data.email;
  }

  get tier(): UserTier {
    return this.data.tier;
  }

  get creditsUsed(): number {
    return this.data.creditsUsed;
  }

  get creditsResetDate(): Date {
    return this.data.creditsResetDate;
  }

  get isFreeTier(): boolean {
    return this.data.tier === 'free';
  }

  get creditLimit(): number {
    switch (this.data.tier) {
      case 'free':
        return 5;
      case 'pro':
        return 999999; // Unlimited for practical purposes
      case 'business':
        return 999999;
      default:
        return 5;
    }
  }

  get hasCreditsAvailable(): boolean {
    return this.data.creditsUsed < this.creditLimit;
  }

  get remainingCredits(): number {
    return Math.max(0, this.creditLimit - this.data.creditsUsed);
  }

  shouldResetCredits(): boolean {
    const now = new Date();
    const resetDate = new Date(this.data.creditsResetDate);
    
    // Check if we're in a new month
    return now.getMonth() !== resetDate.getMonth() || 
           now.getFullYear() !== resetDate.getFullYear();
  }

  incrementCreditsUsed(): UserEntity {
    return new UserEntity({
      ...this.data,
      creditsUsed: this.data.creditsUsed + 1,
    });
  }

  resetCredits(): UserEntity {
    return new UserEntity({
      ...this.data,
      creditsUsed: 0,
      creditsResetDate: new Date(),
    });
  }

  upgradeTier(newTier: UserTier): UserEntity {
    return new UserEntity({
      ...this.data,
      tier: newTier,
    });
  }

  updateLastLogin(): UserEntity {
    return new UserEntity({
      ...this.data,
      lastLoginAt: new Date(),
    });
  }

  toJSON(): User {
    return { ...this.data };
  }

  // Password validation rules (enhanced for better security)
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be no more than 128 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty123', 
      'admin123', 'welcome123', 'Password1', 'Password123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    }
    
    // Check for sequential characters (like 123456 or abcdef)
    const hasSequential = /(?:012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password);
    if (hasSequential) {
      errors.push('Password should not contain sequential characters');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}