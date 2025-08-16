import { UseCase } from '../base/UseCase';
import { Result, NotFoundError, ProcessingError } from '../base/Result';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { VoiceNoteId } from '../../domain/value-objects/VoiceNoteId';
import { Language } from '../../domain/value-objects/Language';
import { ProcessingOrchestrator } from '../services/ProcessingOrchestrator';

export interface ProcessVoiceNoteInput {
  voiceNoteId: string;
  language?: string;
  userPrompt?: string;
  projectId?: string;
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
      const processedVoiceNote = await this.processingOrchestrator.processVoiceNote(
        voiceNote,
        input.language ? Language.fromString(input.language) : undefined,
        input.projectId
      );

      // Check if processing was successful
      if (processedVoiceNote.getStatus().getValue() === 'failed') {
        return {
          success: false,
          error: new ProcessingError(processedVoiceNote.getErrorMessage() || 'Processing failed')
        };
      }

      // Get the transcription and summary IDs
      const transcription = processedVoiceNote.getTranscription();
      const summary = processedVoiceNote.getSummary();
      
      return {
        success: true,
        data: {
          voiceNoteId: processedVoiceNote.getId().getValue(),
          status: processedVoiceNote.getStatus().getValue(),
          transcriptionId: transcription ? processedVoiceNote.getId().getValue() : undefined,
          summaryId: summary ? processedVoiceNote.getId().getValue() : undefined
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