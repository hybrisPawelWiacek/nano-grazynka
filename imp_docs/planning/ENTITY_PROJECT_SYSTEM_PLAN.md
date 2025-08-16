# Entity Project System Implementation Plan
**Created**: August 16, 2025  
**Status**: Ready for Implementation  
**Priority**: HIGH - Core Value Enhancement  
**Timeline**: 4-5 days  
**Dependency**: Requires YAML Prompt System completion

## Executive Summary

Build a knowledge-based entity system that dramatically improves transcription accuracy by injecting domain-specific vocabulary, proper nouns, and technical terms into AI prompts. Entities are shared across projects, with projects serving as grouping mechanisms for both entities and voice notes. This transforms nano-Grazynka from a simple transcription tool into an organizational knowledge system.

## Value Proposition

### Before Entity System
- **Transcription**: "The team discussed clawed API with Darry-o about RLH app"
- **Accuracy**: ~70% for proper nouns and technical terms
- **User effort**: Manual corrections after every transcription

### After Entity System
- **Transcription**: "The team discussed Claude API with Dario about RLHF"
- **Accuracy**: ~95% for known entities
- **User effort**: One-time entity setup, automatic application

### Business Impact
- **80% reduction** in post-transcription correction time
- **Organizational knowledge preservation** across team members
- **New employee onboarding** accelerated with pre-defined glossaries
- **Project context switching** becomes instant and accurate

## System Architecture

### Core Concepts

1. **Entities**: Reusable vocabulary items (people, companies, technical terms, products)
2. **Projects**: Grouping mechanism for entities and voice notes
3. **Many-to-Many Relationships**: Entities can belong to multiple projects
4. **Usage Tracking**: Learn from corrections for future ML enhancements

### Database Schema

```sql
-- Core entity storage (shared across all projects)
CREATE TABLE Entities (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  userId          TEXT NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN ('person', 'company', 'technical', 'product')),
  value           TEXT NOT NULL,  -- The actual text to use
  aliases         TEXT,            -- JSON array of alternatives
  description     TEXT,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, name, type)
);

-- Projects for grouping
CREATE TABLE Projects (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  userId          TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  isActive        BOOLEAN DEFAULT true,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, name)
);

-- Many-to-many: Projects ↔ Entities
CREATE TABLE ProjectEntities (
  projectId       TEXT NOT NULL,
  entityId        TEXT NOT NULL,
  addedAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (projectId, entityId),
  FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE,
  FOREIGN KEY (entityId) REFERENCES Entities(id) ON DELETE CASCADE
);

-- Many-to-many: Projects ↔ Voice Notes
CREATE TABLE ProjectNotes (
  projectId       TEXT NOT NULL,
  voiceNoteId     TEXT NOT NULL,
  addedAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (projectId, voiceNoteId),
  FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE,
  FOREIGN KEY (voiceNoteId) REFERENCES VoiceNote(id) ON DELETE CASCADE
);

-- Usage tracking for future ML
CREATE TABLE EntityUsage (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  entityId        TEXT NOT NULL,
  voiceNoteId     TEXT NOT NULL,
  projectId       TEXT,
  wasUsed         BOOLEAN DEFAULT false,
  wasCorrected    BOOLEAN DEFAULT false,
  originalText    TEXT,
  correctedText   TEXT,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entityId) REFERENCES Entities(id),
  FOREIGN KEY (voiceNoteId) REFERENCES VoiceNote(id),
  FOREIGN KEY (projectId) REFERENCES Projects(id)
);

-- Add projectId to VoiceNote table
ALTER TABLE VoiceNote ADD COLUMN projectId TEXT;
ALTER TABLE VoiceNote ADD FOREIGN KEY (projectId) REFERENCES Projects(id);
```

## Implementation Plan

### Phase 1: Backend Infrastructure (Day 1-2)

