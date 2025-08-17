import { VoiceNoteId } from '../value-objects/VoiceNoteId';
import { Language } from '../value-objects/Language';
import { ProcessingStatus, ProcessingStatusValue } from '../value-objects/ProcessingStatus';
import { Transcription } from './Transcription';
import { Summary } from './Summary';
import { 
  VoiceNoteUploadedEvent,
  VoiceNoteProcessingStartedEvent,
  VoiceNoteTranscribedEvent,
  VoiceNoteSummarizedEvent,
  VoiceNoteProcessingCompletedEvent,
  VoiceNoteProcessingFailedEvent,
  VoiceNoteReprocessedEvent
} from '../events/VoiceNoteEvents';

export class VoiceNote {
  private id: VoiceNoteId;
  private userId?: string;  // Made optional for anonymous users
  private sessionId?: string;  // For anonymous users
  private title: string;
  private originalFilePath: string;
  private fileSize: number;
  private duration?: number;  // Duration in seconds
  private mimeType: string;
  private language: Language;
  private status: ProcessingStatus;
  private tags: string[];
  private errorMessage?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;
  private transcription?: Transcription;
  private summary?: Summary;
  private userPrompt?: string;  // Custom user prompt for summarization
  private whisperPrompt?: string;  // Custom prompt for Whisper transcription
  private transcriptionModel?: string;  // Model selection for transcription
  private geminiSystemPrompt?: string;  // System prompt for Gemini
  private geminiUserPrompt?: string;  // User prompt for Gemini
  private refinedText?: string;  // Refined transcription text
  private refinementPrompt?: string;  // Prompt used for refinement
  private projectId?: string;  // Entity Project System
  // AI-generated metadata fields
  private aiGeneratedTitle?: string;
  private briefDescription?: string;
  private derivedDate?: Date;
  private domainEvents: any[] = [];

  private constructor(
    id: VoiceNoteId,
    title: string,
    originalFilePath: string,
    fileSize: number,
    mimeType: string,
    language: Language,
    status: ProcessingStatus,
    tags: string[],
    userId?: string,  // Optional for anonymous
    sessionId?: string,  // For anonymous users
    duration?: number,  // Duration in seconds
    errorMessage?: string,
    userPrompt?: string,  // Custom user prompt
    whisperPrompt?: string,  // Custom Whisper prompt
    transcriptionModel?: string,  // Model selection
    geminiSystemPrompt?: string,  // Gemini system prompt
    geminiUserPrompt?: string,  // Gemini user prompt
    refinedText?: string,  // Refined transcription
    refinementPrompt?: string,  // Refinement prompt
    projectId?: string,  // Entity Project System
    aiGeneratedTitle?: string,  // AI-generated title
    briefDescription?: string,  // AI-generated brief description
    derivedDate?: Date,  // Date extracted from content
    createdAt?: Date,
    updatedAt?: Date,
    version?: number
  ) {

    
    this.id = id;
    this.title = title;
    this.originalFilePath = originalFilePath;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.language = language;
    this.status = status;
    this.tags = tags;
    this.userId = userId;
    this.sessionId = sessionId;
    this.duration = duration;
    this.errorMessage = errorMessage;
    this.userPrompt = userPrompt;
    this.whisperPrompt = whisperPrompt;
    this.transcriptionModel = transcriptionModel;
    this.geminiSystemPrompt = geminiSystemPrompt;
    this.geminiUserPrompt = geminiUserPrompt;
    this.refinedText = refinedText;
    this.refinementPrompt = refinementPrompt;
    this.projectId = projectId;
    this.aiGeneratedTitle = aiGeneratedTitle;
    this.briefDescription = briefDescription;
    this.derivedDate = derivedDate;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.version = version || 1;
  }

