import { FastifyInstance } from 'fastify';
import { Container } from '../container';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  const container = Container.getInstance();

  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            database: { type: 'string' },
            observability: {
              type: 'object',
              properties: {
                langsmith: { type: 'boolean' },
                openllmetry: { type: 'boolean' }
              }
            },
            config: {
              type: 'object',
              properties: {
                transcriptionProvider: { type: 'string' },
                summarizationModel: { type: 'string' },
                uploadDir: { type: 'string' },
                maxFileSize: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const config = container.getConfig();
    const prisma = container.getPrisma();
    const observability = container.getObservability();
    
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      request.log.error('Database health check failed:', error);
    }

    return reply.send({
      status: 'healthy',
      version: '1.0.1',  // Testing hot reload
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      observability: {
        langsmith: observability.getProviders().some(p => p.constructor.name === 'LangSmithObservabilityProvider'),
        openllmetry: observability.getProviders().some(p => p.constructor.name === 'OpenLLMetryObservabilityProvider')
      },
      config: {
        transcriptionProvider: config.get('transcription.provider'),
        summarizationModel: config.get('summarization.model'),
        uploadDir: config.get('storage.uploadDir'),
        maxFileSize: 10485760 // 10MB default
      }
    });
  });

  fastify.get('/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'boolean' },
                storage: { type: 'boolean' },
                config: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const config = container.getConfig();
    const prisma = container.getPrisma();
    
    const checks = {
      database: false,
      storage: false,
      config: false
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      request.log.error('Database readiness check failed:', error);
    }

    try {
      const fs = await import('fs/promises');
      const uploadDir = config.get('storage.uploadDir');
      await fs.access(uploadDir);
      checks.storage = true;
    } catch (error) {
      request.log.error('Storage readiness check failed:', error);
    }

    try {
      config.get('server.port');
      checks.config = true;
    } catch (error) {
      request.log.error('Config readiness check failed:', error);
    }

    const ready = Object.values(checks).every(check => check);
    
    return reply
      .status(ready ? 200 : 503)
      .send({ ready, checks });
  });
}