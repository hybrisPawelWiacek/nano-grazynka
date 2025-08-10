import { Language } from '../value-objects/Language';

export class Transcription {
  private constructor(
    private readonly text: string,
    private readonly language: Language,
    private readonly duration: number,
    private readonly confidence: number,
    private readonly timestamp: Date
  ) {}

  static create(
    text: string,
    language: Language,
    duration: number,
    confidence: number = 0.0,
    timestamp?: Date
  ): Transcription {
    if (!text || text.trim().length === 0) {
      throw new Error('Transcription text cannot be empty');
    }
    if (duration <= 0) {
      throw new Error('Duration must be positive');
    }
    if (confidence < 0 || confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    return new Transcription(text, language, duration, confidence, timestamp || new Date());
  }

  getText(): string {
    return this.text;
  }

  getLanguage(): Language {
    return this.language;
  }

  getDuration(): number {
    return this.duration;
  }

  getConfidence(): number {
    return this.confidence;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getWordCount(): number {
    return this.text.split(/\s+/).filter(word => word.length > 0).length;
  }
}