  static create(params: {
    userId?: string;  // Optional for anonymous
    sessionId?: string;  // For anonymous users
    title: string;
    originalFilePath: string;
    fileSize: number;
    duration?: number;  // Duration in seconds
    mimeType: string;
    language: Language;
    tags?: string[];
    userPrompt?: string;
    whisperPrompt?: string;
    transcriptionModel?: string;
    geminiSystemPrompt?: string;
    geminiUserPrompt?: string;
    refinementPrompt?: string;
    projectId?: string;  // Entity Project System
  }): VoiceNote {
    const voiceNote = new VoiceNote(
      VoiceNoteId.generate(),
      params.title,
      params.originalFilePath,
      params.fileSize,
      params.mimeType,
      params.language,
      new ProcessingStatus(ProcessingStatusValue.PENDING),
      params.tags || [],
      params.userId,
      params.sessionId,
      params.duration,  // duration
      undefined,  // errorMessage
      params.userPrompt,
      params.whisperPrompt,
      params.transcriptionModel,
      params.geminiSystemPrompt,
      params.geminiUserPrompt,
      undefined,  // refinedText
      params.refinementPrompt,
      params.projectId,  // projectId
      undefined,  // aiGeneratedTitle - will use default
      undefined,  // briefDescription - will use default
      undefined,  // derivedDate - will use default
      undefined,  // createdAt - will use default
      undefined,  // updatedAt - will use default
      undefined   // version - will use default
    );

    voiceNote.addDomainEvent(new VoiceNoteUploadedEvent(voiceNote.id.getValue(), {
      userId: params.userId || 'anonymous',
      sessionId: params.sessionId,
      fileName: params.originalFilePath,
      fileHash: '',
      fileSizeBytes: params.fileSize,
      durationSeconds: 0,
      language: params.language.getValue()
    }));
    return voiceNote;
  }

  static reconstitute(
    id: VoiceNoteId,
    title: string,
    originalFilePath: string,
    fileSize: number,
    mimeType: string,
    language: Language,
    status: ProcessingStatus,
    tags: string[],
    userId?: string,  // Made optional
    sessionId?: string,  // Added for anonymous users
    duration?: number,  // Duration in seconds
    errorMessage?: string,
    userPrompt?: string,  // Added for custom prompts
    whisperPrompt?: string,  // Added for Whisper prompts
    transcriptionModel?: string,  // Model selection
    geminiSystemPrompt?: string,  // Gemini system prompt
    geminiUserPrompt?: string,  // Gemini user prompt
    refinedText?: string,  // Refined transcription
    refinementPrompt?: string,  // Refinement prompt
    projectId?: string,  // Entity Project System
    aiGeneratedTitle?: string,  // AI-generated title
    briefDescription?: string,  // AI-generated brief description
    derivedDate?: Date,  // Date extracted from content
    createdAt?: Date,
    updatedAt?: Date,
    version?: number
  ): VoiceNote {
    return new VoiceNote(
      id,
      title,
      originalFilePath,
      fileSize,
      mimeType,
      language,
      status,
      tags,
      userId,
      sessionId,
      duration,
      errorMessage,
      userPrompt,
      whisperPrompt,
      transcriptionModel,
      geminiSystemPrompt,
      geminiUserPrompt,
      refinedText,
      refinementPrompt,
      projectId,
      aiGeneratedTitle,
      briefDescription,
      derivedDate,
      createdAt,
      updatedAt,
      version
    );
  }

