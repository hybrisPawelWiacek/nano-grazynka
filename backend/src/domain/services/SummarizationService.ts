import { Language } from '../value-objects/Language';

export interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export interface SummarizationService {
  summarize(
    text: string,
    language: Language,
    options?: {
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<SummarizationResult>;
}