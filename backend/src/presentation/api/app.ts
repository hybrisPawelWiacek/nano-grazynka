import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Container } from './container';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { voiceNoteRoutes } from './routes/voiceNotes';

export async function createApp(): Promise<FastifyInstance> {
  const container = Container.getInstance();
  const config = container.getConfig();

  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    },
    requestIdHeader: 'x-trace-id',
    requestIdLogLabel: 'traceId',
    genReqId: (req) => {
      return req.headers['x-trace-id'] as string || 
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 1
    }
  });

  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    skipOnError: true,
    keyGenerator: (req) => {
      return req.headers['x-forwarded-for'] as string || 
        req.socket.remoteAddress || 
        'global';
    }
  });

  fastify.setErrorHandler(errorHandler);

  fastify.addHook('onRequest', async (request: any, reply) => {
    request.startTime = Date.now();
    request.log.info({
      method: request.method,
      url: request.url,
      headers: request.headers,
      traceId: request.id
    });
  });

  fastify.addHook('onResponse', async (request: any, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: Date.now() - request.startTime,
      traceId: request.id
    });
  });

  await fastify.register(healthRoutes);
  await fastify.register(voiceNoteRoutes);

  fastify.get('/', async (request, reply) => {
    return {
      name: 'nano-Grazynka API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        ready: '/ready',
        api: '/api/voice-notes'
      }
    };
  });

  return fastify;
}