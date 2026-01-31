import { ipcMain } from "electron";
import composer from "./ai/index";
import { MCPManager } from "./smithery";
import { mainSet, mainGet, mainSetSecure, mainGetSecure } from "../common/storage";

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

// Secure storage handlers
ipcMain.handle("set-secure-storage", async (event, key: string, value: string) => {
  mainSetSecure(key, value);
  return { success: true };
});

ipcMain.handle("get-secure-storage", async (event, key: string, defaultValue?: string) => {
  return mainGetSecure(key, defaultValue);
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

// Provider settings handlers
ipcMain.handle("get-provider-settings", async () => {
  return {
    selectedProvider: mainGet("selectedProvider", "ollama"),
    modelName: mainGet("modelName", "kimi-k2.5:cloud"),
    name: mainGet("providerName", ""),
    baseUrl: mainGet("baseUrl", "")
  };
});

ipcMain.handle("save-provider-settings", async (event, settings) => {
  // Save non-sensitive data to regular storage
  if (settings.selectedProvider !== undefined) {
    mainSet("selectedProvider", settings.selectedProvider);
  }
  if (settings.modelName !== undefined) {
    mainSet("modelName", settings.modelName);
  }
  if (settings.name !== undefined) {
    mainSet("providerName", settings.name);
  }
  if (settings.baseUrl !== undefined) {
    mainSet("baseUrl", settings.baseUrl);
  }
  
  // Save API key to secure storage
  if (settings.apiKey !== undefined && settings.apiKey !== "") {
    mainSetSecure(`apiKey_${settings.selectedProvider}`, settings.apiKey);
  }
  
  return { success: true };
});

// Get API key for specific provider
ipcMain.handle("get-provider-api-key", async (event, provider: string) => {
  return mainGetSecure(`apiKey_${provider}`, "");
});

// Get Ollama models
ipcMain.handle("get-ollama-models", async () => {
  try {
    const fetch = require('node-fetch');
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    return ["kimi-k2.5:cloud"]; // fallback
  }
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
