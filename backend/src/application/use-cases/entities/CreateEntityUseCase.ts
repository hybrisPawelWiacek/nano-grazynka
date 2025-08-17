import { IEntityRepository } from '../../../domain/repositories/IEntityRepository';
import { Entity } from '../../../domain/entities/Entity';

interface CreateEntityInput {
  userId: string;
  name: string;
  type: 'person' | 'company' | 'technical' | 'product';
  value: string;
  aliases?: string[];
  description?: string;
}

interface CreateEntityOutput {
  success: boolean;
  data?: {
    entity: Entity;
  };
  error?: Error;
}

export class CreateEntityUseCase {
  constructor(
    private entityRepository: IEntityRepository
  ) {}

  async execute(input: CreateEntityInput): Promise<CreateEntityOutput> {
    try {
      // Validate input
      if (!input.name || !input.type || !input.value || !input.userId) {
        throw new Error('Missing required fields: name, type, value, and userId are required');
      }

      // Validate type
      const validTypes = ['person', 'company', 'technical', 'product'];
      if (!validTypes.includes(input.type)) {
        throw new Error(`Invalid entity type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Save to repository
      const savedEntity = await this.entityRepository.create({
        userId: input.userId,
        name: input.name,
        type: input.type,
        value: input.value,
        aliases: input.aliases,
        description: input.description
      });

      return {
        success: true,
        data: {
          entity: savedEntity
        }
      };
    } catch (error) {
      console.error('[CreateEntityUseCase] Error creating entity:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}