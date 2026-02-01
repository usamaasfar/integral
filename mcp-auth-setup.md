# MCP Authentication Setup

## Overview

This document outlines the implementation plan for MCP (Model Context Protocol) authentication and integration in the Integral Electron app using **lazy connection** pattern.

## Architecture

### Data Flow

```
User Search → Smithery API → OAuth Flow → Store Config → Lazy Connect on @mention
     ↓              ↓            ↓           ↓                ↓
Settings UI → Search Results → Auth Popup → Store Tokens → Connect & Use Tools
```

### Storage Structure

```
electron-secure-store (encrypted):
└── mcp-remote-servers: {
    [namespace]: {
      // OAuth tokens (sensitive)
      access_token: string,
      refresh_token: string,
      expires_at: number,

      // Display metadata (encrypted for security)
      namespace: string,
      displayName: string,
      iconUrl: string,

      // Connection info (encrypted for security)
      serverUrl: string,
      connectedAt: string
    }
  }
```

## Connection Strategy: Lazy Loading

**Connect on first @mention, cache in memory**

### Benefits:

- ✅ Fast app startup (no connection delays)
- ✅ Resource efficient (only connect what's used)
- ✅ Better error handling (errors when user needs it)
- ✅ Scales well (100 MCPs installed, only 2-3 used daily)

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1. MCP Service (`/main/services/mcp.ts`)

```typescript
interface MCPService {
  // Lazy connection management
  getClient(namespace: string): Promise<MCPClient>;
  disconnect(namespace: string): Promise<void>;
  disconnectAll(): Promise<void>;

  // OAuth handling
  initiateOAuth(
    namespace: string,
    serverUrl: string,
  ): Promise<{ authUrl: string; sessionId: string }>;
  finishOAuth(
    sessionId: string,
    authCode: string,
    serverConfig: MCPServerConfig,
  ): Promise<void>;

  // Token management
  refreshTokenIfNeeded(namespace: string): Promise<void>;

  // Tool management
  getTools(namespace: string): Promise<Tool[]>;
  getToolsForMention(mention: string): Promise<Tool[]>; // "@gmail" → gmail tools
}

class MCPService {
  private clients = new Map<string, MCPClient>();

  async getClient(namespace: string): Promise<MCPClient> {
    // 1. Always check token validity first
    await this.refreshTokenIfNeeded(namespace);

    // 2. Then check cache
    if (this.clients.has(namespace)) {
      return this.clients.get(namespace)!;
    }

    // 3. Connect with valid tokens
    const serverConfig = secureStorage.get(`mcp-remote-servers.${namespace}`);
    if (!serverConfig)
      throw new Error(`MCP server ${namespace} not configured`);

    const client = await this.connect(namespace, serverConfig);
    this.clients.set(namespace, client);
    return client;
  }
}
```

#### 2. IPC Extensions (`/main/ipc.ts`)

```typescript
// MCP Search
ipcMain.handle("search-mcp-servers", async (_, term: string) => {
  return await smithery.search({ term, verified: true });
});

// MCP Connection (OAuth only, no immediate connection)
ipcMain.handle(
  "connect-mcp-server",
  async (_, serverConfig: MCPServerConfig) => {
    return await mcpService.initiateOAuth(
      serverConfig.namespace,
      serverConfig.serverUrl,
    );
  },
);

ipcMain.handle(
  "finish-mcp-auth",
  async (
    _,
    sessionId: string,
    authCode: string,
    serverConfig: MCPServerConfig,
  ) => {
    return await mcpService.finishOAuth(sessionId, authCode, serverConfig);
  },
);

// MCP Management
ipcMain.handle("disconnect-mcp-server", async (_, namespace: string) => {
  return await mcpService.disconnect(namespace);
});

ipcMain.handle("list-connected-mcps", async () => {
  return secureStorage.get("mcp-remote-servers", {});
});

// Tool access (lazy connection happens here)
ipcMain.handle("get-mcp-tools-for-mention", async (_, mention: string) => {
  return await mcpService.getToolsForMention(mention); // "@gmail" → connects if needed
});
```

#### 3. Settings Store Extension (`/renderer/stores/settings.ts`)

```typescript
interface MCPState {
  connectedMCPs: ConnectedMCP[];
  searchResults: SmitheryServer[];
  isSearching: boolean;

  // Methods
  searchMCPs: (term: string) => Promise<void>;
  connectMCP: (namespace: string) => Promise<void>;
  disconnectMCP: (namespace: string) => Promise<void>;
  loadConnectedMCPs: () => Promise<void>;
}
```

### Phase 2: OAuth Integration

#### 4. OAuth Flow Handler (`/main/services/mcp-oauth.ts`)

```typescript
class MCPOAuthHandler {
  // Handle integral.computer://oauth/callback?code=xxx&state=mcp:namespace
  handleCallback(url: string): Promise<void>;

  // Store and retrieve OAuth tokens securely
  storeTokens(namespace: string, tokens: OAuthTokens): Promise<void>;
  getTokens(namespace: string): Promise<OAuthTokens | null>;
}
```

#### 5. Main Process OAuth Updates (`/main.ts`)

```typescript
// Extend existing OAuth callback handler
app.on("open-url", (event, url) => {
  if (url.includes("mcp:")) {
    // Handle MCP OAuth callback
    mcpOAuthHandler.handleCallback(url);
  } else {
    // Existing OAuth handling
  }
});
```

### Phase 3: UI Integration

#### 6. Settings Component Updates

- Real Smithery API integration
- OAuth popup handling
- Connection status management
- Error handling

#### 7. Preload API Extensions (`/preload.ts`)

```typescript
// MCP APIs
searchMCPServers: (term: string) => ipcRenderer.invoke("search-mcp-servers", term),
connectMCPServer: (namespace: string) => ipcRenderer.invoke("connect-mcp-server", namespace),
finishMCPAuth: (sessionId: string, authCode: string) => ipcRenderer.invoke("finish-mcp-auth", sessionId, authCode),
disconnectMCPServer: (namespace: string) => ipcRenderer.invoke("disconnect-mcp-server", namespace),
listConnectedMCPs: () => ipcRenderer.invoke("list-connected-mcps"),
getMCPTools: () => ipcRenderer.invoke("get-mcp-tools"),
```

### Phase 4: Tool Integration

#### 8. Composer Agent Updates (`/main/ai/agents/composer.ts`)

```typescript
// Dynamic tool loading based on @mentions in prompt
function composer(tools: Tool[]) {
  return new ToolLoopAgent({
    instructions: composerPrompt,
    model: getModel(),
    tools: {
      // Static tools
      weather: tool({ ... }),

      // Dynamic MCP tools (passed from mention parsing)
      ...tools
    }
  });
}

// In AI compose handler
ipcMain.on("ai-compose", async (event, prompt: string) => {
  // Parse @mentions from prompt
  const mentions = extractMentions(prompt); // ["@gmail", "@linear"]

  // Get tools for mentioned MCPs (lazy connection happens here)
  const mcpTools = [];
  for (const mention of mentions) {
    const tools = await mcpService.getToolsForMention(mention);
    mcpTools.push(...tools);
  }

  const agent = composer(mcpTools);
  // ... rest of compose logic
});
```

## Data Models

### MCPServerConfig

```typescript
interface MCPServerConfig {
  // OAuth tokens
  access_token: string;
  refresh_token: string;
  expires_at: number;

  // Display metadata
  namespace: string;
  displayName: string;
  iconUrl: string;

  // Connection info
  serverUrl: string;
  connectedAt: string;
}
```

### In-Memory Client Cache

```typescript
// Runtime only - not persisted
interface MCPClientCache {
  client: MCPClient;
  tools: Tool[];
  lastUsed: number;
}
```

## Security Considerations

1. **All Data Encrypted**: MCP configs and OAuth tokens stored in electron-secure-store
2. **Single Storage Location**: Simplified security model with one encrypted store
3. **URL Validation**: Verify OAuth callback URLs match expected patterns
4. **Error Handling**: Graceful failures without exposing sensitive data
5. **Token Refresh**: Automatic refresh prevents token exposure in logs

## User Flow

1. **Discovery**: User types in search → Smithery API call → Results displayed
2. **Connection**: User selects server → OAuth popup opens → User authorizes → Tokens stored
3. **Usage**: User types "@gmail get emails" → MCP client connects lazily → Tools loaded → AI executes
4. **Subsequent Use**: User types "@gmail" again → Uses cached client → Instant tool access
5. **App Restart**: Stored tokens remain → Connections re-established on first @mention

## Connection Lifecycle

### First @mention:

```
User: "@gmail get emails"
  ↓
Load tokens from storage
  ↓
Check if tokens expired → Refresh if needed
  ↓
Check cache → Not found (first time)
  ↓
Connect to MCP server with valid tokens
  ↓
Cache client + tools
  ↓
Return tools to AI agent
```

### Subsequent @mentions:

```
User: "@gmail create draft"
  ↓
Load tokens from storage
  ↓
Check if tokens expired → Refresh if needed
  ↓
Check cache → Found
  ↓
Return cached tools immediately
```

## Error Handling

- **Network failures**: Retry logic with exponential backoff
- **OAuth failures**: Clear error messages and retry options
- **MCP disconnections**: Auto-reconnect on app restart
- **Tool conflicts**: Namespace prefixing (`@namespace/tool-name`)

## Testing Strategy

Ask the developer for manual testing.

---

## Complete Implementation TODO

### Phase 1: Core Infrastructure ✅ COMPLETED

#### 1.1 MCP Service Foundation ✅

- [x] Create `/main/services/mcp.ts`
  - [x] Implement `MCPService` class with client cache
  - [x] Add `getClient(namespace)` with lazy connection
  - [x] Add `refreshTokenIfNeeded(namespace)` method
  - [x] Add `getToolsForMention(mention)` method
  - [x] Add `disconnect(namespace)` and `disconnectAll()` methods

#### 1.2 OAuth Integration ✅

- [x] Create `/main/services/mcp-oauth.ts`
  - [x] Implement OAuth client provider for MCP
  - [x] Add `initiateOAuth(namespace, serverUrl)` method
  - [x] Add `finishOAuth(sessionId, authCode, serverConfig)` method
  - [x] Add token refresh logic with Smithery OAuth endpoint

#### 1.3 IPC Layer Extensions ✅

- [x] Update `/main/ipc.ts`
  - [x] Add `search-mcp-servers` handler (Smithery API)
  - [x] Add `connect-mcp-server` handler (OAuth initiation)
  - [x] Add `finish-mcp-auth` handler (OAuth completion)
  - [x] Add `disconnect-mcp-server` handler
  - [x] Add `list-connected-mcps` handler (secure storage)

#### 1.4 Preload API Extensions

- [ ] Update `/preload.ts`
  - [ ] Add MCP search methods
  - [ ] Add MCP connection methods
  - [ ] Add MCP management methods
  - [ ] Add OAuth callback handlers

#### 1.4 Preload API Extensions ✅

- [x] Update `/preload.ts`
  - [x] Add `searchMCPServers(term)` method
  - [x] Add `connectMCPServer(namespace)` method
  - [x] Add `finishMCPAuth(sessionId, authCode)` method
  - [x] Add `disconnectMCPServer(namespace)` method
  - [x] Add `listConnectedMCPs()` method

### Phase 2: UI Integration ✅ COMPLETED

#### 2.1 Settings Store Enhancement ✅

- [x] Update `/renderer/stores/settings.ts`
  - [x] Add MCP state management
  - [x] Add `searchMCPs(term)` method
  - [x] Add `connectMCP(serverConfig)` method
  - [x] Add `disconnectMCP(namespace)` method
  - [x] Add `loadConnectedMCPs()` method
  - [x] Add OAuth flow state management

#### 2.2 Settings Component Integration ✅

- [x] Update `/renderer/components/blocks/settings-servers.tsx`
  - [x] Replace dummy data with real Smithery API calls
  - [x] Implement OAuth popup handling
  - [x] Add connection status indicators
  - [x] Add error handling and retry logic
  - [x] Add loading states for search and connection

#### 2.3 Compose Component Integration ✅

- [x] Update `/renderer/components/blocks/compose.tsx`
  - [x] Replace dummy MCP list with real connected MCPs
  - [x] Load connected MCPs from `list-connected-mcps` API
  - [x] Update @mention autocomplete with real data

#### 2.4 OAuth Callback Handling ✅

- [x] Update `/main.ts`
  - [x] Extend `open-url` handler for MCP OAuth callbacks
  - [x] Add state parameter parsing (`mcp:namespace`)
  - [x] Add error handling for OAuth failures
  - [x] Add success notification to renderer

### Phase 3: Tool Integration ✅ COMPLETED

#### 3.1 AI Compose Handler Updates ✅
- [x] Update AI compose IPC handler in `/main/ipc.ts`
  - [x] Accept mentions array parameter: `(prompt, mentions)`
  - [x] Load MCP tools for provided namespaces
  - [x] Pass dynamic tools to composer agent
  - [x] Handle lazy connection errors gracefully

#### 3.2 Composer Agent Updates ✅
- [x] Update `/main/ai/agents/composer.ts`
  - [x] Accept tools parameter in composer function
  - [x] Merge MCP tools with static tools
  - [x] Handle tool conflicts with namespace prefixing
  - [x] Add error handling for MCP connection failures

---

## Implementation Order

1. **Start with Phase 1.1** - MCP Service Foundation
2. **Test with Phase 1.2** - OAuth Integration
3. **Connect with Phase 1.3** - IPC Layer
4. **Validate with Phase 2.2** - UI Integration
5. **Complete with Phase 3** - Tool Integration