  // Getters
  getId(): VoiceNoteId {
    return this.id;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  getUserPrompt(): string | undefined {
    return this.userPrompt;
  }

  getWhisperPrompt(): string | undefined {
    return this.whisperPrompt;
  }

  getTranscriptionModel(): string | undefined {
    return this.transcriptionModel;
  }

  getGeminiSystemPrompt(): string | undefined {
    return this.geminiSystemPrompt;
  }

  getGeminiUserPrompt(): string | undefined {
    return this.geminiUserPrompt;
  }

  getRefinedText(): string | undefined {
    return this.refinedText;
  }

  getRefinementPrompt(): string | undefined {
    return this.refinementPrompt;
  }

  getProjectId(): string | undefined {
    return this.projectId;
  }

  getAIGeneratedTitle(): string | undefined {
    return this.aiGeneratedTitle;
  }

  getBriefDescription(): string | undefined {
    return this.briefDescription;
  }

  getDerivedDate(): Date | undefined {
    return this.derivedDate;
  }

  getDisplayTitle(): string {
    return this.aiGeneratedTitle || this.title;
  }

  setAIGeneratedTitle(title: string): void {
    this.aiGeneratedTitle = title;
    this.updatedAt = new Date();
  }

  setBriefDescription(description: string): void {
    this.briefDescription = description;
    this.updatedAt = new Date();
  }

  setDerivedDate(date: Date): void {
    this.derivedDate = date;
    this.updatedAt = new Date();
  }

  getTitle(): string {
    return this.title;
  }

  getOriginalFilePath(): string {
    return this.originalFilePath;
  }

  getFileSize(): number {
    return this.fileSize;
  }

  getDuration(): number | undefined {
    return this.duration;
  }

  setDuration(duration: number): void {
    this.duration = duration;
    this.updatedAt = new Date();
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getLanguage(): Language {
    return this.language;
  }

  getStatus(): ProcessingStatus {
    return this.status;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): number {
    return this.version;
  }

  getTranscription(): Transcription | undefined {
    return this.transcription;
  }

  getSummary(): Summary | undefined {
    return this.summary;
  }

  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Business methods
  startProcessing(): void {
    const currentStatus = this.status.getValue();
    if (currentStatus !== ProcessingStatusValue.PENDING && currentStatus !== ProcessingStatusValue.FAILED) {
      throw new Error('Can only start processing for pending or failed voice notes');
    }
    this.status = new ProcessingStatus(ProcessingStatusValue.PROCESSING);
    this.updatedAt = new Date();
    this.addDomainEvent(new VoiceNoteProcessingStartedEvent(this.id.getValue()));
  }

  addTranscription(transcription: Transcription): void {
    this.transcription = transcription;
    this.updatedAt = new Date();
    this.addDomainEvent(new VoiceNoteTranscribedEvent(
      this.id.getValue(),
      {
        transcriptionId: '',
        model: 'whisper',
        provider: 'openai',
        wordCount: transcription.getWordCount()
      }
    ));
  }

  addSummary(summary: Summary): void {
    this.summary = summary;
    this.updatedAt = new Date();
    this.addDomainEvent(new VoiceNoteSummarizedEvent(
      this.id.getValue(),
      {
        summaryId: '',
        transcriptionId: '',
        model: 'gpt-4',
        provider: 'openai'
      }
    ));
  }

  markAsCompleted(): void {
    if (this.status.getValue() !== ProcessingStatusValue.PROCESSING) {
      throw new Error('Can only mark as completed from processing status');
    }
    this.status = new ProcessingStatus(ProcessingStatusValue.COMPLETED);
    this.errorMessage = undefined;
    this.updatedAt = new Date();
    this.addDomainEvent(new VoiceNoteProcessingCompletedEvent(this.id.getValue(), {
      processingTimeMs: 0
    }));
  }

  markAsFailed(error: string): void {
    this.status = new ProcessingStatus(ProcessingStatusValue.FAILED);
    this.errorMessage = error;
    this.updatedAt = new Date();
    this.addDomainEvent(new VoiceNoteProcessingFailedEvent(this.id.getValue(), {
      error,
      failedAt: new Date().toISOString()
    }));
  }

  updateTags(tags: string[]): void {
    this.tags = tags;
    this.updatedAt = new Date();
  }

  reprocess(): void {
    if (this.status.getValue() === ProcessingStatusValue.PROCESSING) {
      throw new Error('Cannot reprocess while already processing');
    }
    this.status = new ProcessingStatus(ProcessingStatusValue.PENDING);
    this.errorMessage = undefined;
    this.updatedAt = new Date();
    this.version += 1;
    this.addDomainEvent(new VoiceNoteReprocessedEvent(this.id.getValue(), {
      reason: 'User requested reprocessing'
    }));
  }

  private addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }
}