import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { Container } from '../container';
import { Language } from '../../../domain/value-objects/Language';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { createOptionalAuthMiddleware } from '../middleware/optionalAuth';
import { createUsageLimitMiddleware } from '../middleware/usageLimit';
import { createAnonymousUsageLimitMiddleware } from '../middleware/anonymousUsageLimit';
import { createRateLimitMiddleware } from '../middleware/rateLimit';
import { UserEntity } from '../../../domain/entities/User';
import { JwtService } from '../../../infrastructure/auth/JwtService';

declare module 'fastify' {
  interface FastifyInstance {
    container: Container;
  }
}

export async function voiceNoteRoutes(fastify: FastifyInstance) {
  console.log('voiceNoteRoutes: fastify.container =', !!fastify.container);
  const container = fastify.container || Container.getInstance();
  console.log('voiceNoteRoutes: container =', !!container);
  
  // Create middleware instances
  const jwtService = new JwtService();
  const authMiddleware = createAuthenticateMiddleware(jwtService, container.getUserRepository());
  const optionalAuthMiddleware = createOptionalAuthMiddleware(jwtService, container.getUserRepository());
  const usageLimitMiddleware = createUsageLimitMiddleware(container.getUserRepository());
  const anonymousUsageLimitMiddleware = createAnonymousUsageLimitMiddleware();
  const rateLimitMiddleware = createRateLimitMiddleware();

  // Upload voice note (supports both authenticated and anonymous users)
  fastify.post('/api/voice-notes', 
    { 
      preHandler: [optionalAuthMiddleware, rateLimitMiddleware, usageLimitMiddleware] 
    }, 
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
    try {
      const parts = request.parts();
      let fileData: { buffer: Buffer; filename: string; mimetype: string } | null = null;
      const fields: any = {};
      
      for await (const part of parts) {
        if (part.file) {
          // MUST consume the file stream for the iterator to proceed
          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          fileData = {
            buffer,
            filename: part.filename,
            mimetype: part.mimetype
          };
        } else {
          // Regular field
          fields[part.fieldname] = part.value;
        }
      }
      
      if (!fileData) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Get user or sessionId
      const user = request.user;
      const sessionId = fields.sessionId;
      let anonymousSession = (request as any).anonymousSession;
      
      // Must have either user or sessionId
      if (!user && !sessionId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Session ID required for anonymous uploads'
        });
      }
      
      // Check anonymous session limits if no authenticated user
      if (!user && sessionId) {
        console.log('Checking anonymous session, sessionId:', sessionId);
        console.log('Container exists:', !!container);
        console.log('Container type:', typeof container);
        console.log('Container.getPrisma exists:', typeof container?.getPrisma);
        
        let prisma;
        try {
          prisma = container.getPrisma();
          console.log('Prisma instance retrieved:', !!prisma);
          console.log('Prisma type:', typeof prisma);
          console.log('Prisma has anonymousSession:', !!prisma?.anonymousSession);
          console.log('Prisma constructor name:', prisma?.constructor?.name);
        } catch (err) {
          console.error('Error calling getPrisma:', err);
          throw err;
        }
        
        const ANONYMOUS_USAGE_LIMIT = 5;
        
        try {
          // Check if session exists
          anonymousSession = await prisma.anonymousSession.findUnique({
            where: { sessionId }
          });

          if (!anonymousSession) {
            // Create new session
            anonymousSession = await prisma.anonymousSession.create({
              data: {
                sessionId,
                usageCount: 0
              }
            });
          }

          // Check usage limit
          if (anonymousSession.usageCount >= ANONYMOUS_USAGE_LIMIT) {
            return reply.status(403).send({ 
              error: 'Usage Limit Exceeded',
              message: 'Anonymous usage limit reached. Please sign up to continue.',
              usageCount: anonymousSession.usageCount,
              limit: ANONYMOUS_USAGE_LIMIT
            });
          }
        } catch (error) {
          console.error('Error checking anonymous usage:', error);
          return reply.status(500).send({ 
            error: 'Internal Server Error',
            message: 'Failed to check usage limits' 
          });
        }
      }

      // Validate file type
      const allowedMimeTypes = [
        'audio/mp4',
        'audio/m4a',
        'audio/x-m4a',  // Some systems report m4a files with this MIME type
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/webm',
        'audio/ogg'
      ];
      
      if (!allowedMimeTypes.includes(fileData.mimetype)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        });
      }

      const useCase = container.getUploadVoiceNoteUseCase();
      const result = await useCase.execute({
        file: {
          buffer: fileData.buffer,
          mimeType: fileData.mimetype,
          originalName: fileData.filename,
          size: fileData.buffer.length
        },
        userPrompt: fields.customPrompt || fields.userPrompt,  // Support both field names for compatibility
        tags: fields.tags ? fields.tags.split(',') : undefined,
        userId: user?.id,  // Optional for authenticated users
        sessionId: !user ? sessionId : undefined,  // Only for anonymous users
        language: fields.language === 'AUTO' ? undefined : fields.language as 'EN' | 'PL' | undefined
      });

      if (!result.success) {
        throw result.error;
      }
      
      // Increment usage count after successful upload
      if (user) {
        // Increment authenticated user's credits
        const userRepository = container.getUserRepository();
        await userRepository.incrementCredits(user.id!);
      } else if (anonymousSession) {
        // Increment anonymous session usage count
        const prisma = container.getPrisma();
        await prisma.anonymousSession.update({
          where: { id: anonymousSession.id },
          data: { 
            usageCount: { increment: 1 },
            lastUsedAt: new Date()
          }
        });
      }

      // Fetch the created voice note to return full object
      const getUseCase = container.getGetVoiceNoteUseCase();
      const voiceNoteResult = await getUseCase.execute({
        voiceNoteId: result.data!.voiceNoteId,
        includeTranscription: false,
        includeSummary: false
      });

      if (!voiceNoteResult.success) {
        throw voiceNoteResult.error;
      }

      return reply.status(201).send({
        voiceNote: voiceNoteResult.data,
        message: 'Voice note uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Return 400 for validation errors
      if (error.message?.includes('validation') || 
          error.message?.includes('invalid') || 
          error.message?.includes('required')) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: error.message || 'Validation failed'
        });
      }
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: error.message || 'Upload failed'
      });
    }
  });

  // Process voice note
  fastify.post('/api/voice-notes/:id/process', async (request: any, reply: any) => {
    const useCase = container.getProcessVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      language: request.body?.language
    });

    if (!result.success) {
      throw result.error;
    }

    // Fetch the voice note to return full object
    const getUseCase = container.getGetVoiceNoteUseCase();
    const voiceNoteResult = await getUseCase.execute({
      voiceNoteId: request.params.id,
      includeTranscription: true,
      includeSummary: true
    });

    if (!voiceNoteResult.success) {
      throw voiceNoteResult.error;
    }

    return reply.send({
      voiceNote: voiceNoteResult.data,
      transcription: voiceNoteResult.data?.transcription,
      summary: voiceNoteResult.data?.summary,
      message: 'Voice note processing started'
    });
  });

  // Get voice note by ID (protected route with rate limiting)
  fastify.get('/api/voice-notes/:id', 
    { preHandler: [authMiddleware, rateLimitMiddleware] },
    async (request: any, reply: any) => {
    const useCase = container.getGetVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      includeTranscription: request.query?.includeTranscription === 'true',
      includeSummary: request.query?.includeSummary === 'true'
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.send(result.data);
  });

  // List voice notes (protected route with rate limiting)
  fastify.get('/api/voice-notes', 
    { preHandler: [authMiddleware, rateLimitMiddleware] },
    async (request: FastifyRequest & { user?: UserEntity }, reply: FastifyReply) => {
    const useCase = container.getListVoiceNotesUseCase();
    const query = (request as any).query || {};
    const user = request.user;
    
    const result = await useCase.execute({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      filter: {
        search: query.search,
        status: query.status,
        language: query.language,
        tags: query.tags ? query.tags.split(',') : undefined,
        startDate: query.fromDate ? new Date(query.fromDate) : undefined,
        endDate: query.toDate ? new Date(query.toDate) : undefined,
        projects: query.projects ? query.projects.split(',') : undefined
      },
      userId: user?.id || 'default-user', // Use authenticated user's ID
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc'
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.send(result.data);
  });

  // Delete voice note (protected route)
  fastify.delete('/api/voice-notes/:id', 
    { preHandler: [authMiddleware] },
    async (request: any, reply: any) => {
    const useCase = container.getDeleteVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      deleteAudioFile: request.query?.keepAudioFile !== 'true'
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.status(204).send();
  });

  // Reprocess voice note
  fastify.post('/api/voice-notes/:id/reprocess', async (request: any, reply: any) => {
    const useCase = container.getReprocessVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      systemPrompt: request.body?.systemPrompt,
      userPrompt: request.body?.userPrompt,
      model: request.body?.model,
      language: request.body?.language ? Language[request.body.language] : undefined
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.send({
      id: result.data?.voiceNoteId,
      status: result.data?.status,
      message: 'Voice note reprocessing started'
    });
  });

  // Export voice note
  fastify.get('/api/voice-notes/:id/export', async (request: any, reply: any) => {
    const useCase = container.getExportVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      format: request.query?.format || 'markdown'
    });

    if (!result.success) {
      throw result.error;
    }

    const format = request.query?.format || 'markdown';
    const contentType = format === 'json' ? 'application/json' : 'text/markdown';
    const extension = format === 'json' ? 'json' : 'md';
    
    return reply
      .header('Content-Type', contentType)
      .header('Content-Disposition', `attachment; filename="voice-note-${request.params.id}.${extension}"`)
      .send(result.data?.content);
  });

  // Search voice notes
  fastify.get('/api/voice-notes/search', async (request: any, reply: any) => {
    const useCase = container.getListVoiceNotesUseCase();
    const query = request.query || {};
    
    const result = await useCase.execute({
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      filter: {
        search: query.q || query.query,
        status: query.status,
        language: query.language,
        tags: query.tags ? query.tags.split(',') : undefined,
        projects: query.projects ? query.projects.split(',') : undefined
      },
      userId: query.userId || 'default-user',
      sortBy: query.sortBy || 'relevance',
      sortOrder: query.sortOrder || 'desc'
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.send(result.data);
  });
}