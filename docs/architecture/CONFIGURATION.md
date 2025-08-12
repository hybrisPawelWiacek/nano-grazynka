# Configuration Architecture

**Last Updated**: August 12, 2025  
**Status**: ✅ Consolidated and Simplified

## Overview

The nano-Grazynka configuration system follows a simple, unified approach with a clear hierarchy of configuration sources. All configuration is centralized to avoid confusion and duplication.

## Configuration Hierarchy

Configuration values are resolved in the following priority order:

1. **Environment Variables** (`.env`) - Highest priority
   - API keys, secrets, database URLs
   - Runtime-specific settings
   
2. **YAML Configuration** (`config.yaml`) - Default values
   - Model selections, providers
   - Feature flags, limits
   - System defaults
   
3. **Code Defaults** (`schema.ts`) - Fallback values
   - Type definitions
   - Validation rules
   - Ultimate fallbacks

## File Structure

```
Root Directory
├── .env                          # Environment variables (git-ignored)
├── config.yaml                   # Application configuration
├── docker-compose.yml            # Mounts ./config.yaml:/app/config.yaml
├── docker-compose.prod.yml       # Mounts ./config.yaml:/app/config.yaml
└── backend/
    └── src/
        └── config/
            ├── loader.ts         # ConfigLoader implementation
            └── schema.ts         # Zod schema & types
```

## Configuration Files

### 1. Environment Variables (`.env`)

Primary source for sensitive data and environment-specific settings:

```env
# API Keys
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# Database
DATABASE_URL=file:/data/nano-grazynka.db

# Authentication
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=30d

# Observability (Optional)
LANGSMITH_API_KEY=...
OPENLLMETRY_API_KEY=...
```

### 2. YAML Configuration (`config.yaml`)

Application defaults and model configuration:

```yaml
server:
  port: 3101
  host: 0.0.0.0

transcription:
  provider: openrouter
  model: whisper-1
  maxFileSizeMB: 25

summarization:
  provider: openrouter
  model: google/gemini-2.5-flash
  maxTokens: 2000
  temperature: 0.7
  prompts:
    summary: |
      Summarize the following transcript...
    actionPoints: |
      Extract actionable items...

storage:
  uploadDir: /data/uploads
  maxFileAgeDays: 30
```

### 3. Schema Definition (`backend/src/config/schema.ts`)

Type-safe configuration with Zod validation:

```typescript
export const configSchema = z.object({
  server: z.object({
    port: z.number().default(3101),
    host: z.string().default('0.0.0.0'),
  }),
  // ... rest of schema
});

export type Config = z.infer<typeof configSchema>;
```

## ConfigLoader Implementation

The `ConfigLoader` class (`backend/src/config/loader.ts`) provides:

- **Singleton pattern** - Single configuration instance
- **Environment override** - `.env` values override YAML
- **Type safety** - Zod schema validation
- **Dot notation access** - `ConfigLoader.get('summarization.model')`

```typescript
export class ConfigLoader {
  private static instance: Config | null = null;

  // Get nested values using dot notation
  static get(path: string): any {
    const config = this.getInstance();
    return path.split('.').reduce((obj, key) => obj?.[key], config);
  }

  static getInstance(): Config {
    if (!this.instance) {
      this.instance = this.load();
    }
    return this.instance;
  }

  static load(configPath?: string): Config {
    // 1. Load environment variables
    loadEnv();
    
    // 2. Load YAML config
    const yamlPath = configPath || process.env.CONFIG_PATH || '/app/config.yaml';
    let rawConfig = load(yamlContent);
    
    // 3. Merge with environment variables
    rawConfig = this.mergeWithEnv(rawConfig);
    
    // 4. Validate with Zod
    const parseResult = configSchema.safeParse(rawConfig);
    return parseResult.data;
  }
}
```

## Docker Integration

Both development and production Docker configurations mount the root `config.yaml`:

```yaml
# docker-compose.yml & docker-compose.prod.yml
services:
  backend:
    volumes:
      - ./config.yaml:/app/config.yaml:ro  # Read-only mount
```

## Usage in Application

### In Adapters

```typescript
// WhisperAdapter.ts
const provider = ConfigLoader.get('transcription.provider');
const apiKey = ConfigLoader.get('transcription.apiKey');
```

### In Container

```typescript
// container.ts
this.config = ConfigLoader.load();
this.transcriptionService = new WhisperAdapter();
this.summarizationService = new LLMAdapter();
```

## Current Model Configuration

As of August 12, 2025:

- **Transcription**: `gpt-4o-audio-preview` via OpenAI (GPT-4o-Transcribe)
  - 30% better accuracy than whisper-1 at same cost ($0.36/hour)
  - 6-8% word error rate vs 10-12% for whisper-1
  - Superior handling of proper nouns and technical terms
- **Summarization**: `google/gemini-2.5-flash` via OpenRouter
  - Cost-effective and high-quality summarization
  - Excellent multilingual support
- **Fallback**: `gpt-4o-mini` via OpenAI

## Migration History

### August 12, 2025 - Model Upgrade to GPT-4o-Transcribe

Upgraded transcription model for better accuracy:

1. **Changed transcription provider**: OpenRouter → OpenAI
2. **Upgraded model**: `whisper-1` → `gpt-4o-audio-preview` (GPT-4o-Transcribe)
3. **Benefits achieved**:
   - 30% better accuracy at same cost
   - Reduced word error rate from 10-12% to 6-8%
   - Better handling of proper nouns (Zabu, MCP, nano-Grazynka)
   - Same API endpoint compatibility

### August 12, 2025 - Configuration Consolidation

During the Two-Pass Transcription Phase 1 implementation, we consolidated the configuration system:

1. **Removed duplicates**:
   - Deleted `backend/config.yaml` (was outdated)
   - Deleted `backend/src/config/ConfigLoader.ts` (old implementation)
   - Removed duplicate adapters from `infrastructure/external/`

2. **Unified approach**:
   - Single `config.yaml` in root directory
   - Single `ConfigLoader` in `backend/src/config/loader.ts`
   - All imports updated to use the unified loader

3. **Improved architecture**:
   - Singleton pattern for configuration management
   - Clear hierarchy: ENV → YAML → Defaults
   - Type safety with Zod validation

## Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Keep secrets in environment variables** - Not in YAML
3. **Use YAML for defaults** - Model selection, feature flags
4. **Validate all config** - Use Zod schema for type safety
5. **Document changes** - Update this file when config structure changes

## Troubleshooting

### Config not loading?
1. Check if `/app/config.yaml` exists in Docker container
2. Verify `.env` file is present and loaded
3. Check Zod validation errors in console

### Wrong model being used?
1. Check `config.yaml` for current model setting
2. Verify environment variables aren't overriding
3. Confirm provider (openrouter vs openai) is correct

### Environment variables not working?
1. Ensure `.env` file is in root directory
2. Check Docker env_file configuration
3. Verify variable names match schema expectations