import { SummarizationService, SummarizationResult } from '../../domain/services/SummarizationService';
import { Language } from '../../domain/value-objects/Language';
import { ConfigLoader } from '../../config/loader';

export class LLMAdapter implements SummarizationService {
  private readonly config = ConfigLoader.getInstance();

  async summarize(
    text: string,
    language: Language,
    options?: {
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<SummarizationResult> {
    const provider = this.config.get('summarization.provider');
    
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
    const apiKey = this.config.get('summarization.apiKey');
    const model = this.config.get('summarization.model');
    const baseUrl = this.config.get('summarization.apiUrl') || 'https://api.openai.com/v1';
    
    const systemPrompt = this.getSystemPrompt(language, options?.prompt);
    const maxTokens = options?.maxTokens || this.config.get('summarization.maxTokens');
    const temperature = options?.temperature ?? this.config.get('summarization.temperature');

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
    const apiKey = this.config.get('summarization.apiKey');
    const model = this.config.get('summarization.model');
    const baseUrl = this.config.get('summarization.apiUrl') || 'https://openrouter.ai/api/v1';
    
    const systemPrompt = this.getSystemPrompt(language, options?.prompt);
    const maxTokens = options?.maxTokens || this.config.get('summarization.maxTokens');
    const temperature = options?.temperature ?? this.config.get('summarization.temperature');

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

    const prompts = this.config.get('summarization.prompts');
    const langCode = language.getValue();
    
    return prompts[langCode] || prompts.en;
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