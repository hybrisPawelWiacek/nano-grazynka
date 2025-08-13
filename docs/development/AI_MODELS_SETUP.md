# AI Models Configuration

## Overview
nano-Grazynka supports multiple AI models for transcription and summarization:

### Transcription Models (User-Selectable)
- **GPT-4o Transcribe** (default): Fast, 224 token prompt limit, $0.006/minute
- **Gemini 2.0 Flash**: Context-aware, 1M token prompts, $0.0015/minute (75% cheaper)

### Summarization Models
- **Primary**: Google Gemini models via OpenRouter (cost-effective)
- **Alternative**: OpenAI GPT models (direct API)
- **Fallback**: Mock responses for development

## Multi-Model Transcription Setup

### Transcription Model Selection
Users can choose between two transcription models in the UI:

#### GPT-4o Transcribe (Default)
- **Provider**: OpenAI API
- **Best for**: Quick transcriptions with minimal context
- **Prompt limit**: 224 tokens
- **Cost**: $0.006/minute
- **Features**: Whisper prompts for proper nouns and terminology

#### Gemini 2.0 Flash Transcription
- **Provider**: OpenRouter API
- **Best for**: Context-aware transcriptions with extensive prompts
- **Prompt limit**: 1,000,000 tokens
- **Cost**: $0.0015/minute (75% cheaper than GPT-4o)
- **Features**: 
  - Template system (Meeting, Technical, Podcast)
  - Custom system and user prompts
  - Full conversation context support

### Template System for Gemini
Pre-built templates available:
1. **Meeting Transcription**: Speaker identification, action items
2. **Technical Discussion**: Code mentions, technical terms
3. **Podcast/Interview**: Q&A format, topic segmentation

## Configuration Options

### Option A: OpenRouter (Required for Gemini Transcription)

#### 1. Get an OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai)
2. Sign up or login
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key

#### 2. Set Environment Variable
Create a `.env` file in the project root (not in backend/):
```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

#### 3. Model Selection
The system uses **Gemini 2.0 Flash** by default (`google/gemini-2.0-flash-001`):
- Fast response times
- Cost-effective
- Good for summarization tasks

Alternative model available:
- **Gemini 2.5 Pro** (`google/gemini-2.5-pro-exp-03-25`) - Higher reasoning capability

### Option B: OpenAI (Direct API)

#### 1. Get an OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Sign up or login
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Create a new API key

#### 2. Set Environment Variable
Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-openai-key-here
```

#### 3. Available Models
- **Whisper**: Audio transcription (automatic)
- **GPT-4o-mini**: Cost-effective summarization
- **GPT-4**: Premium summarization (if needed)

## How It Works

The LLMAdapter in `backend/src/infrastructure/external/LLMAdapter.ts` automatically:
1. Detects if `OPENROUTER_API_KEY` is set
2. Routes requests to OpenRouter API with Gemini model
3. Falls back to OpenAI if OpenRouter is not configured
4. Uses mock responses if neither API is configured

## Testing

1. Ensure your `.env` file has either `OPENROUTER_API_KEY` or `OPENAI_API_KEY`
2. Restart the Docker containers:
   ```bash
   docker compose down
   docker compose up --build
   ```
3. Upload an audio file and verify summarization works

## Cost Comparison

### Transcription Models
- **GPT-4o Transcribe** (OpenAI): $0.006/minute
- **Gemini 2.0 Flash** (OpenRouter): $0.0015/minute ⭐ 75% cheaper

### Summarization
- **Gemini 2.0 Flash** (via OpenRouter): ~$0.0002/1K tokens ⭐ Most cost-effective
- **GPT-4o-mini** (via OpenAI): ~$0.00015/1K input, $0.0006/1K output
- **Gemini 2.5 Pro** (via OpenRouter): ~$0.001/1K tokens
- **GPT-4** (via OpenAI): ~$0.03/1K input, $0.06/1K output

## Priority Selection

The system automatically selects APIs in this order:
1. OpenRouter (if `OPENROUTER_API_KEY` is set)
2. OpenAI (if `OPENAI_API_KEY` is set)
3. Mock responses (if neither is configured)

## Troubleshooting

### OpenRouter Issues

#### API Key Not Working
- Verify the key starts with `sk-or-v1-`
- Check your OpenRouter account has credits
- Ensure the key is in the root `.env` file, not `backend/.env`

### OpenAI Issues

#### Rate Limits
- Check your OpenAI usage dashboard
- Consider upgrading to a paid plan
- Implement retry logic with exponential backoff

#### Model Access
- Some models require specific API access levels
- GPT-4 requires payment history or invitation

### General Issues

#### Fallback to Mock Data
If you see mock summaries, check:
1. Environment variable is set correctly
2. Docker containers were rebuilt after adding the key
3. Check backend logs: `docker compose logs backend`

### Rate Limits
OpenRouter has generous rate limits, but if you hit them:
- Add delay between requests
- Consider upgrading your OpenRouter plan
- Use the fallback OpenAI API as backup