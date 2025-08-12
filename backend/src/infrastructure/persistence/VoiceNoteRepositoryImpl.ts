import { PrismaClient } from '@prisma/client';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNote } from '../../domain/entities/VoiceNote';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { Language } from '../../domain/value-objects/Language';
import { ProcessingStatus } from '../../domain/value-objects/ProcessingStatus';

export class VoiceNoteRepositoryImpl implements VoiceNoteRepository {
  constructor(private prisma: PrismaClient) {}

  async save(voiceNote: VoiceNote): Promise<void> {
    const data = this.toDatabase(voiceNote);
    
    await this.prisma.$transaction(async (tx) => {
      // Separate userId from other fields for Prisma relations
      const { userId, ...voiceNoteFields } = data;
      
      // Build the create/update data with proper relation handling
      const createData = {
        ...voiceNoteFields,
        ...(userId ? { user: { connect: { id: userId } } } : {})
      };
      
      const updateData = {
        ...voiceNoteFields,
        ...(userId ? { user: { connect: { id: userId } } } : {})
      };
      
      await tx.voiceNote.upsert({
        where: { id: data.id },
        create: createData,
        update: updateData
      });

      if (voiceNote.getTranscription()) {
        const transcription = voiceNote.getTranscription()!;
        await tx.transcription.upsert({
          where: { voiceNoteId: data.id },
          create: {
            voiceNoteId: data.id,
            text: transcription.getText(),
            language: transcription.getLanguage().toString(),
            confidence: transcription.getConfidence() || 0,
            duration: transcription.getDuration() || 0,
            wordCount: transcription.getWordCount(),
            timestamp: transcription.getTimestamp() || new Date()
          },
          update: {
            text: transcription.getText(),
            language: transcription.getLanguage().toString(),
            confidence: transcription.getConfidence() || 0,
            duration: transcription.getDuration() || 0,
            wordCount: transcription.getWordCount(),
            timestamp: transcription.getTimestamp() || new Date()
          }
        });
      }

      if (voiceNote.getSummary()) {
        const summary = voiceNote.getSummary()!;
        
        // Get the transcription ID from the database
        const transcription = await tx.transcription.findUnique({
          where: { voiceNoteId: data.id }
        });
        
        if (!transcription) {
          throw new Error('Cannot save summary without a transcription');
        }
        
        await tx.summary.upsert({
          where: { voiceNoteId: data.id },
          create: {
            voiceNoteId: data.id,
            transcriptionId: transcription.id,
            summary: summary.getSummary(),
            keyPoints: JSON.stringify(summary.getKeyPoints()),
            actionItems: JSON.stringify(summary.getActionItems()),
            language: summary.getLanguage().getValue(),
            timestamp: summary.getTimestamp() || new Date()
          },
          update: {
            summary: summary.getSummary(),
            keyPoints: JSON.stringify(summary.getKeyPoints()),
            actionItems: JSON.stringify(summary.getActionItems()),
            language: summary.getLanguage().getValue(),
            timestamp: summary.getTimestamp() || new Date()
          }
        });
      }
    });
  }

  async findById(
    id: VoiceNoteId, 
    includeTranscription?: boolean, 
    includeSummary?: boolean
  ): Promise<VoiceNote | null> {
    const result = await this.prisma.voiceNote.findUnique({
      where: { id: id.toString() },
      include: {
        transcriptions: true,  // Always include transcriptions
        summaries: true        // Always include summaries
      }
    });

    if (!result) return null;
    return this.fromDatabase(result);
  }

  async findByUserId(
    userId: string,
    pagination: {
      page: number;
      pageSize: number;
      sortBy?: 'uploadedAt' | 'processedAt' | 'fileName' | 'duration';
      sortOrder?: 'asc' | 'desc';
    },
    filter?: {
      status?: ProcessingStatus;
      language?: Language;
      tags?: string[];
      searchQuery?: string;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<{ items: VoiceNote[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const where: any = { userId };
    
    if (filter) {
      if (filter.status) where.status = filter.status.toString();
      if (filter.language) where.language = filter.language.toString();
      if (filter.fromDate) where.createdAt = { gte: filter.fromDate };
      if (filter.toDate) where.createdAt = { ...where.createdAt, lte: filter.toDate };
      if (filter.searchQuery) {
        where.OR = [
          { title: { contains: filter.searchQuery } },
          { description: { contains: filter.searchQuery } }
        ];
      }
    }

    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;
    
    // Map sortBy to actual database field
    const orderByField = pagination.sortBy === 'uploadedAt' ? 'createdAt' : 
                        pagination.sortBy === 'processedAt' ? 'updatedAt' :
                        pagination.sortBy === 'fileName' ? 'originalFileName' :
                        'createdAt';
    
    const orderBy = { [orderByField]: pagination.sortOrder || 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.voiceNote.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          transcriptions: true,
          summaries: true
        }
      }),
      this.prisma.voiceNote.count({ where })
    ]);

