# YAML Prompt System Implementation Plan v2
**Created**: August 16, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH - Foundation for Entity System  
**Timeline**: 3 days (6-8 hours per day)
**Updated**: After codebase investigation

## Executive Summary

Externalize all AI prompts from hardcoded strings and `config.yaml` into a dedicated `prompts.yaml` file with variable interpolation support. This creates a clean separation between system configuration and prompt templates, enabling easier maintenance, hot-reload capabilities, and preparing infrastructure for the entity system.

## Current State Analysis (Investigation Results)

### Identified Hardcoded Prompt Locations

1. **WhisperAdapter** (`backend/src/infrastructure/adapters/WhisperAdapter.ts`)
   - Lines 271-272: Hardcoded Gemini default system prompt
   ```typescript
   const defaultSystemPrompt = `You are a professional audio transcriber. Transcribe the following audio accurately in ${language.getValue() || 'English'}. 
   Preserve all spoken words exactly as heard. Include timestamps for long audio.`
   ```

2. **LLMAdapter** (`backend/src/infrastructure/adapters/LLMAdapter.ts`)
   - Lines 138-166: getSystemPrompt method
   - Currently uses ConfigLoader.get('summarization.prompts')
   - Handles custom vs default prompt logic

3. **TitleGenerationAdapter** (`backend/src/infrastructure/adapters/TitleGenerationAdapter.ts`)
   - Lines 128-150: buildPrompt method with hardcoded prompt
   ```typescript
   const basePrompt = this.config.titleGeneration?.prompt || 
     `Given this voice note transcription, generate:
     1. A 3-4 word descriptive title
     2. A 10-15 word summary of the main topic
     3. Any specific date mentioned in the content (or null if none)`
   ```

4. **config.yaml** (Root directory)
   - Lines 50-88: Contains prompts mixed with configuration
   - Summarization prompts (lines 51-77)
   - Title generation prompts (lines 78-88)

### Test Coverage Added

**Suite 13: YAML Prompt System Tests** has been added to TEST_PLAN.md with 15 comprehensive test cases:
- Y13.1-Y13.5: Core functionality (initialization, parsing, interpolation)
- Y13.6-Y13.8: Advanced features (hot-reload, fallback, templates)
- Y13.9-Y13.11: Adapter integrations
- Y13.12-Y13.15: Error handling and edge cases

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1 - 6 hours)

#### 1.1 Create PromptLoader Service (2 hours)
**File**: `backend/src/infrastructure/config/PromptLoader.ts`

```typescript
// Key implementation points:
- Singleton service with inversify
- YAML parsing with js-yaml
- Variable interpolation with lodash
- Hot-reload with fs.watch (dev only)
- Fallback to hardcoded defaults
```

#### 1.2 Create prompts.yaml (1 hour)
**File**: `backend/prompts.yaml`

Structure:
- Transcription prompts (gpt4o, gemini)
- Summarization prompts (default, custom, action_items)
- Title generation prompts
- Template definitions (meeting, technical, default)

#### 1.3 Dependency Injection Setup (1 hour)
**File**: `backend/src/presentation/api/container.ts`
- Add PromptLoader binding
- Ensure singleton scope
- Update adapter constructors

#### 1.4 Unit Tests for PromptLoader (2 hours)
**File**: `tests/unit/PromptLoader.test.ts`
- Test YAML loading
- Test variable interpolation
- Test fallback behavior
- Test error handling

### Phase 2: Adapter Migration (Day 2 - 8 hours)

#### 2.1 Migrate WhisperAdapter (2 hours)
**Changes at lines 271-272**:
```typescript
// Replace hardcoded prompt with:
const defaultSystemPrompt = this.promptLoader.getPrompt(
  `transcription.${modelType}.default`,
  {
    entities: { compressed: whisperPrompt || '' },
    project: { name: 'nano-Grazynka' }
  }
);
```

#### 2.2 Migrate LLMAdapter (2 hours)
**Changes at lines 138-166**:
```typescript
// Update getSystemPrompt method:
private getSystemPrompt(customPrompt?: string): string {
  return this.promptLoader.getPrompt(
    customPrompt ? 'summarization.with_custom' : 'summarization.default',
    {
      entities: { relevant: '' },
      user: { customPrompt: customPrompt }
    }
  );
}
```

#### 2.3 Migrate TitleGenerationAdapter (2 hours)
**Changes at lines 128-150**:
```typescript
// Replace buildPrompt method content:
private buildPrompt(transcription: string): string {
  const prompt = this.promptLoader.getPrompt(
    'titleGeneration.default',
    { entities: { key: '' } }
  );
  return `${prompt}\n\nTranscription:\n${transcription}`;
}
```

