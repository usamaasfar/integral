import { stepCountIs, type Tool, ToolLoopAgent } from "ai";

import composerPrompt from "~/main/ai/prompt/composer";
import { getModel } from "~/main/ai/providers";
import { requestUserInputTool } from "~/main/ai/agents/tools";

/**
 * Create a composer agent with tools from MCP servers
 * @param mcpTools - Tools from connected MCP servers (from remote.getAllTools() or remote.getToolsFromServers())
 * @returns ToolLoopAgent configured with MCP tools
 */
function composer(mcpTools: Record<string, Tool> = {}) {
  try {
    const composer = new ToolLoopAgent({
      instructions: composerPrompt,
      model: getModel(),
      stopWhen: stepCountIs(128),
      tools: {
        ...mcpTools,
        request_user_input: requestUserInputTool,
      },
    });

    return composer;
  } catch (error) {
    console.error("Failed to create composer agent:", error);
    throw error;
  }
}

export default composer;
