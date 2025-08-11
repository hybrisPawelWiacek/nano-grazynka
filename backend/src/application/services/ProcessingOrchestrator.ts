import { VoiceNote } from '../../domain/entities/VoiceNote';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';
import { Language } from '../../domain/value-objects/Language';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { EventStore } from '../../domain/repositories/EventStore';
import { TranscriptionService } from '../../domain/services/TranscriptionService';
import { SummarizationService } from '../../domain/services/SummarizationService';
import { ConfigLoader } from '../../config/ConfigLoader';
import {
  VoiceNoteProcessingStartedEvent,
  VoiceNoteTranscribedEvent,
  VoiceNoteSummarizedEvent,
  VoiceNoteProcessingCompletedEvent,
  VoiceNoteProcessingFailedEvent,
  VoiceNoteReprocessedEvent
} from '../../domain/events/VoiceNoteEvents';

export class ProcessingOrchestrator {
  private static readonly CANONICAL_FAILURE_MESSAGE = 
    'Processing failed due to an unexpected error. Please try again later or contact support if the issue persists.';

  constructor(
    private transcriptionService: TranscriptionService,
    private summarizationService: SummarizationService,
    private voiceNoteRepository: VoiceNoteRepository,
    private eventStore: EventStore,
    private config: ConfigLoader
  ) {}

  async processVoiceNote(
    voiceNote: VoiceNote,
    language?: Language
  ): Promise<VoiceNote> {
    try {
      // Start processing
      voiceNote.startProcessing();
      await this.voiceNoteRepository.save(voiceNote);
      
      const startedEvent = new VoiceNoteProcessingStartedEvent(
        voiceNote.getId().toString()
      );
      await this.eventStore.append(startedEvent);

      // Transcription
      const transcriptionResult = await this.performTranscription(voiceNote, language);
      if (!transcriptionResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          transcriptionResult.error || new Error('Transcription failed')
        );
      }

      voiceNote.addTranscription(transcriptionResult.transcription!);
      await this.voiceNoteRepository.save(voiceNote);
      
      const transcribedEvent = new VoiceNoteTranscribedEvent(
        voiceNote.getId().toString(),
        {
          transcriptionId: voiceNote.getId().toString(), // Use voice note ID as transcription reference
          model: 'whisper-1',
          provider: 'openai',
          wordCount: transcriptionResult.transcription!.getText().split(' ').length
        }
      );
      await this.eventStore.append(transcribedEvent);

      // Summarization
      const summaryResult = await this.performSummarization(
        voiceNote,
        transcriptionResult.transcription!
      );
      if (!summaryResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          summaryResult.error || new Error('Summarization failed')
        );
      }

      voiceNote.addSummary(summaryResult.summary!);
      voiceNote.markAsCompleted();
      await this.voiceNoteRepository.save(voiceNote);
      
      const summarizedEvent = new VoiceNoteSummarizedEvent(
        voiceNote.getId().toString(),
        {
          summaryId: voiceNote.getId().toString(), // Use voice note ID as summary reference
          transcriptionId: voiceNote.getId().toString(), // Use voice note ID as transcription reference
          model: this.config.get('summarization.model'),
          provider: this.config.get('summarization.provider')
        }
      );
      await this.eventStore.append(summarizedEvent);
      
      const completedEvent = new VoiceNoteProcessingCompletedEvent(
        voiceNote.getId().toString(),
        {
          processingTimeMs: Date.now() - voiceNote.getCreatedAt().getTime()
        }
      );
      await this.eventStore.append(completedEvent);

      return voiceNote;
    } catch (error) {
      return await this.handleProcessingFailure(voiceNote, error as Error);
    }
  }

  async reprocessVoiceNote(
    voiceNote: VoiceNote,
    systemPrompt?: string,
    userPrompt?: string,
    _model?: string,
    _language?: Language
  ): Promise<VoiceNote> {
    try {
      // Must have transcription to reprocess
      const transcription = voiceNote.getTranscription();
      if (!transcription) {
        throw new Error('Cannot reprocess without transcription');
      }

      voiceNote.reprocess();
      await this.voiceNoteRepository.save(voiceNote);

      // Re-run summarization with new prompts
      const summaryResult = await this.performSummarization(
        voiceNote,
        transcription,
        systemPrompt,
        userPrompt
      );

      if (!summaryResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          summaryResult.error || new Error('Reprocessing failed')
        );
      }

      voiceNote.addSummary(summaryResult.summary!);
      voiceNote.markAsCompleted();
      
      await this.voiceNoteRepository.save(voiceNote);
      
      const reprocessedEvent = new VoiceNoteReprocessedEvent(
        voiceNote.getId().toString(),
        {
          reason: 'User requested reprocessing with new prompts',
          customPrompt: userPrompt
        }
      );
      await this.eventStore.append(reprocessedEvent);

      return voiceNote;
    } catch (error) {
      return await this.handleProcessingFailure(voiceNote, error as Error);
    }
  }

  private async performTranscription(
    voiceNote: VoiceNote,
    language?: Language
  ): Promise<{ success: boolean; transcription?: Transcription; error?: Error }> {
    try {
      // Read the audio file
      const fs = require('fs').promises;
      const audioBuffer = await fs.readFile(voiceNote.getOriginalFilePath());
      
      // Pass the buffer and language string to the transcription service
      const transcriptionText = await this.transcriptionService.transcribe(
        audioBuffer,
        language ? language.getValue() : undefined
      );

      const transcription = Transcription.create(
        transcriptionText,
        language || Language.EN,
        1, // Duration not available from Whisper API, using 1 as default
        1.0 // Confidence not available from Whisper API
      );

      return { success: true, transcription };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  private async performSummarization(
    _voiceNote: VoiceNote,
    transcription: Transcription,
    systemPrompt?: string,
    userPrompt?: string
  ): Promise<{ success: boolean; summary?: Summary; error?: Error }> {
    try {
      const language = transcription.getLanguage();
      // Get the summary prompt directly, not language-specific
      const summaryPrompt = this.config.get('summarization.prompts.summary');
      const finalSystemPrompt = systemPrompt || summaryPrompt;
      const finalUserPrompt = userPrompt || transcription.getText();

      // This is a simplified version - the actual LLMAdapter returns SummarizationResult
      const result = await (this.summarizationService as any).summarize(
        transcription.getText(),
        finalSystemPrompt,
        finalUserPrompt
      );

      const summary = Summary.create(
        result.summary,
        result.keyPoints,
        result.actionItems,
        language
      );

      return { success: true, summary };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  private async handleProcessingFailure(
    voiceNote: VoiceNote,
    error: Error
  ): Promise<VoiceNote> {
    voiceNote.markAsFailed(ProcessingOrchestrator.CANONICAL_FAILURE_MESSAGE);
    await this.voiceNoteRepository.save(voiceNote);
    
    const failedEvent = new VoiceNoteProcessingFailedEvent(
      voiceNote.getId().toString(),
      {
        error: ProcessingOrchestrator.CANONICAL_FAILURE_MESSAGE,
        failedAt: new Date().toISOString()
      }
    );
    await this.eventStore.append(failedEvent);

    // Log actual error for debugging
    console.error(`Processing failed for ${voiceNote.getId()}:`, error);
    
    return voiceNote;
  }
}