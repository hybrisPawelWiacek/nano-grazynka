import { injectable, inject } from 'tsyringe';
import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { Project } from '../../../domain/entities/Project';

interface UpdateProjectInput {
  projectId: string;
  userId: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateProjectOutput {
  success: boolean;
  data?: {
    project: Project;
  };
  error?: Error;
}

@injectable()
export class UpdateProjectUseCase {
  constructor(
    @inject('IProjectRepository') private projectRepository: IProjectRepository
  ) {}

  async execute(input: UpdateProjectInput): Promise<UpdateProjectOutput> {
    try {
      // Validate input
      if (!input.projectId || !input.userId) {
        throw new Error('Project ID and user ID are required');
      }

      // Find existing project
      const existingProject = await this.projectRepository.findById(input.projectId);
      if (!existingProject) {
        throw new Error('Project not found');
      }

      // Check ownership
      if (existingProject.userId !== input.userId) {
        throw new Error('Unauthorized: You can only update your own projects');
      }

      // Prepare update object (only include provided fields)
      const updates: Partial<Project> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      // Update project
      const updatedProject = await this.projectRepository.update(input.projectId, updates);

      return {
        success: true,
        data: {
          project: updatedProject
        }
      };
    } catch (error) {
      console.error('[UpdateProjectUseCase] Error updating project:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}