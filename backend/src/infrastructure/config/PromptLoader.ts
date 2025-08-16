import 'reflect-metadata';
import { injectable } from 'inversify';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { load } from 'js-yaml';
import { get, template } from 'lodash';
import path from 'path';

interface PromptConfig {
  transcription?: {
    gpt4o?: Record<string, string>;
    gemini?: Record<string, string>;
  };
  summarization?: {
    default?: string;
    with_custom?: string;
    action_items?: string;
    templates?: Record<string, string>;
  };
  titleGeneration?: {
    default?: string;
    templates?: Record<string, string>;
  };
  templates?: Record<string, string>;
}

interface InterpolationContext {
  project?: {
    name?: string;
    description?: string;
  };
  entities?: {
    people?: string;
    companies?: string;
    technical?: string;
    products?: string;
    compressed?: string;
    detailed?: string;
    relevant?: string;
    key?: string;
  };
  user?: {
    customPrompt?: string;
  };
}

@injectable()
export class PromptLoader {
  private static instance: PromptLoader | null = null;
  private prompts: PromptConfig = {};
  private yamlPath: string;
  private watcherSetup: boolean = false;
  private isProduction: boolean = process.env.NODE_ENV === 'production';

  constructor() {
    // Determine YAML path - check multiple locations
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'prompts.yaml'),
      path.join(process.cwd(), 'prompts.yaml'),
      '/app/prompts.yaml',
      path.join(__dirname, '..', '..', '..', 'prompts.yaml')
    ];

    this.yamlPath = possiblePaths.find(p => existsSync(p)) || possiblePaths[0];
    this.loadPrompts();
    
    // Setup hot-reload in development
    if (!this.isProduction) {
      this.setupHotReload();
    }
  }

  public static getInstance(): PromptLoader {
    if (!PromptLoader.instance) {
      PromptLoader.instance = new PromptLoader();
    }
    return PromptLoader.instance;
  }

  private loadPrompts(): void {
    try {
      if (existsSync(this.yamlPath)) {
        const yamlContent = readFileSync(this.yamlPath, 'utf8');
        this.prompts = load(yamlContent) as PromptConfig || {};
        console.log(`[PromptLoader] Loaded prompts from ${this.yamlPath}`);
      } else {
        console.warn(`[PromptLoader] Prompts file not found at ${this.yamlPath}, using fallback defaults`);
        this.prompts = this.getFallbackPrompts();
      }
    } catch (error) {
      console.error(`[PromptLoader] Error loading prompts from ${this.yamlPath}:`, error);
      this.prompts = this.getFallbackPrompts();
    }
  }

  private setupHotReload(): void {
    if (this.watcherSetup || !existsSync(this.yamlPath)) {
      return;
    }

    try {
      watchFile(this.yamlPath, { interval: 1000 }, () => {
        console.log('[PromptLoader] Prompts file changed, reloading...');
        this.loadPrompts();
      });
      this.watcherSetup = true;
      console.log('[PromptLoader] Hot-reload enabled for prompts');
    } catch (error) {
      console.error('[PromptLoader] Failed to setup hot-reload:', error);
    }
  }

  public getPrompt(path: string, context?: InterpolationContext): string {
    try {
      // Get the prompt template using lodash get
      let promptTemplate = get(this.prompts, path);
      
      if (!promptTemplate) {
        console.warn(`[PromptLoader] Prompt not found at path: ${path}, using fallback`);
        promptTemplate = this.getFallbackPrompt(path);
      }

      // If no interpolation context provided, return as-is
      if (!context) {
        return promptTemplate;
      }

      // Interpolate variables using lodash template
      const compiled = template(promptTemplate, {
        interpolate: /{{([\s\S]+?)}}/g
      });

      // Create a flat context object for interpolation
      const flatContext = this.flattenContext(context);
      
      return compiled(flatContext);
    } catch (error) {
      console.error(`[PromptLoader] Error getting prompt at ${path}:`, error);
      return this.getFallbackPrompt(path);
    }
  }

  private flattenContext(context: InterpolationContext): Record<string, any> {
    const flat: Record<string, any> = {};
    
    // Flatten project context - keep flat keys for backward compatibility
    if (context.project) {
      flat['project.name'] = context.project.name || 'nano-Grazynka';
      flat['project.description'] = context.project.description || '';
    }
    
    // Flatten entities context - all return empty strings for now
    if (context.entities) {
      flat['entities.people'] = context.entities.people || '';
      flat['entities.companies'] = context.entities.companies || '';
      flat['entities.technical'] = context.entities.technical || '';
      flat['entities.products'] = context.entities.products || '';
      flat['entities.compressed'] = context.entities.compressed || '';
      flat['entities.detailed'] = context.entities.detailed || '';
      flat['entities.relevant'] = context.entities.relevant || '';
      flat['entities.key'] = context.entities.key || '';
    }
    
    // Flatten user context
    if (context.user) {
      flat['user.customPrompt'] = context.user.customPrompt || '';
    }
    
    // CRITICAL FIX: Add nested objects for lodash template
    // Lodash template expects nested objects, not flat keys
    flat.entities = {
      people: context.entities?.people || '',
      companies: context.entities?.companies || '',
      technical: context.entities?.technical || '',
      products: context.entities?.products || '',
      compressed: context.entities?.compressed || '',
      detailed: context.entities?.detailed || '',
      relevant: context.entities?.relevant || '',
      key: context.entities?.key || ''
    };
    
    flat.project = {
      name: context.project?.name || 'nano-Grazynka',
      description: context.project?.description || ''
    };
    
    flat.user = {
      customPrompt: context.user?.customPrompt || ''
    };
    
    return flat;
  }

  private getFallbackPrompt(path: string): string {
    const fallbacks = this.getFallbackPrompts();
    return get(fallbacks, path) || 'No prompt available';
  }

  private getFallbackPrompts(): PromptConfig {
    return {
      transcription: {
        gpt4o: {
          default: `You are a professional audio transcriber. Transcribe the following audio accurately. 
Preserve all spoken words exactly as heard. Include timestamps for long audio.`,
          whisper: `Transcribe this audio with high accuracy. Maintain the original language and preserve all details.`
        },
        gemini: {
          default: `You are a professional audio transcriber. Transcribe the following audio accurately. 
Preserve all spoken words exactly as heard. Include timestamps for long audio.`,
          detailed: `Provide a detailed transcription with timestamps and speaker identification when possible.`
        }
      },
      summarization: {
        default: `Analyze the following transcription and provide:
1. **Summary**: A 2-3 sentence overview
2. **Key Points**: Main topics as bullet points
3. **Action Items**: Any tasks or follow-ups mentioned
Format the response in clear sections.`,
        with_custom: `{{user.customPrompt}}

Now analyze the following transcription based on the above requirements.`,
        action_items: `Extract and list all action items and tasks from this transcription.`,
        templates: {
          meeting: `Analyze this meeting transcription and provide structured notes.`,
          technical: `Extract technical details and decisions from this transcription.`
        }
      },
      titleGeneration: {
        default: `Given this voice note transcription, generate:
1. A 3-4 word descriptive title
2. A 10-15 word summary of the main topic
3. Any specific date mentioned in the content (or null if none)

Return as JSON with keys: title, summary, date`,
        templates: {
          brief: `Generate a brief 3-4 word title for this transcription.`
        }
      }
    };
  }

  public getAllPrompts(): PromptConfig {
    return this.prompts;
  }

  public reloadPrompts(): void {
    this.loadPrompts();
  }

  public cleanup(): void {
    if (this.watcherSetup && existsSync(this.yamlPath)) {
      unwatchFile(this.yamlPath);
      this.watcherSetup = false;
    }
  }
}