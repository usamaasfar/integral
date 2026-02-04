import { stepCountIs, type Tool, ToolLoopAgent } from "ai";

import composerPrompt from "~/main/ai/prompt/composer";
import { getModel } from "~/main/ai/providers";

/**
 * Create a composer agent with tools from MCP servers
 * @param mcpTools - Tools from connected MCP servers (from remote.getAllTools() or remote.getToolsFromServers())
 * @returns ToolLoopAgent configured with MCP tools
 */
function composer(mcpTools: Record<string, Tool> = {}) {
  try {
    const toolNames = Object.keys(mcpTools);
    const toolCount = toolNames.length;

    if (toolCount === 0) {
      console.warn("Composer initialized with no tools. Connect MCP servers to enable tool usage.");
    } else {
      console.log(`Composer initialized with ${toolCount} MCP tools:`, toolNames);

      // Debug: Log sample tool structure
      const firstTool = mcpTools[toolNames[0]];
      console.log(`Sample MCP tool structure:`, {
        name: toolNames[0],
        type: typeof firstTool,
        hasDescription: !!firstTool?.description,
        description: firstTool?.description?.substring(0, 100),
        hasExecute: typeof firstTool?.execute === "function",
        keys: Object.keys(firstTool || {}),
      });
    }

    const composer = new ToolLoopAgent({
      instructions: composerPrompt,
      model: getModel(),
      stopWhen: stepCountIs(128),
      tools: mcpTools,
    });

    return composer;
  } catch (error) {
    console.error("Failed to create composer agent:", error);
    throw error;
  }
}

export default composer;
