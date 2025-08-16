import { injectable, inject } from 'tsyringe';
import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { IEntityRepository } from '../../../domain/repositories/IEntityRepository';

interface ManageProjectEntitiesInput {
  projectId: string;
  userId: string;
  action: 'add' | 'remove';
  entityIds: string[];
}

interface ManageProjectEntitiesOutput {
  success: boolean;
  data?: {
    message: string;
    affectedCount: number;
  };
  error?: Error;
}

@injectable()
export class ManageProjectEntitiesUseCase {
  constructor(
    @inject('IProjectRepository') private projectRepository: IProjectRepository,
    @inject('IEntityRepository') private entityRepository: IEntityRepository
  ) {}

  async execute(input: ManageProjectEntitiesInput): Promise<ManageProjectEntitiesOutput> {
    try {
      // Validate input
      if (!input.projectId || !input.userId || !input.entityIds || input.entityIds.length === 0) {
        throw new Error('Project ID, user ID, and entity IDs are required');
      }

      // Find project and verify ownership
      const project = await this.projectRepository.findById(input.projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      if (project.userId !== input.userId) {
        throw new Error('Unauthorized: You can only manage entities in your own projects');
      }

      // Verify all entities exist and belong to the user
      for (const entityId of input.entityIds) {
        const entity = await this.entityRepository.findById(entityId);
        if (!entity) {
          throw new Error(`Entity ${entityId} not found`);
        }
        if (entity.userId !== input.userId) {
          throw new Error(`Unauthorized: Entity ${entityId} does not belong to you`);
        }
      }

      // Perform action
      let affectedCount = 0;
      if (input.action === 'add') {
        for (const entityId of input.entityIds) {
          try {
            await this.projectRepository.addEntity(input.projectId, entityId);
            affectedCount++;
          } catch (error) {
            // Skip if already exists (unique constraint)
            console.log(`Entity ${entityId} already in project ${input.projectId}`);
          }
        }
      } else if (input.action === 'remove') {
        for (const entityId of input.entityIds) {
          await this.projectRepository.removeEntity(input.projectId, entityId);
          affectedCount++;
        }
      }

      const actionVerb = input.action === 'add' ? 'added to' : 'removed from';
      return {
        success: true,
        data: {
          message: `${affectedCount} entities ${actionVerb} project`,
          affectedCount
        }
      };
    } catch (error) {
      console.error('[ManageProjectEntitiesUseCase] Error managing project entities:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}