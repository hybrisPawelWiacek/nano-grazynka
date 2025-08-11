import { TranscriptionService } from '../../domain/services/TranscriptionService';
import { ConfigLoader } from '../../config/ConfigLoader';
import { CompositeObservabilityProvider } from '../observability/CompositeObservabilityProvider';
import FormData from 'form-data';
import axios from 'axios';

export class WhisperAdapter implements TranscriptionService {
  private apiKey: string | undefined;
  private apiUrl: string;
  private model: string;

  constructor(
    private config: ConfigLoader,
    private observability: CompositeObservabilityProvider
  ) {
    // Use OpenAI API key if available, fallback to OpenRouter
    this.apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    
    if (process.env.OPENAI_API_KEY) {
      this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
      this.model = 'whisper-1';
    } else if (process.env.OPENROUTER_API_KEY) {
      this.apiUrl = 'https://openrouter.ai/api/v1/audio/transcriptions';
      this.model = 'openai/whisper-1';
    } else {
      console.warn('No transcription API key found, using mock implementation');
      this.apiUrl = '';
      this.model = '';
    }
  }

  async transcribe(audioBuffer: Buffer, language?: string): Promise<string> {
    const traceId = await this.observability.startTrace('whisper.transcribe', {
      language,
      bufferSize: audioBuffer.length
    });

    try {
      // If no API key, return mock transcription
      if (!this.apiKey) {
        const mockTranscription = `Mock transcription: This is a test transcription. 
          Actual implementation requires OPENAI_API_KEY or OPENROUTER_API_KEY. 
          Language: ${language || 'auto-detect'}`;
        
        await this.observability.endTrace(traceId, { success: true, mock: true });
        return mockTranscription;
      }

      // Create form data for the API request
      const form = new FormData();
      
      // Add the audio file
      form.append('file', audioBuffer, {
        filename: 'audio.m4a',
        contentType: 'audio/m4a'
      });
      
      // Add model parameter
      form.append('model', this.model);
      
      // Add language hint if provided
      if (language) {
        const langCode = language.toLowerCase() === 'pl' ? 'pl' : 'en';
        form.append('language', langCode);
      }
      
      // Add response format
      form.append('response_format', 'json');

      // Make the API request
      const response = await axios.post(this.apiUrl, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        maxBodyLength: Infinity,
        timeout: 60000 // 60 second timeout for large files
      });

      // Extract transcription from response
      const transcription = response.data.text || response.data.transcription || '';
      
      await this.observability.endTrace(traceId, { 
        success: true, 
        transcriptionLength: transcription.length 
      });
      
      return transcription;
    } catch (error: any) {
      console.error('Transcription error:', error.response?.data || error.message);
      await this.observability.endTrace(traceId, null, error);
      
      // Return a more informative error message
      if (error.response?.status === 401) {
        throw new Error('Invalid API key for transcription service');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid audio format or parameters');
      } else {
        throw new Error(`Transcription failed: ${error.message}`);
      }
    }
  }

  async detectLanguage(audioBuffer: Buffer): Promise<string> {
    const traceId = await this.observability.startTrace('whisper.detectLanguage', {
      bufferSize: audioBuffer.length
    });

    try {
      // If no API key, return default language
      if (!this.apiKey) {
        await this.observability.endTrace(traceId, { language: 'EN', mock: true });
        return 'EN';
      }

      // Transcribe without language hint to detect language
      const transcription = await this.transcribe(audioBuffer);
      
      // Simple language detection based on common words
      // In production, you might want to use a proper language detection library
      const polishWords = ['jest', 'się', 'nie', 'na', 'do', 'że', 'będzie', 'jak'];
      const lowerText = transcription.toLowerCase();
      
      let polishCount = 0;
      for (const word of polishWords) {
        if (lowerText.includes(word)) polishCount++;
      }
      
      const detectedLanguage = polishCount >= 3 ? 'PL' : 'EN';
      
      await this.observability.endTrace(traceId, { language: detectedLanguage });
      return detectedLanguage;
    } catch (error) {
      await this.observability.endTrace(traceId, null, error as Error);
      // Default to English on error
      return 'EN';
    }
  }
}