import { SummarizationService, SummarizationResult } from '../../domain/services/SummarizationService';
import { Language } from '../../domain/value-objects/Language';
import { ConfigLoader } from '../../config/loader';
import { PromptLoader } from '../config/PromptLoader';

export class LLMAdapter implements SummarizationService {
  private promptLoader: PromptLoader;

  constructor(promptLoader?: PromptLoader) {
    this.promptLoader = promptLoader || PromptLoader.getInstance();
  }

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
    
    const systemPrompt = this.getSystemPrompt(language, !!options?.prompt);
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
          { role: 'user', content: options?.prompt 
            ? `${options.prompt}\n\nTranscript:\n${text}`
            : text 
          },
        ],
        max_tokens: maxTokens,
        temperature,
        // Always enforce JSON format
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI summarization failed: ${error}`);
    }

    const result = await response.json();
    const messageContent = result.choices[0].message.content;
    
    // Parse the JSON response
    const content = JSON.parse(messageContent);
    const parsedResult = this.parseResult(content, !!options?.prompt);
    return parsedResult;
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
    
    const systemPrompt = this.getSystemPrompt(language, !!options?.prompt);
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
          { role: 'user', content: options?.prompt 
            ? `${options.prompt}\n\nTranscript:\n${text}`
            : text 
          },
        ],
        max_tokens: maxTokens,
        temperature,
        // Always enforce JSON format
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter summarization failed: ${error}`);
    }

    const result = await response.json();
    const messageContent = result.choices[0].message.content;
    
    // Parse the JSON response
    const content = JSON.parse(messageContent);
    const parsedResult = this.parseResult(content, !!options?.prompt);
    return parsedResult;
  }

  private getSystemPrompt(language: Language, isCustomPrompt: boolean = false): string {
    // For custom prompts, use the with_custom template
    if (isCustomPrompt) {
      // For now, return flexible JSON instruction since we don't have the actual custom prompt here
      return "You are a helpful assistant analyzing transcripts. Respond with a JSON object. For simple responses, you can use: {\"summary\": \"your response here\"}. For detailed responses, you can include additional fields like keyPoints and actionItems.";
    }
    
    // Use PromptLoader to get the default summarization prompt
    const prompt = this.promptLoader.getPrompt(
      'summarization.default',
      {
        entities: { 
          relevant: '',
          compressed: '',
          detailed: ''
        },
        project: { 
          name: 'nano-Grazynka',
          description: 'Voice note transcription and summarization utility'
        }
      }
    );
    
    // Add JSON format instruction with Markdown formatting
    return `${prompt}
    
    Format your response using Markdown for better readability:
    - Use **bold** for emphasis on important points
    - Use bullet points (- or •) for lists
    - Use ### for section headers if needed
    - Format action items with checkboxes: - [ ] Action item
    - Add appropriate line breaks between sections
    
    IMPORTANT: You must respond with valid JSON in the following format:
    {
      "summary": "A well-formatted markdown summary with **emphasis** where appropriate",
      "key_points": ["• **Key point 1** with explanation", "• **Key point 2** with details", "• **Key point 3** with context"],
      "action_items": ["- [ ] Action item 1 with owner if mentioned", "- [ ] Action item 2 with deadline if specified"]
    }
    
    Maintain the language: ${language.getValue() || 'English'}`;
  }

  private parseResult(content: any, isCustomPrompt?: boolean): SummarizationResult {
    const extractArray = (field: any): string[] => {
      if (Array.isArray(field)) {
        return field.filter(item => typeof item === 'string');
      }
      if (typeof field === 'string') {
        return field.split('\n').filter(item => item.trim().length > 0);
      }
      return [];
    };

    // For custom prompts, be flexible with the response format
    if (isCustomPrompt) {
      // If it's just a string, use it as the summary
      if (typeof content === 'string' && content.trim().length > 0) {
        return {
          summary: content,
          keyPoints: [],
          actionItems: [],
        };
      }
      
      // If it has a summary field, use it, otherwise use the whole response as text
      let summaryText = content.summary || 
                        content.text || 
                        content.response || 
                        content.result ||
                        '';
      
      // If still empty and content is an object, stringify it
      if (!summaryText && typeof content === 'object') {
        summaryText = JSON.stringify(content, null, 2);
      }
      
      // If still empty, convert to string
      if (!summaryText) {
        summaryText = String(content || '');
      }
      
      // Ensure we have something, even if it's a fallback message
      if (!summaryText || summaryText.trim().length === 0) {
        summaryText = 'Unable to generate summary with the provided custom instructions.';
      }
      
      return {
        summary: summaryText,
        keyPoints: extractArray(content.key_points || content.keyPoints || content.points || []),
        actionItems: extractArray(content.action_items || content.actionItems || content.actions || content.todos || []),
      };
    }
    
    // For default prompts, use the standard structure
    return {
      summary: content.summary || '',
      keyPoints: extractArray(content.key_points || content.keyPoints || []),
      actionItems: extractArray(content.action_items || content.actionItems || []),
    };
  }
}