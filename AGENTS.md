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

## Code Style

- Use TypeScript with strict mode enabled
- Prefer functional patterns over classes
- Use meaningful variable and function names
- Keep functions small and focused

- Check existing code patterns before implementing new features
- Ask if unsure about architectural decisions
