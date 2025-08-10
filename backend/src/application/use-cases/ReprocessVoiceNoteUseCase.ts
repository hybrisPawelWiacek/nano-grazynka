import { UseCase } from '../base/UseCase';
import { Result, NotFoundError, ValidationError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { ProcessingOrchestrator } from '../services/ProcessingOrchestrator';

export interface ReprocessVoiceNoteInput {
  voiceNoteId: string;
  newUserPrompt: string;
  systemPromptVariables?: {
    projects?: string[];
    teams?: string[];
    preferredFormat?: string;
    summaryHeading?: string;
    keyPointsHeading?: string;
    actionItemsHeading?: string;
  };
}

export interface ReprocessVoiceNoteOutput {
  voiceNoteId: string;
  status: string;
  summaryId: string;
  version: number;
}

export class ReprocessVoiceNoteUseCase extends UseCase<
  ReprocessVoiceNoteInput,
  Result<ReprocessVoiceNoteOutput>
> {
  constructor(
    private readonly voiceNoteRepository: VoiceNoteRepository,
    private readonly processingOrchestrator: ProcessingOrchestrator
  ) {
    super();
  }

  async execute(input: ReprocessVoiceNoteInput): Promise<Result<ReprocessVoiceNoteOutput>> {
    try {
      // Validate input
      if (!input.newUserPrompt || input.newUserPrompt.trim().length === 0) {
        return {
          success: false,
          error: new ValidationError('New user prompt is required for reprocessing')
        };
      }

      // Find voice note
      const voiceNoteId = VoiceNoteId.fromString(input.voiceNoteId);
      const voiceNote = await this.voiceNoteRepository.findById(voiceNoteId);

      if (!voiceNote) {
        return {
          success: false,
          error: new NotFoundError(`Voice note with ID ${input.voiceNoteId} not found`)
        };
      }

      // Check if voice note has been transcribed
      if (!voiceNote.getTranscription()) {
        return {
          success: false,
          error: new ValidationError(
            'Cannot reprocess: Voice note has not been transcribed yet. Please process it first.'
          )
        };
      }

      // Check if voice note is currently processing
      if (voiceNote.getStatus().getValue() === 'processing') {
        return {
          success: false,
          error: new ValidationError('Voice note is currently being processed')
        };
      }

      // Reprocess the voice note
      const result = await this.processingOrchestrator.reprocessVoiceNote(
        voiceNote,
        input.newUserPrompt,
        input.systemPromptVariables
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || new Error('Reprocessing failed')
        };
      }

      return {
        success: true,
        data: {
          voiceNoteId: voiceNote.getId().getValue(),
          status: voiceNote.getStatus().getValue(),
          summaryId: result.summary!.getId(),
          version: voiceNote.getVersion()
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