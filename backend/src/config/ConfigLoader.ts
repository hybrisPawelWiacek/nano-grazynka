import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { configSchema, type Config } from './schema';
import * as dotenv from 'dotenv';

export class ConfigLoader {
  private config: Config | null = null;
  private static instance: ConfigLoader;

  constructor() {
    dotenv.config();
  }

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  load(): Config {
    if (this.config) {
      return this.config;
    }

    const configPath = path.join(process.cwd(), 'config.yaml');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found at ${configPath}`);
    }

    const fileContents = fs.readFileSync(configPath, 'utf8');
    const yamlConfig = yaml.load(fileContents) as any;

    const mergedConfig = this.mergeWithEnv(yamlConfig);
    
    try {
      this.config = configSchema.parse(mergedConfig);
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        console.error(JSON.stringify(error.errors, null, 2));
        throw new Error('Invalid configuration');
      }
      throw error;
    }
  }

  private mergeWithEnv(yamlConfig: any): any {
    return {
      server: {
        port: parseInt(process.env.PORT || yamlConfig.server?.port || '3101', 10),
        host: process.env.HOST || yamlConfig.server?.host || '0.0.0.0'
      },
      database: {
        url: process.env.DATABASE_URL || yamlConfig.database?.url || 'file:./data/nano-grazynka.db'
      },
      transcription: {
        provider: process.env.TRANSCRIPTION_PROVIDER || yamlConfig.transcription?.provider || 'openai',
        apiKey: process.env.OPENAI_API_KEY || yamlConfig.transcription?.apiKey || '',
        model: process.env.TRANSCRIPTION_MODEL || yamlConfig.transcription?.model || 'whisper-1',
        maxFileSizeMB: parseInt(process.env.TRANSCRIPTION_MAX_FILE_SIZE_MB || yamlConfig.transcription?.maxFileSizeMB || '25', 10),
        supportedFormats: yamlConfig.transcription?.supportedFormats || ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
      },
      summarization: {
        provider: process.env.SUMMARIZATION_PROVIDER || yamlConfig.summarization?.provider || 'openai',
        apiKey: process.env.OPENAI_API_KEY || yamlConfig.summarization?.apiKey || '',
        model: process.env.SUMMARIZATION_MODEL || yamlConfig.summarization?.model || 'gpt-4-turbo-preview',
        maxTokens: parseInt(process.env.SUMMARIZATION_MAX_TOKENS || yamlConfig.summarization?.maxTokens || '2000', 10),
        temperature: parseFloat(process.env.SUMMARIZATION_TEMPERATURE || yamlConfig.summarization?.temperature || '0.7'),
        prompts: yamlConfig.summarization?.prompts || {
          summary: 'Summarize the following transcript concisely, capturing key points and main ideas.',
          actionPoints: 'Extract actionable items from the following transcript as a bullet list.'
        }
      },
      storage: {
        uploadDir: process.env.UPLOAD_DIR || yamlConfig.storage?.uploadDir || '/data/uploads',
        maxFileAgeDays: parseInt(process.env.MAX_FILE_AGE_DAYS || yamlConfig.storage?.maxFileAgeDays || '30', 10)
      },
      processing: {
        maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || yamlConfig.processing?.maxConcurrentJobs || '3', 10),
        jobTimeoutMinutes: parseInt(process.env.JOB_TIMEOUT_MINUTES || yamlConfig.processing?.jobTimeoutMinutes || '30', 10),
        retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || yamlConfig.processing?.retryAttempts || '3', 10)
      },
      observability: {
        langsmith: {
          enabled: !!process.env.LANGSMITH_API_KEY,
          apiKey: process.env.LANGSMITH_API_KEY || '',
          project: process.env.LANGSMITH_PROJECT || 'nano-grazynka'
        },
        openllmetry: {
          enabled: !!process.env.OPENLLMETRY_API_KEY,
          apiKey: process.env.OPENLLMETRY_API_KEY || ''
        }
      }
    };
  }

  get<T = any>(path: string): T {
    if (!this.config) {
      this.load();
    }
    
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        throw new Error(`Configuration key not found: ${path}`);
      }
    }
    
    return value as T;
  }
}