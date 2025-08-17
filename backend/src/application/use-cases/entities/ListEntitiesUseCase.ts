import { IEntityRepository } from '../../../domain/repositories/IEntityRepository';
import { Entity } from '../../../domain/entities/Entity';

interface ListEntitiesInput {
  userId: string;
  projectId?: string;
  search?: string;
  type?: 'person' | 'company' | 'technical' | 'product';
  page?: number;
  limit?: number;
}

interface ListEntitiesOutput {
  success: boolean;
  data?: {
    entities: Entity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: Error;
}

export class ListEntitiesUseCase {
  constructor(
    private entityRepository: IEntityRepository
  ) {}

  async execute(input: ListEntitiesInput): Promise<ListEntitiesOutput> {
    try {
      // Validate input
      if (!input.userId) {
        throw new Error('User ID is required');
      }

      const page = input.page || 1;
      const limit = input.limit || 20;

      let entities: Entity[];
      
      // Get entities based on filters
      if (input.projectId) {
        // Get entities for a specific project
        entities = await this.entityRepository.findByProject(input.projectId);
      } else if (input.search) {
        // Search entities by name
        entities = await this.entityRepository.searchByName(input.userId, input.search);
      } else {
        // Get all user's entities
        entities = await this.entityRepository.findByUserId(input.userId);
      }

      // Filter by type if provided
      if (input.type) {
        entities = entities.filter(entity => entity.type === input.type);
      }

      // Calculate pagination
      const total = entities.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Apply pagination
      const paginatedEntities = entities.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          entities: paginatedEntities,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('[ListEntitiesUseCase] Error listing entities:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}