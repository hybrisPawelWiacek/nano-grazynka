import { UseCase } from '../base/UseCase';
import { Result, NotFoundError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { StorageService } from '../../domain/services/StorageService';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { Config } from '../../config/schema';

export interface DeleteVoiceNoteInput {
  voiceNoteId: string;
  deleteAudioFile?: boolean;
}

export interface DeleteVoiceNoteOutput {
  voiceNoteId: string;
  deleted: boolean;
  audioFileDeleted: boolean;
}

export class DeleteVoiceNoteUseCase extends UseCase<
  DeleteVoiceNoteInput,
  Result<DeleteVoiceNoteOutput>
> {
  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository,
    private readonly storageService: StorageService,
    private readonly config: Config
  ) {
    super();
  }

  async execute(input: DeleteVoiceNoteInput): Promise<Result<DeleteVoiceNoteOutput>> {
    try {
      // Find voice note
      const voiceNoteId = VoiceNoteId.fromString(input.voiceNoteId);
      const voiceNote = await this.voiceNoteRepository.findById(voiceNoteId);

      if (!voiceNote) {
        return {
          success: false,
          error: new NotFoundError(`Voice note with ID ${input.voiceNoteId} not found`)
        };
      }

      // Delete audio file if requested
      let audioFileDeleted = false;
      if (input.deleteAudioFile !== false && voiceNote.getOriginalFilePath()) {
        try {
          await this.storageService.deleteFile(voiceNote.getOriginalFilePath()!);
          audioFileDeleted = true;
        } catch (error) {
          // Log error but continue with deletion
          console.error('Failed to delete audio file:', error);
        }
      }

      // Delete voice note from repository (cascade deletes transcription and summary)
      await this.voiceNoteRepository.delete(voiceNoteId);

      return {
        success: true,
        data: {
          voiceNoteId: input.voiceNoteId,
          deleted: true,
          audioFileDeleted
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