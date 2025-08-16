import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Container } from '../container';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { UserEntity } from '../../../domain/entities/User';

export async function projectRoutes(fastify: FastifyInstance) {
  const container = fastify.container || Container.getInstance();
  
  // Create middleware instance
  const jwtService = new JwtService();
  const authMiddleware = createAuthenticateMiddleware(jwtService, container.getUserRepository());

  // Create project
  fastify.post('/api/projects',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const body = request.body as {
          name: string;
          description?: string;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getCreateProjectUseCase();
        const result = await useCase.execute({
          userId: request.user.id!,
          name: body.name,
          description: body.description
        });

        if (!result.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: result.error?.message || 'Failed to create project'
          });
        }

        return reply.status(201).send({
          project: result.data?.project,
          message: 'Project created successfully'
        });
      } catch (error: any) {
        console.error('Create project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to create project'
        });
      }
    }
  );

  // List projects
  fastify.get('/api/projects',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const query = request.query as {
          includeInactive?: string;
          page?: string;
          limit?: string;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getListProjectsUseCase();
        const result = await useCase.execute({
          userId: request.user.id!,
          includeInactive: query.includeInactive === 'true',
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined
        });

        if (!result.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: result.error?.message || 'Failed to list projects'
          });
        }

        return reply.send({
          projects: result.data?.projects || [],
          pagination: result.data?.pagination
        });
      } catch (error: any) {
        console.error('List projects error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to list projects'
        });
      }
    }
  );

  // Get project by ID
  fastify.get('/api/projects/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const projectRepository = container.getProjectRepository();
        const project = await projectRepository.findById(params.id);

        if (!project) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Project not found'
          });
        }

        // Check ownership
        if (project.userId !== request.user.id) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied'
          });
        }

        return reply.send({ project });
      } catch (error: any) {
        console.error('Get project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to get project'
        });
      }
    }
  );

  // Update project
  fastify.put('/api/projects/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = request.body as {
          name?: string;
          description?: string;
          isActive?: boolean;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getUpdateProjectUseCase();
        const result = await useCase.execute({
          projectId: params.id,
          userId: request.user.id!,
          name: body.name,
          description: body.description,
          isActive: body.isActive
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to update project'
          });
        }

        return reply.send({
          project: result.data?.project,
          message: 'Project updated successfully'
        });
      } catch (error: any) {
        console.error('Update project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to update project'
        });
      }
    }
  );

  // Delete project
  fastify.delete('/api/projects/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getDeleteProjectUseCase();
        const result = await useCase.execute({
          projectId: params.id,
          userId: request.user.id!
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to delete project'
          });
        }

        return reply.status(204).send();
      } catch (error: any) {
        console.error('Delete project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to delete project'
        });
      }
    }
  );

  // Add entities to project
  fastify.post('/api/projects/:id/entities',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = request.body as { entityIds: string[] };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        if (!body.entityIds || !Array.isArray(body.entityIds) || body.entityIds.length === 0) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'entityIds array is required'
          });
        }

        const useCase = container.getManageProjectEntitiesUseCase();
        const result = await useCase.execute({
          projectId: params.id,
          userId: request.user.id!,
          action: 'add',
          entityIds: body.entityIds
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to add entities to project'
          });
        }

        return reply.send({
          message: result.data?.message,
          affectedCount: result.data?.affectedCount
        });
      } catch (error: any) {
        console.error('Add entities to project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to add entities to project'
        });
      }
    }
  );

  // Remove entities from project
  fastify.delete('/api/projects/:id/entities',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = request.body as { entityIds: string[] };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        if (!body.entityIds || !Array.isArray(body.entityIds) || body.entityIds.length === 0) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'entityIds array is required'
          });
        }

        const useCase = container.getManageProjectEntitiesUseCase();
        const result = await useCase.execute({
          projectId: params.id,
          userId: request.user.id!,
          action: 'remove',
          entityIds: body.entityIds
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to remove entities from project'
          });
        }

        return reply.send({
          message: result.data?.message,
          affectedCount: result.data?.affectedCount
        });
      } catch (error: any) {
        console.error('Remove entities from project error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to remove entities from project'
        });
      }
    }
  );

  // Get project entities
  fastify.get('/api/projects/:id/entities',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        // Verify project ownership
        const projectRepository = container.getProjectRepository();
        const project = await projectRepository.findById(params.id);

        if (!project) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Project not found'
          });
        }

        if (project.userId !== request.user.id) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied'
          });
        }

        // Get entities for the project
        const entityRepository = container.getEntityRepository();
        const entities = await entityRepository.findByProject(params.id);

        return reply.send({ entities });
      } catch (error: any) {
        console.error('Get project entities error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to get project entities'
        });
      }
    }
  );
}