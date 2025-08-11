# Setting Up CLAUDE.md Files for Project Organization

## Overview
This playbook guides you through setting up CLAUDE.md files in project subfolders to provide Claude Code with project-specific context, instructions, and best practices. CLAUDE.md files help Claude understand project structure, conventions, and team preferences.

## Personality: Project Organizer
*Methodical, structured, detail-oriented. Ensures Claude has all necessary context for optimal assistance.*

## Why CLAUDE.md Files?

CLAUDE.md files serve as project-specific instruction manuals for Claude Code:
- **Project Context**: Architecture, tech stack, conventions
- **Team Preferences**: Coding standards, review processes
- **Tool Configuration**: MCP servers, build tools, testing frameworks
- **Domain Knowledge**: Business logic, terminology, constraints
- **Workflow Patterns**: Development flow, deployment processes

## CLAUDE.md Structure Template

```markdown
# CLAUDE.md - [Project Name]

## Project Overview
Brief description of what this project does and its purpose.

## Architecture & Tech Stack
- **Language**: [Primary language and version]
- **Framework**: [Main framework(s)]
- **Database**: [Database type and version]
- **Key Dependencies**: [Critical libraries]

## Project Structure
\`\`\`
src/
├── components/   # UI components
├── services/     # Business logic
├── utils/        # Utility functions
└── tests/        # Test files
\`\`\`

## Development Conventions
- **Code Style**: [ESLint/Prettier/Black config]
- **Naming**: [camelCase/snake_case patterns]
- **Components**: [Functional/Class preference]
- **State Management**: [Redux/Context/Zustand]

## MCP Server Configuration
### Primary Tools
- **serena**: Code navigation (activate with: /path/to/project)
- **github**: Repository operations
- **postgres**: Database queries (connection: PROJECT_DB_URL)

### Project-Specific Servers
- **[custom-server]**: [Purpose and configuration]

## Testing & Quality
- **Test Command**: npm test / pytest
- **Coverage Target**: 80%
- **Linting**: npm run lint
- **Type Checking**: npm run typecheck

## Build & Deployment
- **Development**: npm run dev
- **Build**: npm run build
- **Deploy**: [Deployment process]

## Common Tasks
### Adding a New Feature
1. Create feature branch
2. Update tests first (TDD)
3. Implement feature
4. Run linting and tests
5. Create PR with conventional commit

### Debugging Issues
1. Check logs in logs/ directory
2. Use debugger with VS Code launch config
3. Common issues documented in docs/troubleshooting.md

## Domain Terminology
- **[Term]**: [Definition specific to this project]
- **[Acronym]**: [Expansion and meaning]

## Team Preferences
- Prefer composition over inheritance
- Write tests for all new features
- Document complex algorithms
- Use semantic commit messages

## External Resources
- **Documentation**: [Link to docs]
- **API Reference**: [Link to API docs]
- **Design System**: [Link to design]

## DO NOT
- Never commit .env files
- Don't modify generated files
- Avoid direct database modifications
- Don't skip tests for "simple" changes
```

## Implementation Steps

### Step 1: Analyze Project Structure
```bash
# Check if project already has CLAUDE.md
ls -la CLAUDE.md claude.md .claude.md

# Understand project hierarchy
tree -L 2 -d
```

### Step 2: Identify Subprojects
Look for indicators of subprojects:
- Separate package.json/requirements.txt
- Independent .git directories
- Distinct build configurations
- Microservice boundaries

### Step 3: Create Root CLAUDE.md
Start with the main project's CLAUDE.md:

```markdown
# CLAUDE.md - Main Project

## Multi-Project Structure
This repository contains multiple subprojects. Each has its own CLAUDE.md:
- `/frontend` - React application (see frontend/CLAUDE.md)
- `/backend` - API service (see backend/CLAUDE.md)
- `/shared` - Common utilities (see shared/CLAUDE.md)

## Cross-Project Conventions
[Shared conventions across all subprojects]
```

### Step 4: Create Subproject CLAUDE.md Files

For each subproject, create a focused CLAUDE.md:

```bash
# Frontend subproject
cat > frontend/CLAUDE.md << 'EOF'
# CLAUDE.md - Frontend

## Parent Project
Part of [Main Project Name]. See root CLAUDE.md for overall architecture.

## This Subproject
React-based UI application...

## Local Development
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Specific Conventions
- Components use TypeScript
- Styled with Tailwind CSS
- State managed by Zustand
EOF
```

### Step 5: Link CLAUDE.md Files

Create clear navigation between CLAUDE.md files:

