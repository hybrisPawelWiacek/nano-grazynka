import fs from 'fs';
import path from 'path';
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
    let model = ConfigLoader.get('transcription.model') || ConfigLoader.get('transcription.whisperModel');
    const baseUrl = ConfigLoader.get('transcription.apiUrl') || 'https://api.openai.com/v1';

    // Use the path as-is since LocalStorageAdapter now returns full path
    const fullPath = audioFilePath;
    
    // Debug logging
    console.log('WhisperAdapter.transcribeWithOpenAI - audioFilePath:', audioFilePath);
    console.log('Full path:', fullPath);
    console.log('File exists?', fs.existsSync(fullPath));
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Audio file not found: ${fullPath}`);
    }
    
    const stats = fs.statSync(fullPath);
    console.log('File size:', stats.size, 'bytes');
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = audioFilePath.split('/').pop() || 'audio.m4a';
    
    // Create a Blob from the buffer with proper MIME type
    const mimeType = fileName.endsWith('.m4a') ? 'audio/m4a' : 
                     fileName.endsWith('.mp3') ? 'audio/mpeg' :
                     fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    
    // Use native FormData (available in Node.js 18+)
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('model', model);
    
    // Only add language if not auto-detect
    const langValue = language.getValue();
    if (langValue && langValue !== '') {
      formData.append('language', langValue);
    }
    
    // Use 'json' format for gpt-4o-transcribe, 'verbose_json' for whisper models
    const responseFormat = model.includes('gpt-4o') ? 'json' : 'verbose_json';
    formData.append('response_format', responseFormat);
    
    if (options?.prompt) {
      formData.append('prompt', options.prompt);
    }
    if (options?.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    console.log('Sending request to OpenAI with model:', model);
    
    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // DO NOT set Content-Type - let fetch handle it automatically
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      
      // If model not found, try with just 'whisper'
      if (error.includes('model') && model === 'whisper-1') {
        console.log('Retrying with model: whisper');
        model = 'whisper';
        
        // Recreate FormData with new model
        const retryFormData = new FormData();
        retryFormData.append('file', fileBlob, fileName);
        retryFormData.append('model', model);
        if (langValue && langValue !== '') {
          retryFormData.append('language', langValue);
        }
        const retryResponseFormat = model.includes('gpt-4o') ? 'json' : 'verbose_json';
        retryFormData.append('response_format', retryResponseFormat);
        if (options?.prompt) {
          retryFormData.append('prompt', options.prompt);
        }
        if (options?.temperature !== undefined) {
          retryFormData.append('temperature', options.temperature.toString());
        }
        
        const retryResponse = await fetch(`${baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: retryFormData,
        });
        
        if (!retryResponse.ok) {
          const retryError = await retryResponse.text();
          throw new Error(`OpenAI transcription failed: ${retryError}`);
        }
        
        const retryResult = await retryResponse.json();
        return {
          text: retryResult.text,
          language,
          duration: retryResult.duration || 0,
          confidence: this.calculateConfidence(retryResult.segments),
        };
      }
      
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

    // Use the path as-is since LocalStorageAdapter now returns full path
    const fullPath = audioFilePath;
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Audio file not found: ${fullPath}`);
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = audioFilePath.split('/').pop() || 'audio.m4a';
    
    // Create a Blob from the buffer
    const mimeType = fileName.endsWith('.m4a') ? 'audio/m4a' : 
                     fileName.endsWith('.mp3') ? 'audio/mpeg' :
                     fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    
    // Use native FormData
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('model', `openai/${model}`);
    
    const langValue = language.getValue();
    if (langValue && langValue !== '') {
      formData.append('language', langValue);
    }
    
    // Use 'json' format for gpt-4o-transcribe, 'verbose_json' for whisper models
    const responseFormat = model.includes('gpt-4o') ? 'json' : 'verbose_json';
    formData.append('response_format', responseFormat);
    
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
        // DO NOT set Content-Type
      },
      body: formData,
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