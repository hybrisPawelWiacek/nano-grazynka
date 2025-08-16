# YAML Prompt System Implementation Plan
**Created**: August 16, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH - Foundation for Entity System  
**Timeline**: 3 days

## Executive Summary

Externalize all AI prompts from hardcoded strings and `config.yaml` into a dedicated `prompts.yaml` file with variable interpolation support. This creates a clean separation between system configuration and prompt templates, enabling easier maintenance, hot-reload capabilities, and preparing infrastructure for the entity system.

## Objectives

1. **Centralize all prompts** in a single `prompts.yaml` file
2. **Enable variable interpolation** with {{placeholder}} syntax
3. **Support hot-reload** in development for rapid iteration
4. **Maintain backward compatibility** during migration
5. **Prepare for entity injection** with placeholder support

## Current State Analysis

### Existing Prompt Locations
- **config.yaml**: Lines 51-77 contain summarization and title generation prompts
- **WhisperAdapter**: Hardcoded transcription prompts
- **LLMAdapter**: Hardcoded summarization system prompts
- **TitleGenerationAdapter**: Hardcoded metadata extraction prompts
- **Frontend**: Custom prompt strings in components

### Problems with Current Approach
- Prompts mixed with configuration settings
- No variable support for dynamic content
- Requires code changes for prompt updates
- No A/B testing capability
- Difficult to maintain consistency

## Proposed Architecture

### File Structure
```
/backend/
├── config.yaml          # System configuration only
├── prompts.yaml         # All prompt templates (NEW)
└── src/
    └── infrastructure/
        └── config/
            └── PromptLoader.ts  # Prompt loading service (NEW)
```

### YAML Schema

```yaml
# prompts.yaml
version: "1.0"
metadata:
  description: "AI Prompt Templates for nano-Grazynka"
  last_updated: "2025-08-16"

# Transcription prompts
transcription:
  gpt4o:
    default: "Transcribe this audio. Key terms: {{entities.compressed}}"
    meeting: "Meeting transcription. Attendees: {{entities.people}}"
    technical: "Technical discussion. Terms: {{entities.technical}}"
    
  gemini:
    default: |
      ## Transcription Context
      Project: {{project.name}}
      
      People: {{entities.people}}
      Companies: {{entities.companies}}
      Technical terms: {{entities.technical}}
      Products: {{entities.products}}
      
      Maintain exact spelling and capitalization for all terms above.
      
    meeting: |
      ## Meeting Transcription
      Project: {{project.name}}
      Attendees: {{entities.people.detailed}}
      
      Focus on:
      - Action items and decisions
      - Speaker attribution
      - Key discussion points
      
    technical: |
      ## Technical Discussion
      Technologies: {{entities.technical.detailed}}
      
      Preserve:
      - Code snippets and commands
      - Technical terminology
      - Architecture decisions

# Summarization prompts
summarization:
  default: |
    Summarize the following transcript concisely, capturing key points and main ideas.
    Context: {{entities.relevant}}
    Language: Maintain the original language of the transcript.
    
  with_custom: "{{user.customPrompt}}"
  
  action_items: |
    Extract actionable items from the following transcript as a bullet list.
    Team members: {{entities.people}}
    Project: {{project.name}}

# Title generation prompts
titleGeneration:
  default: |
    Given this voice note transcription, generate:
    1. A 3-4 word descriptive title
    2. A 10-15 word summary of the main topic
    3. Any specific date mentioned in the content (or null if none)
    
    Context entities: {{entities.key}}
    
    Respond ONLY in JSON format:
    {
      "title": "...",
      "description": "...",
      "date": "YYYY-MM-DD or null"
    }

# Template definitions
templates:
  meeting:
    name: "Meeting Notes"
    description: "Optimized for meetings and discussions"
    models: ["gemini"]
    prompt_ref: "transcription.gemini.meeting"
    
  technical:
    name: "Technical Discussion"
    description: "For technical talks and code reviews"
    models: ["gemini"]
    prompt_ref: "transcription.gemini.technical"
    
  default:
    name: "General"
    description: "General purpose transcription"
    models: ["gpt4o", "gemini"]
    prompt_ref: "transcription.{{model}}.default"
```

