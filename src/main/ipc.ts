import { ipcMain } from "electron";
import { MCPManager } from "./smithery";

const mcpManager = new MCPManager();

// Available MCPs (Gmail only for testing)
const availableMCPs = [{ name: "Gmail", url: "https://server.smithery.ai/gmail" }];

// Auto-reconnect saved MCPs on startup
async function autoReconnectMCPs() {
  for (const mcp of availableMCPs) {
    try {
      const result = await mcpManager.connectToMCP(mcp.name, mcp.url);
      if (result.success) {
        console.log(`🔄 Auto-reconnected ${mcp.name}`);
      }
    } catch (error) {
      console.log(`⚠️ Failed to auto-reconnect ${mcp.name}:`, error.message);
    }
  }
}

// Start auto-reconnection
// autoReconnectMCPs();

// MCP OAuth handlers
ipcMain.handle("get-available-mcps", async () => {
  return availableMCPs;
});

ipcMain.handle("connect-mcp", async (event, mcpName: string) => {
  const mcp = availableMCPs.find((m) => m.name === mcpName);
  if (!mcp) {
    throw new Error(`MCP ${mcpName} not found`);
  }

  return await mcpManager.connectToMCP(mcp.name, mcp.url);
});

ipcMain.handle("finish-oauth", async (event, mcpName: string, authCode: string) => {
  const mcp = availableMCPs.find((m) => m.name === mcpName);
  if (!mcp) {
    throw new Error(`MCP ${mcpName} not found`);
  }

  return await mcpManager.finishOAuth(mcp.name, mcp.url, authCode);
});
