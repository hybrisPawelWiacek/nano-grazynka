# Documentation Structure

## Overview
This document explains the organization of documentation in the nano-Grazynka project.

## Documentation Split

The project uses a two-directory structure to separate concerns:

### `docs/` - Project Documentation
Contains technical documentation for the codebase and system design. This is the documentation developers need to understand and work with the actual code.

### `imp_docs/` - AI Process & Implementation Documentation  
Contains documentation for AI agents, requirements tracking, and development process. This includes planning documents, test results, and AI-specific playbooks.

## Document Categories

### Project Documentation (`docs/`)

#### Architecture Documents (`docs/architecture/`)
System design and technical architecture:
- **ARCHITECTURE.md** - System design patterns and DDD implementation
- **DATABASE.md** - Database schema and data models
- **CONFIGURATION.md** - Configuration management

#### API Documentation (`docs/api/`)
- **api-contract.md** - API endpoint specifications
- **api-spec.yaml** - OpenAPI specification
- **FRONTEND_ROUTES.md** - Frontend routing patterns and API mapping

#### Development Documentation (`docs/development/`)
- **DEVELOPMENT.md** - Development setup and debugging
- **AI_MODELS_SETUP.md** - AI models configuration (OpenRouter/OpenAI)

### AI Process Documentation (`imp_docs/`)

#### Requirements Documents (`imp_docs/requirements/`)
Human-managed business requirements that drive the project:
- **PRD_ACTUAL.md** - Complete requirements documentation (both implemented and pending)
- **PREMIUM_FEATURES.md** - Premium features and monetization specifications

#### Testing Documentation (`imp_docs/testing/`)
- **TEST_PLAN.md** - Testing strategy
- **TEST_RESULTS_2025_08_13.md** - Latest test execution results

#### Planning Documents (`imp_docs/planning/`)
Ephemeral planning documents for features currently being implemented:
- Active planning documents for ongoing work
- Move to `imp_docs/archive/` when implementation is complete

#### Playbooks (`imp_docs/playbook/`)
- **MCP_PLAYBOOK.md** - MCP server usage patterns and examples

#### Prompts (`imp_docs/prompts/`)
- **CONTEXT_RESET_PROMPT.md** - Context reset prompts for AI agents

#### Archive (`imp_docs/archive/`)
Completed planning documents and deprecated documentation:
- Historical documents preserved for reference
- Completed implementation plans
- Deprecated requirements

### Canonical Documents (Root Level)
These are the primary source of truth and should be kept up-to-date:
- **CLAUDE.md** - AI collaboration guide and documentation map
- **PROJECT_STATUS.md** - Current project status and progress tracker
- **README.md** - Quick start guide and project overview

## Document Management Rules

1. **Canonical documents** (CLAUDE.md, PROJECT_STATUS.md) must always be in root
2. **Project documentation** stays in `docs/` - technical, codebase-related
3. **AI process documentation** goes in `imp_docs/` - requirements, testing, planning
4. **Requirements** are human-managed and should rarely change
5. **Planning documents** are ephemeral and created for specific tasks
6. **No duplicate documents** - single source of truth principle
7. **Archive old versions** in `imp_docs/archive/` instead of deleting them

## Finding Information

| If you need... | Check... |
|----------------|----------|
| Current project state | PROJECT_STATUS.md (root) |
| What to work on | PROJECT_STATUS.md → Next Steps |
| System design info | docs/architecture/ARCHITECTURE.md |
| API endpoints | docs/api/api-contract.md |
| Feature requirements | imp_docs/requirements/PRD_ACTUAL.md |
| Test results | imp_docs/testing/TEST_RESULTS_2025_08_13.md |
| Test plan | imp_docs/testing/TEST_PLAN.md |
| MCP usage patterns | imp_docs/playbook/MCP_PLAYBOOK.md |
| How to use the codebase | CLAUDE.md (root) |
| Specific task plans | imp_docs/planning/*.md |
| Development setup | docs/development/DEVELOPMENT.md |

## Directory Structure

```
nano-grazynka/
├── CLAUDE.md                    # AI collaboration guide (canonical)
├── PROJECT_STATUS.md            # Project status tracker (canonical)
├── README.md                    # Quick start guide (canonical)
│
├── docs/                        # Project Documentation
│   ├── DOCUMENTATION_STRUCTURE.md  # This file
│   ├── api/                    # API specifications
│   │   ├── api-contract.md
│   │   ├── api-spec.yaml
│   │   └── FRONTEND_ROUTES.md
│   ├── architecture/           # System design & architecture
│   │   ├── ARCHITECTURE.md
│   │   ├── CONFIGURATION.md
│   │   └── DATABASE.md
│   └── development/            # Development setup & configuration
│       ├── AI_MODELS_SETUP.md
│       └── DEVELOPMENT.md
│
└── imp_docs/                   # AI Process & Implementation Documentation
    ├── requirements/           # Product requirements (PRD)
    │   ├── PRD_ACTUAL.md
    │   └── PREMIUM_FEATURES.md
    ├── testing/                # Test plans & results
    │   ├── TEST_PLAN.md
    │   └── TEST_RESULTS_2025_08_13.md
    ├── planning/               # Active planning documents
    │   └── FIX_PLAN_2025_08_13.md
    ├── playbook/               # MCP playbook & patterns
    │   └── MCP_PLAYBOOK.md
    ├── prompts/                # Context reset prompts
    │   └── CONTEXT_RESET_PROMPT.md
    └── archive/                # Completed/archived plans
        ├── UX_REARCHITECTURE_PLAN.md
        ├── USER_SYSTEM_IMPLEMENTATION.md
        └── [other archived documents]
```

---
Created: August 12, 2025
Updated: August 13, 2025 - Restructured to separate project docs from AI process docs