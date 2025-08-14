import { TitleGenerationService, TitleGenerationResult, TitleGenerationError } from '../../domain/services/TitleGenerationService';
import OpenAI from 'openai';

export class TitleGenerationAdapter implements TitleGenerationService {
  private openai?: OpenAI;
  private config: any;

  constructor(config: any) {
    this.config = config;
    
    // Initialize based on provider
    if (config.titleGeneration?.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async generateMetadata(
    transcription: string,
    language?: string
  ): Promise<TitleGenerationResult> {
    const provider = this.config.titleGeneration?.provider || 'openrouter';
    
    try {
      if (provider === 'openai') {
        return await this.generateWithOpenAI(transcription, language);
      } else {
        return await this.generateWithOpenRouter(transcription, language);
      }
    } catch (error) {
      console.error('Title generation failed:', error);
      throw new TitleGenerationError(`Failed to generate title: ${error.message}`);
    }
  }

  private async generateWithOpenAI(
    transcription: string,
    language?: string
  ): Promise<TitleGenerationResult> {
    if (!this.openai) {
      throw new TitleGenerationError('OpenAI client not initialized');
    }

    const prompt = this.buildPrompt(transcription);
    const model = this.config.titleGeneration?.model || 'gpt-4o-mini';
    const maxTokens = this.config.titleGeneration?.maxTokens || 150;
    const temperature = this.config.titleGeneration?.temperature || 0.3;

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a precise metadata extractor for voice transcriptions. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new TitleGenerationError('No response from OpenAI');
    }

    return this.parseResponse(content);
  }

  private async generateWithOpenRouter(
    transcription: string,
    language?: string
  ): Promise<TitleGenerationResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new TitleGenerationError('OpenRouter API key not configured');
    }

    const prompt = this.buildPrompt(transcription);
    const model = this.config.titleGeneration?.model || 'google/gemini-2.5-flash';
    const maxTokens = this.config.titleGeneration?.maxTokens || 150;
    const temperature = this.config.titleGeneration?.temperature || 0.3;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nano-grazynka.app',
        'X-Title': 'nano-Grazynka Voice Notes'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a precise metadata extractor for voice transcriptions. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new TitleGenerationError(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new TitleGenerationError('No response from OpenRouter');
    }

    return this.parseResponse(content);
  }

  private buildPrompt(transcription: string): string {
    const basePrompt = this.config.titleGeneration?.prompt || 
      `Given this voice note transcription, generate:
      1. A 3-4 word descriptive title
      2. A 10-15 word summary of the main topic
      3. Any specific date mentioned in the content (or null if none)
      
      Respond ONLY in JSON format:
      {
        "title": "...",
        "description": "...",
        "date": "YYYY-MM-DD or null"
      }
      
      Transcription:`;

    // Truncate transcription if too long (keep first 2000 chars for context)
    const truncatedTranscription = transcription.length > 2000 
      ? transcription.substring(0, 2000) + '...'
      : transcription;

    return `${basePrompt}\n${truncatedTranscription}`;
  }

  private parseResponse(content: string): TitleGenerationResult {
    try {
      const parsed = JSON.parse(content);
      
      // Validate and clean the response
      const title = this.validateTitle(parsed.title);
      const description = this.validateDescription(parsed.description);
      const date = this.parseDate(parsed.date);

      return {
        title,
        description,
        date
      };
    } catch (error) {
      console.error('Failed to parse title generation response:', content);
      throw new TitleGenerationError('Invalid response format from LLM');
    }
  }

  private validateTitle(title: any): string {
    if (!title || typeof title !== 'string') {
      throw new TitleGenerationError('Invalid title in response');
    }
    
    // Ensure title is 3-5 words (with some flexibility)
    const words = title.trim().split(/\s+/);
    if (words.length > 6) {
      return words.slice(0, 5).join(' ');
    }
    
    return title.trim();
  }

  private validateDescription(description: any): string {
    if (!description || typeof description !== 'string') {
      throw new TitleGenerationError('Invalid description in response');
    }
    
    // Ensure description is reasonable length (10-20 words)
    const words = description.trim().split(/\s+/);
    if (words.length > 20) {
      return words.slice(0, 20).join(' ') + '...';
    }
    
    return description.trim();
  }

  private parseDate(dateStr: any): Date | null {
    if (!dateStr || dateStr === 'null' || dateStr === null) {
      return null;
    }

    if (typeof dateStr !== 'string') {
      return null;
    }

    // Try to parse the date
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      // Invalid date format
    }

    return null;
  }
}