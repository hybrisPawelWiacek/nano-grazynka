import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Container } from '../container';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { JwtService } from '../../../infrastructure/auth/JwtService';
import { UserEntity } from '../../../domain/entities/User';

export async function entityRoutes(fastify: FastifyInstance) {
  const container = fastify.container || Container.getInstance();
  
  // Create middleware instance
  const jwtService = new JwtService();
  const authMiddleware = createAuthenticateMiddleware(jwtService, container.getUserRepository());

  // Create entity
  fastify.post('/api/entities',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const body = request.body as {
          name: string;
          type: 'person' | 'company' | 'technical' | 'product';
          value: string;
          aliases?: string[];
          description?: string;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getCreateEntityUseCase();
        const result = await useCase.execute({
          userId: request.user.id!,
          name: body.name,
          type: body.type,
          value: body.value,
          aliases: body.aliases,
          description: body.description
        });

        if (!result.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: result.error?.message || 'Failed to create entity'
          });
        }

        return reply.status(201).send({
          entity: result.data?.entity,
          message: 'Entity created successfully'
        });
      } catch (error: any) {
        console.error('Create entity error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to create entity'
        });
      }
    }
  );

  // List entities
  fastify.get('/api/entities',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const query = request.query as {
          projectId?: string;
          search?: string;
          type?: 'person' | 'company' | 'technical' | 'product';
          page?: string;
          limit?: string;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getListEntitiesUseCase();
        const result = await useCase.execute({
          userId: request.user.id!,
          projectId: query.projectId,
          search: query.search,
          type: query.type,
          page: query.page ? parseInt(query.page) : undefined,
          limit: query.limit ? parseInt(query.limit) : undefined
        });

        if (!result.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: result.error?.message || 'Failed to list entities'
          });
        }

        return reply.send({
          entities: result.data?.entities || [],
          pagination: result.data?.pagination
        });
      } catch (error: any) {
        console.error('List entities error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to list entities'
        });
      }
    }
  );

  // Get entity by ID
  fastify.get('/api/entities/:id',
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

        const entityRepository = container.getEntityRepository();
        const entity = await entityRepository.findById(params.id);

        if (!entity) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Entity not found'
          });
        }

        // Check ownership
        if (entity.userId !== request.user.id) {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Access denied'
          });
        }

        return reply.send({ entity });
      } catch (error: any) {
        console.error('Get entity error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to get entity'
        });
      }
    }
  );

  // Update entity
  fastify.put('/api/entities/:id',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = request.body as {
          name?: string;
          type?: 'person' | 'company' | 'technical' | 'product';
          value?: string;
          aliases?: string[];
          description?: string;
        };

        if (!request.user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        const useCase = container.getUpdateEntityUseCase();
        const result = await useCase.execute({
          entityId: params.id,
          userId: request.user.id!,
          name: body.name,
          type: body.type,
          value: body.value,
          aliases: body.aliases,
          description: body.description
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to update entity'
          });
        }

        return reply.send({
          entity: result.data?.entity,
          message: 'Entity updated successfully'
        });
      } catch (error: any) {
        console.error('Update entity error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to update entity'
        });
      }
    }
  );

  // Delete entity
  fastify.delete('/api/entities/:id',
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

        const useCase = container.getDeleteEntityUseCase();
        const result = await useCase.execute({
          entityId: params.id,
          userId: request.user.id!
        });

        if (!result.success) {
          const statusCode = result.error?.message.includes('not found') ? 404 :
                           result.error?.message.includes('Unauthorized') ? 403 : 400;
          return reply.status(statusCode).send({
            error: statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request',
            message: result.error?.message || 'Failed to delete entity'
          });
        }

        return reply.status(204).send();
      } catch (error: any) {
        console.error('Delete entity error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message || 'Failed to delete entity'
        });
      }
    }
  );
}