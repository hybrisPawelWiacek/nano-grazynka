import { IEntityRepository } from '../../../domain/repositories/IEntityRepository';

interface DeleteEntityInput {
  entityId: string;
  userId: string;
}

interface DeleteEntityOutput {
  success: boolean;
  error?: Error;
}

export class DeleteEntityUseCase {
  constructor(
    private entityRepository: IEntityRepository
  ) {}

  async execute(input: DeleteEntityInput): Promise<DeleteEntityOutput> {
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
        throw new Error('Unauthorized: You can only delete your own entities');
      }

      // Delete entity (cascade will handle ProjectEntity and EntityUsage relations)
      await this.entityRepository.delete(input.entityId);

      return {
        success: true
      };
    } catch (error) {
      console.error('[DeleteEntityUseCase] Error deleting entity:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}