import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';

interface DeleteProjectInput {
  projectId: string;
  userId: string;
}

interface DeleteProjectOutput {
  success: boolean;
  error?: Error;
}

export class DeleteProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  async execute(input: DeleteProjectInput): Promise<DeleteProjectOutput> {
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
        throw new Error('Unauthorized: You can only delete your own projects');
      }

      // Delete project (cascade will handle ProjectEntity and ProjectNote relations)
      await this.projectRepository.delete(input.projectId);

      return {
        success: true
      };
    } catch (error) {
      console.error('[DeleteProjectUseCase] Error deleting project:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}