#### Entity Repository
```typescript
// src/domain/repositories/IEntityRepository.ts
export interface IEntityRepository {
  create(entity: Entity): Promise<Entity>;
  update(id: string, updates: Partial<Entity>): Promise<Entity>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Entity | null>;
  findByUserId(userId: string): Promise<Entity[]>;
  findByProject(projectId: string): Promise<Entity[]>;
  searchByName(userId: string, query: string): Promise<Entity[]>;
}

// src/infrastructure/persistence/EntityRepository.ts
@injectable()
export class EntityRepository implements IEntityRepository {
  constructor(
    @inject('DatabaseClient') private db: DatabaseClient
  ) {}

  async create(entity: Entity): Promise<Entity> {
    const result = await this.db.entity.create({
      data: {
        userId: entity.userId,
        name: entity.name,
        type: entity.type,
        value: entity.value,
        aliases: entity.aliases ? JSON.stringify(entity.aliases) : null,
        description: entity.description
      }
    });
    return this.mapToEntity(result);
  }

  async findByProject(projectId: string): Promise<Entity[]> {
    const results = await this.db.projectEntity.findMany({
      where: { projectId },
      include: { entity: true }
    });
    return results.map(r => this.mapToEntity(r.entity));
  }
  
  // ... other methods
}
```

#### Project Repository
```typescript
// src/domain/repositories/IProjectRepository.ts
export interface IProjectRepository {
  create(project: Project): Promise<Project>;
  update(id: string, updates: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  addEntity(projectId: string, entityId: string): Promise<void>;
  removeEntity(projectId: string, entityId: string): Promise<void>;
  addNote(projectId: string, noteId: string): Promise<void>;
}
```

#### Entity Context Builder
```typescript
// src/application/services/EntityContextBuilder.ts
@injectable()
export class EntityContextBuilder {
  constructor(
    @inject('IEntityRepository') private entityRepo: IEntityRepository,
    @inject('IProjectRepository') private projectRepo: IProjectRepository
  ) {}

  async buildContext(
    userId: string,
    projectId: string | null,
    modelType: 'gpt4o' | 'gemini'
  ): Promise<EntityContext> {
    // Get entities for project
    const entities = projectId 
      ? await this.entityRepo.findByProject(projectId)
      : await this.entityRepo.findByUserId(userId);

    // Group by type
    const grouped = this.groupByType(entities);

    // Optimize for model
    if (modelType === 'gpt4o') {
      return this.compressForGPT4o(grouped);
    } else {
      return this.expandForGemini(grouped);
    }
  }

  private compressForGPT4o(grouped: GroupedEntities): EntityContext {
    // Simple compression: top 20 entities as comma-separated list
    const allEntities = Object.values(grouped).flat();
    const top20 = allEntities.slice(0, 20);
    
    return {
      compressed: top20.map(e => e.value).join(', '),
      people: '',
      technical: '',
      companies: '',
      products: ''
    };
  }

  private expandForGemini(grouped: GroupedEntities): EntityContext {
    return {
      compressed: '',
      people: grouped.person?.map(e => `${e.value} (${e.description || 'team member'})`).join(', ') || '',
      technical: grouped.technical?.map(e => e.value).join(', ') || '',
      companies: grouped.company?.map(e => e.value).join(', ') || '',
      products: grouped.product?.map(e => e.value).join(', ') || '',
      detailed: this.buildDetailedContext(grouped)
    };
  }

  private buildDetailedContext(grouped: GroupedEntities): string {
    let context = '';
    
    if (grouped.person?.length) {
      context += `Team Members:\n${grouped.person.map(e => `- ${e.value}`).join('\n')}\n\n`;
    }
    
    if (grouped.technical?.length) {
      context += `Technical Terms:\n${grouped.technical.map(e => `- ${e.value}: ${e.description || ''}`).join('\n')}\n\n`;
    }
    
    // ... other types
    
    return context;
  }
}
```

### Phase 2: API Endpoints (Day 2)

