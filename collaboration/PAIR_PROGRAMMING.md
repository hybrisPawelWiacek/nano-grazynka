# Pair Programming & Collaboration Guidelines

## Working with This Codebase

### Core Philosophy
- **MVP First**: Build only what's in the PRD, nothing more
- **Simplicity**: Choose boring technology that works  
- **DDD**: Maintain clean architecture boundaries
- **No Premature Optimization**: Solve today's problems, not tomorrow's

### Collaboration with Paweł (Product Manager)
- Strong technical understanding but delegates implementation
- Values simplicity and pragmatic solutions
- Expects autonomous technology decisions within requirements
- Appreciates best practices without over-engineering

### Decision Making Framework
When making choices, ask:
1. Is it required by the PRD?
2. Is it the simplest solution that works?
3. Does it follow established patterns?
4. Will it scale to MVP needs (not beyond)?
5. Is it maintainable and clear?

### AI Agent Collaboration Principles

#### Decision Rules
- **Minor changes** (formatting, imports, small fixes): Agent does them autonomously
- **Significant changes** (new features, refactoring, deletions): Agent asks first
- **Ambiguous situations**: Agent clarifies with you
- **Error fixes**: Agent explains the issue and proposed solution before fixing

#### Orchestration Principles
When working with AI agents:
1. **Coordinate tools efficiently** - Use the right tool for each task
2. **Manage complexity** - Break down complex tasks using TodoWrite
3. **Maintain context** - Keep track of what we're working on
4. **Prepare for subagents** - Structure work to eventually delegate to specialized agents
5. **Stay focused** - Work on what's requested, nothing more

## Development Workflow

### Before Making Changes
1. Check if it's in the PRD
2. Verify it follows existing patterns
3. Consider the simplest implementation
4. Ensure it maintains clean architecture

### Communication Style
- Be direct and concise
- Focus on MVP requirements
- Avoid scope creep
- Document decisions when they deviate from standard patterns

### Code Review Expectations
- Pragmatic over perfect
- Working over theoretical
- Simple over clever
- Clear over compact

## Technology Decisions

### Principles
- Choose boring technology that works
- Avoid premature optimization
- Follow Domain-Driven Design
- Keep architecture boundaries clean

### When to Consult
Consult before:
- Adding new dependencies
- Changing architecture patterns
- Implementing features beyond PRD
- Making performance optimizations without metrics

### Autonomous Decisions
Make autonomous decisions for:
- Bug fixes that don't change behavior
- Code formatting and organization
- Test improvements
- Documentation updates
- Error handling improvements

## Project Context

**nano-Grazynka** is a voice note transcription and summarization utility that:
- Processes audio files (English/Polish)
- Generates intelligent summaries with key points and action items
- Follows strict rule: transcription is the sole source of truth
- Built with Domain-Driven Design principles
- MVP-focused with no unnecessary features

## Remember

This is an MVP. Every line of code should directly support a requirement in the PRD. When in doubt, choose the simpler option.