# Setting Your Interaction Preferences

## Overview
This playbook guides you through configuring how Claude communicates with you during MCP Helper conversations. Your preferences are saved and automatically applied to all future interactions.

## Personality: Preference Guide
*Adaptive, intuitive, respectful of your communication style. I'll help you find the perfect balance between detail and efficiency.*

## The 3-Dimension System

Your interaction style is controlled by three independent dimensions:

### 1. Verbosity Level (1-5)
How much detail I include in responses:
- **1 - Ultra-Minimal**: Single commands, no explanation
- **2 - Concise**: Brief explanations, essential info only  
- **3 - Balanced**: Standard explanations with context
- **4 - Detailed**: Comprehensive with examples
- **5 - Educational**: Full teaching mode with deep dives

### 2. Tone
How I communicate with you:
- **Professional**: Formal, precise, business-like
- **Friendly**: Warm, encouraging, conversational
- **Casual**: Relaxed, informal, like a colleague
- **Technical**: Direct, terminology-heavy, expert-to-expert
- **Mentoring**: Educational, patient, growth-focused

### 3. Depth
How thoroughly I cover topics:
- **Quick**: Fast answers, minimal context
- **Balanced**: Standard depth, practical focus
- **Thorough**: Complete coverage, all edge cases

## Quick Setup Commands

### First Time Setup
Just say:
> "Set my interaction preferences"

I'll walk you through each dimension with examples.

### Quick Presets
Use these shortcuts for common combinations:

**"Make it minimal"**
→ Sets: verbosity=1, tone=technical, depth=quick

**"I'm learning"**
→ Sets: verbosity=4, tone=mentoring, depth=thorough

**"Just the facts"**
→ Sets: verbosity=2, tone=professional, depth=quick

**"Friendly helper"**
→ Sets: verbosity=3, tone=friendly, depth=balanced

**"Expert mode"**
→ Sets: verbosity=2, tone=technical, depth=balanced

## Natural Language Adjustments

Change preferences anytime during conversation:

### Verbosity Adjustments
- "Be more verbose" → Increases by 1 level
- "Less detail please" → Decreases by 1 level
- "Maximum detail" → Sets to level 5
- "Just commands" → Sets to level 1

### Tone Adjustments
- "Be more casual" → Switches to casual tone
- "More professional please" → Switches to professional
- "Talk to me like a friend" → Switches to friendly
- "Teach me" → Switches to mentoring

### Depth Adjustments
- "Go deeper" → Switches to thorough
- "Keep it quick" → Switches to quick
- "Standard depth" → Switches to balanced

## Examples by Verbosity Level

Here's how I'd respond to "Configure Serena server" at each level:

### Level 1 - Ultra-Minimal
```
npm install @mcp/serena
Add to .claude.json
Set SERENA_PROJECT_PATH
```

### Level 2 - Concise
```
Install Serena MCP server:
1. npm install @mcp/serena
2. Add server config to ~/.claude.json
3. Set SERENA_PROJECT_PATH in .env
4. Restart Claude
```

### Level 3 - Balanced
```
To configure Serena for semantic code navigation:

1. Install the server:
   npm install -g @mcp/serena

2. Add to ~/.claude.json:
   {
     "serena": {
       "command": "npx",
       "args": ["@mcp/serena"]
     }
   }

3. Set project path in .env:
   SERENA_PROJECT_PATH=/path/to/your/project

4. Restart Claude to activate

Serena provides 37% faster code search than grep.
```

### Level 4 - Detailed
```
Let's configure Serena, your semantic code navigation server:

**What Serena Does:**
Serena provides intelligent, symbol-aware code search that's 37% faster than traditional grep. It understands code structure, not just text patterns.

**Installation Steps:**

1. **Install globally via npm:**
   ```bash
   npm install -g @mcp/serena
   ```
   This makes Serena available system-wide.

2. **Configure in ~/.claude.json:**
   ```json
   {
     "mcpServers": {
       "serena": {
         "command": "npx",
         "args": ["@mcp/serena"],
         "env": {
           "SERENA_PROJECT_PATH": "${SERENA_PROJECT_PATH}"
         }
       }
     }
   }
   ```

3. **Set environment variable:**
   Add to your .env or ~/.claude-env:
   ```bash
   export SERENA_PROJECT_PATH="/Users/you/project"
   ```

4. **Restart Claude:**
   ```bash
   source ~/.claude-env && claude
   ```

5. **Verify installation:**
   In Claude, type: /mcp list
   You should see "serena" in the list.

**Key Benefits:**
- Finds symbols by semantic meaning
- Navigates class hierarchies
- Understands imports and dependencies
- Caches for instant subsequent searches
```

