import { BaseDomainEvent } from './DomainEvent';

export class VoiceNoteUploadedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      userId: string;
      fileName: string;
      fileHash: string;
      fileSizeBytes: number;
      durationSeconds: number;
      language: string;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteUploaded', payload);
  }
}

export class VoiceNoteProcessingStartedEvent extends BaseDomainEvent {
  constructor(voiceNoteId: string) {
    super(voiceNoteId, 'VoiceNoteProcessingStarted', {});
  }
}

export class VoiceNoteTranscribedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      transcriptionId: string;
      model: string;
      provider: string;
      wordCount: number;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteTranscribed', payload);
  }
}

export class VoiceNoteSummarizedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      summaryId: string;
      transcriptionId: string;
      model: string;
      provider: string;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteSummarized', payload);
  }
}

export class VoiceNoteProcessingCompletedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      processingTimeMs: number;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteProcessingCompleted', payload);
  }
}

export class VoiceNoteProcessingFailedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      error: string;
      failedAt: string;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteProcessingFailed', payload);
  }
}

export class VoiceNoteReprocessedEvent extends BaseDomainEvent {
  constructor(
    voiceNoteId: string,
    payload: {
      reason: string;
      customPrompt?: string;
    }
  ) {
    super(voiceNoteId, 'VoiceNoteReprocessed', payload);
  }
}