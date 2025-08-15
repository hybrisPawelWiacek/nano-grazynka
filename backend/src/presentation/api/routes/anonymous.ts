import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { Container } from '../container';

export async function anonymousRoutes(fastify: FastifyInstance) {
  // Get anonymous session usage info
  fastify.get('/api/anonymous/usage/:sessionId', async (request: FastifyRequest<{
    Params: { sessionId: string }
  }>, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params;

      if (!sessionId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Session ID is required'
        });
      }

      // Get or create session
      let session = await prisma.anonymousSession.findUnique({
        where: { sessionId }
      });

      if (!session) {
        // Create new session with 0 usage
        session = await prisma.anonymousSession.create({
          data: {
            sessionId,
            usageCount: 0
          }
        });
      }

      // Return usage info
      return reply.send({
        sessionId: session.sessionId,
        usageCount: session.usageCount,
        limit: 5,
        remaining: Math.max(0, 5 - session.usageCount),
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt
      });
    } catch (error) {
      console.error('Error getting anonymous usage:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get usage information'
      });
    }
  });

  // Get voice notes for anonymous session
  fastify.get('/api/anonymous/voice-notes/:sessionId', async (request: FastifyRequest<{
    Params: { sessionId: string },
    Querystring: { 
      page?: string, 
      limit?: string,
      includeTranscription?: string,
      includeSummary?: string
    }
  }>, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params;
      const page = parseInt(request.query.page || '1');
      const limit = parseInt(request.query.limit || '10');
      const includeTranscription = request.query.includeTranscription === 'true';
      const includeSummary = request.query.includeSummary === 'true';

      if (!sessionId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Session ID is required'
        });
      }

      // Check if session exists
      const session = await prisma.anonymousSession.findUnique({
        where: { sessionId }
      });

      if (!session) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Session not found'
        });
      }

      // Get voice notes for this session
      const offset = (page - 1) * limit;
      const voiceNotes = await prisma.voiceNote.findMany({
        where: { sessionId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transcriptions: includeTranscription,
          summaries: includeSummary
        }
      });

      // Get total count
      const total = await prisma.voiceNote.count({
        where: { sessionId }
      });

      return reply.send({
        data: voiceNotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting anonymous voice notes:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get voice notes'
      });
    }
  });

  // Migrate anonymous session to user account
  fastify.post('/api/anonymous/migrate', {
    schema: {
      body: {
        type: 'object',
        required: ['sessionId', 'userId'],
        properties: {
          sessionId: { type: 'string' },
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            migrated: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Body: { sessionId: string; userId: string }
  }>, reply: FastifyReply) => {
    try {
      const { sessionId, userId } = request.body;

      // Get the use case from container
      const container = Container.getInstance();
      const migrateUseCase = container.getMigrateAnonymousToUserUseCase();

      // Execute migration
      const result = await migrateUseCase.execute({ sessionId, userId });

      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Session not found') {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Session not found'
          });
        }
        if (error.message === 'User not found') {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found'
          });
        }
      }
      
      console.error('Migration error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to migrate session'
      });
    }
  });
}
