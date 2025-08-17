import { IEntityRepository } from '../../../domain/repositories/IEntityRepository';
import { Entity } from '../../../domain/entities/Entity';

interface UpdateEntityInput {
  entityId: string;
  userId: string;
  name?: string;
  type?: 'person' | 'company' | 'technical' | 'product';
  value?: string;
  aliases?: string[];
  description?: string;
}

interface UpdateEntityOutput {
  success: boolean;
  data?: {
    entity: Entity;
  };
  error?: Error;
}

export class UpdateEntityUseCase {
  constructor(
    private entityRepository: IEntityRepository
  ) {}

  async execute(input: UpdateEntityInput): Promise<UpdateEntityOutput> {
    try {
      // Validate input
      if (!input.entityId || !input.userId) {
        throw new Error('Entity ID and user ID are required');
      }

      // Find existing entity
      const existingEntity = await this.entityRepository.findById(input.entityId);
      if (!existingEntity) {
        throw new Error('Entity not found');
      }

      // Check ownership
      if (existingEntity.userId !== input.userId) {
        throw new Error('Unauthorized: You can only update your own entities');
      }

      // Validate type if provided
      if (input.type) {
        const validTypes = ['person', 'company', 'technical', 'product'];
        if (!validTypes.includes(input.type)) {
          throw new Error(`Invalid entity type. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      // Prepare update object (only include provided fields)
      const updates: Partial<Entity> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.type !== undefined) updates.type = input.type;
      if (input.value !== undefined) updates.value = input.value;
      if (input.aliases !== undefined) updates.aliases = input.aliases;
      if (input.description !== undefined) updates.description = input.description;

      // Update entity
      const updatedEntity = await this.entityRepository.update(input.entityId, updates);

      return {
        success: true,
        data: {
          entity: updatedEntity
        }
      };
    } catch (error) {
      console.error('[UpdateEntityUseCase] Error updating entity:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}