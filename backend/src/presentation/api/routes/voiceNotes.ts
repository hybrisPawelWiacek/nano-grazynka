import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { Container } from '../container';
import { Language } from '../../../domain/value-objects/Language';

export async function voiceNoteRoutes(fastify: FastifyInstance): Promise<void> {
  const container = Container.getInstance();

  // Upload voice note
  fastify.post('/api/voice-notes', async (request: FastifyRequest, reply: FastifyReply) => {
    const parts = request.parts();
    let file: MultipartFile | null = null;
    const fields: any = {};
    
    for await (const part of parts) {
      if (part.type === 'file') {
        file = part as MultipartFile;
      } else if (part.type === 'field') {
        const fieldPart = part as any;
        fields[fieldPart.fieldname] = fieldPart.value;
      }
    }
    
    if (!file) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'No file uploaded'
      });
    }
    
    const buffer = await file.toBuffer();

    const useCase = container.getUploadVoiceNoteUseCase();
    const result = await useCase.execute({
      file: {
        buffer,
        mimeType: file.mimetype,
        originalName: file.filename,
        size: buffer.length
      },
      userPrompt: fields.userPrompt,
      tags: fields.tags ? fields.tags.split(',') : undefined,
      userId: fields.userId || 'default-user',
      language: fields.language as 'EN' | 'PL' | undefined
    });

    if (!result.success) {
      throw result.error;
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
  });

  // Process voice note
  fastify.post('/api/voice-notes/:id/process', async (request: any, reply: any) => {
    const useCase = container.getProcessVoiceNoteUseCase();
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      language: request.body?.language ? Language[request.body.language] : undefined
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
      transcription: voiceNoteResult.data?.transcriptions?.[0],
      summary: voiceNoteResult.data?.summaries?.[0],
      message: 'Voice note processing started'
    });
  });

  // Get voice note by ID
  fastify.get('/api/voice-notes/:id', async (request: any, reply: any) => {
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

  // List voice notes
  fastify.get('/api/voice-notes', async (request: any, reply: any) => {
    const useCase = container.getListVoiceNotesUseCase();
    const query = request.query || {};
    
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
      userId: query.userId,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc'
    });

    if (!result.success) {
      throw result.error;
    }

    return reply.send(result.data);
  });

  // Delete voice note
  fastify.delete('/api/voice-notes/:id', async (request: any, reply: any) => {
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
    const query = request.query || {};
    
    const result = await useCase.execute({
      voiceNoteId: request.params.id,
      format: query.format || 'markdown',
      includeTranscription: query.includeTranscription !== 'false',
      includeSummary: query.includeSummary !== 'false',
      includeMetadata: query.includeMetadata !== 'false'
    });

    if (!result.success) {
      throw result.error;
    }

    const contentType = query.format === 'json' 
      ? 'application/json' 
      : 'text/markdown; charset=utf-8';
    
    const filename = `voice-note-${request.params.id}.${query.format === 'json' ? 'json' : 'md'}`;
    
    return reply
      .header('Content-Type', contentType)
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(result.data?.content);
  });
}