import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { PromptLoader } from '../../backend/src/infrastructure/config/PromptLoader';
import { WhisperAdapter } from '../../backend/src/infrastructure/adapters/WhisperAdapter';
import { LLMAdapter } from '../../backend/src/infrastructure/adapters/LLMAdapter';
import { TitleGenerationAdapter } from '../../backend/src/infrastructure/adapters/TitleGenerationAdapter';
import { Language } from '../../backend/src/domain/value-objects/Language';

// Mock external dependencies
jest.mock('fs');
jest.mock('../../backend/src/config/loader', () => ({
  ConfigLoader: {
    get: jest.fn((path: string) => {
      const config: any = {
        transcription: {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'whisper-1'
        },
        summarization: {
          provider: 'openrouter',
          apiKey: 'test-key',
          model: 'gpt-4',
          maxTokens: 500,
          temperature: 0.7
        },
        titleGeneration: {
          provider: 'openrouter',
          model: 'gpt-4',
          maxTokens: 150,
          temperature: 0.3
        }
      };
      return path.split('.').reduce((obj, key) => obj?.[key], config);
    })
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Prompt System Integration Tests', () => {
  let promptLoader: PromptLoader;
  let whisperAdapter: WhisperAdapter;
  let llmAdapter: LLMAdapter;
  let titleGenerationAdapter: TitleGenerationAdapter;
  
  const mockPromptYaml = `
transcription:
  gemini:
    default: |
      Test transcription prompt {{entities.detailed}}
  gpt4o:
    default: |
      GPT-4o transcription {{entities.compressed}}

summarization:
  default: |
    Summarize this content for {{project.name}}.
    {{entities.relevant}}
  with_custom: |
    {{user.customPrompt}}
    Additional context: {{entities.relevant}}

titleGeneration:
  default: |
    Generate title for {{project.name}}.
    Context: {{entities.key}}
    Return JSON format.
`;

  beforeEach(() => {
    // Reset singletons
    (PromptLoader as any).instance = null;
    
    // Setup mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockPromptYaml);
    (fs.watchFile as jest.Mock).mockImplementation(() => {});
    (fs.unwatchFile as jest.Mock).mockImplementation(() => {});
    
    // Set to test environment
    process.env.NODE_ENV = 'test';
    process.env.OPENROUTER_API_KEY = 'test-api-key';
    
    // Initialize components
    promptLoader = PromptLoader.getInstance();
    whisperAdapter = new WhisperAdapter(promptLoader);
    llmAdapter = new LLMAdapter(promptLoader);
    
    const mockConfig = {
      titleGeneration: {
        provider: 'openrouter',
        model: 'gpt-4',
        maxTokens: 150,
        temperature: 0.3
      }
    };
    titleGenerationAdapter = new TitleGenerationAdapter(mockConfig, promptLoader);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WhisperAdapter Integration', () => {
    test('should use PromptLoader for Gemini transcription prompts', async () => {
      // Mock the private method call that uses the prompt
      const transcribeWithGeminiSpy = jest.spyOn(whisperAdapter as any, 'transcribeWithGemini');
      transcribeWithGeminiSpy.mockResolvedValue({
        text: 'Test transcription',
        language: 'en',
        confidence: 0.95,
        metadata: {}
      });
      
      const language = new Language('en');
      await whisperAdapter.transcribe('test.m4a', language, 'custom prompt');
      
      // Verify that transcribeWithGemini was called
      expect(transcribeWithGeminiSpy).toHaveBeenCalled();
      
      // The method would internally use PromptLoader
      // Since we can't directly test private method internals,
      // we verify the adapter was constructed with PromptLoader
      expect(whisperAdapter).toBeDefined();
      expect((whisperAdapter as any).promptLoader).toBe(promptLoader);
    });

    test('should handle variable interpolation in transcription prompts', () => {
      const prompt = promptLoader.getPrompt('transcription.gemini.default', {
        entities: { detailed: 'Entity context here' },
        project: { name: 'TestProject' }
      });
      
      expect(prompt).toContain('Test transcription prompt Entity context here');
    });
  });

  describe('LLMAdapter Integration', () => {
    test('should use PromptLoader for summarization prompts', async () => {
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Test summary',
                key_points: ['Point 1', 'Point 2'],
                action_items: ['Action 1']
              })
            }
          }]
        })
      });
      
      const language = new Language('en');
      const result = await llmAdapter.summarize('Test transcription', language);
      
      // Verify fetch was called with proper headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
      
      // Verify result structure
      expect(result).toEqual({
        summary: 'Test summary',
        keyPoints: ['Point 1', 'Point 2'],
        actionItems: ['Action 1']
      });
    });

    test('should handle custom prompts with variable interpolation', async () => {
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'Custom analysis result'
              })
            }
          }]
        })
      });
      
      const language = new Language('en');
      const result = await llmAdapter.summarize(
        'Test transcription',
        language,
        { prompt: 'Analyze for technical details' }
      );
      
      // Verify custom prompt handling
      expect(result.summary).toBe('Custom analysis result');
      expect((llmAdapter as any).promptLoader).toBe(promptLoader);
    });

    test('should use default prompt when no custom prompt provided', () => {
      const prompt = promptLoader.getPrompt('summarization.default', {
        project: { name: 'TestProject' },
        entities: { relevant: 'Context info' }
      });
      
      expect(prompt).toContain('Summarize this content for TestProject');
      expect(prompt).toContain('Context info');
    });
  });

  describe('TitleGenerationAdapter Integration', () => {
    test('should use PromptLoader for title generation prompts', async () => {
      // Mock fetch response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Test Title',
                description: 'Test description of the content',
                date: '2025-08-16'
              })
            }
          }]
        })
      });
      
      const result = await titleGenerationAdapter.generateMetadata('Test transcription', 'en');
      
      // Verify result structure
      expect(result).toEqual({
        title: 'Test Title',
        description: 'Test description of the content',
        date: new Date('2025-08-16')
      });
      
      // Verify adapter uses PromptLoader
      expect((titleGenerationAdapter as any).promptLoader).toBe(promptLoader);
    });

    test('should handle variable interpolation in title prompts', () => {
      const prompt = promptLoader.getPrompt('titleGeneration.default', {
        project: { name: 'TestProject' },
        entities: { key: 'Key context' }
      });
      
      expect(prompt).toContain('Generate title for TestProject');
      expect(prompt).toContain('Context: Key context');
      expect(prompt).toContain('Return JSON format');
    });

    test('should truncate long transcriptions', async () => {
      const longTranscription = 'a'.repeat(3000); // Create a 3000 char string
      
      // Mock fetch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Long Content',
                description: 'Summary of long content',
                date: null
              })
            }
          }]
        })
      });
      
      await titleGenerationAdapter.generateMetadata(longTranscription, 'en');
      
      // Verify fetch was called
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const userContent = requestBody.messages[1].content;
      
      // Verify transcription was truncated
      expect(userContent).toContain('...');
      expect(userContent.length).toBeLessThan(longTranscription.length + 500); // Account for prompt
    });
  });

  describe('Cross-Adapter Consistency', () => {
    test('all adapters should use the same PromptLoader instance', () => {
      const whisperLoader = (whisperAdapter as any).promptLoader;
      const llmLoader = (llmAdapter as any).promptLoader;
      const titleLoader = (titleGenerationAdapter as any).promptLoader;
      
      expect(whisperLoader).toBe(llmLoader);
      expect(llmLoader).toBe(titleLoader);
      expect(titleLoader).toBe(promptLoader);
    });

    test('all adapters should handle missing prompts gracefully', () => {
      // Create adapters without YAML file
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (PromptLoader as any).instance = null;
      
      const newPromptLoader = PromptLoader.getInstance();
      const newWhisperAdapter = new WhisperAdapter(newPromptLoader);
      const newLlmAdapter = new LLMAdapter(newPromptLoader);
      const newTitleAdapter = new TitleGenerationAdapter(
        { titleGeneration: { provider: 'openrouter' } },
        newPromptLoader
      );
      
      // All should have fallback prompts
      const transcriptionPrompt = newPromptLoader.getPrompt('transcription.gemini.default');
      const summarizationPrompt = newPromptLoader.getPrompt('summarization.default');
      const titlePrompt = newPromptLoader.getPrompt('titleGeneration.default');
      
      expect(transcriptionPrompt).toContain('professional audio transcriber');
      expect(summarizationPrompt).toContain('Analyze the following transcription');
      expect(titlePrompt).toContain('3-4 word descriptive title');
    });
  });

  describe('Variable Interpolation in Adapters', () => {
    test('should interpolate all variable types correctly', () => {
      const context = {
        project: {
          name: 'TestProject',
          description: 'Test Description'
        },
        entities: {
          compressed: 'compressed data',
          detailed: 'detailed data',
          relevant: 'relevant data',
          key: 'key data'
        },
        user: {
          customPrompt: 'Custom user instructions'
        }
      };
      
      // Test transcription interpolation
      const gpt4oPrompt = promptLoader.getPrompt('transcription.gpt4o.default', context);
      expect(gpt4oPrompt).toContain('compressed data');
      
      const geminiPrompt = promptLoader.getPrompt('transcription.gemini.default', context);
      expect(geminiPrompt).toContain('detailed data');
      
      // Test summarization interpolation
      const summaryPrompt = promptLoader.getPrompt('summarization.default', context);
      expect(summaryPrompt).toContain('TestProject');
      expect(summaryPrompt).toContain('relevant data');
      
      const customPrompt = promptLoader.getPrompt('summarization.with_custom', context);
      expect(customPrompt).toContain('Custom user instructions');
      
      // Test title generation interpolation
      const titlePrompt = promptLoader.getPrompt('titleGeneration.default', context);
      expect(titlePrompt).toContain('TestProject');
      expect(titlePrompt).toContain('key data');
    });
  });
});