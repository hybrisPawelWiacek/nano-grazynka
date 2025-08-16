import { z } from 'zod';

export const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535).default(3001),
    host: z.string().default('0.0.0.0'),
  }),
  database: z.object({
    url: z.string().default('file:/data/nano-grazynka.db'),
  }),
  transcription: z.object({
    provider: z.enum(['openai', 'openrouter']).default('openai'),
    model: z.string().default('whisper-1'),
    whisperModel: z.string().default('whisper-1'),  // Alias for model
    apiKey: z.string().optional(),
    apiUrl: z.string().optional(),
    maxFileSizeMB: z.number().default(25),
    supportedFormats: z.array(z.string()).default(['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']),
  }),
  summarization: z.object({
    provider: z.enum(['openai', 'openrouter']).default('openai'),
    model: z.string().default('gpt-4-turbo-preview'),
    apiKey: z.string().optional(),
    apiUrl: z.string().optional(),
    maxTokens: z.number().default(2000),
    temperature: z.number().min(0).max(2).default(0.7),
  }),
  observability: z.object({
    langsmith: z.object({
      apiKey: z.string().optional(),
      project: z.string().optional(),
      enabled: z.boolean().default(false),
    }),
    openllmetry: z.object({
      apiKey: z.string().optional(),
      enabled: z.boolean().default(false),
    }),
  }),
  storage: z.object({
    uploadDir: z.string().default('/data/uploads'),
    maxFileAgeDays: z.number().default(30),
  }),
  processing: z.object({
    maxConcurrentJobs: z.number().default(3),
    jobTimeoutMinutes: z.number().default(30),
    retryAttempts: z.number().default(3),
  }),
});

export type Config = z.infer<typeof configSchema>;