## Implementation Plan

### Phase 1: PromptLoader Service (Day 1)

```typescript
// src/infrastructure/config/PromptLoader.ts
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { injectable } from 'inversify';
import _ from 'lodash';

interface PromptConfig {
  version: string;
  metadata: Record<string, any>;
  transcription: Record<string, any>;
  summarization: Record<string, any>;
  titleGeneration: Record<string, any>;
  templates: Record<string, any>;
}

@injectable()
export class PromptLoader {
  private prompts: PromptConfig;
  private readonly promptsPath: string;
  private fileWatcher?: fs.FSWatcher;

  constructor() {
    this.promptsPath = path.join(process.cwd(), 'prompts.yaml');
    this.loadPrompts();
    this.setupHotReload();
  }

  private loadPrompts(): void {
    try {
      const fileContent = fs.readFileSync(this.promptsPath, 'utf8');
      this.prompts = yaml.load(fileContent) as PromptConfig;
    } catch (error) {
      console.error('Failed to load prompts.yaml, using defaults', error);
      this.prompts = this.getDefaultPrompts();
    }
  }

  private setupHotReload(): void {
    if (process.env.NODE_ENV === 'development') {
      this.fileWatcher = fs.watch(this.promptsPath, (eventType) => {
        if (eventType === 'change') {
          console.log('Reloading prompts.yaml...');
          this.loadPrompts();
        }
      });
    }
  }

  public getPrompt(
    path: string, 
    variables: Record<string, any> = {}
  ): string {
    const template = _.get(this.prompts, path, '');
    return this.interpolate(template, variables);
  }

  private interpolate(
    template: string, 
    variables: Record<string, any>
  ): string {
    // Replace {{variable}} with actual values
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = _.get(variables, path.trim());
      // Return empty string for missing entities initially
      return value !== undefined ? String(value) : '';
    });
  }

  public getTemplate(name: string): any {
    return this.prompts.templates?.[name];
  }

  private getDefaultPrompts(): PromptConfig {
    // Fallback prompts if YAML file is missing
    return {
      version: '1.0',
      metadata: {},
      transcription: {
        gpt4o: {
          default: 'Transcribe this audio accurately.'
        },
        gemini: {
          default: 'Transcribe this audio with context.'
        }
      },
      summarization: {
        default: 'Summarize the transcript.'
      },
      titleGeneration: {
        default: 'Generate a title for this content.'
      },
      templates: {}
    };
  }

  public dispose(): void {
    this.fileWatcher?.close();
  }
}
```

### Phase 2: Migration of Existing Prompts (Day 2)

#### Update WhisperAdapter
```typescript
// Before
const prompt = customPrompt || 'Transcribe accurately';

// After
const prompt = customPrompt || this.promptLoader.getPrompt(
  `transcription.${model}.default`,
  { entities: { compressed: '' }, project: { name: '' } }
);
```

#### Update LLMAdapter
```typescript
// Before
const systemPrompt = config.summarization.prompts.summary;

// After
const systemPrompt = this.promptLoader.getPrompt(
  'summarization.default',
  { 
    entities: { relevant: '' },
    user: { customPrompt: customPrompt }
  }
);
```

#### Update TitleGenerationAdapter
```typescript
// Before
const prompt = `Given this transcription...${hardcodedPrompt}`;

// After
const prompt = this.promptLoader.getPrompt(
  'titleGeneration.default',
  { entities: { key: '' } }
);
```

### Phase 3: Container Registration & Testing (Day 3)

#### Update Dependency Injection
```typescript
// src/presentation/api/container.ts
import { PromptLoader } from '../../infrastructure/config/PromptLoader';

container.bind<PromptLoader>(PromptLoader).toSelf().inSingletonScope();
```

