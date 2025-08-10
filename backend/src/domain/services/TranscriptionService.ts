import { Language } from '../value-objects/Language';

export interface TranscriptionResult {
  text: string;
  language: Language;
  duration: number;
  confidence: number;
}

export interface TranscriptionService {
  transcribe(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      temperature?: number;
    }
  ): Promise<TranscriptionResult>;
}