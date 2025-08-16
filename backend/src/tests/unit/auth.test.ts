import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserEntity } from '../../domain/entities/User';
import { AuthService } from '../../domain/services/AuthService';
import { JwtService } from '../../infrastructure/auth/JwtService';
import { PasswordService } from '../../infrastructure/auth/PasswordService';
import bcrypt from 'bcrypt';
import { createId } from '@paralleldrive/cuid2';

describe('Authentication Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let passwordService: PasswordService;
  let jwtService: JwtService;

  beforeEach(() => {
    // Mock repositories
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn()
    };

    passwordService = new PasswordService();
    jwtService = new JwtService();
    authService = new AuthService(mockUserRepository, passwordService, jwtService);
  });

  describe('User Registration', () => {
    it('should register a new user with free tier', async () => {
      const email = 'test@example.com';
      const password = 'Password123!';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(
        UserEntity.create({
          email,
          tier: 'free',
          creditsUsed: 0,
          creditsResetDate: new Date()
        })
      );

      const result = await authService.register(email, password);

      expect(result.user.email).toBe(email);
      expect(result.user.tier).toBe('free');
      expect(result.token).toBeDefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should fail registration if user already exists', async () => {
      const email = 'existing@example.com';
      const password = 'Password123!';

      mockUserRepository.findByEmail.mockResolvedValue(
        UserEntity.create({ email, tier: 'free', creditsUsed: 0, creditsResetDate: new Date() })
      );

      await expect(authService.register(email, password)).rejects.toThrow('already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      const email = 'test@example.com';
      const weakPassword = '123';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.register(email, weakPassword)).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('User Login', () => {
    it('should login user and create session', async () => {
      const email = 'user@example.com';
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = UserEntity.fromPersistence({
        id: createId(),
        email,
        passwordHash: hashedPassword,
        tier: 'free',
        creditsUsed: 0,
        creditsResetDate: new Date(),
        createdAt: new Date(),
        lastLoginAt: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser.updateLastLogin());

      const result = await authService.login(email, password);

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
    });

    it('should fail login with incorrect password', async () => {
      const email = 'user@example.com';
      const password = 'WrongPassword';
      const hashedPassword = await bcrypt.hash('CorrectPassword', 10);

      const mockUser = UserEntity.fromPersistence({
        id: createId(),
        email,
        passwordHash: hashedPassword,
        tier: 'free',
        creditsUsed: 0,
        creditsResetDate: new Date(),
        createdAt: new Date(),
        lastLoginAt: null
      });

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login(email, password)).rejects.toThrow('Invalid email or password');
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('JWT Service', () => {
    it('should generate and verify JWT tokens', () => {
      const payload = { userId: createId(), email: 'test@example.com', tier: 'free' };
      
      const token = jwtService.sign(payload);
      expect(token).toBeDefined();
      
      const decoded = jwtService.verify(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => jwtService.verify(invalidToken)).toThrow();
    });
  });

  describe('User Entity', () => {
    it('should track credit usage correctly', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        tier: 'free',
        creditsUsed: 3,
        creditsResetDate: new Date()
      });

      expect(user.hasCreditsAvailable).toBe(true);
      expect(user.creditLimit).toBe(5);
      expect(user.remainingCredits).toBe(2);

      // Use up remaining credits
      const updatedUser = user.incrementCreditsUsed().incrementCreditsUsed();
      expect(updatedUser.hasCreditsAvailable).toBe(false);
      expect(updatedUser.creditsUsed).toBe(5);
    });

    it('should handle tier-based credit limits', () => {
      const freeUser = UserEntity.create({
        email: 'free@example.com',
        tier: 'free',
        creditsUsed: 0,
        creditsResetDate: new Date()
      });

      const proUser = UserEntity.create({
        email: 'pro@example.com',
        tier: 'pro',
        creditsUsed: 0,
        creditsResetDate: new Date()
      });

      const businessUser = UserEntity.create({
        email: 'business@example.com',
        tier: 'business',
        creditsUsed: 0,
        creditsResetDate: new Date()
      });

      expect(freeUser.creditLimit).toBe(5);
      expect(proUser.creditLimit).toBe(999999);
      expect(businessUser.creditLimit).toBe(999999);
    });

    it('should check if credits need reset', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const user = UserEntity.create({
        email: 'test@example.com',
        tier: 'free',
        creditsUsed: 5,
        creditsResetDate: lastMonth
      });

      expect(user.shouldResetCredits()).toBe(true);

      const recentUser = UserEntity.create({
        email: 'test2@example.com',
        tier: 'free',
        creditsUsed: 5,
        creditsResetDate: new Date()
      });

      expect(recentUser.shouldResetCredits()).toBe(false);
    });
  });
});