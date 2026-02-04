## Flow

### 1. **User Clicks "Install" on MCP Server**

```typescript
await remote.connectServer("exa");
```

**What happens:**

1. Creates `OAuthClientProvider` for "exa"
2. Provider checks secure storage for saved tokens
3. If tokens exist → loads them
4. Creates MCP client with the provider
5. Tries to get tools from server

**Two paths from here:**

#### Path A: Has Valid Tokens

```
✓ Tokens exist in storage
✓ Server accepts them
✓ Returns { success: true, tools: {...} }
✓ Saves "exa" to connected servers list
```

#### Path B: Needs OAuth

```
✗ No tokens (or expired)
✗ Server returns 401 Unauthorized
✓ Returns { success: false, needsAuth: true }
```

---

### 2. **OAuth Flow (Path B)**

When `needsAuth: true`:

```
1. AI SDK calls: authProvider.redirectToAuthorization(authUrl)
   └─> Opens browser to: https://server.smithery.ai/exa/oauth/authorize?...

2. User logs in and authorizes in browser

3. Browser redirects to: integral.computer://oauth/callback?code=ABC123&state=...

4. Your app catches this deep link (need to implement this part)

5. Your app calls the token exchange (need to implement this part)

6. AI SDK calls: authProvider.saveTokens(tokens)
   └─> Saves to: secure::mcp::exa::auth
   └─> { tokens: {...}, clientInfo: {...}, updatedAt: "..." }

7. Connection completes, tools are available
```

---

### 3. **On App Startup**

```typescript
// main.ts
await remote.reconnectAll();
```

**What happens:**

1. Reads `mcp-connected-servers` from storage → `["exa", "brave-search"]`
2. For each server:
   - Creates `OAuthClientProvider("exa")`
   - Provider loads tokens from `secure::mcp::exa::auth`
   - If tokens exist → creates MCP client
   - If no tokens → skips (user needs to re-auth)
3. All servers with valid tokens are reconnected

---

### 4. **Disconnect Flow**

```typescript
await remote.disconnectServer("exa");
```

**What happens:**

1. Closes MCP client connection
2. Removes from active connections map
3. Updates `mcp-connected-servers` list
4. **Note**: Tokens remain in storage (for quick reconnect)

To fully delete tokens:

```typescript
const provider = new OAuthClientProvider("exa");
provider.deleteTokens(); // Removes from secure storage
```

---

## Visual Flow Diagram

```
User Clicks Install
       │
       ▼
connectServer("exa")
       │
       ├─> OAuthClientProvider created
       │   └─> Loads tokens from secure storage
       │
       ├─> Creates MCP client
       │
       ▼
  Try to get tools
       │
       ├──────────────┬──────────────┐
       │              │              │
   Has Tokens    No Tokens      Expired
       │              │              │
       ▼              ▼              ▼
   SUCCESS      NEEDS OAUTH    NEEDS OAUTH
       │              │
       │              ├─> Opens browser
       │              ├─> User authorizes
       │              ├─> Callback with code
       │              ├─> Token exchange
       │              └─> saveTokens() → secure storage
       │                          │
       └──────────────────────────┘
                     │
                     ▼
              Save to connected list
                     │
                     ▼
              Tools available!
```

---

## Storage

### Secure Storage (Encrypted)

**Location**: OS Keychain (macOS Keychain, Windows Credential Vault, Linux Secret Service)

**Format**: `secure::mcp::{namespace}::auth`

```json
{
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "clientInfo": {
    "client_id": "...",
    "client_secret": "..."
  },
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Regular Storage

**Key**: `mcp-connected-servers`

**Value**: `["exa", "brave-search", ...]`

## Resources

- [Vercel AI SDK MCP Documentation](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [Smithery Documentation](https://smithery.ai/docs)
- [MCP OAuth Specification](https://modelcontextprotocol.io/specification/draft/basic/authorization)
