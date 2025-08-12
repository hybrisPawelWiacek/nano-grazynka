import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { Container } from '../container';
import { Language } from '../../../domain/value-objects/Language';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { createUsageLimitMiddleware } from '../middleware/usageLimit';
import { createRateLimitMiddleware } from '../middleware/rateLimit';
import { UserEntity } from '../../../domain/entities/User';
import { JwtService } from '../../../infrastructure/auth/JwtService';

export async function voiceNoteRoutes(fastify: FastifyInstance) {
  const container = Container.getInstance();
  
  // Create middleware instances
  const jwtService = new JwtService();
  const authMiddleware = createAuthenticateMiddleware(jwtService, container.getUserRepository());
  const usageLimitMiddleware = createUsageLimitMiddleware(container.getUserRepository());
  const rateLimitMiddleware = createRateLimitMiddleware();

  // Upload voice note (protected route with usage limits and rate limiting)
  fastify.post('/api/voice-notes', 
    { 
      preHandler: [authMiddleware, rateLimitMiddleware, usageLimitMiddleware] 
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

      // Get authenticated user
      const user = request.user;
      if (!user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
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
        userId: user.id!, // Use authenticated user's ID
        language: fields.language as 'EN' | 'PL' | undefined
      });

      if (!result.success) {
        throw result.error;
      }
      
      // Increment user's credits after successful upload
      const userRepository = container.getUserRepository();
      await userRepository.incrementCredits(user.id!);

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