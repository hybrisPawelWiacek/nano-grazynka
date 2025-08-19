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
        transcriptionProvider: (config as any).transcription?.provider,
        summarizationModel: (config as any).summarization?.model,
        uploadDir: (config as any).storage?.uploadDir,
        maxFileSize: 10485760 // 10MB default
      }
    });
  });

  // Metrics endpoint for Prometheus
  fastify.get('/metrics', {
    schema: {
      description: 'Prometheus metrics endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'string'
        }
      }
    }
  }, async (request, reply) => {
    const container = Container.getInstance();
    const prisma = container.getPrisma();
    
    // Collect metrics
    const metrics = [];
    
    // System metrics
    metrics.push(`# HELP nano_grazynka_up Whether the application is up`);
    metrics.push(`# TYPE nano_grazynka_up gauge`);
    metrics.push(`nano_grazynka_up 1`);
    
    metrics.push(`# HELP nano_grazynka_uptime_seconds Application uptime in seconds`);
    metrics.push(`# TYPE nano_grazynka_uptime_seconds gauge`);
    metrics.push(`nano_grazynka_uptime_seconds ${process.uptime()}`);
    
    // Memory metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP nano_grazynka_memory_heap_used_bytes Heap memory used in bytes`);
    metrics.push(`# TYPE nano_grazynka_memory_heap_used_bytes gauge`);
    metrics.push(`nano_grazynka_memory_heap_used_bytes ${memUsage.heapUsed}`);
    
    metrics.push(`# HELP nano_grazynka_memory_heap_total_bytes Total heap memory in bytes`);
    metrics.push(`# TYPE nano_grazynka_memory_heap_total_bytes gauge`);
    metrics.push(`nano_grazynka_memory_heap_total_bytes ${memUsage.heapTotal}`);
    
    // Business metrics
    try {
      const voiceNoteCount = await prisma.voiceNote.count();
      metrics.push(`# HELP nano_grazynka_voice_notes_total Total number of voice notes`);
      metrics.push(`# TYPE nano_grazynka_voice_notes_total gauge`);
      metrics.push(`nano_grazynka_voice_notes_total ${voiceNoteCount}`);
      
      const processingCount = await prisma.voiceNote.count({
        where: { status: 'processing' }
      });
      metrics.push(`# HELP nano_grazynka_voice_notes_processing Number of voice notes currently processing`);
      metrics.push(`# TYPE nano_grazynka_voice_notes_processing gauge`);
      metrics.push(`nano_grazynka_voice_notes_processing ${processingCount}`);
      
      const completedCount = await prisma.voiceNote.count({
        where: { status: 'completed' }
      });
      metrics.push(`# HELP nano_grazynka_voice_notes_completed Number of completed voice notes`);
      metrics.push(`# TYPE nano_grazynka_voice_notes_completed gauge`);
      metrics.push(`nano_grazynka_voice_notes_completed ${completedCount}`);
      
      const failedCount = await prisma.voiceNote.count({
        where: { status: 'failed' }
      });
      metrics.push(`# HELP nano_grazynka_voice_notes_failed Number of failed voice notes`);
      metrics.push(`# TYPE nano_grazynka_voice_notes_failed gauge`);
      metrics.push(`nano_grazynka_voice_notes_failed ${failedCount}`);
    } catch (error) {
      request.log.error('Failed to collect business metrics:', error);
    }
    
    return reply
      .type('text/plain')
      .send(metrics.join('\n'));
  });
}