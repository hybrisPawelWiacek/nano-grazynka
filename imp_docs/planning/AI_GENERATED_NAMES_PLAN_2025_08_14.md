# AI-Generated Names & Summaries Feature Plan
**Date**: August 14, 2025
**Status**: Planning
**Priority**: Medium

## Executive Summary
Implement AI-generated names and brief descriptions for voice notes to replace generic filenames, significantly improving the user experience when browsing and identifying notes in the library.

## Problem Statement
Currently, voice notes are displayed with their original filenames (e.g., "meeting_2025_01_15.m4a"), making it difficult for users to quickly identify content. Users must open each note to understand what it contains, creating friction in the workflow.

## Proposed Solution
Generate intelligent, contextual titles and brief descriptions using AI during the transcription phase, while preserving original filenames for reference.

## Feature Specifications

### Core Components

#### 1. AI-Generated Fields
- **AI Title**: 3-4 word descriptive name derived from content
- **Brief Description**: 10-15 word summary of the main topic
- **Derived Date**: Date extracted from content (if mentioned)

#### 2. Display Hierarchy
```
[AI Title - Bold, Primary]
[Original Filename - Small, Gray]
[Brief Description - Regular, Preview Text]
[Date - Smart Format]
```

### Technical Architecture

#### Database Schema Changes
```sql
ALTER TABLE VoiceNote ADD COLUMN aiGeneratedTitle TEXT;
ALTER TABLE VoiceNote ADD COLUMN briefDescription TEXT;
ALTER TABLE VoiceNote ADD COLUMN derivedDate DATETIME;
```

#### New Domain Components
```typescript
// Domain Service Interface
interface TitleGenerationService {
  generateMetadata(transcription: string): Promise<{
    title: string;
    description: string;
    date: Date | null;
  }>;
}
```

#### Processing Flow
1. Upload → Transcription → **Title Generation** → Summarization → Complete
2. Title generation happens immediately after transcription
3. Lightweight LLM call with focused prompt
4. Results stored in database
5. Frontend displays AI title with original as fallback

### Implementation Details

#### Backend Updates

##### 1. VoiceNote Entity Extensions
```typescript
// Add to VoiceNote.ts
private aiGeneratedTitle?: string;
private briefDescription?: string;
private derivedDate?: Date;

// Methods
setAIGeneratedTitle(title: string): void
setBriefDescription(description: string): void
setDerivedDate(date: Date): void
getDisplayTitle(): string // Returns AI title or original
```

##### 2. Title Generation Service
- Location: `/backend/src/infrastructure/adapters/TitleGenerationAdapter.ts`
- Implements domain interface
- Uses same LLM configuration as summarization
- Optimized prompt for speed and accuracy

##### 3. Processing Orchestrator Updates
```typescript
// In ProcessingOrchestrator.performTranscription()
const transcription = await this.transcriptionService.transcribe(...);
const metadata = await this.titleGenerationService.generateMetadata(
  transcription.getText()
);
voiceNote.setAIGeneratedTitle(metadata.title);
voiceNote.setBriefDescription(metadata.description);
if (metadata.date) voiceNote.setDerivedDate(metadata.date);
```

#### Frontend Updates

##### 1. VoiceNoteCard Component
```tsx
// Display logic
<h3 className={styles.title}>
  {note.aiGeneratedTitle || note.title}
</h3>
<span className={styles.originalName}>
  {note.aiGeneratedTitle ? note.originalFilename : null}
</span>
<p className={styles.description}>
  {note.briefDescription}
</p>
```

##### 2. Library View Enhancements
- Show brief descriptions in card view
- Smart date formatting (relative for recent, absolute for older)
- Visual indicator for AI-generated vs original names

### Prompt Engineering

#### Title Generation Prompt
```
You are a title generator for voice transcriptions. Generate:
1. A 3-4 word descriptive title
2. A 10-15 word summary of the main topic
3. Any specific date mentioned in the content

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "date": "YYYY-MM-DD or null"
}

Transcription:
[TRANSCRIPTION_TEXT]
```

### UX Considerations

#### Visual Design
- Maintain ultra-minimal Apple aesthetic
- No additional UI complexity
- Subtle typography hierarchy
- Clean information architecture

#### Interaction Patterns
- Hover to see full description
- Click to view/edit full note
- Original filename always accessible
- Graceful fallbacks for failed generation

### Performance Optimization

#### Strategies
1. **Parallel Processing**: Generate title while summarization runs
2. **Caching**: Store results to avoid regeneration
3. **Lightweight Prompts**: Minimal tokens for fast response
4. **Fallback Logic**: Use original title if generation fails

#### Expected Impact
- Processing time increase: ~1-2 seconds
- API cost increase: ~$0.001 per note
- User time saved: 5-10 seconds per library browse

### Migration Strategy

#### Phase 1: New Notes
- Deploy feature for newly uploaded notes
- Monitor quality and performance
- Gather user feedback

#### Phase 2: Batch Processing
- Optional background job to process existing notes
- User-triggered regeneration option
- Preserve original titles as backup

### Testing Plan

#### Unit Tests
- Title generation service
- Entity methods
- Fallback logic

#### Integration Tests
- Full processing flow
- API responses
- Database persistence

#### E2E Tests
- Upload with title generation
- Library display
- Edge cases (long titles, no date, etc.)

### Success Metrics

#### Quantitative
- Title generation success rate > 95%
- Processing time increase < 2 seconds
- User engagement with library view +20%

#### Qualitative
- Users can identify notes without opening
- Improved library browsing experience
- Reduced cognitive load

### Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Poor title quality | Low | Medium | Fallback to original, manual edit option |
| Increased costs | Low | Low | Efficient prompts, usage monitoring |
| Processing delays | Low | Medium | Parallel processing, timeout handling |
| Breaking changes | Low | High | Backward compatibility, gradual rollout |

### Implementation Timeline

#### Week 1
- Day 1: Database migration
- Day 2-3: Backend entity and service implementation
- Day 4-5: Processing flow integration

#### Week 2
- Day 1-2: API updates
- Day 3-4: Frontend implementation
- Day 5: Testing and refinement

### Dependencies
- Existing LLM infrastructure (OpenAI/OpenRouter)
- Database migration capabilities
- Frontend component system

### Open Questions
1. Should we allow manual editing of AI-generated titles?
2. Should we regenerate titles when reprocessing notes?
3. Should we show confidence scores for generated titles?
4. Should dates be extracted from filename if not in content?

### Future Enhancements
1. **Smart Categories**: Auto-categorize based on content
2. **Semantic Search**: Search by meaning, not just keywords
3. **Title Templates**: User-defined patterns for specific note types
4. **Batch Operations**: Regenerate titles for multiple notes

## Conclusion
This feature will significantly improve the nano-Grazynka user experience by making voice notes instantly recognizable and browsable. The implementation follows established patterns, maintains the minimal aesthetic, and adds genuine value without complexity.

## Next Steps
1. Review and approve plan
2. Create database migration
3. Begin backend implementation
4. Proceed with frontend updates
5. Test thoroughly
6. Deploy to production