import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { ElectronOAuthProvider } from "./mcp-oauth";
import storage from "~/main/utils/storage";

interface ConnectedMCP {
  name: string;
  url: string;
  client: any;
  tools: any;
  displayName: string;
  iconUrl: string;
}

interface MCPServerConfig {
  namespace: string;
  displayName: string;
  iconUrl: string;
  serverUrl: string;
}

/**
 * MCPManager - Manages MCP server connections using @ai-sdk/mcp
 *
 * This class:
 * 1. Connects to MCP servers using AI SDK's HTTP transport
 * 2. Handles OAuth authentication via ElectronOAuthProvider
 * 3. Caches connections and tools
 * 4. Provides tools to the AI agent
 */
export class MCPManager {
  private connections = new Map<string, ConnectedMCP>();
  private oauthProviders = new Map<string, ElectronOAuthProvider>();

  /**
   * Connect to an MCP server
   *
   * Returns {success: true, tools} if connection succeeds
   * Returns {success: false, needsAuth: true} if OAuth is required
   */
  async connectToMCP(
    namespace: string,
    serverUrl: string,
    displayName: string,
    iconUrl: string,
  ): Promise<{ success: boolean; needsAuth?: boolean; tools?: any; error?: string }> {
    console.log(`🔗 Connecting to ${namespace} at ${serverUrl}...`);

    // Reuse or create OAuth provider
    let authProvider = this.oauthProviders.get(namespace);
    if (!authProvider) {
      authProvider = new ElectronOAuthProvider(namespace);
      this.oauthProviders.set(namespace, authProvider);
    }

    try {
      // Create client (should succeed even without auth)
      const client = await createMCPClient({
        transport: {
          type: "http",
          url: serverUrl,
          authProvider,
        },
      });

      // Store client immediately (before trying to use it)
      console.log(`💾 Storing client for ${namespace}...`);
      this.connections.set(namespace, {
        name: namespace,
        url: serverUrl,
        client,
        tools: {},
        displayName,
        iconUrl,
      });
      console.log(`✅ Client stored`);

      // Try to get tools - this will trigger OAuth if needed
      const tools = await client.tools();

      // Debug: Log tool structure to understand format
      const toolNames = Object.keys(tools);
      console.log(`✅ ${namespace} connected! Tools:`, toolNames);
      if (toolNames.length > 0) {
        const firstTool = tools[toolNames[0]];
        console.log(`📋 Sample tool structure:`, {
          name: toolNames[0],
          hasDescription: !!firstTool?.description,
          hasExecute: typeof firstTool?.execute === "function",
          keys: Object.keys(firstTool || {}),
        });
      }

      // Success! Update stored connection with tools
      this.connections.get(namespace)!.tools = tools;
      
      // Save server config to persistent storage for reconnection on startup
      this.saveServerConfig(namespace, serverUrl, displayName, iconUrl);
      
      return { success: true, tools };

    } catch (error: any) {
      // If auth error, OAuth flow has started - return needsAuth
      if (error.message?.includes("unauthorized") || error.message?.includes("auth")) {
        console.log(`🔐 ${namespace} needs OAuth authorization`);
        return { success: false, needsAuth: true };
      }
      // Other errors
      console.error(`❌ Connection failed:`, error);
      return { success: false, error: error.message || "Connection failed" };
    }
  }

