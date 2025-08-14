// Domain service interface for generating AI-powered metadata from transcriptions

export interface TitleGenerationResult {
  title: string;
  description: string;
  date: Date | null;
}

export interface TitleGenerationService {
  generateMetadata(
    transcription: string,
    language?: string
  ): Promise<TitleGenerationResult>;
}

export class TitleGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TitleGenerationError';
  }
}