import { VoiceNote } from '../../domain/entities/VoiceNote';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';
import { Language } from '../../domain/value-objects/Language';
import { ProcessingStatusValue } from '../../domain/value-objects/ProcessingStatus';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { EventStore } from '../../domain/repositories/EventStore';
import { TranscriptionService } from '../../domain/services/TranscriptionService';
import { SummarizationService } from '../../domain/services/SummarizationService';
import { Config } from '../../config/schema';
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
    private config: Config
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

      // Skip summarization on initial upload - will be done via PostTranscriptionDialog
      // Comment out the auto-summarization to enable two-step flow
      /*
      const summaryResult = await this.performSummarization(
        voiceNote,
        transcriptionResult.transcription!,
        undefined,  // systemPrompt - use default
        voiceNote.getUserPrompt()  // Pass user's custom prompt
      );
      if (!summaryResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          summaryResult.error || new Error('Summarization failed')
        );
      }

      voiceNote.addSummary(summaryResult.summary!);
      */
      voiceNote.markAsCompleted();
      await this.voiceNoteRepository.save(voiceNote);
      
      // Skip summarization event since we're not auto-summarizing
      /*
      const summarizedEvent = new VoiceNoteSummarizedEvent(
        voiceNote.getId().toString(),
        {
          summaryId: voiceNote.getId().toString(), // Use voice note ID as summary reference
          transcriptionId: voiceNote.getId().toString(), // Use voice note ID as transcription reference
          model: (this.config as any).summarization?.model || 'gpt-4-turbo-preview',
          provider: (this.config as any).summarization?.provider || 'openai'
        }
      );
      await this.eventStore.append(summarizedEvent);
      */
      
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
      // Must have transcription to generate/regenerate summary
      const transcription = voiceNote.getTranscription();
      if (!transcription) {
        throw new Error('Cannot generate summary without transcription');
      }

      // Check current status to determine if this is initial generation or regeneration
      const currentStatus = voiceNote.getStatus();
      const isInitialGeneration = currentStatus !== ProcessingStatusValue.COMPLETED;
      
      // Only update status if not already completed (for initial generation after skip)
      if (isInitialGeneration) {
        voiceNote.reprocess();
        voiceNote.startProcessing(); // Transition from PENDING to PROCESSING
        await this.voiceNoteRepository.save(voiceNote);
      }

      // Generate or regenerate summarization with prompts
      const summaryResult = await this.performSummarization(
        voiceNote,
        transcription,
        systemPrompt,
        userPrompt
      );

      if (!summaryResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          summaryResult.error || new Error('Summary generation failed')
        );
      }

      voiceNote.addSummary(summaryResult.summary!);
      
      // Only mark as completed if this was initial generation
      if (isInitialGeneration) {
        voiceNote.markAsCompleted();
      }
      
      await this.voiceNoteRepository.save(voiceNote);
      
      const eventReason = isInitialGeneration 
        ? 'User requested initial summary generation'
        : 'User requested summary regeneration with new prompts';
      
      const reprocessedEvent = new VoiceNoteReprocessedEvent(
        voiceNote.getId().toString(),
        {
          reason: eventReason,
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
      const model = voiceNote.getTranscriptionModel() || 'gpt-4o-transcribe';
      let transcriptionResult;
      
      if (model === 'gpt-4o-transcribe') {
        // Use existing OpenAI flow with whisper prompt
        const whisperPrompt = voiceNote.getWhisperPrompt();
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          whisperPrompt ? { prompt: whisperPrompt } : undefined
        );
      } else if (model === 'google/gemini-2.0-flash-001') {
        // Use Gemini flow with extended prompts
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          {
            model: 'google/gemini-2.0-flash-001',
            systemPrompt: voiceNote.getGeminiSystemPrompt(),
            prompt: voiceNote.getGeminiUserPrompt()
          }
        );
      } else {
        // Fallback to default GPT-4o flow
        const whisperPrompt = voiceNote.getWhisperPrompt();
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          whisperPrompt ? { prompt: whisperPrompt } : undefined
        );
      }

      const transcription = Transcription.create(
        transcriptionResult.text,
        transcriptionResult.language || language || Language.EN,
        transcriptionResult.duration || 1,
        transcriptionResult.confidence || 1.0
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
      
      // For two-pass transcription: use custom prompts if provided
      // The systemPrompt parameter allows customization of the system instruction
      // The userPrompt is additional context/instruction from the user
      const customSystemPrompt = systemPrompt || userPrompt;

      // Call LLMAdapter with correct signature: (text, language, options)
      const result = await (this.summarizationService as any).summarize(
        transcription.getText(),
        language,
        {
          prompt: customSystemPrompt || undefined,
          maxTokens: 2000,
          temperature: 0.7
        }
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