```markdown
## Related Documentation
- **Parent**: [../CLAUDE.md](../CLAUDE.md)
- **Sibling Projects**: 
  - [Backend](../backend/CLAUDE.md)
  - [Infrastructure](../infra/CLAUDE.md)
```

## Best Practices

### 1. Keep It Current
- Update CLAUDE.md when project structure changes
- Document new conventions as they're established
- Remove outdated information promptly

### 2. Be Specific
- Include exact commands, not general descriptions
- Provide file paths, not just directory names
- Show example code patterns

### 3. Hierarchy Matters
```
Root CLAUDE.md
├── Overview & shared conventions
├── Links to subproject CLAUDE.md files
└── Cross-cutting concerns

Subproject CLAUDE.md
├── Local project details
├── Link back to parent
└── Specific workflows
```

### 4. Version Control
- Commit CLAUDE.md files to repository
- Review in PRs like documentation
- Tag with version for major changes

## Common Patterns

### Monorepo Structure
```
monorepo/
├── CLAUDE.md                 # Overall architecture
├── packages/
│   ├── app/
│   │   └── CLAUDE.md        # App-specific
│   ├── api/
│   │   └── CLAUDE.md        # API-specific
│   └── shared/
│       └── CLAUDE.md        # Shared lib context
```

### Microservices Structure
```
project/
├── CLAUDE.md                 # System overview
├── services/
│   ├── auth/
│   │   └── CLAUDE.md        # Auth service
│   ├── payments/
│   │   └── CLAUDE.md        # Payment service
│   └── notifications/
│       └── CLAUDE.md        # Notification service
```

### Full-Stack Application
```
app/
├── CLAUDE.md                 # Full-stack overview
├── client/
│   └── CLAUDE.md            # Frontend details
├── server/
│   └── CLAUDE.md            # Backend details
└── database/
    └── CLAUDE.md            # Schema & migrations
```

## Automation Options

### Script to Generate CLAUDE.md
```bash
#!/bin/bash
# generate-claude-md.sh

PROJECT_NAME=$(basename "$PWD")
LANGUAGE=$(detect_language)  # Custom function
FRAMEWORK=$(detect_framework)  # Custom function

cat > CLAUDE.md << EOF
# CLAUDE.md - $PROJECT_NAME

Generated on: $(date)

## Detected Configuration
- Language: $LANGUAGE
- Framework: $FRAMEWORK
- Package Manager: $(detect_package_manager)

## TODO: Customize this file
Add project-specific information...
EOF
```

### Git Hook for CLAUDE.md Updates
```bash
#!/bin/bash
# .git/hooks/post-merge

if git diff HEAD HEAD~1 --name-only | grep -E "(package\.json|requirements\.txt|go\.mod)"; then
    echo "Dependencies changed. Consider updating CLAUDE.md"
fi
```

## Validation Checklist

- [ ] Root CLAUDE.md exists and is comprehensive
- [ ] Each subproject has its own CLAUDE.md
- [ ] All CLAUDE.md files link to each other appropriately
- [ ] Project-specific MCP server configs documented
- [ ] Development commands are accurate and tested
- [ ] Conventions align with actual codebase
- [ ] External resources and docs linked
- [ ] Team preferences clearly stated
- [ ] Domain terminology defined

## Example: MCP-Helper V2 as Subproject

When MCP-Helper V2 is cloned into a host project:

```
host-project/
├── CLAUDE.md                    # Host project instructions
├── src/                         # Host project code
└── mcp-helper-v2/
    └── CLAUDE.md                # MCP-Helper specific instructions
```

The MCP-Helper V2 CLAUDE.md would include:
- How to use the conversational framework
- Available playbooks and personalities
- Integration with host project's MCP servers
- Subagent configuration workflows

## Support & Troubleshooting

### Common Issues

1. **Claude ignores CLAUDE.md**
   - Ensure file is named exactly `CLAUDE.md` (case-sensitive)
   - Check file is in project root or subproject root
   - Verify file is committed to git

2. **Conflicting instructions**
   - Root CLAUDE.md takes precedence for shared concerns
   - Subproject CLAUDE.md overrides for local scope
   - Be explicit about scope in each file

3. **Outdated information**
   - Set up regular reviews (monthly/quarterly)
   - Include last-updated date in file
   - Use git blame to track changes

## Next Steps

After implementing CLAUDE.md structure:
1. Test with Claude Code on sample tasks
2. Gather team feedback on completeness
3. Iterate based on Claude's performance
4. Document patterns that work well
5. Share templates with other projects

---
*This playbook is part of MCP-Helper V2. For more guides, see [playbooks directory](./)*