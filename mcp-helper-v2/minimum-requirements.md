# Minimum Requirements for MCP Helper V2

## Basic Requirements

To use MCP Helper V2, you need:

### 1. Docker Desktop
- **Why**: Many MCP servers run as Docker containers
- **Installation**: Download from [docker.com](https://www.docker.com/products/docker-desktop/)
- **Configuration**: Enable MCP Toolkit in Docker Desktop settings
  - Open Docker Desktop
  - Go to Settings/Preferences
  - Find "Extensions" or "MCP Toolkit"
  - Enable the MCP Toolkit feature

### 2. Claude Code CLI
- **Why**: This is the interface through which you'll interact with MCP servers
- **Installation**: Follow instructions at [claude.ai/code](https://claude.ai/code)
- **Verification**: Run `claude --version` in your terminal

## Foundation Servers (For Advanced Features)

If you want to use the "Add Novel Server" conversation (adding servers not in our catalog), you'll need these foundation servers configured first:

### Required Foundation Servers

1. **Sequential Thinking**
   - **Purpose**: Planning complex configurations and breaking down tasks
   - **Installation**: Configured during setup process
   - **Why needed**: Helps plan the configuration strategy for novel servers

2. **Perplexity**
   - **Purpose**: Deep research on new MCP servers
   - **Installation**: Requires `PERPLEXITY_API_KEY`
   - **Why needed**: Researches documentation, GitHub repos, and implementation details

3. **Memory**
   - **Purpose**: Persistent storage of configuration decisions
   - **Installation**: Via Docker MCP Toolkit or OpenMemory
   - **Why needed**: Tracks progress during complex configuration processes

4. **Serena**
   - **Purpose**: Semantic code analysis
   - **Installation**: Via UV package manager
   - **Why needed**: Analyzes server implementation code to understand requirements

5. **Context7**
   - **Purpose**: Fetching up-to-date documentation
   - **Installation**: Docker-based
   - **Why needed**: Gets latest docs for frameworks and libraries used by servers

### Installing Foundation Servers

To install the foundation servers, you can either:

1. **Use the Greenfield Setup playbook** first to configure these servers
2. **Install manually** using the global installation script from the main mcp-servers-config repository:
   ```bash
   git clone https://github.com/hybrisPawelWiacek/mcp-servers-config.git
   cd mcp-servers-config
   ./scripts/install-mcp-servers-global.sh
   ```

## Environment Variables

You'll need API keys for various services. During our conversations, I'll help you set these up:

- `GITHUB_PAT` - For GitHub integration
- `PERPLEXITY_API_KEY` - For research capabilities
- `OPENAI_API_KEY` - For memory embeddings (if using OpenMemory)
- Various other keys depending on which servers you choose

## Verification Checklist

Before starting:

- [ ] Docker Desktop is installed and running
- [ ] MCP Toolkit is enabled in Docker Desktop
- [ ] Claude Code CLI is installed (`claude --version` works)
- [ ] You have API keys ready for the services you want to use

For advanced features:
- [ ] Foundation servers are configured (or you're ready to configure them)
- [ ] You have necessary API keys (especially `PERPLEXITY_API_KEY`)

## Not Required

You DON'T need:
- Programming knowledge
- Command line expertise (I'll guide you through everything)
- Pre-existing MCP server configurations
- Node.js or any development tools (this isn't a programming tool)