import { readFileSync, existsSync } from 'fs';
import { load } from 'js-yaml';
import { config as loadEnv } from 'dotenv';
import { configSchema, type Config } from './schema';
import path from 'path';

export class ConfigLoader {
  private static instance: Config | null = null;

  // Helper method to get nested config values using dot notation
  static get(path: string): any {
    const config = this.getInstance();
    return path.split('.').reduce((obj, key) => obj?.[key], config as any);
  }

  static load(configPath?: string): Config {
    if (this.instance) {
      return this.instance;
    }

    // Load environment variables
    loadEnv();

    // Default config object
    let rawConfig: any = {};

    // Load YAML config if exists
    const yamlPath = configPath || process.env.CONFIG_PATH || '/app/config.yaml';
    if (existsSync(yamlPath)) {
      try {
        const yamlContent = readFileSync(yamlPath, 'utf8');
        rawConfig = load(yamlContent) || {};
      } catch (error) {
        console.warn(`Failed to load config from ${yamlPath}:`, error);
      }
    }

    // Override with environment variables
    rawConfig = this.mergeWithEnv(rawConfig);

    // Validate and parse config
    const parseResult = configSchema.safeParse(rawConfig);
    if (!parseResult.success) {
      throw new Error(`Invalid configuration: ${parseResult.error.message}`);
    }

    this.instance = parseResult.data;
    return this.instance;
  }

  private static mergeWithEnv(config: any): any {
    return {
      ...config,
      server: {
        ...config.server,
        port: process.env.PORT ? parseInt(process.env.PORT) : config.server?.port,
        host: process.env.HOST || config.server?.host,
      },
      database: {
        ...config.database,
        url: process.env.DATABASE_URL || config.database?.url,
      },
      transcription: {
        ...config.transcription,
        apiKey: config.transcription?.provider === 'openrouter'
          ? (process.env.OPENROUTER_API_KEY || config.transcription?.apiKey)
          : (process.env.OPENAI_API_KEY || config.transcription?.apiKey),
      },
      summarization: {
        ...config.summarization,
        apiKey: config.summarization?.provider === 'openrouter' 
          ? (process.env.OPENROUTER_API_KEY || config.summarization?.apiKey)
          : (process.env.OPENAI_API_KEY || config.summarization?.apiKey),
      },
      observability: {
        langsmith: {
          ...config.observability?.langsmith,
          apiKey: process.env.LANGSMITH_API_KEY || config.observability?.langsmith?.apiKey,
          project: process.env.LANGSMITH_PROJECT || config.observability?.langsmith?.project,
          enabled: !!(process.env.LANGSMITH_API_KEY || config.observability?.langsmith?.apiKey),
        },
        openllmetry: {
          ...config.observability?.openllmetry,
          apiKey: process.env.OPENLLMETRY_API_KEY || config.observability?.openllmetry?.apiKey,
          enabled: !!(process.env.OPENLLMETRY_API_KEY || config.observability?.openllmetry?.apiKey),
        },
      },
    };
  }

  static getInstance(): Config {
    if (!this.instance) {
      this.instance = this.load();
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}

// Export Config type and ConfigLoader
export { Config } from './schema';