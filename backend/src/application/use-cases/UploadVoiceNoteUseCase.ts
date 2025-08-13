import { UseCase } from '../base/UseCase';
import { Result, ValidationError } from '../base/Result';
import { VoiceNote } from '../../domain/entities/VoiceNote';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { StorageService } from '../../domain/services/StorageService';
import { EventStore } from '../../domain/repositories/EventStore';
import { Language } from '../../domain/value-objects/Language';
import { Config } from '../../config/schema';
import * as path from 'path';

export interface UploadVoiceNoteInput {
  userId?: string;  // Made optional for anonymous users
  sessionId?: string;  // For anonymous users
  file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
  userPrompt?: string;
  whisperPrompt?: string;  // GPT-4o transcription hints
  transcriptionModel?: string;  // Model selection
  geminiSystemPrompt?: string;  // Gemini system prompt
  geminiUserPrompt?: string;  // Gemini user context
  tags?: string[];
  language?: 'EN' | 'PL';
}

export interface UploadVoiceNoteOutput {
  voiceNoteId: string;
  title: string;
  status: string;
}

export class UploadVoiceNoteUseCase extends UseCase<
  UploadVoiceNoteInput,
  Result<UploadVoiceNoteOutput>
> {
  private readonly SUPPORTED_MIME_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/ogg',
    'audio/webm'
  ];

  private readonly SUPPORTED_EXTENSIONS = [
    '.mp3',
    '.m4a',
    '.aac',
    '.wav',
    '.flac',
    '.ogg',
    '.webm'
  ];

  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository,
    private readonly storageService: StorageService,
    private readonly eventStore: EventStore,
    private readonly config: any  // ConfigLoader instance
  ) {
    super();
  }

  async execute(input: UploadVoiceNoteInput): Promise<Result<UploadVoiceNoteOutput>> {
    try {
      // Validate file
      const validationResult = this.validateFile(input.file);
      if (!validationResult.success) {
        return validationResult;
      }

      // Save file to storage
      const storagePath = await this.storageService.save(
        input.file.buffer,
        input.file.originalName,
        input.userId || input.sessionId || 'anonymous'
      );

      // Extract title from filename
      const title = this.extractTitleFromFilename(input.file.originalName);

      // Create voice note entity
      const voiceNote = VoiceNote.create({
        userId: input.userId,
        sessionId: input.sessionId,
        title,
        originalFilePath: storagePath,
        fileSize: input.file.size,
        mimeType: input.file.mimeType,
        language: input.language ? Language.fromString(input.language) : Language.EN,
        tags: input.tags || [],
        userPrompt: input.userPrompt,
        whisperPrompt: input.whisperPrompt,
        transcriptionModel: input.transcriptionModel,
        geminiSystemPrompt: input.geminiSystemPrompt,
        geminiUserPrompt: input.geminiUserPrompt
      });

      // Save to repository
      await this.voiceNoteRepository.save(voiceNote);

      // Save domain events
      const events = voiceNote.getDomainEvents();
      for (const event of events) {
        await this.eventStore.save(event);
      }

      // Clear events after saving
      voiceNote.clearDomainEvents();

      return {
        success: true,
        data: {
          voiceNoteId: voiceNote.getId().getValue(),
          title: voiceNote.getTitle(),
          status: voiceNote.getStatus().getValue()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }

  private validateFile(file: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  }): Result<void> {
    // Check file extension
    const extension = path.extname(file.originalName).toLowerCase();
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        success: false,
        error: new ValidationError(
          `Unsupported file extension: ${extension}. Supported formats: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
        )
      };
    }

    // Check MIME type
    if (!this.SUPPORTED_MIME_TYPES.includes(file.mimeType)) {
      return {
        success: false,
        error: new ValidationError(
          `Unsupported file type: ${file.mimeType}. Supported types: mp3, m4a, wav, flac, ogg`
        )
      };
    }

    // Check file size
    const maxSizeMB = this.config.transcription?.maxFileSizeMB || 25;
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: new ValidationError(
          `File size exceeds maximum allowed size of ${maxSizeMB}MB`
        )
      };
    }

    // Check if buffer is not empty
    if (!file.buffer || file.buffer.length === 0) {
      return {
        success: false,
        error: new ValidationError('File is empty')
      };
    }

    return { success: true, data: undefined };
  }

  private extractTitleFromFilename(filename: string): string {
    // Remove extension and clean up the filename to use as title
    const nameWithoutExt = path.basename(filename, path.extname(filename));
    // Replace underscores and dashes with spaces, capitalize words
    return nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }
}