```typescript
// src/presentation/api/routes/entityRoutes.ts
export function registerEntityRoutes(app: FastifyInstance) {
  // Entity CRUD
  app.post('/api/entities', async (request, reply) => {
    const { name, type, value, aliases, description } = request.body;
    const userId = request.user.id;
    
    const entity = await entityService.create({
      userId, name, type, value, aliases, description
    });
    
    return { entity };
  });

  app.get('/api/entities', async (request, reply) => {
    const userId = request.user.id;
    const entities = await entityService.findByUser(userId);
    return { entities };
  });

  app.put('/api/entities/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    const entity = await entityService.update(id, updates);
    return { entity };
  });

  app.delete('/api/entities/:id', async (request, reply) => {
    const { id } = request.params;
    await entityService.delete(id);
    return { success: true };
  });

  // Project CRUD
  app.post('/api/projects', async (request, reply) => {
    const { name, description } = request.body;
    const userId = request.user.id;
    
    const project = await projectService.create({
      userId, name, description
    });
    
    return { project };
  });

  app.get('/api/projects', async (request, reply) => {
    const userId = request.user.id;
    const projects = await projectService.findByUser(userId);
    return { projects };
  });

  // Project-Entity associations
  app.post('/api/projects/:projectId/entities', async (request, reply) => {
    const { projectId } = request.params;
    const { entityIds } = request.body;
    
    await projectService.addEntities(projectId, entityIds);
    return { success: true };
  });

  app.get('/api/projects/:projectId/entities', async (request, reply) => {
    const { projectId } = request.params;
    const entities = await entityService.findByProject(projectId);
    return { entities };
  });
}
```

### Phase 3: Frontend UI Components (Day 3-4)

#### Entity Manager (Settings Page)
```tsx
// frontend/components/EntityManager.tsx
export function EntityManager() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [newEntity, setNewEntity] = useState({ name: '', type: 'technical', value: '' });

  const handleAddEntity = async () => {
    const response = await api.createEntity(newEntity);
    setEntities([...entities, response.entity]);
    setNewEntity({ name: '', type: 'technical', value: '' });
  };

  return (
    <div className={styles.entityManager}>
      <h2>Entity Manager</h2>
      
      <div className={styles.addEntity}>
        <input
          placeholder="Entity name"
          value={newEntity.name}
          onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
        />
        
        <select
          value={newEntity.type}
          onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
        >
          <option value="person">Person</option>
          <option value="company">Company</option>
          <option value="technical">Technical Term</option>
          <option value="product">Product</option>
        </select>
        
        <input
          placeholder="Value (how it should appear)"
          value={newEntity.value}
          onChange={(e) => setNewEntity({ ...newEntity, value: e.target.value })}
        />
        
        <button onClick={handleAddEntity}>Add Entity</button>
      </div>

      <div className={styles.entityList}>
        {entities.map(entity => (
          <div key={entity.id} className={styles.entity}>
            <span className={styles.entityName}>{entity.name}</span>
            <span className={styles.entityType}>[{entity.type}]</span>
            <span className={styles.entityValue}>{entity.value}</span>
            <button onClick={() => handleDeleteEntity(entity.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Project Selector (Upload Flow)
```tsx
// frontend/components/ProjectSelector.tsx
export function ProjectSelector({ 
  selectedProject, 
  onProjectChange 
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    api.getProjects().then(data => setProjects(data.projects));
  }, []);

  return (
    <select 
      className={styles.projectSelector}
      value={selectedProject?.id || ''}
      onChange={(e) => {
        const project = projects.find(p => p.id === e.target.value);
        onProjectChange(project || null);
      }}
    >
      <option value="">No Project</option>
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
      <option value="new">+ New Project</option>
    </select>
  );
}
```

#### Upload Flow Integration
```tsx
// frontend/app/page.tsx (Homepage)
export default function HomePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectEntities, setProjectEntities] = useState<Entity[]>([]);

  useEffect(() => {
    if (selectedProject) {
      // Load entities for selected project
      api.getProjectEntities(selectedProject.id)
        .then(data => setProjectEntities(data.entities));
    }
  }, [selectedProject]);

  const handleUpload = async (file: File, options: UploadOptions) => {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('transcriptionModel', options.model);
    
    // Include project and entity context
    if (selectedProject) {
      formData.append('projectId', selectedProject.id);
    }
    
    // Entities will be loaded server-side based on projectId
    await api.uploadVoiceNote(formData);
  };

  return (
    <div>
      <ProjectSelector 
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
      />
      
      {projectEntities.length > 0 && (
        <div className={styles.entityPreview}>
          <p>Active entities: {projectEntities.length}</p>
          <div className={styles.entityPills}>
            {projectEntities.slice(0, 5).map(e => (
              <span key={e.id} className={styles.pill}>
                {e.name}
              </span>
            ))}
            {projectEntities.length > 5 && (
              <span className={styles.pill}>+{projectEntities.length - 5} more</span>
            )}
          </div>
        </div>
      )}
      
      {/* Rest of upload UI */}
    </div>
  );
}
```

### Phase 4: Transcription Integration (Day 4-5)

#### Update Processing Orchestrator
```typescript
// src/application/services/ProcessingOrchestrator.ts
export class ProcessingOrchestrator {
  async processAudioFile(params: ProcessingParams): Promise<ProcessingResult> {
    const { audioPath, userId, projectId, transcriptionModel } = params;
    
    // Build entity context
    const entityContext = await this.entityContextBuilder.buildContext(
      userId,
      projectId,
      transcriptionModel === 'gpt-4o-transcribe' ? 'gpt4o' : 'gemini'
    );
    
    // Get prompt with entity injection
    const prompt = this.promptLoader.getPrompt(
      `transcription.${transcriptionModel}.default`,
      {
        project: projectId ? await this.projectRepo.findById(projectId) : { name: '' },
        entities: entityContext
      }
    );
    
    // Transcribe with entity-aware prompt
    const transcription = await this.whisperAdapter.transcribe(
      audioPath,
      language,
      {
        model: transcriptionModel,
        prompt: prompt
      }
    );
    
    // Track entity usage
    await this.trackEntityUsage(transcription, projectId, entityContext);
    
    // Continue with summarization...
  }
  
