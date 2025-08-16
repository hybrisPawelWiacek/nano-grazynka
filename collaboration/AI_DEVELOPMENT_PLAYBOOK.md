# AI Development Playbook - Avoiding Mistakes with Claude Code CLI

## Overview
This playbook documents best practices and patterns for preventing common errors when developing with AI assistants, particularly Claude Code CLI. It's a living document that should be extended as new patterns and solutions are discovered.

## Table of Contents
1. [Method Signature Errors](#method-signature-errors)
2. [Context Management](#context-management)
3. [Code Generation Patterns](#code-generation-patterns)
4. [Verification Strategies](#verification-strategies)
5. [Project-Specific Patterns](#project-specific-patterns)

---

## Method Signature Errors

### Problem Description
Method signature errors occur when implementations don't match their interface contracts. These are particularly common with AI assistants because:
- AI may not always check the interface definition before implementing
- Context windows can cause AI to "forget" earlier interface definitions  
- AI might make assumptions based on common patterns rather than checking actual signatures
- When multiple files are involved, AI might not cross-reference properly

### Real Example from Project
```typescript
// WRONG - What AI generated
await this.entityUsageRepository.trackUsage({
  entityId: entity.id,
  projectId: projectId,
  voiceNoteId: voiceNote.getId().toString(),
  usageType: 'transcription',
  userId: voiceNote.getUserId()!
});

// CORRECT - What interface expected
await this.entityUsageRepository.trackUsage([{
  entityId: entity.id,
  projectId: projectId,
  voiceNoteId: voiceNote.getId().toString(),
  usageType: 'transcription',
  userId: voiceNote.getUserId()!,
  wasUsed: true,
  wasCorrected: false
}]);
```

### Prevention Strategies

#### 1. TypeScript Configuration
Ensure strict type checking in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 2. AI Prompt Patterns

**Pattern A: Interface-First Development**
```
"First, show me the interface definition for [MethodName] in [InterfaceName], then implement it"
```

**Pattern B: Signature Verification**
```
"Before implementing, use Serena to find and verify the method signature of [MethodName] in [InterfaceName]"
```

**Pattern C: Contract Testing**
```
"Generate a TypeScript compile-time test that verifies [ImplementationClass] correctly implements [InterfaceName]"
```

#### 3. Workflow Patterns

**TDD Workflow for AI:**
1. Define interface with AI
2. Generate tests from interface
3. Implement to pass tests
4. Run type checking

**Verification Workflow:**
1. Read interface using Serena's `find_symbol`
2. Generate method stub with exact signature
3. Verify signature matches
4. Complete implementation
5. Run `tsc --noEmit` to verify

#### 4. Real-time Verification

Add to `package.json`:
```json
{
  "scripts": {
    "check:types": "tsc --noEmit",
    "check:watch": "tsc --noEmit --watch",
    "check:signatures": "ts-node scripts/signature-check.ts"
  }
}
```

Create `scripts/signature-check.ts`:
```typescript
// Compile-time verification that implementations match interfaces
import { IEntityRepository } from '../src/domain/repositories/IEntityRepository';
import { EntityRepository } from '../src/infrastructure/persistence/EntityRepository';

// This will fail compilation if signatures don't match
type VerifyImplements<T, U extends T> = U;
type VerifyEntityRepo = VerifyImplements<IEntityRepository, EntityRepository>;

console.log('✅ All implementations match their interfaces');
```

#### 5. Pre-commit Hooks

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type checking before commit
npm run check:types || {
  echo "❌ TypeScript type checking failed. Please fix errors before committing."
  exit 1
}
```

### Common Signature Patterns to Watch For

| Pattern | Common Mistake | Correct Approach |
|---------|---------------|------------------|
| Array Parameters | Passing single object | Wrap in array: `[object]` |
| Optional Properties | Using `undefined` union | Use `?` notation |
| DTOs vs Entities | Passing domain entities | Use DTOs for repository methods |
| Return Types | Assuming `void` | Check if Promise<T> is expected |
| Async Methods | Forgetting `await` | Always check if method is async |

---

## Context Management

### Problem Description
AI assistants can lose track of important context, especially in long sessions or after context compaction.

### Prevention Strategies

#### 1. Memory Entities for Signatures
Create dedicated memory entities:
```typescript
// Save to Memory MCP
Entity: METHOD_SIGNATURES
Observations:
- IEntityRepository.trackUsage expects EntityUsageRecord[]
- IProjectRepository.create expects CreateProjectDTO
- All repository methods return Promises
```

#### 2. Interface Documentation
Keep interfaces visible in comments:
```typescript
// Interface: trackUsage(records: EntityUsageRecord[]): Promise<void>
async trackUsageImplementation(records: EntityUsageRecord[]): Promise<void> {
  // Implementation
}
```

---

## Code Generation Patterns

### Anti-patterns to Avoid

#### 1. Assumption-Based Implementation
❌ **Don't:** Let AI implement based on assumptions
```
"Implement the trackUsage method"
```

✅ **Do:** Provide context and verification
```
"First find the IEntityUsageRepository interface, show me the trackUsage signature, then implement it"
```

#### 2. Bulk Changes Without Verification
❌ **Don't:** Make many changes at once
```
"Update all repository methods"
```

✅ **Do:** Incremental changes with verification
```
"Update one repository method, run type check, then proceed to next"
```

---

## Verification Strategies

### Multi-layer Verification Approach

1. **Compile-time:** TypeScript strict mode
2. **Pre-save:** VS Code TypeScript extension
3. **Pre-commit:** Husky hooks with `tsc --noEmit`
4. **CI/CD:** GitHub Actions type checking
5. **Runtime:** Type guards and validators

### Verification Checklist for AI

When implementing methods with AI, use this checklist:
- [ ] Interface definition retrieved and shown
- [ ] Method signature copied as comment
- [ ] Parameter types match exactly
- [ ] Return type matches exactly  
- [ ] Array vs single object verified
- [ ] Optional parameters use `?` notation
- [ ] Async/await properly handled
- [ ] `tsc --noEmit` passes

---

## Project-Specific Patterns

### nano-grazynka Specific Patterns

#### Repository Pattern
- Repositories take DTOs, not domain entities
- All repository methods return Promises
- Update methods take Partial<T> for updates

#### Use Case Pattern
- Input/Output interfaces for all use cases
- Success flag in output
- Error handling in try/catch

#### Entity Pattern
- Entities use specific types (person, company, technical, product)
- Arrays stored as JSON strings in database
- Null vs undefined handling for optional fields

### Common Gotchas

1. **Database URL:** Always use `file:/data/nano-grazynka.db` in Docker
2. **Import Paths:** Domain entities are in `/domain/entities/` not `/domain/models/`
3. **Container Registration:** Check `container.ts` for actual implementations used
4. **API Response Format:** Nested responses `{ voiceNote: {...} }` not flat

---

## Continuous Improvement

### How to Extend This Playbook

When you encounter a new type of error:

1. **Document the Error:**
   - What went wrong
   - Why it happened
   - Code example

2. **Analyze Root Cause:**
   - Was it a context issue?
   - Was it an assumption?
   - Was it a missing verification?

3. **Create Prevention Strategy:**
   - TypeScript config change?
   - New prompt pattern?
   - New verification step?

4. **Test the Strategy:**
   - Apply to similar cases
   - Verify it prevents the error
   - Document results

5. **Update Playbook:**
   - Add to relevant section
   - Include examples
   - Update checklists

### Metrics to Track

- Method signature errors per session
- Time to detect errors
- Compilation success rate
- Test coverage for interfaces
- Context compaction frequency

---

## Quick Reference Card

### Before Implementing Any Method
```bash
# 1. Find the interface
claude> "Use Serena to find the interface definition for [MethodName]"

# 2. Verify signature
claude> "Show me the exact signature including parameter and return types"

# 3. Implement with comment
claude> "Implement with the signature as a comment above"

# 4. Type check
npm run check:types
```

### After Any Interface Change
```bash
# 1. Find all implementations
claude> "Find all classes implementing [InterfaceName]"

# 2. Update implementations
claude> "Update each implementation to match new signature"

# 3. Run comprehensive check
npm test && npm run check:types
```

### When Context is Compacted
```bash
# 1. Load memory
claude> "Load METHOD_SIGNATURES from Memory"

# 2. Verify current state
claude> "Show current working directory and git status"

# 3. Continue from checkpoint
claude> "Continue from last TODO item"
```

---

## Appendix: Tool Configurations

### VS Code Settings
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on"
}
```

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

---

*Last Updated: August 2025*
*Version: 1.0.0*
*Contributors: AI Development Team*