  /**
   * Complete OAuth flow after user authorizes in browser
   *
   * @param namespace - MCP server namespace
   * @param serverUrl - MCP server URL
   * @param authCode - OAuth authorization code from callback
   * @param metadata - Server display metadata
   */
  async finishOAuth(
    namespace: string,
    serverUrl: string,
    authCode: string,
    metadata: { displayName: string; iconUrl: string },
  ): Promise<{ success: boolean; tools?: any; error?: string }> {
    try {
      console.log(`🔗 Finishing OAuth for ${namespace}...`);

      // Get existing connection (might exist if client creation succeeded)
      const connection = this.connections.get(namespace);
      const authProvider = this.oauthProviders.get(namespace);

      if (!authProvider) {
        throw new Error(`No OAuth provider found for ${namespace}`);
      }

      let client;

      if (connection && connection.client) {
        // Client exists from connectToMCP - reuse it
        console.log(`♻️ Reusing existing client for ${namespace}`);
        client = connection.client;

        // Complete OAuth flow by passing the auth code to the transport
        console.log(`🔄 Exchanging auth code for tokens...`);
        await (client as any).transport.finishAuth(authCode);

        // Reset auth-in-progress flag now that OAuth is complete
        (authProvider as any)._authInProgress = false;

        // Get tools now that we're authenticated
        console.log(`📦 Fetching tools...`);
        const tools = await client.tools();

        // Update stored connection with tools
        connection.tools = tools;

        console.log(`✅ ${namespace} OAuth completed! Tools:`, Object.keys(tools));
        return { success: true, tools };
      } else {
        // Client doesn't exist - connectToMCP failed before storing
        // Exchange auth code for tokens manually, then reconnect
        console.log(`🔧 No client found - completing OAuth manually and asking user to reconnect`);

        // Get code verifier
        const codeVerifier = await authProvider.codeVerifier();

        // Manually exchange auth code for tokens
        // For Smithery servers, the auth endpoint is on auth.smithery.ai, not server.smithery.ai
        const tokenUrl = new URL(serverUrl);
        if (tokenUrl.hostname.includes("server.smithery.ai")) {
          tokenUrl.hostname = tokenUrl.hostname.replace("server.smithery.ai", "auth.smithery.ai");
        }
        tokenUrl.pathname = tokenUrl.pathname.replace(/\/$/, "") + "/token";

        console.log(`🔄 Manually exchanging auth code for tokens at ${tokenUrl}...`);

        // Prepare token request parameters
        const tokenParams: Record<string, string> = {
          grant_type: "authorization_code",
          code: authCode,
          redirect_uri: authProvider.redirectUrl,
          code_verifier: codeVerifier,
        };

        // Add client_id if available (required for some OAuth servers)
        const clientInfo = await authProvider.getClientInfo();
        if (clientInfo?.client_id) {
          tokenParams.client_id = clientInfo.client_id;
          console.log(`📝 Using client_id from saved client info`);
        } else {
          console.log(`⚠️ No client_id available - attempting token exchange without it`);
        }

        const tokenResponse = await fetch(tokenUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(tokenParams).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error(`Token exchange failed:`, errorText);
          throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }

        const tokens = await tokenResponse.json();
        console.log(`✅ Tokens received, saving...`);

        // Save tokens
        await authProvider.saveTokens(tokens);

        // Reset auth-in-progress flag
        (authProvider as any)._authInProgress = false;

        // Now reconnect using the saved tokens
        console.log(`🔄 Tokens saved, reconnecting to ${namespace}...`);
        const reconnectResult = await this.connectToMCP(namespace, serverUrl, metadata.displayName, metadata.iconUrl);

        return reconnectResult;
      }
    } catch (error: any) {
      console.error(`❌ ${namespace} OAuth failed:`, error);
      // Reset auth-in-progress flag on error
      const authProvider = this.oauthProviders.get(namespace);
      if (authProvider) {
        (authProvider as any)._authInProgress = false;
      }
      return {
        success: false,
        error: error.message || "OAuth failed",
      };
    }
  }

