import { UseCase } from '../base/UseCase';
import { Result } from '../base/Result';
import { VoiceNoteRepository, VoiceNoteFilter } from '../../domain/repositories/VoiceNoteRepository';

export interface ListVoiceNotesInput {
  userId?: string;
  page?: number;
  limit?: number;
  filter?: {
    status?: string;
    language?: string;
    tags?: string[];
    search?: string;
    startDate?: Date;
    endDate?: Date;
    projects?: string[];
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ListVoiceNotesOutput {
  items: Array<{
    id: string;
    userId: string;
    title: string;
    fileSize: number;
    mimeType: string;
    language: string;
    status: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    hasSummary: boolean;
    hasTranscription: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ListVoiceNotesUseCase extends UseCase<
  ListVoiceNotesInput,
  Result<ListVoiceNotesOutput>
> {
  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository
  ) {
    super();
  }

  async execute(input: ListVoiceNotesInput): Promise<Result<ListVoiceNotesOutput>> {
    try {
      const page = input.page || 1;
      const limit = input.limit || 20;

      // Build filter
      const filter: VoiceNoteFilter = {
        userId: input.userId,
        status: input.filter?.status,
        language: input.filter?.language,
        tags: input.filter?.tags,
        search: input.filter?.search,
        startDate: input.filter?.startDate,
        endDate: input.filter?.endDate
      };

      // Get paginated results
      const result = await this.voiceNoteRepository.findByUserId(
        input.userId || '',
        {
          page,
          pageSize: limit,
          sortBy: (input.sortBy as any) || 'uploadedAt',
          sortOrder: (input.sortOrder as 'asc' | 'desc') || 'desc'
        },
        filter
      );

      // Map voice notes to output format
      const items = result.items.map(voiceNote => ({
        id: voiceNote.getId().toString(),
        userId: voiceNote.getUserId(),
        title: voiceNote.getTitle(),
        fileSize: voiceNote.getFileSize(),
        mimeType: voiceNote.getMimeType(),
        language: voiceNote.getLanguage().getValue(),
        status: voiceNote.getStatus().getValue(),
        tags: voiceNote.getTags(),
        createdAt: voiceNote.getCreatedAt(),
        updatedAt: voiceNote.getUpdatedAt(),
        hasSummary: !!voiceNote.getSummary(),
        hasTranscription: !!voiceNote.getTranscription()
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(result.total / limit);

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
}