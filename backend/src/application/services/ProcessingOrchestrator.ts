import { VoiceNote } from '../../domain/entities/VoiceNote';
import { Transcription } from '../../domain/entities/Transcription';
import { Summary } from '../../domain/entities/Summary';
import { Language } from '../../domain/value-objects/Language';
import { ProcessingStatusValue } from '../../domain/value-objects/ProcessingStatus';
import { VoiceNoteRepository } from '../../domain/repositories/VoiceNoteRepository';
import { EventStore } from '../../domain/repositories/EventStore';
import { TranscriptionService } from '../../domain/services/TranscriptionService';
import { SummarizationService } from '../../domain/services/SummarizationService';
import { TitleGenerationService } from '../../domain/services/TitleGenerationService';
import { Config } from '../../config/schema';
import { EntityContextBuilder, ModelType } from './EntityContextBuilder';
import { IProjectRepository } from '../../domain/repositories/IProjectRepository';
import { IEntityUsageRepository, EntityUsageRecord } from '../../domain/repositories/IEntityUsageRepository';
import { EntityContext } from '../../domain/entities/Entity';
import { IEntityRepository } from '../../domain/repositories/IEntityRepository';
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
    private titleGenerationService: TitleGenerationService,
    private voiceNoteRepository: VoiceNoteRepository,
    private eventStore: EventStore,
    private config: Config,
    private entityContextBuilder: EntityContextBuilder,
    private projectRepository: IProjectRepository,
    private entityUsageRepository: IEntityUsageRepository,
    private entityRepository: IEntityRepository
  ) {}

  // Helper function to convert model names to simplified types for EntityContextBuilder
  private getModelType(model: string): 'gpt4o' | 'gemini' {
    if (model.includes('gemini')) {
      return 'gemini';
    }
    return 'gpt4o'; // Default to gpt4o for all OpenAI models
  }

  // Helper function to format EntityContext to string
  private formatEntityContext(context: EntityContext): string {
    // For GPT-4o, use compressed format
    if (context.compressed) {
      return `Known entities: ${context.compressed}`;
    }
    
    // For Gemini, use detailed format
    const parts: string[] = [];
    if (context.people) {
      parts.push(`Team Members: ${context.people}`);
    }
    if (context.companies) {
      parts.push(`Companies: ${context.companies}`);
    }
    if (context.technical) {
      parts.push(`Technical Terms: ${context.technical}`);
    }
    if (context.products) {
      parts.push(`Products: ${context.products}`);
    }
    if (context.detailed) {
      parts.push(context.detailed);
    }
    
    return parts.join('\n');
  }

  async processVoiceNote(
    voiceNote: VoiceNote,
    language?: Language,
    projectId?: string
  ): Promise<VoiceNote> {
    try {
      // Start processing
      voiceNote.startProcessing();
      await this.voiceNoteRepository.save(voiceNote);
      
      const startedEvent = new VoiceNoteProcessingStartedEvent(
        voiceNote.getId().toString()
      );
      await this.eventStore.append(startedEvent);

      // Associate voice note with project if projectId provided
      if (projectId) {
        const project = await this.projectRepository.findById(projectId);
        if (project && project.userId === voiceNote.getUserId()) {
          await this.projectRepository.addVoiceNote(projectId, voiceNote.getId().toString());
        }
      }

      // Transcription with entity context
      const transcriptionResult = await this.performTranscription(voiceNote, language, projectId);
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

      // Generate AI title and metadata after transcription
      try {
        const titleResult = await this.titleGenerationService.generateMetadata(
          transcriptionResult.transcription!.getText(),
          voiceNote.getLanguage().toString()
        );
        
        voiceNote.setAIGeneratedTitle(titleResult.title);
        voiceNote.setBriefDescription(titleResult.description);
        if (titleResult.date) {
          voiceNote.setDerivedDate(titleResult.date);
        }
        
        console.log('[ProcessingOrchestrator] Generated AI metadata:', {
          title: titleResult.title,
          description: titleResult.description,
          date: titleResult.date
        });
      } catch (error) {
        // Title generation is non-critical, log error but continue
        console.error('[ProcessingOrchestrator] Title generation failed:', error);
      }

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
    _language?: Language,
    projectId?: string
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

      // Associate voice note with project if projectId provided and not already associated
      if (projectId && isInitialGeneration) {
        const project = await this.projectRepository.findById(projectId);
        if (project && project.userId === voiceNote.getUserId()) {
          await this.projectRepository.addVoiceNote(projectId, voiceNote.getId().toString());
        }
      }

      // Generate or regenerate summarization with prompts
      const summaryResult = await this.performSummarization(
        voiceNote,
        transcription,
        systemPrompt,
        userPrompt,
        projectId
      );

      if (!summaryResult.success) {
        return await this.handleProcessingFailure(
          voiceNote,
          summaryResult.error || new Error('Summary generation failed')
        );
      }

      voiceNote.addSummary(summaryResult.summary!);
      
      // Regenerate AI title when reprocessing with new summary
      try {
        const transcription = voiceNote.getTranscription();
        if (transcription) {
          const titleResult = await this.titleGenerationService.generateMetadata(
            transcription.getText(),
            voiceNote.getLanguage().toString()
          );
          
          voiceNote.setAIGeneratedTitle(titleResult.title);
          voiceNote.setBriefDescription(titleResult.description);
          if (titleResult.date) {
            voiceNote.setDerivedDate(titleResult.date);
          }
          
          console.log('[ProcessingOrchestrator] Regenerated AI metadata during reprocess:', {
            title: titleResult.title,
            description: titleResult.description,
            date: titleResult.date
          });
        }
      } catch (error) {
        // Title generation is non-critical, log error but continue
        console.error('[ProcessingOrchestrator] Title regeneration failed:', error);
      }
      
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
    language?: Language,
    projectId?: string
  ): Promise<{ success: boolean; transcription?: Transcription; error?: Error }> {
    try {
      const model = voiceNote.getTranscriptionModel() || 'gpt-4o-transcribe';
      let transcriptionResult;
      
      // Generate entity context if projectId is provided
      let entityContext: string | undefined;
      let projectEntities: Array<{ id: string; name: string }> = [];
      if (projectId) {
        try {
          // Fix: Use correct parameter order and getModelType helper
          const modelType = this.getModelType(model);
          const userId = voiceNote.getUserId();
          
          if (!userId) {
            console.warn('[ProcessingOrchestrator] No user ID for entity context');
          } else {
            // Call buildContext with correct parameter order: (userId, projectId, modelType)
            const contextData = await this.entityContextBuilder.buildContext(
              userId,
              projectId,
              modelType
            );
            
            // Fix: EntityContextBuilder returns EntityContext directly, not wrapped
            if (contextData) {
              entityContext = this.formatEntityContext(contextData);
              
              // Get entities from repository for usage tracking
              const entities = await this.entityRepository.findByProject(projectId);
              projectEntities = entities.map(e => ({ id: e.id, name: e.name }));
              
              console.log('[ProcessingOrchestrator] Generated entity context for transcription:', {
                projectId,
                contextLength: entityContext.length,
                model,
                modelType,
                entityCount: projectEntities.length
              });
            }
          }
        } catch (error) {
          console.error('[ProcessingOrchestrator] Failed to generate entity context:', error);
          // Continue without entity context
        }
      }
      
      if (model === 'gpt-4o-transcribe') {
        // Use existing OpenAI flow with whisper prompt + entity context
        const whisperPrompt = voiceNote.getWhisperPrompt();
        const combinedPrompt = entityContext 
          ? `${entityContext}\n\n${whisperPrompt || ''}`
          : whisperPrompt;
          
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          combinedPrompt ? { prompt: combinedPrompt } : undefined
        );
      } else if (model === 'google/gemini-2.0-flash-001') {
        // Use Gemini flow with extended prompts + entity context
        console.log('[ProcessingOrchestrator] Using Gemini model:', model);
        
        const systemPrompt = voiceNote.getGeminiSystemPrompt();
        const userPrompt = voiceNote.getGeminiUserPrompt();
        
        // Append entity context to system prompt for Gemini
        const enhancedSystemPrompt = entityContext
          ? `${systemPrompt}\n\n${entityContext}`
          : systemPrompt;
        
        console.log('[ProcessingOrchestrator] Enhanced system prompt with entities:', enhancedSystemPrompt);
        console.log('[ProcessingOrchestrator] User prompt:', userPrompt);
        
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          {
            model: 'google/gemini-2.0-flash-001',
            systemPrompt: enhancedSystemPrompt,
            prompt: userPrompt
          }
        );
      } else {
        // Fallback to default GPT-4o flow
        const whisperPrompt = voiceNote.getWhisperPrompt();
        const combinedPrompt = entityContext 
          ? `${entityContext}\n\n${whisperPrompt || ''}`
          : whisperPrompt;
          
        transcriptionResult = await this.transcriptionService.transcribe(
          voiceNote.getOriginalFilePath(),
          language || voiceNote.getLanguage(),
          combinedPrompt ? { prompt: combinedPrompt } : undefined
        );
      }

      const transcription = Transcription.create(
        transcriptionResult.text,
        transcriptionResult.language || language || Language.EN,
        transcriptionResult.duration || 1,
        transcriptionResult.confidence || 1.0
      );

      // Track entity usage if entities were used
      if (projectId && projectEntities.length > 0) {
        try {
          for (const entity of projectEntities) {
            await this.entityUsageRepository.trackUsage([{
              entityId: entity.id,
              projectId: projectId,
              voiceNoteId: voiceNote.getId().toString(),
              usageType: 'transcription',
              userId: voiceNote.getUserId()!,
              wasUsed: true,
              wasCorrected: false
            }]);
          }
          console.log('[ProcessingOrchestrator] Tracked entity usage for transcription:', {
            projectId,
            entityCount: projectEntities.length,
            voiceNoteId: voiceNote.getId().toString()
          });
        } catch (error) {
          // Don't fail transcription if usage tracking fails
          console.error('[ProcessingOrchestrator] Failed to track entity usage:', error);
        }
      }

      return { success: true, transcription };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  private async performSummarization(
    voiceNote: VoiceNote,
    transcription: Transcription,
    systemPrompt?: string,
    userPrompt?: string,
    projectId?: string
  ): Promise<{ success: boolean; summary?: Summary; error?: Error }> {
    try {
      const language = transcription.getLanguage();
      
      // Generate entity context if projectId is provided
      let entityContext: string | undefined;
      let projectEntities: Array<{ id: string; name: string }> = [];
      if (projectId) {
        try {
          // For summarization, we use GPT-4o model context
          const modelType = 'gpt4o' as const;
          const userId = voiceNote.getUserId();
          
          if (!userId) {
            console.warn('[ProcessingOrchestrator] No user ID for entity context');
          } else {
            // Call buildContext with correct parameter order: (userId, projectId, modelType)
            const contextData = await this.entityContextBuilder.buildContext(
              userId,
              projectId,
              modelType
            );
            
            // Fix: EntityContextBuilder returns EntityContext directly, not wrapped
            if (contextData) {
              entityContext = this.formatEntityContext(contextData);
              
              // Get entities from repository for usage tracking
              const entities = await this.entityRepository.findByProject(projectId);
              projectEntities = entities.map(e => ({ id: e.id, name: e.name }));
              
              console.log('[ProcessingOrchestrator] Generated entity context for summarization:', {
                projectId,
                contextLength: entityContext.length,
                entityCount: projectEntities.length
              });
            }
          }
        } catch (error) {
          console.error('[ProcessingOrchestrator] Failed to generate entity context:', error);
          // Continue without entity context
        }
      }
      
      // Combine entity context with user prompt
      const enhancedUserPrompt = entityContext
        ? `${entityContext}\n\n${userPrompt || ''}`
        : userPrompt;
      
      // For two-pass transcription: use custom prompts if provided
      // The systemPrompt parameter allows customization of the system instruction
      // The userPrompt is additional context/instruction from the user
      // Pass userPrompt directly to LLMAdapter which will handle it appropriately

      // Call LLMAdapter with correct signature: (text, language, options)
      const result = await (this.summarizationService as any).summarize(
        transcription.getText(),
        language,
        {
          prompt: enhancedUserPrompt || systemPrompt || undefined,
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

      // Track entity usage if entities were used for summarization
      if (projectId && projectEntities.length > 0) {
        try {
          for (const entity of projectEntities) {
            await this.entityUsageRepository.trackUsage([{
              entityId: entity.id,
              projectId: projectId,
              voiceNoteId: voiceNote.getId().toString(),
              usageType: 'summarization',
              userId: voiceNote.getUserId()!,
              wasUsed: true,
              wasCorrected: false
            }]);
          }
          console.log('[ProcessingOrchestrator] Tracked entity usage for summarization:', {
            projectId,
            entityCount: projectEntities.length,
            voiceNoteId: voiceNote.getId().toString()
          });
        } catch (error) {
          // Don't fail summarization if usage tracking fails
          console.error('[ProcessingOrchestrator] Failed to track entity usage:', error);
        }
      }

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