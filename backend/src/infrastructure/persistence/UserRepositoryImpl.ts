import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../../domain/entities/User';

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(user: UserEntity, passwordHash: string): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  incrementCredits(userId: string): Promise<UserEntity>;
  resetCredits(userId: string): Promise<UserEntity>;
  updateTier(userId: string, tier: string): Promise<UserEntity>;
}

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;
    return this.toDomainEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;
    return this.toDomainEntity(user);
  }

  async create(user: UserEntity, passwordHash: string): Promise<UserEntity> {
    const userData = user.toJSON();
    const created = await this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        tier: userData.tier,
        creditsUsed: userData.creditsUsed,
        creditsResetDate: userData.creditsResetDate,
      },
    });

    return this.toDomainEntity(created);
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const userData = user.toJSON();
    if (!userData.id) {
      throw new Error('Cannot update user without ID');
    }

    const updated = await this.prisma.user.update({
      where: { id: userData.id },
      data: {
        tier: userData.tier,
        creditsUsed: userData.creditsUsed,
        creditsResetDate: userData.creditsResetDate,
        lastLoginAt: userData.lastLoginAt,
      },
    });

    return this.toDomainEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async incrementCredits(userId: string): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsed: { increment: 1 },
      },
    });

    return this.toDomainEntity(updated);
  }

  async resetCredits(userId: string): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        creditsUsed: 0,
        creditsResetDate: new Date(),
      },
    });

    return this.toDomainEntity(updated);
  }

  async updateTier(userId: string, tier: string): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        tier,
        // Reset credits when upgrading
        creditsUsed: 0,
        creditsResetDate: new Date()
      }
    });

    return this.toDomainEntity(updated);
  }

  private toDomainEntity(user: PrismaUser): UserEntity {
    return UserEntity.fromPersistence({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      tier: user.tier as 'free' | 'pro' | 'business',
      creditsUsed: user.creditsUsed,
      creditsResetDate: user.creditsResetDate,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  }
}