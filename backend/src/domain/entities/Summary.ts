import { Language } from '../value-objects/Language';

export class Summary {
  private constructor(
    private readonly summary: string,
    private readonly keyPoints: string[],
    private readonly actionItems: string[],
    private readonly language: Language,
    private readonly timestamp: Date
  ) {}

  static create(
    summary: string,
    keyPoints: string[],
    actionItems: string[],
    language: Language,
    timestamp?: Date
  ): Summary {
    if (!summary || summary.trim().length === 0) {
      throw new Error('Summary text cannot be empty');
    }
    if (!keyPoints || keyPoints.length === 0) {
      throw new Error('Key points cannot be empty');
    }
    return new Summary(summary, keyPoints, actionItems, language, timestamp || new Date());
  }

  getSummary(): string {
    return this.summary;
  }

  getKeyPoints(): string[] {
    return [...this.keyPoints];
  }

  getActionItems(): string[] {
    return [...this.actionItems];
  }

  getLanguage(): Language {
    return this.language;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }
}