#### 2.4 Integration Tests (2 hours)
**File**: `tests/integration/prompt-system.test.ts`
- Test each adapter with PromptLoader
- Test end-to-end flow
- Test variable replacement

### Phase 3: Finalization & Testing (Day 3 - 6 hours)

#### 3.1 Remove Old Configuration (1 hour)
- Clean up prompts from config.yaml (lines 50-88)
- Update ConfigLoader references
- Ensure backward compatibility

#### 3.2 Variable Interpolation Tests (2 hours)
**File**: `tests/scripts/test-prompt-interpolation.js`
- Test all variable patterns
- Test nested paths
- Test missing variables
- Test edge cases

#### 3.3 End-to-End Testing (2 hours)
- Run full test suite
- Test with Docker environment
- Verify hot-reload in development
- Test fallback scenarios

#### 3.4 Documentation & Cleanup (1 hour)
- Update README.md
- Create PROMPTS_GUIDE.md
- Update API documentation
- Code review preparation

## Migration Checklist

### Pre-Implementation
- [x] Update TEST_PLAN.md with Suite 13
- [x] Identify all hardcoded prompt locations
- [ ] Review existing tests for conflicts
- [ ] Backup current config.yaml

### Implementation
- [ ] Create PromptLoader service
- [ ] Create prompts.yaml file
- [ ] Update container.ts
- [ ] Migrate WhisperAdapter
- [ ] Migrate LLMAdapter
- [ ] Migrate TitleGenerationAdapter
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test hot-reload functionality

### Post-Implementation
- [ ] Remove prompts from config.yaml
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create rollback instructions
- [ ] Deploy to production

## Variable System (Phase 1)

### Supported Placeholders
All return empty strings initially, preparing for entity system integration:

```yaml
{{project.name}}          # Project name
{{project.description}}   # Project description
{{entities.people}}       # List of people names
{{entities.companies}}    # Company names
{{entities.technical}}    # Technical terms
{{entities.products}}     # Product names
{{entities.compressed}}   # Compressed for GPT-4o (token limit)
{{entities.detailed}}     # Detailed for Gemini (1M tokens)
{{entities.relevant}}     # Context-relevant entities
{{user.customPrompt}}     # User's custom prompt (passed through)
```

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| YAML parsing errors | Fallback to hardcoded defaults with logging |
| Hot-reload crashes | Wrap in try-catch, disable on error |
| Variable injection attacks | Sanitize all inputs, no eval() |
| Performance regression | Cache parsed prompts, benchmark before/after |
| Breaking changes | Feature flag for gradual rollout |

## Success Metrics

### Functional
- ✅ All 15 test cases in Suite 13 passing
- ✅ No regression in transcription quality
- ✅ No regression in summarization quality
- ✅ Hot-reload working in development
- ✅ Fallback working when YAML missing

### Performance
- ⏱️ Prompt loading < 50ms
- ⏱️ Variable interpolation < 5ms
- ⏱️ No increase in API response time
- ⏱️ Hot-reload response < 100ms

### Code Quality
- 📊 Test coverage > 90% for PromptLoader
- 📊 Zero hardcoded prompts remaining
- 📊 All adapters using PromptLoader
- 📊 Documentation complete

## Rollback Plan

If critical issues arise:

1. **Quick Revert** (5 minutes)
   - Set environment variable `USE_LEGACY_PROMPTS=true`
   - PromptLoader returns hardcoded defaults
   - No code changes needed

2. **Full Rollback** (30 minutes)
   - Revert git commits
   - Restore config.yaml prompts
   - Redeploy previous version

## Dependencies & Prerequisites

### Required Before Starting
- ✅ Node.js environment ready
- ✅ Test suite operational
- ✅ Docker environment working
- ✅ Access to all adapter files

### NPM Packages Needed
```json
{
  "js-yaml": "^4.1.0",  // Already in project
  "lodash": "^4.17.21"  // Already in project
}
```

### Will Enable (Future)
- Entity Project System (requires variable interpolation)
- A/B testing of prompts
- User-customizable prompts
- Prompt versioning and analytics

## Definition of Done

- [ ] All prompts externalized to prompts.yaml
- [ ] PromptLoader service fully implemented
- [ ] All three adapters migrated
- [ ] Variable interpolation working
- [ ] Hot-reload functional in dev
- [ ] All 15 tests in Suite 13 passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production

---
*Updated after investigation: Added specific line numbers, comprehensive test suite, and detailed migration steps for each adapter.*