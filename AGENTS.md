# AGENTS.md

## Project Overview

A lightweight Electron.js desktop app that connects to MCP servers (via Smithery) and any AI provider, defaulting to local Ollama. Think command palette, not chat client.

Core features:

- **@-mention pattern** to invoke MCP tools (e.g., "Get bugs from @Gmail and create issues on @Linear")
- **Human-in-the-loop checkpoints** — agent pauses for user decisions (team, priority, etc.) rather than assuming

## The Minimal Loop

No chat sessions. No history sidebar. No session management. Just:

1. **Cmd+N** — Fresh context, new message
2. **Cmd+R** — Reply to continue the thread

That's it. Single-threaded, ephemeral interaction. The app behaves more like Spotlight or Raycast than ChatGPT — you invoke it, get a result, move on. Replies let you iterate when needed, but there's no persistent conversation state to manage.

## How It Works

**Architecture:**

- Electron main process handles AI agents, MCP connections, OAuth, and storage
- React renderer process provides UI (composer dialog, settings)
- IPC bridge connects main and renderer via preload script

**MCP Integration:**

- Connects to remote MCP servers via HTTP + OAuth (Smithery)
- Tools are fetched once per connection and cached
- Only mentioned tools (@gmail, @linear) are loaded into the AI agent context

**AI Flow:**

1. User types prompt with optional @mentions
2. IPC sends prompt + mentions to main process
3. Main loads cached MCP tools for mentioned servers
4. Creates composer agent (AI SDK) with tools
5. Agent streams steps back to renderer
6. UI displays results

## Folder Structure

```
apps/desktop/src/
├── main/              # Electron main process
│   ├── ai/            # AI agents and providers
│   ├── mcp/           # MCP remote server connections
│   ├── services/      # Ollama, Smithery, OAuth
│   └── utils/         # Storage (encrypted + plain)
├── renderer/          # React UI
│   ├── screens/       # Composer, Settings
│   ├── components/    # Reusable UI blocks
│   └── stores/        # Zustand state (servers, providers, general)
└── preload.ts         # IPC bridge (electronAPI)
```

## Code Style

- Use TypeScript with strict mode enabled
- Prefer functional patterns over classes
- Use meaningful variable and function names
- Keep functions small and focused

- Check existing code patterns before implementing new features
- Ask if unsure about architectural decisions
