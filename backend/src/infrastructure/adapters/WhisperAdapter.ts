import FormData from 'form-data';
import fs from 'fs';
import { TranscriptionService, TranscriptionResult } from '../../domain/services/TranscriptionService';
import { Language } from '../../domain/value-objects/Language';
import { ConfigLoader } from '../../config/loader';

export class WhisperAdapter implements TranscriptionService {

  async transcribe(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      temperature?: number;
    }
  ): Promise<TranscriptionResult> {
    const provider = ConfigLoader.get('transcription.provider');
    
    if (provider === 'openai') {
      return this.transcribeWithOpenAI(audioFilePath, language, options);
    } else if (provider === 'openrouter') {
      return this.transcribeWithOpenRouter(audioFilePath, language, options);
    } else {
      throw new Error(`Unsupported transcription provider: ${provider}`);
    }
  }

  private async transcribeWithOpenAI(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      temperature?: number;
    }
  ): Promise<TranscriptionResult> {
    const apiKey = ConfigLoader.get('transcription.apiKey');
    const model = ConfigLoader.get('transcription.whisperModel');
    const baseUrl = ConfigLoader.get('transcription.apiUrl') || 'https://api.openai.com/v1';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', model);
    formData.append('language', language.getValue());
    formData.append('response_format', 'verbose_json');
    
    if (options?.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options?.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI transcription failed: ${error}`);
    }

    const result = await response.json();
    
    return {
      text: result.text,
      language,
      duration: result.duration || 0,
      confidence: this.calculateConfidence(result.segments),
    };
  }

  private async transcribeWithOpenRouter(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      temperature?: number;
    }
  ): Promise<TranscriptionResult> {
    const apiKey = ConfigLoader.get('transcription.apiKey');
    const model = ConfigLoader.get('transcription.whisperModel');
    const baseUrl = ConfigLoader.get('transcription.apiUrl') || 'https://openrouter.ai/api/v1';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model', `openai/${model}`);
    formData.append('language', language.getValue());
    formData.append('response_format', 'verbose_json');
    
    if (options?.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options?.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nano-grazynka.app',
        'X-Title': 'nano-Grazynka',
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter transcription failed: ${error}`);
    }

    const result = await response.json();
    
    return {
      text: result.text,
      language,
      duration: result.duration || 0,
      confidence: this.calculateConfidence(result.segments),
    };
  }

  private calculateConfidence(segments?: any[]): number {
    if (!segments || segments.length === 0) {
      return 0.95;
    }

    const avgProbability = segments.reduce((sum, segment) => {
      return sum + (segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.95);
    }, 0) / segments.length;

    return Math.min(avgProbability, 1.0);
  }
}