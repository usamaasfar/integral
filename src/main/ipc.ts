import { ipcMain } from "electron";
import composer from "./ai/index";
import { MCPManager } from "./smithery";
import { mainSet, mainGet } from "../common/storage";

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

// Storage handlers
ipcMain.handle("set-storage", async (event, key: string, value: any) => {
  mainSet(key, value);
  return { success: true };
});

ipcMain.handle("get-storage", async (event, key: string, defaultValue?: any) => {
  return mainGet(key, defaultValue);
});

// Settings handlers
ipcMain.handle("get-settings", async () => {
  return {
    username: mainGet("username", ""),
    customInstructions: mainGet("customInstructions", "")
  };
});

ipcMain.handle("save-settings", async (event, settings) => {
  if (settings.username !== undefined) {
    mainSet("username", settings.username);
  }
  if (settings.customInstructions !== undefined) {
    mainSet("customInstructions", settings.customInstructions);
  }
  return { success: true };
});

// AI Composer handler
ipcMain.on("ai-compose", async (event, prompt: string) => {
  try {
    const agent = composer([]);

    const result = await agent?.generate({
      prompt,
      onStepFinish: (step) => {
        // Extract text from step content for UI
        const textContent = step.content?.find((c) => c.type === "text");
        const stepWithText = { ...step, text: textContent?.text || step.text };

        event.reply("ai-step", stepWithText);
      },
    });

    event.reply("ai-complete", result);
  } catch (error) {
    console.error("AI Error:", error);
    event.reply("ai-error", error.message);
  }
});
