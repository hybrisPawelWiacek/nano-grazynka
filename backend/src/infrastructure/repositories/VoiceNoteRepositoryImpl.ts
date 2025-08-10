import { prisma } from '../database/client';
import { VoiceNoteRepository, VoiceNoteFilter, PaginationOptions, PaginatedResult } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNote } from '../../domain/entities/VoiceNote';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { Language } from '../../domain/value-objects/Language';
import { ProcessingStatus } from '../../domain/value-objects/ProcessingStatus';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';
import { Prisma } from '@prisma/client';

export class VoiceNoteRepositoryImpl implements VoiceNoteRepository {
  async save(voiceNote: VoiceNote): Promise<void> {
    const data = this.toPrismaModel(voiceNote);
    
    await prisma.$transaction(async (tx) => {
      await tx.voiceNote.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      if (voiceNote.getTranscription()) {
        const transcription = voiceNote.getTranscription()!;
        await tx.transcription.upsert({
          where: { voiceNoteId: data.id! },
          create: {
            voiceNote: { connect: { id: data.id! } },
            text: transcription.getText(),
            language: transcription.getLanguage().getValue(),
            duration: transcription.getDuration(),
            confidence: transcription.getConfidence(),
            timestamp: transcription.getTimestamp(),
          },
          update: {
            text: transcription.getText(),
            language: transcription.getLanguage().getValue(),
            duration: transcription.getDuration(),
            confidence: transcription.getConfidence(),
            timestamp: transcription.getTimestamp(),
          },
        });
      }

      if (voiceNote.getSummary()) {
        const summary = voiceNote.getSummary()!;
        // Get the transcription ID
        const transcription = await tx.transcription.findUnique({
          where: { voiceNoteId: data.id }
        });
        
        if (transcription) {
          await tx.summary.upsert({
            where: { voiceNoteId: data.id! },
            create: {
              voiceNote: { connect: { id: data.id! } },
              transcription: { connect: { id: transcription.id } },
              summary: summary.getSummary(),
              keyPoints: JSON.stringify(summary.getKeyPoints()),
              actionItems: JSON.stringify(summary.getActionItems()),
              language: summary.getLanguage().getValue(),
              timestamp: summary.getTimestamp(),
            },
            update: {
              summary: summary.getSummary(),
              keyPoints: JSON.stringify(summary.getKeyPoints()),
              actionItems: JSON.stringify(summary.getActionItems()),
              language: summary.getLanguage().getValue(),
              timestamp: summary.getTimestamp(),
            },
          });
        }
      }
    });
  }

  async findById(id: VoiceNoteId): Promise<VoiceNote | null> {
    const result = await prisma.voiceNote.findUnique({
      where: { id: id.getValue() },
      include: {
        transcriptions: true,
        summaries: true,
      },
    });

    return result ? this.toDomainModel(result) : null;
  }

  async findByUserId(
    userId: string,
    pagination: PaginationOptions,
    filter?: VoiceNoteFilter
  ): Promise<PaginatedResult<VoiceNote>> {
    const where: Prisma.VoiceNoteWhereInput = {
      userId,
      ...(filter?.status && { status: filter.status.getValue() }),
      ...(filter?.language && { language: filter.language.getValue() }),
    };

    const skip = (pagination.page - 1) * pagination.pageSize;
    const orderByField = pagination.sortBy === 'uploadedAt' ? 'createdAt' : 
                        pagination.sortBy === 'processedAt' ? 'updatedAt' : 
                        'createdAt';

    const [items, total] = await prisma.$transaction([
      prisma.voiceNote.findMany({
        where,
        include: {
          transcriptions: true,
          summaries: true,
        },
        take: pagination.pageSize,
        skip,
        orderBy: {
          [orderByField]: pagination.sortOrder || 'desc',
        },
      }),
      prisma.voiceNote.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDomainModel(item)),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async delete(id: VoiceNoteId): Promise<void> {
    await prisma.voiceNote.delete({
      where: { id: id.getValue() },
    });
  }

  async search(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ items: VoiceNote[]; total: number }> {
    const where: Prisma.VoiceNoteWhereInput = {
      userId,
      OR: [
        { title: { contains: query } },
        { transcriptions: { some: { text: { contains: query } } } },
        { summaries: { some: { summary: { contains: query } } } },
        { tags: { contains: query } },
      ],
    };

    const [items, total] = await prisma.$transaction([
      prisma.voiceNote.findMany({
        where,
        include: {
          transcriptions: true,
          summaries: true,
        },
        take: options?.limit || 10,
        skip: options?.offset || 0,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.voiceNote.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDomainModel(item)),
      total,
    };
  }

  private toPrismaModel(voiceNote: VoiceNote): Prisma.VoiceNoteCreateInput {
    return {
      id: voiceNote.getId().getValue(),
      userId: voiceNote.getUserId(),
      title: voiceNote.getTitle(),
      originalFilePath: voiceNote.getOriginalFilePath(),
      fileSize: voiceNote.getFileSize(),
      mimeType: voiceNote.getMimeType(),
      language: voiceNote.getLanguage().getValue(),
      status: voiceNote.getStatus().getValue(),
      tags: JSON.stringify(voiceNote.getTags()),
      errorMessage: voiceNote.getErrorMessage(),
      createdAt: voiceNote.getCreatedAt(),
      updatedAt: voiceNote.getUpdatedAt(),
      version: voiceNote.getVersion(),
    };
  }

  private toDomainModel(data: any): VoiceNote {
    const voiceNote = VoiceNote.reconstitute(
      VoiceNoteId.fromString(data.id),
      data.userId,
      data.title,
      data.originalFilePath,
      data.fileSize,
      data.mimeType,
      Language.fromString(data.language),
      ProcessingStatus.fromString(data.status),
      JSON.parse(data.tags || '[]'),
      data.errorMessage,
      data.createdAt,
      data.updatedAt,
      data.version
    );

    if (data.transcriptions && data.transcriptions.length > 0) {
      const trans = data.transcriptions[0];
      const transcription = Transcription.create(
        trans.text,
        Language.fromString(trans.language),
        trans.duration,
        trans.confidence,
        trans.timestamp
      );
      voiceNote.addTranscription(transcription);
    }

    if (data.summaries && data.summaries.length > 0) {
      const sum = data.summaries[0];
      const summary = Summary.create(
        sum.summary,
        JSON.parse(sum.keyPoints || '[]'),
        JSON.parse(sum.actionItems || '[]'),
        Language.fromString(sum.language),
        sum.timestamp
      );
      voiceNote.addSummary(summary);
    }

    return voiceNote;
  }

  async findByFileHash(_userId: string, _fileHash: string): Promise<VoiceNote | null> {
    // Since we don't have fileHash in our schema, return null for now
    // This would need to be implemented properly when fileHash is added
    return null;
  }

  async findPendingForProcessing(limit: number): Promise<VoiceNote[]> {
    const results = await prisma.voiceNote.findMany({
      where: {
        status: ProcessingStatus.PENDING.getValue(),
      },
      include: {
        transcriptions: true,
        summaries: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return results.map((result) => this.toDomainModel(result));
  }

  async exists(id: VoiceNoteId): Promise<boolean> {
    const count = await prisma.voiceNote.count({
      where: { id: id.getValue() },
    });
    return count > 0;
  }
}