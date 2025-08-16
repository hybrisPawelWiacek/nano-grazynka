# Test Documentation Alignment Plan

**Created**: August 16, 2025  
**Status**: Ready for Implementation  
**Purpose**: Reorganize test documentation to eliminate redundancy and clarify the hierarchy between strategy, implementation, and reference materials.

## Problem Statement

Currently, test documentation has overlapping "how-to" instructions across multiple locations:
- `imp_docs/testing/PLAYWRIGHT_*_HAPPY_PATH.md` contains specific MCP tool commands
- `tests/MCP_TEST_GUIDE.md` duplicates many of these patterns generically
- This creates confusion about which document to reference when executing tests

## Current Structure Issues

### Redundant Documentation
When executing test plans, there are multiple sources of "how":
1. **TEST_PLAN.md** - Defines WHAT to test (test IDs, scenarios, expected results)
2. **PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md** - Contains specific MCP commands (the HOW)
3. **MCP_TEST_GUIDE.md** - Also contains HOW with generic patterns (redundant)

### Misplaced Documentation
- `MCP_TEST_GUIDE.md` is essentially a playbook/reference guide but lives in `tests/`
- It belongs with other AI agent playbooks in `collaboration/`

## Proposed New Structure

### Directory Organization

```
collaboration/
├── MCP_PLAYBOOK.md                    # General MCP server usage
├── PLAYWRIGHT_MCP_PLAYBOOK.md         # Renamed from MCP_TEST_GUIDE.md
├── AI_DEVELOPMENT_PLAYBOOK.md         # AI development patterns
└── PAIR_PROGRAMMING.md                # Collaboration guidelines

imp_docs/testing/
├── TEST_PLAN.md                       # WHAT: Test strategy & scenarios
├── PLAYWRIGHT_ANONYMOUS_HAPPY_PATH.md # HOW: Specific test implementation
├── PLAYWRIGHT_LOGGED_IN_HAPPY_PATH.md # HOW: Specific test implementation
└── results/                           # Test execution results
    ├── TEST_RESULTS_*.md
    └── MIGRATION_TEST_RESULTS_*.md

tests/
├── README.md                          # Quick start guide
├── scripts/                           # Test scenario definitions
│   ├── run-all-mcp-tests.js         # Master test runner
│   ├── test-anonymous-flow-mcp.js    # Test scenarios
│   └── test-*-mcp.js                 # Other test scenarios
└── test-data/                         # Test files
    ├── zabka.m4a
    └── test-audio.mp3
```

## Documentation Hierarchy

### Clear Separation of Concerns

1. **Strategy Layer** (`imp_docs/testing/`)
   - **Purpose**: Define test requirements and specifications
   - **TEST_PLAN.md**: Master test plan with all suites and scenarios
   - **PLAYWRIGHT_*_HAPPY_PATH.md**: Detailed test flows with specific MCP commands
   - **results/**: Historical test results

2. **Reference Layer** (`collaboration/`)
   - **Purpose**: Provide reusable patterns and tool references
   - **PLAYWRIGHT_MCP_PLAYBOOK.md**: MCP tool syntax, patterns, troubleshooting
   - **MCP_PLAYBOOK.md**: General MCP server usage across the project

3. **Implementation Layer** (`tests/`)
   - **Purpose**: Executable test code and data
   - **scripts/**: Test scenario definitions
   - **test-data/**: Test audio files
   - **README.md**: Quick start for running tests

## Execution Flow

When an AI agent is asked to "execute test plan using TEST_PLAN.md":

1. **Check TEST_PLAN.md** → Understand WHAT to test (Test IDs, expected results)
2. **Follow PLAYWRIGHT_*_HAPPY_PATH.md** → Get specific test steps with exact MCP commands
3. **Reference PLAYWRIGHT_MCP_PLAYBOOK.md** → Look up tool syntax, debug issues, find patterns

## Implementation Steps

### Step 1: Move and Rename MCP_TEST_GUIDE.md
```bash
mv tests/MCP_TEST_GUIDE.md collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md
```

### Step 2: Update PLAYWRIGHT_MCP_PLAYBOOK.md
- Remove duplicate test flows (keep only generic patterns)
- Focus on:
  - MCP tool reference
  - Troubleshooting guide
  - Best practices
  - Migration reference (npm → MCP)
- Add clear note: "For specific test implementations, see imp_docs/testing/PLAYWRIGHT_*_HAPPY_PATH.md"

### Step 3: Update PLAYWRIGHT_*_HAPPY_PATH.md Files
- Keep specific MCP command sequences
- Add reference: "For MCP tool syntax and troubleshooting, see collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md"
- Ensure each test step has clear MCP commands

### Step 4: Update Cross-References
Update all documentation links:
- `tests/README.md` → Point to new playbook location
- `imp_docs/testing/TEST_PLAN.md` → Reference both happy path docs and playbook
- `collaboration/MCP_PLAYBOOK.md` → Add link to PLAYWRIGHT_MCP_PLAYBOOK.md

### Step 5: Update CLAUDE.md
Add section explaining the new test documentation structure:
```markdown
## Test Documentation Structure
- **Strategy**: imp_docs/testing/TEST_PLAN.md - What to test
- **Implementation**: imp_docs/testing/PLAYWRIGHT_*_HAPPY_PATH.md - Specific test flows
- **Reference**: collaboration/PLAYWRIGHT_MCP_PLAYBOOK.md - MCP tool guide
```

## Benefits

1. **Eliminates Redundancy**: No duplicate "how-to" instructions
2. **Clear Hierarchy**: Strategy → Implementation → Reference
3. **Logical Organization**: Playbooks with playbooks, tests with tests
4. **Improved Navigation**: Clear path from requirements to execution
5. **Maintainability**: Single source of truth for each type of information

## Success Criteria

- [ ] No duplicate test flow instructions across documents
- [ ] Clear separation between test specifications and tool references
- [ ] All cross-references updated and working
- [ ] AI agents can navigate from TEST_PLAN to execution without confusion
- [ ] Test documentation follows: WHAT (plan) → HOW (happy paths) → REFERENCE (playbook)

## Timeline

This reorganization can be completed in one session:
1. Move files (5 min)
2. Update content to remove redundancy (20 min)
3. Update cross-references (10 min)
4. Test the new structure (10 min)

Total: ~45 minutes

## Notes

- This change is backward-compatible - old references will be updated
- The `tests/e2e/archive/npm-based/` structure remains unchanged
- Test scripts in `tests/scripts/*-mcp.js` remain in place
- Only documentation is being reorganized, not test code

---

**Next Step**: Execute this plan to create a cleaner, more maintainable test documentation structure.