  private async trackEntityUsage(
    transcription: string,
    projectId: string | null,
    entityContext: EntityContext
  ): Promise<void> {
    // Simple tracking: check if entities appear in transcription
    // Future: ML-based detection of corrections
    const usedEntities = this.detectUsedEntities(transcription, entityContext);
    
    for (const entityId of usedEntities) {
      await this.entityUsageRepo.create({
        entityId,
        voiceNoteId: transcription.id,
        projectId,
        wasUsed: true
      });
    }
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('EntityContextBuilder', () => {
  it('should compress entities for GPT-4o', async () => {
    const entities = createMockEntities(30);
    const context = await builder.buildContext('user1', 'project1', 'gpt4o');
    
    expect(context.compressed).toBeDefined();
    expect(context.compressed.split(',').length).toBeLessThanOrEqual(20);
  });

  it('should expand entities for Gemini', async () => {
    const entities = createMockEntities(30);
    const context = await builder.buildContext('user1', 'project1', 'gemini');
    
    expect(context.detailed).toBeDefined();
    expect(context.people).toBeDefined();
    expect(context.technical).toBeDefined();
  });
});

describe('Entity API', () => {
  it('should create entity', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/entities',
      payload: {
        name: 'Claude API',
        type: 'technical',
        value: 'Claude API',
        aliases: ['Claude SDK', 'Anthropic API']
      }
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json().entity.name).toBe('Claude API');
  });
});
```

### Integration Tests
- Create project with entities
- Upload audio with project context
- Verify entity injection in prompts
- Check transcription accuracy improvement
- Test entity usage tracking

### E2E Tests
```typescript
test('should use project entities in transcription', async ({ page }) => {
  // Create project
  await page.goto('/settings');
  await page.click('text=Projects');
  await page.fill('input[name="projectName"]', 'Test Project');
  await page.click('text=Create Project');
  
  // Add entities
  await page.click('text=Entity Manager');
  await page.fill('input[name="entityName"]', 'Anthropic');
  await page.selectOption('select', 'company');
  await page.click('text=Add Entity');
  
  // Upload with project
  await page.goto('/');
  await page.selectOption('select.projectSelector', 'Test Project');
  await page.setInputFiles('input[type="file"]', 'test-audio.m4a');
  await page.click('text=Upload');
  
  // Verify transcription includes correct entity
  await page.waitForSelector('text=Anthropic');
});
```

## Migration Strategy

### Database Migration
```sql
-- Migration: 001_add_entity_system.sql
BEGIN TRANSACTION;