    const voiceNotes = items.map(item => this.fromDatabase(item));
    const totalPages = Math.ceil(total / pagination.pageSize);

    return {
      items: voiceNotes,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages
    };
  }

  async findByFileHash(userId: string, fileHash: string): Promise<VoiceNote | null> {
    // Implementation for finding by file hash
    return null;
  }

  async findPendingForProcessing(limit: number): Promise<VoiceNote[]> {
    const items = await this.prisma.voiceNote.findMany({
      where: { status: ProcessingStatus.pending.toString() },
      take: limit,
      orderBy: { createdAt: 'asc' }
    });
    
    return items.map(item => this.fromDatabase(item));
  }

  async findAll(
    filters?: {
      status?: ProcessingStatus;
      userId?: string;
      tags?: string[];
      fromDate?: Date;
      toDate?: Date;
      search?: string;
    },
    pagination?: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ items: VoiceNote[]; total: number }> {
    const where: any = {};
    
    if (filters) {
      if (filters.status) where.status = filters.status.toString();
      if (filters.userId) where.userId = filters.userId;
      if (filters.fromDate) where.createdAt = { gte: filters.fromDate };
      if (filters.toDate) where.createdAt = { ...where.createdAt, lte: filters.toDate };
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } }
        ];
      }
    }

    const skip = pagination ? (pagination.page - 1) * pagination.limit : 0;
    const take = pagination?.limit || 20;
    const orderBy = pagination?.sortBy 
      ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.voiceNote.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          transcriptions: true,
          summaries: true
        }
      }),
      this.prisma.voiceNote.count({ where })
    ]);

    return {
      items: items.map(item => this.fromDatabase(item)),
      total
    };
  }

  async delete(id: VoiceNoteId): Promise<void> {
    await this.prisma.voiceNote.delete({
      where: { id: id.toString() }
    });
  }

  async exists(id: VoiceNoteId): Promise<boolean> {
    const count = await this.prisma.voiceNote.count({
      where: { id: id.toString() }
    });
    return count > 0;
  }

  private toDatabase(voiceNote: VoiceNote): any {
    return {
      id: voiceNote.getId().toString(),
      userId: voiceNote.getUserId() || null,  // Handle optional userId
      sessionId: voiceNote.getSessionId() || null,  // Add sessionId field
      title: voiceNote.getTitle(),
      originalFilePath: voiceNote.getOriginalFilePath(),
      fileSize: voiceNote.getFileSize(),
      mimeType: voiceNote.getMimeType(),
      language: voiceNote.getLanguage().toString(),
      status: voiceNote.getStatus().toString(),
      tags: JSON.stringify(voiceNote.getTags()),
      userPrompt: voiceNote.getUserPrompt() || null,
      whisperPrompt: voiceNote.getWhisperPrompt() || null,
      errorMessage: voiceNote.getErrorMessage() || null,
      createdAt: voiceNote.getCreatedAt(),
      updatedAt: voiceNote.getUpdatedAt(),
      version: voiceNote.getVersion()
    };
  }

  private fromDatabase(data: any): VoiceNote {
    const status = ProcessingStatus.fromString(data.status);
    const language = Language.fromString(data.language);
    
        const voiceNote = VoiceNote.reconstitute(
      VoiceNoteId.fromString(data.id),
      data.title,
      data.originalFilePath,
      data.fileSize,
      data.mimeType,
      language,
      status,
      JSON.parse(data.tags || '[]'),
      data.userId,
      data.sessionId,  // Add sessionId parameter
      data.errorMessage || undefined,
      data.userPrompt || undefined,  // Add userPrompt parameter
      data.whisperPrompt || undefined,  // Add whisperPrompt parameter
      data.createdAt,
      data.updatedAt,
      data.version
    );

    if (data.transcriptions && data.transcriptions.length > 0) {
      const latestTranscription = data.transcriptions[data.transcriptions.length - 1];
      const transcription = Transcription.create(
        latestTranscription.text,
        Language.fromString(latestTranscription.language),
        latestTranscription.duration || 1,  // duration is required, use 1 as default
        latestTranscription.confidence || 0.0,  // confidence defaults to 0.0
        latestTranscription.timestamp
      );
      voiceNote.addTranscription(transcription);
    }

    if (data.summaries && data.summaries.length > 0) {
      const latestSummary = data.summaries[data.summaries.length - 1];
      const summary = Summary.create(
        latestSummary.summary,
        JSON.parse(latestSummary.keyPoints || '[]'),
        JSON.parse(latestSummary.actionItems || '[]'),
        Language.fromString(latestSummary.language),
        latestSummary.timestamp
      );
      voiceNote.addSummary(summary);
    }

    return voiceNote;
  }
}