### Level 5 - Educational
```
Let's explore Serena configuration in depth to understand both the what and why:

**Understanding Semantic Code Navigation:**

Traditional text search (grep) treats code as strings. If you search for "User", it finds every occurrence - comments, variables, strings. Serena understands that `class User`, `userCount`, and `"User"` are fundamentally different.

**Why Serena Matters for MCP:**

Model Context Protocol servers extend Claude's capabilities. Serena specifically addresses a critical limitation: Claude can't efficiently navigate large codebases with basic text search. By understanding code structure, Serena reduces token usage by up to 60% while improving accuracy.

**Deep Dive: Installation Process**

1. **Global vs Local Installation:**
   ```bash
   npm install -g @mcp/serena  # Global: available everywhere
   # OR
   npm install @mcp/serena     # Local: project-specific
   ```
   
   Global is recommended for MCP servers since Claude launches them independently of your project context.

2. **Configuration Architecture:**
   
   The ~/.claude.json file uses a declarative format:
   ```json
   {
     "mcpServers": {
       "serena": {                    // Server identifier
         "command": "npx",            // Execution method
         "args": ["@mcp/serena"],     // Package to run
         "env": {                     // Environment passthrough
           "SERENA_PROJECT_PATH": "${SERENA_PROJECT_PATH}"
         }
       }
     }
   }
   ```
   
   This tells Claude: "When I need Serena, run `npx @mcp/serena` with these environment variables."

3. **Environment Variable Strategy:**
   
   Why use ${SERENA_PROJECT_PATH} placeholder?
   - Keeps secrets out of config files
   - Allows per-project customization
   - Enables easy switching between projects
   
   The resolution chain:
   Project .env → ~/.claude-env → System environment

4. **Activation Mechanism:**
   
   When you restart Claude after configuration:
   - Claude reads ~/.claude.json
   - Identifies available MCP servers
   - Launches them on-demand via stdio protocol
   - Maintains persistent connections for session

5. **Verification Deep Dive:**
   
   The `/mcp list` command queries Claude's MCP registry:
   ```
   Available servers:
   - serena: ✓ Connected (semantic code navigation)
   - github: ✓ Connected (repository operations)
   ```
   
   If Serena shows as "disconnected", common causes:
   - Missing npm package
   - Incorrect environment variable
   - Permission issues with project directory

**Advanced Configuration Options:**

```json
{
  "serena": {
    "command": "npx",
    "args": ["@mcp/serena", "--cache-size", "500MB"],
    "env": {
      "SERENA_PROJECT_PATH": "${SERENA_PROJECT_PATH}",
      "SERENA_IGNORE_PATTERNS": "*.test.js,*.spec.ts",
      "SERENA_INDEX_DEPTH": "5"
    }
  }
}
```

**Performance Implications:**

Benchmark comparison (10,000 file project):
- grep "function authenticate": 2.3s, 847 results
- Serena "function:authenticate": 0.8s, 12 accurate results

The 37% speed improvement comes from:
- Pre-indexed symbol tables
- AST-based search vs regex
- Intelligent caching strategies

Would you like me to explain any particular aspect in more detail?
```

## Preference Combinations

### For Beginners
- Verbosity: 4-5
- Tone: Mentoring or Friendly
- Depth: Thorough

### For Experienced Developers
- Verbosity: 2-3
- Tone: Technical or Professional  
- Depth: Balanced

### For Quick Tasks
- Verbosity: 1-2
- Tone: Technical
- Depth: Quick

### For Learning New Concepts
- Verbosity: 5
- Tone: Mentoring
- Depth: Thorough

### For Team Collaboration
- Verbosity: 3
- Tone: Professional
- Depth: Balanced

## Saving & Persistence

Your preferences are automatically saved to CLAUDE.md:

```markdown
## Interaction Preferences
MCP_HELPER_PERSONALITY: verbosity=3, tone=friendly, depth=balanced
Last updated: 2024-01-11
```

These preferences:
- Apply to all MCP Helper conversations
- Persist across Claude sessions
- Can be version controlled with your project
- Override defaults for your team

## Special Contexts

Some conversations temporarily adjust preferences:

### Error Handling
Automatically increases verbosity by +1 to explain issues clearly.

### Security Warnings
Switches to professional tone and thorough depth for critical information.

### Quick Commands
Respects verbosity=1 even for complex operations when you prefix with "quick:".

## Team Preferences

Set team-wide defaults in shared CLAUDE.md:

```markdown
## Team Defaults
MCP_HELPER_TEAM_PERSONALITY: verbosity=3, tone=professional, depth=balanced

## Personal Override
MCP_HELPER_PERSONALITY: verbosity=2, tone=casual, depth=quick
```

Personal preferences override team defaults.

## Preference Analytics

Track which settings work best:

```markdown
## Preference History
- 2024-01-01: verbosity=5, tone=mentoring (initial learning)
- 2024-01-15: verbosity=3, tone=friendly (comfortable with basics)
- 2024-02-01: verbosity=2, tone=technical (expert mode)
```

## Troubleshooting

### "Claude ignores my preferences"
- Check CLAUDE.md exists in project root
- Verify format: `MCP_HELPER_PERSONALITY: verbosity=X, tone=Y, depth=Z`
- Ensure no syntax errors in CLAUDE.md

### "Responses still too verbose/brief"
- Use explicit commands: "Set verbosity to 2"
- Check for context overrides (errors, security)
- Verify saved preferences with "Show my preferences"

### "Tone feels wrong"
- Try different tone options
- Combine with verbosity adjustments
- Consider context-specific preferences

## Quick Reference Card

```
COMMANDS:
Set my preferences          → Full setup wizard
Show my preferences         → Display current settings
Reset preferences          → Return to defaults
Be more/less verbose       → Adjust detail level
Be more casual/professional → Adjust tone
Go deeper/keep it quick    → Adjust depth

VERBOSITY LEVELS:
1 = Commands only
2 = Brief explanations  
3 = Standard detail
4 = Comprehensive
5 = Educational

TONES:
Professional | Friendly | Casual | Technical | Mentoring

DEPTH:
Quick | Balanced | Thorough
```

## Next Steps

1. Set your initial preferences
2. Try them for a few conversations
3. Adjust naturally with commands
4. Find your optimal combination
5. Save for team consistency

Remember: These preferences are about making MCP Helper work the way YOU work best. There's no right or wrong combination - only what helps you be most effective.

---
*This playbook is part of MCP-Helper V2. See [CLAUDE.md](../CLAUDE.md) for more options.*