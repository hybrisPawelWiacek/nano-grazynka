import { SummarizationService, SummarizationResult } from '../../domain/services/SummarizationService';
import { Language } from '../../domain/value-objects/Language';
import { ConfigLoader } from '../../config/loader';

export class LLMAdapter implements SummarizationService {

  async summarize(
    text: string,
    language: Language,
    options?: {
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<SummarizationResult> {
    const provider = ConfigLoader.get('summarization.provider');
    
    if (provider === 'openai') {
      return this.summarizeWithOpenAI(text, language, options);
    } else if (provider === 'openrouter') {
      return this.summarizeWithOpenRouter(text, language, options);
    } else {
      throw new Error(`Unsupported summarization provider: ${provider}`);
    }
  }

  private async summarizeWithOpenAI(
    text: string,
    language: Language,
    options?: {
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<SummarizationResult> {
    const apiKey = ConfigLoader.get('summarization.apiKey');
    const model = ConfigLoader.get('summarization.model');
    const baseUrl = ConfigLoader.get('summarization.apiUrl') || 'https://api.openai.com/v1';
    
    const systemPrompt = this.getSystemPrompt(language, options?.prompt);
    const maxTokens = options?.maxTokens || ConfigLoader.get('summarization.maxTokens');
    const temperature = options?.temperature ?? ConfigLoader.get('summarization.temperature');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI summarization failed: ${error}`);
    }

    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);
    
    return this.parseResult(content);
  }

  private async summarizeWithOpenRouter(
    text: string,
    language: Language,
    options?: {
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<SummarizationResult> {
    const apiKey = ConfigLoader.get('summarization.apiKey') || process.env.OPENROUTER_API_KEY;
    const model = ConfigLoader.get('summarization.model');
    const baseUrl = ConfigLoader.get('summarization.apiUrl') || 'https://openrouter.ai/api/v1';
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }
    
    const systemPrompt = this.getSystemPrompt(language, options?.prompt);
    const maxTokens = options?.maxTokens || ConfigLoader.get('summarization.maxTokens');
    const temperature = options?.temperature ?? ConfigLoader.get('summarization.temperature');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nano-grazynka.app',
        'X-Title': 'nano-Grazynka',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter summarization failed: ${error}`);
    }

    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);
    
    return this.parseResult(content);
  }

  private getSystemPrompt(language: Language, customPrompt?: string): string {
    if (customPrompt) {
      return customPrompt;
    }

    const prompts = ConfigLoader.get('summarization.prompts');
    const basePrompt = prompts.summary || 'Summarize the following transcript concisely, capturing key points and main ideas.';
    
    // Add JSON format instruction for Gemini compatibility
    return `${basePrompt}
    
    IMPORTANT: You must respond with valid JSON in the following format:
    {
      "summary": "A concise summary of the transcript",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"],
      "action_items": ["Action item 1", "Action item 2"]
    }`;
  }

  private parseResult(content: any): SummarizationResult {
    const extractArray = (field: any): string[] => {
      if (Array.isArray(field)) {
        return field.filter(item => typeof item === 'string');
      }
      if (typeof field === 'string') {
        return field.split('\n').filter(item => item.trim().length > 0);
      }
      return [];
    };

    return {
      summary: content.summary || '',
      keyPoints: extractArray(content.key_points || content.keyPoints || []),
      actionItems: extractArray(content.action_items || content.actionItems || []),
    };
  }
}