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
  private userId: string;
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
  private domainEvents: any[] = [];

  private constructor(
    id: VoiceNoteId,
    userId: string,
    title: string,
    originalFilePath: string,
    fileSize: number,
    mimeType: string,
    language: Language,
    status: ProcessingStatus,
    tags: string[],
    errorMessage?: string,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.originalFilePath = originalFilePath;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.language = language;
    this.status = status;
    this.tags = tags;
    this.errorMessage = errorMessage;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.version = version || 1;
  }

  static create(params: {
    userId: string;
    title: string;
    originalFilePath: string;
    fileSize: number;
    mimeType: string;
    language: Language;
    tags?: string[];
    userPrompt?: string;
  }): VoiceNote {
    const voiceNote = new VoiceNote(
      VoiceNoteId.generate(),
      params.userId,
      params.title,
      params.originalFilePath,
      params.fileSize,
      params.mimeType,
      params.language,
      new ProcessingStatus(ProcessingStatusValue.PENDING),
      params.tags || []
    );

    voiceNote.addDomainEvent(new VoiceNoteUploadedEvent(voiceNote.id.getValue(), {
      userId: params.userId,
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
    userId: string,
    title: string,
    originalFilePath: string,
    fileSize: number,
    mimeType: string,
    language: Language,
    status: ProcessingStatus,
    tags: string[],
    errorMessage?: string,
    createdAt?: Date,
    updatedAt?: Date,
    version?: number
  ): VoiceNote {
    return new VoiceNote(
      id,
      userId,
      title,
      originalFilePath,
      fileSize,
      mimeType,
      language,
      status,
      tags,
      errorMessage,
      createdAt,
      updatedAt,
      version
    );
  }

  // Getters
  getId(): VoiceNoteId {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
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