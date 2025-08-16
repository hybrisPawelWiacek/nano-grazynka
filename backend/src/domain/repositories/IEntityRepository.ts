import { Entity, CreateEntityDTO, UpdateEntityDTO } from '../entities/Entity';

export interface IEntityRepository {
  create(entity: CreateEntityDTO): Promise<Entity>;
  update(id: string, updates: UpdateEntityDTO): Promise<Entity>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Entity | null>;
  findByUserId(userId: string): Promise<Entity[]>;
  findByProject(projectId: string): Promise<Entity[]>;
  searchByName(userId: string, query: string): Promise<Entity[]>;
  addToProject(entityId: string, projectId: string): Promise<void>;
  removeFromProject(entityId: string, projectId: string): Promise<void>;
}