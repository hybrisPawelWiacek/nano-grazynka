import { VoiceNoteRepositoryImpl } from '../VoiceNoteRepositoryImpl';
import { VoiceNote } from '../../../domain/entities/VoiceNote';
import { VoiceNoteId } from '../../../domain/value-objects/VoiceNoteId';
import { Language } from '../../../domain/value-objects/Language';
import { ProcessingStatus } from '../../../domain/value-objects/ProcessingStatus';
import { Transcription } from '../../../domain/entities/Transcription';
import { Summary } from '../../../domain/entities/Summary';
import { prisma } from '../../database/client';

jest.mock('../../database/client', () => ({
  prisma: {
    $transaction: jest.fn(),
    voiceNote: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    transcription: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    summary: {
      upsert: jest.fn(),
    },
  },
}));

describe('VoiceNoteRepositoryImpl', () => {
  let repository: VoiceNoteRepositoryImpl;
  let mockPrisma: any;

  beforeEach(() => {
    repository = new VoiceNoteRepositoryImpl();
    mockPrisma = prisma as any;
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a voice note without transcription or summary', async () => {
      const voiceNote = VoiceNote.create(
        'user123',
        'Test Note',
        '/path/to/file.m4a',
        1024,
        'audio/m4a',
        Language.EN
      );

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      await repository.save(voiceNote);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.voiceNote.upsert).toHaveBeenCalledWith({
        where: { id: voiceNote.getId().getValue() },
        create: expect.objectContaining({
          id: voiceNote.getId().getValue(),
          userId: 'user123',
          title: 'Test Note',
          originalFilePath: '/path/to/file.m4a',
          fileSize: 1024,
          mimeType: 'audio/m4a',
          language: 'en',
          status: 'pending',
        }),
        update: expect.objectContaining({
          id: voiceNote.getId().getValue(),
        }),
      });
    });

    it('should save a voice note with transcription and summary', async () => {
      const voiceNote = VoiceNote.create(
        'user123',
        'Test Note',
        '/path/to/file.m4a',
        1024,
        'audio/m4a',
        Language.EN
      );

      const transcription = Transcription.create(
        'This is a test transcription',
        Language.EN,
        60,
        0.95
      );
      voiceNote.addTranscription(transcription);

      const summary = Summary.create(
        'Test summary',
        ['Key point 1', 'Key point 2'],
        ['Action item 1'],
        Language.EN
      );
      voiceNote.addSummary(summary);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });
      
      // Mock the transcription.findUnique for getting transcription ID
      mockPrisma.transcription.findUnique.mockResolvedValue({ id: 'trans123' });

      await repository.save(voiceNote);

      expect(mockPrisma.transcription.upsert).toHaveBeenCalled();
      expect(mockPrisma.summary.upsert).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return null when voice note not found', async () => {
      const id = VoiceNoteId.generate();
      mockPrisma.voiceNote.findUnique.mockResolvedValue(null);

      const result = await repository.findById(id);

      expect(result).toBeNull();
      expect(mockPrisma.voiceNote.findUnique).toHaveBeenCalledWith({
        where: { id: id.getValue() },
        include: {
          transcriptions: true,
          summaries: true,
        },
      });
    });

    it('should return voice note when found', async () => {
      const id = VoiceNoteId.generate();
      const dbData = {
        id: id.getValue(),
        userId: 'user123',
        title: 'Test Note',
        originalFilePath: '/path/to/file.m4a',
        fileSize: 1024,
        mimeType: 'audio/m4a',
        language: 'en',
        status: 'completed',
        tags: JSON.stringify(['test']),
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        transcriptions: [{
          text: 'Test transcription',
          language: 'en',
          duration: 60,
          confidence: 0.95,
          timestamp: new Date(),
        }],
        summaries: [{
          summary: 'Test summary',
          keyPoints: JSON.stringify(['Key point 1']),
          actionItems: JSON.stringify(['Action item 1']),
          language: 'en',
          timestamp: new Date(),
        }],
      };

      mockPrisma.voiceNote.findUnique.mockResolvedValue(dbData);

      const result = await repository.findById(id);

      expect(result).not.toBeNull();
      expect(result?.getId().getValue()).toBe(id.getValue());
      expect(result?.getTranscription()).not.toBeNull();
      expect(result?.getSummary()).not.toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return paginated results', async () => {
      const dbData = [
        {
          id: VoiceNoteId.generate().getValue(),
          userId: 'user123',
          title: 'Test Note 1',
          originalFilePath: '/path/to/file1.m4a',
          fileSize: 1024,
          mimeType: 'audio/m4a',
          language: 'en',
          status: 'completed',
          tags: JSON.stringify([]),
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          transcriptions: [],
          summaries: [],
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([dbData, 1]);

      const result = await repository.findByUserId(
        'user123',
        {
          page: 1,
          pageSize: 10,
        },
        {
          status: ProcessingStatus.COMPLETED,
        }
      );

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.voiceNote.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          status: 'completed',
        },
        include: {
          transcriptions: true,
          summaries: true,
        },
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a voice note', async () => {
      const id = VoiceNoteId.generate();

      await repository.delete(id);

      expect(mockPrisma.voiceNote.delete).toHaveBeenCalledWith({
        where: { id: id.getValue() },
      });
    });
  });

  describe('search', () => {
    it('should search across multiple fields', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await repository.search('user123', 'test query', { limit: 10, offset: 0 });

      expect(mockPrisma.voiceNote.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          OR: expect.arrayContaining([
            { title: { contains: 'test query' } },
            { transcriptions: { some: { text: { contains: 'test query' } } } },
            { summaries: { some: { summary: { contains: 'test query' } } } },
          ]),
        },
        include: {
          transcriptions: true,
          summaries: true,
        },
        take: 10,
        skip: 0,
        orderBy: { updatedAt: 'desc' },
      });
    });
  });
});