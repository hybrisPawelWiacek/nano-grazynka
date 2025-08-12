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
    errorMessage?: string,
    userPrompt?: string,  // Custom user prompt
    whisperPrompt?: string,  // Custom Whisper prompt
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
    this.errorMessage = errorMessage;
    this.userPrompt = userPrompt;
    this.whisperPrompt = whisperPrompt;
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
    mimeType: string;
    language: Language;
    tags?: string[];
    userPrompt?: string;
    whisperPrompt?: string;
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
      undefined,  // errorMessage
      params.userPrompt,
      params.whisperPrompt
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
    errorMessage?: string,
    userPrompt?: string,  // Added for custom prompts
    whisperPrompt?: string,  // Added for Whisper prompts
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
      errorMessage,
      userPrompt,
      whisperPrompt,
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

  getTitle(): string {
    return this.title;
  }

  getOriginalFilePath(): string {
    return this.originalFilePath;
  }

  getFileSize(): number {
    return this.fileSize;
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