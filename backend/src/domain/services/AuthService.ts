import { UserEntity } from '../entities/User';
import { UserRepository } from '../../infrastructure/persistence/UserRepositoryImpl';
import { PasswordService } from '../../infrastructure/auth/PasswordService';
import { JwtService, JwtPayload } from '../../infrastructure/auth/JwtService';

export interface LoginResult {
  user: UserEntity;
  token: string;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService
  ) {}

  async register(email: string, password: string): Promise<LoginResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate password
    const passwordValidation = UserEntity.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(password);

    // Create user entity
    const newUser = UserEntity.create({
      email,
      tier: 'free',
      creditsUsed: 0,
      creditsResetDate: new Date(),
      lastLoginAt: new Date(),
    });

    // Save to database
    const savedUser = await this.userRepository.create(newUser, passwordHash);

    // Generate JWT
    const token = this.jwtService.sign({
      userId: savedUser.id!,
      email: savedUser.email,
      tier: savedUser.tier,
    });

    return { user: savedUser, token };
  }

  async login(email: string, password: string): Promise<LoginResult> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Get user data to access passwordHash
    const userData = user.toJSON();
    if (!userData.passwordHash) {
      throw new Error('Invalid user data');
    }

    // Verify password
    const isValidPassword = await this.passwordService.verify(password, userData.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    const updatedUser = user.updateLastLogin();
    await this.userRepository.update(updatedUser);

    // Generate JWT
    const token = this.jwtService.sign({
      userId: updatedUser.id!,
      email: updatedUser.email,
      tier: updatedUser.tier,
    });

    return { user: updatedUser, token };
  }

  async validateToken(token: string): Promise<UserEntity | null> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findById(payload.userId);
      return user;
    } catch {
      return null;
    }
  }

  async getUserFromToken(token: string): Promise<UserEntity | null> {
    try {
      const payload = this.jwtService.verify(token);
      return await this.userRepository.findById(payload.userId);
    } catch {
      return null;
    }
  }
}