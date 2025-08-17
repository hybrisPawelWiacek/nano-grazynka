import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { Project } from '../../../domain/entities/Project';

interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
}

interface CreateProjectOutput {
  success: boolean;
  data?: {
    project: Project;
  };
  error?: Error;
}

export class CreateProjectUseCase {
  constructor(
    private projectRepository: IProjectRepository
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    try {
      // Validate input
      if (!input.name || !input.userId) {
        throw new Error('Missing required fields: name and userId are required');
      }

      // Save to repository
      const savedProject = await this.projectRepository.create({
        userId: input.userId,
        name: input.name,
        description: input.description,
        isActive: true
      });

      return {
        success: true,
        data: {
          project: savedProject
        }
      };
    } catch (error) {
      console.error('[CreateProjectUseCase] Error creating project:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}