#### Integration Tests
```typescript
describe('PromptLoader', () => {
  it('should load prompts from YAML', () => {
    const loader = new PromptLoader();
    const prompt = loader.getPrompt('transcription.gpt4o.default');
    expect(prompt).toBeDefined();
  });

  it('should interpolate variables', () => {
    const loader = new PromptLoader();
    const prompt = loader.getPrompt('transcription.gemini.default', {
      project: { name: 'Test Project' },
      entities: { people: 'John, Jane' }
    });
    expect(prompt).toContain('Test Project');
    expect(prompt).toContain('John, Jane');
  });

  it('should handle missing variables gracefully', () => {
    const loader = new PromptLoader();
    const prompt = loader.getPrompt('transcription.gpt4o.default', {});
    expect(prompt).not.toContain('{{');
  });
});
```

## Variable System

### Supported Variables (Phase 1)
All variables return empty strings initially, preparing for entity system:

- `{{project.name}}` - Project name (empty initially)
- `{{project.description}}` - Project description (empty initially)
- `{{entities.people}}` - List of people (empty initially)
- `{{entities.companies}}` - Company names (empty initially)
- `{{entities.technical}}` - Technical terms (empty initially)
- `{{entities.products}}` - Product names (empty initially)
- `{{entities.compressed}}` - Compressed for GPT-4o (empty initially)
- `{{entities.detailed}}` - Detailed for Gemini (empty initially)
- `{{entities.relevant}}` - Context-relevant entities (empty initially)
- `{{user.customPrompt}}` - User's custom prompt (passed through)

### Variable Resolution Order
1. Check provided variables object
2. Return empty string if not found (no error)
3. Future: Load from entity system

## Success Criteria

### Must Have
- ✅ All prompts externalized to `prompts.yaml`
- ✅ Variable interpolation working
- ✅ Backward compatibility maintained
- ✅ No regression in transcription/summarization quality
- ✅ Hot-reload working in development

### Nice to Have
- ✅ Prompt versioning support
- ✅ Template system for common scenarios
- ⏳ A/B testing infrastructure (future)
- ⏳ Prompt validation schema (future)

## Testing Plan

### Unit Tests
- PromptLoader class methods
- Variable interpolation logic
- Fallback behavior
- Template resolution

### Integration Tests
- WhisperAdapter with PromptLoader
- LLMAdapter with PromptLoader
- TitleGenerationAdapter with PromptLoader
- End-to-end transcription flow

### Manual Testing
- Hot-reload functionality
- Missing YAML file handling
- Malformed YAML handling
- Performance impact

## Migration Strategy

### Day 1
1. Create PromptLoader service
2. Create initial prompts.yaml
3. Add to dependency injection

### Day 2
1. Update WhisperAdapter
2. Update LLMAdapter
3. Update TitleGenerationAdapter
4. Test each adapter

### Day 3
1. Remove prompts from config.yaml
2. Full integration testing
3. Documentation update
4. Deploy to production

## Rollback Plan

If issues arise:
1. Keep original prompt code commented
2. Feature flag for prompt source (YAML vs hardcoded)
3. Quick revert via configuration
4. No database changes required

## Dependencies

### Prerequisites
- None (can be implemented independently)

### Will Enable
- Entity Project System (requires variable interpolation)
- A/B testing of prompts
- User-customizable prompts (future)

## Documentation Updates

- Update README with prompts.yaml description
- Add prompts.yaml to .gitignore.example
- Create PROMPTS_GUIDE.md for prompt customization
- Update API documentation

## Future Enhancements

After MVP:
1. **Prompt Versioning**: Track prompt iterations
2. **A/B Testing**: Compare prompt effectiveness
3. **User Overrides**: Allow users to customize prompts
4. **Prompt Analytics**: Track which prompts work best
5. **LLM-Optimized Prompts**: Auto-optimize based on results

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| YAML parsing errors | Low | High | Fallback to defaults |
| Performance impact | Low | Low | Cache parsed prompts |
| Hot-reload issues | Low | Low | Dev-only feature |
| Variable injection | Low | Medium | Sanitize inputs |

## Definition of Done

- [ ] prompts.yaml created with all prompts
- [ ] PromptLoader service implemented
- [ ] All adapters migrated to use PromptLoader
- [ ] Variable interpolation working
- [ ] Hot-reload functional in development
- [ ] Tests passing (unit & integration)
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Deployed to production

---
*This plan creates the foundation for the Entity Project System by establishing the variable interpolation infrastructure.*