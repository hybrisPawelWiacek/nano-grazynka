import { injectable, inject } from 'tsyringe';
import { IProjectRepository } from '../../../domain/repositories/IProjectRepository';
import { Project } from '../../../domain/entities/Project';

interface ListProjectsInput {
  userId: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

interface ListProjectsOutput {
  success: boolean;
  data?: {
    projects: Project[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: Error;
}

@injectable()
export class ListProjectsUseCase {
  constructor(
    @inject('IProjectRepository') private projectRepository: IProjectRepository
  ) {}

  async execute(input: ListProjectsInput): Promise<ListProjectsOutput> {
    try {
      // Validate input
      if (!input.userId) {
        throw new Error('User ID is required');
      }

      const page = input.page || 1;
      const limit = input.limit || 20;

      // Get all user's projects
      let projects = await this.projectRepository.findByUserId(input.userId);

      // Filter out inactive projects unless specifically requested
      if (!input.includeInactive) {
        projects = projects.filter(project => project.isActive);
      }

      // Calculate pagination
      const total = projects.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Apply pagination
      const paginatedProjects = projects.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          projects: paginatedProjects,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('[ListProjectsUseCase] Error listing projects:', error);
      return {
        success: false,
        error: error as Error
      };
    }
  }
}