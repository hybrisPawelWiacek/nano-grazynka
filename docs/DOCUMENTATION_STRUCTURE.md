# Documentation Structure

## Overview
This document explains the organization of documentation in the nano-Grazynka project.

## Document Categories

### Canonical Documents (Root Level)
These are the primary source of truth and should be kept up-to-date:

- **CLAUDE.md** - AI collaboration guide and documentation map
- **PROJECT_STATUS.md** - Current project status and progress tracker
- **README.md** - Quick start guide and project overview

### Requirements Documents (`docs/requirements/`)
Human-managed business requirements that drive the project:

- **PRD_ACTUAL.md** - Complete requirements documentation (both implemented and pending)
- **PRD.md** - [ARCHIVED] Original MVP product requirements
- **prd_add_1.md** - [ARCHIVED] User system and monetization requirements

### Architecture Documents (`docs/architecture/`)
System design and technical architecture:

- **ARCHITECTURE.md** - System design patterns and DDD implementation
- **DATABASE.md** - Database schema and data models

### Planning Documents (`docs/planning/`)
Ephemeral planning documents for features currently being implemented:

- Active planning documents for ongoing work go here
- Move to `docs/archive/` when implementation is complete

### API Documentation (`docs/api/`)
- **api-contract.md** - API endpoint specifications
- **api-spec.yaml** - OpenAPI specification
- **FRONTEND_ROUTES.md** - Frontend routing patterns and API mapping

### Testing Documentation (`docs/testing/`)
- **TEST_PLAN.md** - Testing strategy
- **TEST_RESULTS.md** - Test execution results
- **integration-testing.md** - Integration testing guide

### Development Documentation (`docs/development/`)
- **DEVELOPMENT.md** - Development setup and debugging
- **AI_MODELS_SETUP.md** - AI models configuration (OpenRouter/OpenAI)

### Playbooks (`docs/playbook/`)
- **MCP_PLAYBOOK.md** - MCP server usage patterns and examples

### Archive (`docs/archive/`)
Completed planning documents and deprecated documentation:

- **UX_REARCHITECTURE_PLAN.md** - Completed anonymous usage implementation plan
- **USER_SYSTEM_IMPLEMENTATION.md** - Completed authentication system plan
- Historical documents preserved for reference

## Document Management Rules

1. **Canonical documents** (CLAUDE.md, PROJECT_STATUS.md) must always be in root
2. **Requirements** are human-managed and should rarely change
3. **Planning documents** are ephemeral and created for specific tasks
4. **No duplicate documents** - single source of truth principle
5. **Archive old versions** instead of deleting them

## Finding Information

| If you need... | Check... |
|----------------|----------|
| Current project state | PROJECT_STATUS.md (root) |
| What to work on | PROJECT_STATUS.md → Next Steps |
| System design info | docs/architecture/ARCHITECTURE.md |
| API endpoints | docs/api/api-contract.md |
| Feature requirements | docs/requirements/PRD_ACTUAL.md |
| How to use the codebase | CLAUDE.md (root) |
| Specific task plans | docs/planning/*.md |

---
Created: August 12, 2025