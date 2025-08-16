# Entity Project System - Implementation Prompts

**Created**: August 16, 2025  
**Purpose**: Structured prompts for implementing the Entity Project System in 3 phases  
**Estimated Timeline**: 4-5 days total (split across 3 sessions)

## Overview

These prompts are designed to implement the Entity Project System from `ENTITY_PROJECT_SYSTEM_PLAN.md` in three focused sessions, each with clear scope and deliverables. This approach prevents context overflow and ensures systematic progress.

---

## Prompt 1: Backend Infrastructure (Phase 1 - Database & Core)
**Estimated Time**: 1.5 days  
**Context Requirements**: Fresh session recommended

```
Implement Phase 1 of the Entity Project System from @imp_docs/planning/ENTITY_PROJECT_SYSTEM_PLAN.md

Focus on backend infrastructure:
1. Update Prisma schema with Entity, Project, ProjectEntity, ProjectNote, EntityUsage models
2. Update VoiceNote and User models with relationships
3. Run migration: DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate dev --name add_entity_project_system
4. Create domain models and interfaces (IEntityRepository, IProjectRepository)
5. Implement EntityRepository and ProjectRepository in infrastructure/persistence/
6. Create EntityContextBuilder service with compression/expansion logic
7. Update Container to register new dependencies

Key integration points:
- PromptLoader already accepts InterpolationContext with entities field
- prompts.yaml has placeholders ready ({{entities.compressed}}, {{entities.detailed}}, etc.)
- Follow existing DDD patterns and repository structure

Test with basic unit tests for EntityContextBuilder compression/expansion logic.
Commit when complete.
```

### Expected Deliverables
- ✅ Database schema updated with 5 new models
- ✅ Migration successfully applied
- ✅ Repository implementations working
- ✅ EntityContextBuilder compressing/expanding correctly
- ✅ Container wired with new dependencies
- ✅ Basic unit tests passing

---

## Prompt 2: API Layer & Processing Integration (Phase 2)
**Estimated Time**: 1.5 days  
**Context Requirements**: Phase 1 must be complete

```
Implement Phase 2 of the Entity Project System - API endpoints and processing integration.

Prerequisites: Phase 1 (database/repositories) must be complete.

Tasks:
1. Create entityRoutes.ts and projectRoutes.ts in presentation/api/routes/
2. Implement CRUD endpoints for entities and projects
3. Add project-entity association endpoints
4. Register routes in main API setup
5. Update ProcessingOrchestrator to:
   - Accept projectId parameter
   - Build entity context using EntityContextBuilder
   - Inject entities into PromptLoader context
   - Track entity usage in EntityUsage table
6. Update upload endpoint to accept projectId in FormData

Integration test: Create entity via API, associate with project, verify context building works.
Commit when complete.
```

### Expected Deliverables
- ✅ Entity CRUD API endpoints working
- ✅ Project CRUD API endpoints working
- ✅ Project-entity associations functional
- ✅ ProcessingOrchestrator using entity context
- ✅ Entity usage tracking implemented
- ✅ Upload endpoint accepts projectId
- ✅ Integration tests passing

---

## Prompt 3: Frontend UI & Full Integration Testing
**Estimated Time**: 2 days  
**Context Requirements**: Phases 1-2 must be complete

```
Implement Phase 3 of the Entity Project System - Frontend UI components and full integration.

Prerequisites: Phases 1-2 (backend/API) must be complete.

Frontend tasks:
1. Create EntityManager component for Settings page
   - CRUD interface for entities
   - Type categorization (person/company/technical/product)
2. Create ProjectSelector component
   - Dropdown with project list
   - "New Project" option
3. Update homepage upload flow:
   - Add ProjectSelector above upload area
   - Show entity preview pills for selected project
   - Pass projectId in upload FormData
4. Add API client methods in lib/api/ for entities/projects

Testing tasks:
1. Manual test: Create project → Add entities → Upload with project → Verify transcription uses entities
2. Write E2E test for entity-aware transcription flow
3. Performance test: Ensure <100ms overhead with entity injection

Update PROJECT_STATUS.md with completion status.
Commit when complete.
```

### Expected Deliverables
- ✅ EntityManager component functional
- ✅ ProjectSelector component integrated
- ✅ Upload flow includes project selection
- ✅ Entity preview pills showing
- ✅ API client methods working
- ✅ E2E tests passing
- ✅ Performance <100ms overhead
- ✅ PROJECT_STATUS.md updated

---

## Testing Checklist

### After Prompt 1
- [ ] Can create entities in database via Prisma
- [ ] EntityContextBuilder compresses for GPT-4o (top 20)
- [ ] EntityContextBuilder expands for Gemini (detailed)
- [ ] Container starts without errors

### After Prompt 2
- [ ] Can CRUD entities via API
- [ ] Can CRUD projects via API
- [ ] Can associate entities with projects
- [ ] Upload with projectId works
- [ ] Entity context injected into prompts

### After Prompt 3
- [ ] Full flow works: Create project → Add entities → Upload → Get accurate transcription
- [ ] UI is intuitive and responsive
- [ ] Performance overhead <100ms
- [ ] No regressions in existing functionality

---

## Rollback Plan

If issues arise at any phase:

1. **Database Rollback**:
   ```bash
   cd backend
   DATABASE_URL="file:../data/nano-grazynka.db" npx prisma migrate reset
   ```

2. **Git Rollback**:
   ```bash
   git reset --hard HEAD~1  # Rollback last commit
   ```

3. **Container Issues**:
   - Comment out new registrations in container.ts
   - Restart application

---

## Success Metrics

After all 3 prompts complete:
- **Transcription accuracy**: ~70% → ~95% for known entities
- **Correction time**: 80% reduction
- **Performance**: <100ms overhead
- **User experience**: Simple, intuitive entity management
- **Code quality**: Tests passing, no regressions

---

## Notes for Implementation

1. **Always use TodoWrite** to track progress within each prompt
2. **Test incrementally** - don't wait until the end
3. **Follow existing patterns** - check similar code in the codebase
4. **Use Memory MCP** to save important decisions and gotchas
5. **Commit after each prompt** for easy rollback if needed

---

*These prompts are designed for sequential execution. Each builds on the previous, so complete them in order.*