  /**
   * Get list of connected MCP server namespaces
   */
  getConnectedMCPs(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get tools for a specific MCP server
   */
  getMCPTools(namespace: string): any {
    const connection = this.connections.get(namespace);
    return connection?.tools || {};
  }

  /**
   * Get all tools from connected MCPs, aggregated
   */
  getAllTools(): any {
    let allTools = {};
    for (const [namespace, connection] of this.connections) {
      const tools = connection.tools || {};
      // Prefix tool names with namespace to avoid conflicts
      const prefixedTools = Object.entries(tools).reduce(
        (acc, [key, tool]) => {
          acc[`${namespace}__${key}`] = tool;
          return acc;
        },
        {} as Record<string, any>,
      );
      allTools = { ...allTools, ...prefixedTools };
    }
    return allTools;
  }

  /**
   * Get tools for multiple MCP servers by namespace
   */
  getToolsForMentions(mentions: string[]): any {
    let allTools = {};
    for (const namespace of mentions) {
      const connection = this.connections.get(namespace);
      if (connection) {
        const tools = connection.tools || {};
        // Prefix tool names with namespace to avoid conflicts
        const prefixedTools = Object.entries(tools).reduce(
          (acc, [key, tool]) => {
            acc[`${namespace}__${key}`] = tool;
            return acc;
          },
          {} as Record<string, any>,
        );
        allTools = { ...allTools, ...prefixedTools };
      }
    }
    return allTools;
  }

  /**
   * Get list of all connected servers with metadata
   */
  listConnectedServers(): MCPServerConfig[] {
    return Array.from(this.connections.values()).map((conn) => ({
      namespace: conn.name,
      displayName: conn.displayName,
      iconUrl: conn.iconUrl,
      serverUrl: conn.url,
    }));
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectMCP(namespace: string): Promise<void> {
    const connection = this.connections.get(namespace);
    if (connection) {
      try {
        await connection.client.close();
      } catch (error) {
        console.error(`Error closing connection to ${namespace}:`, error);
      }
      this.connections.delete(namespace);
      console.log(`🔌 Disconnected from ${namespace}`);
    }

    // Also remove OAuth provider
    const authProvider = this.oauthProviders.get(namespace);
    if (authProvider) {
      authProvider.clearTokens();
      this.oauthProviders.delete(namespace);
    }

    // Remove from persistent storage
    this.removeServerConfig(namespace);
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnectAll(): Promise<void> {
    for (const namespace of this.connections.keys()) {
      await this.disconnectMCP(namespace);
    }
  }

  /**
   * Save server config to persistent storage
   */
  private saveServerConfig(namespace: string, serverUrl: string, displayName: string, iconUrl: string): void {
    const savedServers = storage.store.get("connected-mcps", []) as MCPServerConfig[];
    
    // Remove existing entry if it exists
    const filteredServers = savedServers.filter(s => s.namespace !== namespace);
    
    // Add new entry
    filteredServers.push({
      namespace,
      serverUrl,
      displayName,
      iconUrl,
    });
    
    storage.store.set("connected-mcps", filteredServers);
    console.log(`💾 Saved ${displayName} to persistent storage`);
  }

  /**
   * Remove server config from persistent storage
   */
  private removeServerConfig(namespace: string): void {
    const savedServers = storage.store.get("connected-mcps", []) as MCPServerConfig[];
    const filteredServers = savedServers.filter(s => s.namespace !== namespace);
    storage.store.set("connected-mcps", filteredServers);
    console.log(`🗑️ Removed ${namespace} from persistent storage`);
  }

  /**
   * Initialize and reconnect to saved MCP servers on startup
   */
  async initializeConnections(): Promise<void> {
    console.log("🔄 Initializing MCP connections...");
    
    // Get list of saved server configs from storage
    const savedServers = storage.store.get("connected-mcps", []) as MCPServerConfig[];
    
    if (savedServers.length === 0) {
      console.log("📭 No saved MCP servers found");
      return;
    }
    
    console.log(`🔗 Attempting to reconnect to ${savedServers.length} saved servers...`);
    
    // Try to reconnect to each saved server
    for (const server of savedServers) {
      try {
        console.log(`🔄 Reconnecting to ${server.displayName}...`);
        const result = await this.connectToMCP(
          server.namespace,
          server.serverUrl,
          server.displayName,
          server.iconUrl
        );
        
        if (result.success) {
          console.log(`✅ Successfully reconnected to ${server.displayName}`);
        } else if (result.needsAuth) {
          console.log(`🔐 ${server.displayName} needs re-authentication (tokens may have expired)`);
        } else {
          console.log(`❌ Failed to reconnect to ${server.displayName}: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error reconnecting to ${server.displayName}:`, error);
      }
    }
  }
}

// Export singleton instance
export const mcpManager = new MCPManager();
