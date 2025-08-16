import { Entity, CreateEntityDTO, UpdateEntityDTO, EntityType } from '../../domain/models/Entity';
import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
import { PrismaClient } from '@prisma/client';

export class EntityRepository implements IEntityRepository {
  constructor(
    private db: PrismaClient
  ) {}

  async create(dto: CreateEntityDTO): Promise<Entity> {
    const result = await this.db.entity.create({
      data: {
        userId: dto.userId,
        name: dto.name,
        type: dto.type,
        value: dto.value,
        aliases: dto.aliases ? JSON.stringify(dto.aliases) : null,
        description: dto.description
      }
    });
    return this.mapToEntity(result);
  }

  async update(id: string, updates: UpdateEntityDTO): Promise<Entity> {
    const result = await this.db.entity.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.value !== undefined && { value: updates.value }),
        ...(updates.aliases !== undefined && { 
          aliases: updates.aliases ? JSON.stringify(updates.aliases) : null 
        }),
        ...(updates.description !== undefined && { description: updates.description })
      }
    });
    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.entity.delete({
      where: { id }
    });
  }

  async findById(id: string): Promise<Entity | null> {
    const result = await this.db.entity.findUnique({
      where: { id }
    });
    return result ? this.mapToEntity(result) : null;
  }

  async findByUserId(userId: string): Promise<Entity[]> {
    const results = await this.db.entity.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    return results.map(r => this.mapToEntity(r));
  }

  async findByProject(projectId: string): Promise<Entity[]> {
    const results = await this.db.projectEntity.findMany({
      where: { projectId },
      include: { entity: true },
      orderBy: { entity: { name: 'asc' } }
    });
    return results.map(r => this.mapToEntity(r.entity));
  }

  async searchByName(userId: string, query: string): Promise<Entity[]> {
    const results = await this.db.entity.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query } },
          { value: { contains: query } },
          { description: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' }
    });
    return results.map(r => this.mapToEntity(r));
  }

  async addToProject(entityId: string, projectId: string): Promise<void> {
    await this.db.projectEntity.create({
      data: {
        entityId,
        projectId
      }
    });
  }

  async removeFromProject(entityId: string, projectId: string): Promise<void> {
    await this.db.projectEntity.delete({
      where: {
        projectId_entityId: {
          projectId,
          entityId
        }
      }
    });
  }

  private mapToEntity(dbEntity: any): Entity {
    return {
      id: dbEntity.id,
      userId: dbEntity.userId,
      name: dbEntity.name,
      type: dbEntity.type as EntityType,
      value: dbEntity.value,
      aliases: dbEntity.aliases ? JSON.parse(dbEntity.aliases) : undefined,
      description: dbEntity.description || undefined,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt
    };
  }
}