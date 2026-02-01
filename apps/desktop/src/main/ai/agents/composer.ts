import { stepCountIs, type Tool, ToolLoopAgent, tool } from "ai";
import { z } from "zod";

import composerPrompt from "~/main/ai/prompt/composer";
import { getModel } from "~/main/ai/providers";

function composer(dynamicTools: Record<string, Tool> = {}) {
  try {
    // Static tools
    const staticTools = {
      weather: tool({
        description: "Get the weather in a location (in Fahrenheit)",
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => ({
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        }),
      }),
      convertFahrenheitToCelsius: tool({
        description: "Convert temperature from Fahrenheit to Celsius",
        inputSchema: z.object({
          temperature: z.number().describe("Temperature in Fahrenheit"),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return { celsius };
        },
      }),
    };

    // Merge static and dynamic tools (dynamic tools are already in object format)
    const allTools = { ...staticTools, ...dynamicTools };

    // Debug: Log tool information
    const allToolNames = Object.keys(allTools);
    console.log(`🔧 Composer initialized with ${allToolNames.length} tools:`, allToolNames);
    if (Object.keys(dynamicTools).length > 0) {
      const firstDynamicTool = Object.keys(dynamicTools)[0];
      const tool = dynamicTools[firstDynamicTool];
      console.log(`📋 Sample MCP tool structure:`, {
        name: firstDynamicTool,
        type: typeof tool,
        hasDescription: !!tool?.description,
        description: tool?.description,
        hasExecute: typeof tool?.execute === "function",
        keys: Object.keys(tool || {}),
      });
    }

    const composer = new ToolLoopAgent({
      instructions: composerPrompt,
      model: getModel(),
      stopWhen: stepCountIs(128),
      tools: allTools,
    });

    return composer;
  } catch (error) {
    console.error(error);
  }
}

export default composer;
