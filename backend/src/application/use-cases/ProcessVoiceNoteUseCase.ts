import { UseCase } from '../base/UseCase';
import { Result, NotFoundError, ProcessingError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { ProcessingOrchestrator } from '../services/ProcessingOrchestrator';

export interface ProcessVoiceNoteInput {
  voiceNoteId: string;
  userPrompt?: string;
}

export interface ProcessVoiceNoteOutput {
  voiceNoteId: string;
  status: string;
  transcriptionId?: string;
  summaryId?: string;
}

export class ProcessVoiceNoteUseCase extends UseCase<
  ProcessVoiceNoteInput,
  Result<ProcessVoiceNoteOutput>
> {
  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository,
    private readonly processingOrchestrator: ProcessingOrchestrator
  ) {
    super();
  }

  async execute(input: ProcessVoiceNoteInput): Promise<Result<ProcessVoiceNoteOutput>> {
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

      // Check if already processing
      if (voiceNote.getStatus().getValue() === 'processing') {
        return {
          success: false,
          error: new ProcessingError('Voice note is already being processed')
        };
      }

      // Process the voice note
      const result = await this.processingOrchestrator.processVoiceNote(
        voiceNote,
        input.userPrompt
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || new ProcessingError('Processing failed')
        };
      }

      return {
        success: true,
        data: {
          voiceNoteId: voiceNote.getId().getValue(),
          status: voiceNote.getStatus().getValue(),
          transcriptionId: result.transcription?.getId(),
          summaryId: result.summary?.getId()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new ProcessingError('Unknown error occurred')
      };
    }
  }
}