-- Create all tables as defined in schema section
CREATE TABLE Entities (...);
CREATE TABLE Projects (...);
CREATE TABLE ProjectEntities (...);
CREATE TABLE ProjectNotes (...);
CREATE TABLE EntityUsage (...);

-- Add projectId to existing VoiceNote
ALTER TABLE VoiceNote ADD COLUMN projectId TEXT;

-- Create indexes for performance
CREATE INDEX idx_entities_user ON Entities(userId);
CREATE INDEX idx_projects_user ON Projects(userId);
CREATE INDEX idx_entity_usage_entity ON EntityUsage(entityId);
CREATE INDEX idx_entity_usage_note ON EntityUsage(voiceNoteId);

COMMIT;
```

### Rollout Plan
1. Deploy database schema
2. Deploy backend with entity support
3. Deploy frontend with UI components
4. Enable for beta users first
5. Gradual rollout to all users

## Success Metrics

### Quantitative
- **Transcription accuracy**: Measure proper noun accuracy before/after
- **Correction rate**: Track how often users fix entity-related errors
- **Entity adoption**: Number of entities created per user
- **Project usage**: Percentage of uploads using projects

### Qualitative
- User feedback on accuracy improvement
- Time saved on corrections
- Ease of entity management
- Value of project organization

## MVP Scope

### What We Build
- ✅ Entity CRUD operations
- ✅ Project CRUD operations
- ✅ Many-to-many relationships
- ✅ Simple UI for management
- ✅ Project selector in upload
- ✅ Basic GPT-4o compression
- ✅ Rich Gemini context
- ✅ Integration with transcription

### What We DON'T Build (MVP)
- ❌ Team sharing of entities
- ❌ Entity import/export
- ❌ Auto-suggestion based on history
- ❌ ML-based entity extraction
- ❌ Complex entity hierarchies
- ❌ Entity versioning
- ❌ Usage analytics dashboard

## Future Enhancements

### Phase 2 (Next Sprint)
- Auto-suggest entities based on patterns
- Bulk import from CSV/JSON
- Entity usage analytics
- Smart entity detection from corrections

### Phase 3 (Future)
- ML-powered entity extraction
- Team entity sharing
- Integration with external systems
- Industry-specific entity packs
- Entity disambiguation
- Phonetic matching

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance with many entities | Medium | Medium | Implement caching |
| User adoption complexity | Medium | High | Simple UI, good defaults |
| Entity name conflicts | Low | Low | User-scoped uniqueness |
| Database migration issues | Low | High | Thorough testing, rollback plan |

## Dependencies

### Required First
- YAML Prompt System (for variable interpolation)

### External Dependencies
- None

## Definition of Done

- [ ] Database schema implemented
- [ ] Entity CRUD API complete
- [ ] Project CRUD API complete
- [ ] Entity Manager UI functional
- [ ] Project Selector integrated
- [ ] Entity context building working
- [ ] GPT-4o compression implemented
- [ ] Gemini expansion implemented
- [ ] Transcription integration complete
- [ ] Entity usage tracking working
- [ ] Tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Performance acceptable (<100ms overhead)
- [ ] Deployed to production

---
*This system transforms nano-Grazynka into an organizational knowledge platform that learns and improves with use.*