import fs from 'fs';
import { TranscriptionService, TranscriptionResult } from '../../domain/services/TranscriptionService';
import { Language } from '../../domain/value-objects/Language';
import { ConfigLoader } from '../../config/loader';
import { PromptLoader } from '../config/PromptLoader';

export class WhisperAdapter implements TranscriptionService {
  private promptLoader: PromptLoader;

  constructor(promptLoader?: PromptLoader) {
    this.promptLoader = promptLoader || PromptLoader.getInstance();
  }

  async transcribe(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      temperature?: number;
      model?: string;
      systemPrompt?: string;
    }
  ): Promise<TranscriptionResult> {
    // Check if specific model is requested
    if (options?.model === 'google/gemini-2.0-flash-001') {
      return this.transcribeWithGemini(audioFilePath, language, options);
    }
    
    const provider = ConfigLoader.get('transcription.provider');
    
    try {
      if (provider === 'openai') {
        return await this.transcribeWithOpenAI(audioFilePath, language, options);
      } else if (provider === 'openrouter') {
        return await this.transcribeWithOpenRouter(audioFilePath, language, options);
      } else {
        throw new Error(`Unsupported transcription provider: ${provider}`);
      }
    } catch (error) {
      console.error('[WhisperAdapter] Primary transcription failed:', error);
      
      // Fallback to Gemini if OpenAI/OpenRouter fails
      if (provider !== 'gemini') {
        console.log('[WhisperAdapter] Attempting fallback to Gemini...');
        try {
          const result = await this.transcribeWithGemini(audioFilePath, language, options);
          console.log('[WhisperAdapter] Gemini fallback successful');
          return result;
        } catch (geminiError) {
          console.error('[WhisperAdapter] Gemini fallback also failed:', geminiError);
          // Re-throw original error as it's more relevant
          throw error;
        }
      }
      
      // If we're already using Gemini or fallback failed, re-throw
      throw error;
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
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Audio file not found: ${fullPath}`);
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(fullPath);
    const fileName = audioFilePath.split('/').pop() || 'audio.m4a';
    
    // Create a Blob from the buffer with proper MIME type
    const mimeType = fileName.endsWith('.m4a') ? 'audio/m4a' : 
                     fileName.endsWith('.mp3') ? 'audio/mpeg' :
                     fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
    const fileBlob = new Blob([fileBuffer], { type: mimeType });
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
        
        console.log(`[WhisperAdapter] Attempt ${attempt}/${maxRetries} - Transcribing with OpenAI...`);
        
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
          console.error(`[WhisperAdapter] OpenAI API error (attempt ${attempt}):`, error);
          
          // If model not found, try with just 'whisper' on first attempt
          if (attempt === 1 && error.includes('model') && model === 'whisper-1') {
            console.log('[WhisperAdapter] Retrying with model: whisper');
            model = 'whisper';
            continue; // Retry with new model
          }
          
          // Check for rate limit errors
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
            console.log(`[WhisperAdapter] Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // For server errors, retry with exponential backoff
          if (response.status >= 500) {
            const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`[WhisperAdapter] Server error, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            lastError = new Error(`OpenAI transcription failed: ${error}`);
            continue;
          }
          
          // For client errors, don't retry
          throw new Error(`OpenAI transcription failed: ${error}`);
        }

        const result: any = await response.json();
        
        console.log('[WhisperAdapter] Transcription successful');
        return {
          text: result.text,
          language,
          duration: result.duration || 0,
          confidence: this.calculateConfidence(result.segments),
        };
        
      } catch (error) {
        console.error(`[WhisperAdapter] Error on attempt ${attempt}:`, error);
        lastError = error as Error;
        
        // If this is a network error and not the last attempt, retry
        if (attempt < maxRetries && 
            (error instanceof TypeError || // Network errors
             (error as any).code === 'ECONNRESET' ||
             (error as any).code === 'ETIMEDOUT')) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`[WhisperAdapter] Network error, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // If it's the last attempt or a non-retryable error, throw
        if (attempt === maxRetries) {
          console.error('[WhisperAdapter] All retry attempts exhausted');
        }
        throw error;
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('OpenAI transcription failed after all retries');
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

    const result: any = await response.json();
    
    return {
      text: result.text,
      language,
      duration: result.duration || 0,
      confidence: this.calculateConfidence(result.segments),
    };
  }

  async transcribeWithGemini(
    audioFilePath: string,
    language: Language,
    options?: {
      prompt?: string;
      systemPrompt?: string;
      temperature?: number;
      model?: string;
    }
  ): Promise<TranscriptionResult> {
    console.log('[WhisperAdapter.transcribeWithGemini] Called with options:', options);
    // Use direct Gemini API key instead of OpenRouter
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured in environment variables');
    }
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    // Use the path as-is since LocalStorageAdapter now returns full path
    const fullPath = audioFilePath;
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Audio file not found: ${fullPath}`);
    }
    
    // Read file as buffer and encode as base64
    const fileBuffer = fs.readFileSync(fullPath);
    const base64Audio = fileBuffer.toString('base64');
    
    // Determine MIME type for direct Gemini API
    const fileName = audioFilePath.split('/').pop() || 'audio.m4a';
    const mimeType = fileName.endsWith('.m4a') ? 'audio/mp4' :  // M4A uses audio/mp4 MIME type
                     fileName.endsWith('.mp3') ? 'audio/mp3' :
                     fileName.endsWith('.mp4') ? 'audio/mp4' :
                     fileName.endsWith('.wav') ? 'audio/wav' : 
                     fileName.endsWith('.webm') ? 'audio/webm' : 
                     fileName.endsWith('.ogg') ? 'audio/ogg' :
                     fileName.endsWith('.flac') ? 'audio/flac' : 'audio/mp4';
    
    // Get system prompt from PromptLoader
    const defaultSystemPrompt = this.promptLoader.getPrompt(
      'transcription.gemini.default',
      {
        entities: { 
          compressed: options?.prompt || '',
          detailed: '' 
        },
        project: { 
          name: 'nano-Grazynka',
          description: 'Voice note transcription utility'
        }
      }
    );
    
    // Debug: Log audio file size
    console.log(`[Gemini] Processing audio file: ${fileName}, size: ${fileBuffer.length} bytes, mime: ${mimeType}`);
    
    // Construct request for direct Gemini API
    // Combine system prompt and user prompt into single instruction
    const fullPrompt = `${options?.systemPrompt || defaultSystemPrompt}

${options?.prompt || "Please transcribe this audio accurately."}`;

    // Gemini API expects different structure
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Audio
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options?.temperature || 0.3,
        maxOutputTokens: 8192,
        topP: 0.95,
        topK: 40
      }
    };
    
    // Debug: Log the exact request structure (without the full base64 data)
    console.log('[Gemini] Request structure:', JSON.stringify({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          parts: [
            { text: fullPrompt },
            { inline_data: { mime_type: mimeType, data: `[BASE64_DATA_${base64Audio.length}_CHARS]` } }
          ]
        }
      ],
      generationConfig: requestBody.generationConfig
    }, null, 2));
    
    // Use the correct Gemini API endpoint
    const modelName = 'models/gemini-2.0-flash-exp';
    
    // Retry logic with exponential backoff for 503 errors
    let lastError;
    const maxRetries = 3;
    const baseDelay = 1000; // Start with 1 second
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`Gemini transcription error (attempt ${attempt + 1}):`, error);
          
          // Check if it's a 503 overload error
          if (response.status === 503 || error.includes('overloaded')) {
            lastError = new Error(`Gemini model overloaded: ${error}`);
            
            // If not the last attempt, wait with exponential backoff
            if (attempt < maxRetries - 1) {
              const delay = baseDelay * Math.pow(2, attempt);
              console.log(`[Gemini] Model overloaded, retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            // For non-503 errors, throw immediately
            throw new Error(`Gemini transcription failed: ${error}`);
          }
        } else {
          // Success! Process the response
          const result: any = await response.json();
          
          // Extract transcription from Gemini response structure
          const transcriptionText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!transcriptionText) {
            console.error('Gemini response:', JSON.stringify(result, null, 2));
            throw new Error('Gemini returned empty transcription');
          }
          
          return {
            text: transcriptionText,
            language,
            duration: 0, // Gemini doesn't provide duration
            confidence: 0.95, // Default high confidence for Gemini
          };
        }
      } catch (error) {
        lastError = error;
        
        // If it's a network error, retry with backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`[Gemini] Network error, retrying in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // All retries exhausted, try fallback to OpenAI if configured
    if (lastError && process.env.OPENAI_API_KEY) {
      console.log('[Gemini] All retries exhausted, falling back to OpenAI...');
      return this.transcribeWithOpenAI(audioFilePath, language, options);
    }
    
    throw lastError || new Error('Gemini transcription failed after all retries');
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