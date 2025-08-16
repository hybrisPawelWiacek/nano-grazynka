import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { PromptLoader } from '../../backend/src/infrastructure/config/PromptLoader';

// Mock fs module
jest.mock('fs');

describe('PromptLoader', () => {
  let promptLoader: PromptLoader;
  const mockYamlPath = path.join(process.cwd(), 'backend', 'prompts.yaml');
  
  const mockYamlContent = `
transcription:
  gpt4o:
    default: |
      Test transcription prompt for GPT-4o.
      {{entities.compressed}}
  gemini:
    default: |
      Test transcription prompt for Gemini.
      {{entities.detailed}}

summarization:
  default: |
    Summarize this content.
    {{entities.relevant}}
  with_custom: |
    {{user.customPrompt}}
    Additional instructions here.
  action_items: |
    Extract action items.

titleGeneration:
  default: |
    Generate title for {{project.name}}.
    {{entities.key}}
`;

  beforeEach(() => {
    // Reset singleton instance
    (PromptLoader as any).instance = null;
    
    // Setup default mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(mockYamlContent);
    (fs.watchFile as jest.Mock).mockImplementation(() => {});
    (fs.unwatchFile as jest.Mock).mockImplementation(() => {});
    
    // Set NODE_ENV to test to avoid hot-reload
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should load prompts from YAML file on initialization', () => {
      promptLoader = PromptLoader.getInstance();
      
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('prompts.yaml'));
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('prompts.yaml'), 'utf8');
    });

    test('should use fallback prompts when YAML file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      promptLoader = PromptLoader.getInstance();
      const prompt = promptLoader.getPrompt('transcription.gpt4o.default');
      
      expect(prompt).toContain('professional audio transcriber');
    });

    test('should handle YAML parsing errors gracefully', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      promptLoader = PromptLoader.getInstance();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PromptLoader] Error loading prompts'),
        expect.any(Error)
      );
      
      // Should fall back to default prompts
      const prompt = promptLoader.getPrompt('summarization.default');
      expect(prompt).toContain('Analyze the following transcription');
      
      consoleSpy.mockRestore();
    });

    test('should implement singleton pattern', () => {
      const instance1 = PromptLoader.getInstance();
      const instance2 = PromptLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Prompt Retrieval', () => {
    beforeEach(() => {
      promptLoader = PromptLoader.getInstance();
    });

    test('should retrieve prompt by path', () => {
      const prompt = promptLoader.getPrompt('transcription.gpt4o.default');
      
      expect(prompt).toContain('Test transcription prompt for GPT-4o');
      expect(prompt).toContain('{{entities.compressed}}');
    });

    test('should retrieve nested prompts', () => {
      const prompt = promptLoader.getPrompt('summarization.action_items');
      
      expect(prompt).toBe('Extract action items.');
    });

    test('should return fallback prompt for non-existent path', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const prompt = promptLoader.getPrompt('non.existent.path');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Prompt not found at path: non.existent.path')
      );
      expect(prompt).toBe('No prompt available');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Variable Interpolation', () => {
    beforeEach(() => {
      promptLoader = PromptLoader.getInstance();
    });

    test('should interpolate project variables', () => {
      const context = {
        project: {
          name: 'TestProject',
          description: 'Test Description'
        }
      };
      
      const prompt = promptLoader.getPrompt('titleGeneration.default', context);
      
      expect(prompt).toContain('Generate title for TestProject');
    });

    test('should interpolate entity variables', () => {
      const context = {
        entities: {
          compressed: 'compressed entities',
          detailed: 'detailed entities',
          relevant: 'relevant entities',
          key: 'key entities'
        }
      };
      
      const prompt = promptLoader.getPrompt('transcription.gpt4o.default', context);
      expect(prompt).toContain('compressed entities');
      
      const geminiPrompt = promptLoader.getPrompt('transcription.gemini.default', context);
      expect(geminiPrompt).toContain('detailed entities');
    });

    test('should interpolate user custom prompt', () => {
      const context = {
        user: {
          customPrompt: 'My custom instructions'
        }
      };
      
      const prompt = promptLoader.getPrompt('summarization.with_custom', context);
      
      expect(prompt).toContain('My custom instructions');
      expect(prompt).toContain('Additional instructions here');
    });

    test('should handle missing variables with empty strings', () => {
      const context = {
        entities: {}  // Empty entities
      };
      
      const prompt = promptLoader.getPrompt('transcription.gpt4o.default', context);
      
      // Should replace {{entities.compressed}} with empty string
      expect(prompt).toBe('Test transcription prompt for GPT-4o.\n');
    });

    test('should handle null context', () => {
      const prompt = promptLoader.getPrompt('summarization.default');
      
      // Should return template with placeholders intact
      expect(prompt).toContain('{{entities.relevant}}');
    });

    test('should use default values for missing context properties', () => {
      const context = {
        project: {}  // Empty project object
      };
      
      const prompt = promptLoader.getPrompt('titleGeneration.default', context);
      
      // Should use default project name
      expect(prompt).toContain('Generate title for nano-Grazynka');
    });
  });

  describe('Hot Reload', () => {
    test('should setup file watcher in development mode', () => {
      process.env.NODE_ENV = 'development';
      (PromptLoader as any).instance = null;
      
      promptLoader = PromptLoader.getInstance();
      
      expect(fs.watchFile).toHaveBeenCalledWith(
        expect.stringContaining('prompts.yaml'),
        { interval: 1000 },
        expect.any(Function)
      );
    });

    test('should not setup file watcher in production mode', () => {
      process.env.NODE_ENV = 'production';
      (PromptLoader as any).instance = null;
      
      promptLoader = PromptLoader.getInstance();
      
      expect(fs.watchFile).not.toHaveBeenCalled();
    });

    test('should reload prompts when file changes', () => {
      process.env.NODE_ENV = 'development';
      (PromptLoader as any).instance = null;
      
      let watchCallback: Function;
      (fs.watchFile as jest.Mock).mockImplementation((path, options, callback) => {
        watchCallback = callback;
      });
      
      promptLoader = PromptLoader.getInstance();
      
      // Simulate file change with new content
      const newContent = `
summarization:
  default: Updated prompt content
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(newContent);
      
      // Trigger watch callback
      watchCallback!();
      
      // Check that new content is loaded
      const prompt = promptLoader.getPrompt('summarization.default');
      expect(prompt).toBe('Updated prompt content');
    });

    test('should handle hot-reload errors gracefully', () => {
      process.env.NODE_ENV = 'development';
      (PromptLoader as any).instance = null;
      
      (fs.watchFile as jest.Mock).mockImplementation(() => {
        throw new Error('Watch setup failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      promptLoader = PromptLoader.getInstance();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[PromptLoader] Failed to setup hot-reload:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Public Methods', () => {
    beforeEach(() => {
      promptLoader = PromptLoader.getInstance();
    });

    test('getAllPrompts should return all loaded prompts', () => {
      const allPrompts = promptLoader.getAllPrompts();
      
      expect(allPrompts).toHaveProperty('transcription');
      expect(allPrompts).toHaveProperty('summarization');
      expect(allPrompts).toHaveProperty('titleGeneration');
    });

    test('reloadPrompts should reload prompts from file', () => {
      const newContent = `
summarization:
  default: Reloaded content
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(newContent);
      
      promptLoader.reloadPrompts();
      
      const prompt = promptLoader.getPrompt('summarization.default');
      expect(prompt).toBe('Reloaded content');
    });

    test('cleanup should remove file watcher', () => {
      process.env.NODE_ENV = 'development';
      (PromptLoader as any).instance = null;
      
      promptLoader = PromptLoader.getInstance();
      promptLoader.cleanup();
      
      expect(fs.unwatchFile).toHaveBeenCalledWith(
        expect.stringContaining('prompts.yaml')
      );
    });
  });

  describe('Fallback Prompts', () => {
    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      promptLoader = PromptLoader.getInstance();
    });

    test('should provide complete fallback prompts structure', () => {
      const allPrompts = promptLoader.getAllPrompts();
      
      // Check transcription fallbacks
      expect(allPrompts.transcription?.gpt4o?.default).toContain('professional audio transcriber');
      expect(allPrompts.transcription?.gemini?.default).toContain('professional audio transcriber');
      
      // Check summarization fallbacks
      expect(allPrompts.summarization?.default).toContain('Analyze the following transcription');
      expect(allPrompts.summarization?.with_custom).toContain('{{user.customPrompt}}');
      expect(allPrompts.summarization?.action_items).toContain('Extract and list all action items');
      
      // Check title generation fallbacks
      expect(allPrompts.titleGeneration?.default).toContain('3-4 word descriptive title');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      promptLoader = PromptLoader.getInstance();
    });

    test('should handle interpolation errors gracefully', () => {
      // Create a prompt with invalid template syntax
      const invalidYaml = `
test:
  invalid: "Unclosed template {{entities.test"
`;
      (fs.readFileSync as jest.Mock).mockReturnValue(invalidYaml);
      promptLoader.reloadPrompts();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const prompt = promptLoader.getPrompt('test.invalid', { entities: { test: 'value' } });
      
      // Should return fallback on error
      expect(prompt).toBe('No prompt available');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PromptLoader] Error getting prompt'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});