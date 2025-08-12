import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ANONYMOUS_USAGE_LIMIT = 5;

/**
 * Middleware to check and enforce anonymous usage limits
 */
export function createAnonymousUsageLimitMiddleware() {
  return async function anonymousUsageLimit(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // Only apply to anonymous users
    if (request.user) {
      return; // Authenticated user, skip this middleware
    }

    // Get sessionId from request body or multipart fields
    const body = request.body as any;
    // For multipart/form-data, fastify-multipart stores parsed fields differently
    // We need to handle this in the route handler, not middleware
    const sessionId = body?.sessionId || (request as any).sessionId;

    if (!sessionId) {
      return reply.code(400).send({ 
        error: 'Bad Request',
        message: 'Session ID required for anonymous uploads' 
      });
    }

    try {
      // Check if session exists
      let session = await prisma.anonymousSession.findUnique({
        where: { sessionId }
      });

      if (!session) {
        // Create new session
        session = await prisma.anonymousSession.create({
          data: {
            sessionId,
            usageCount: 0
          }
        });
      }

      // Check usage limit
      if (session.usageCount >= ANONYMOUS_USAGE_LIMIT) {
        return reply.code(403).send({ 
          error: 'Usage Limit Exceeded',
          message: 'Anonymous usage limit reached. Please sign up to continue.',
          usageCount: session.usageCount,
          limit: ANONYMOUS_USAGE_LIMIT
        });
      }

      // Attach session to request for later use
      (request as any).anonymousSession = session;

    } catch (error) {
      console.error('Error checking anonymous usage:', error);
      return reply.code(500).send({ 
        error: 'Internal Server Error',
        message: 'Failed to check usage limits' 
      });
    }
  };
}