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
      model?: string;
      systemPrompt?: string;
    }
  ): Promise<TranscriptionResult> {
    // Check if specific model is requested
    if (options?.model === 'google/gemini-2.0-flash-001') {
      return this.transcribeWithGemini(audioFilePath, language, options);
    }
    
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
        
        const retryResult: any = await retryResponse.json();
        return {
          text: retryResult.text,
          language,
          duration: retryResult.duration || 0,
          confidence: this.calculateConfidence(retryResult.segments),
        };
      }
      
      throw new Error(`OpenAI transcription failed: ${error}`);
    }

    const result: any = await response.json();
    
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
    
    // Construct default system prompt if not provided
    const defaultSystemPrompt = `You are a professional audio transcriber. Transcribe the following audio accurately in ${language.getValue() || 'English'}. 
    Preserve all spoken words exactly as heard. Include timestamps for long audio.
    If you hear technical terms, proper nouns, or acronyms, transcribe them correctly.
    Format the transcription clearly with proper punctuation.`;
    
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
    const response = await fetch(`${baseUrl}/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini transcription error:', error);
      throw new Error(`Gemini transcription failed: ${error}`);
    }

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