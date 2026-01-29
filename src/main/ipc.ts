import { ToolLoopAgent } from "ai";
import { ipcMain } from "electron";
import { ollama } from "ollama-ai-provider-v2";
import { getCachedTools, getServerStatus, initializeMCPServers } from "./ai/mcps/manager";
import { AGENT_INSTRUCTIONS } from "./ai/prompt";

// AI Models
const models = {
  kimi: ollama("kimi-k2.5:cloud"),
  llama: ollama("llama3.2:3b"),
};

// Initialize on startup
initializeMCPServers().catch(console.error);

// MCP IPC handlers
ipcMain.handle("get-mcp-status", () => getServerStatus());

ipcMain.on("generate-with-mcp", async (event, prompt: string) => {
  try {
    const allTools = getCachedTools();

    const agent = new ToolLoopAgent({
      model: models.kimi,
      tools: allTools,
      instructions: AGENT_INSTRUCTIONS,
      onStepFinish: ({ text }) => {
        event.reply("agent-step", text);
      },
    });

    const result = await agent.generate({ prompt });

    event.reply("generate-complete", {
      success: true,
      text: result.text,
      steps: result.steps.length,
    });
  } catch (error) {
    event.reply("generate-error", {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
