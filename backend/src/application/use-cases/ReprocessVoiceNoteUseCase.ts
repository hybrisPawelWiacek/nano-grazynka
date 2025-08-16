import { UseCase } from '../base/UseCase';
import { Result, NotFoundError, ValidationError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { ProcessingOrchestrator } from '../services/ProcessingOrchestrator';

export interface ReprocessVoiceNoteInput {
  voiceNoteId: string;
  userPrompt?: string;  // Changed from newUserPrompt to match what's sent from API
  systemPromptVariables?: Record<string, string>;
  projectId?: string;  // Optional project ID for entity context
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
      // userPrompt is now optional - allow regeneration with default prompts
      // No validation needed for userPrompt

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

      // Reprocess the voice note with optional user prompt
      const result = await this.processingOrchestrator.reprocessVoiceNote(
        voiceNote,
        undefined,  // systemPrompt
        input.userPrompt,  // userPrompt (optional)
        undefined,  // model
        undefined,  // language
        input.projectId  // projectId (optional)
      );

      // The reprocessVoiceNote returns a VoiceNote, not a result object
      // Check if the voice note was successfully reprocessed by checking its status
      if (result.getStatus().getValue() === 'failed') {
        return {
          success: false,
          error: new Error('Reprocessing failed')
        };
      }

      return {
        success: true,
        data: {
          voiceNoteId: voiceNote.getId().getValue(),
          status: result.getStatus().getValue(),
          summaryId: result.getSummary() ? result.getId().getValue() : '',
          version: result.getVersion()
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