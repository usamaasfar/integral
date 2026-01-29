import { createMCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadMCPServers } from "./config";

// MCP State
let cachedTools: any = {};
let serverStatus: { name: string; status: "connected" | "failed" }[] = [];

export const initializeMCPServers = async () => {
  const config = loadMCPServers();
  cachedTools = {};
  serverStatus = [];

  // Try remote servers
  for (const remote of config.remotes) {
    try {
      const client = await createMCPClient({
        transport: {
          type: "http",
          url: remote.url,
          headers: remote.headers || {},
        },
      });
      const tools = await client.tools();
      Object.assign(cachedTools, tools);
      serverStatus.push({ name: remote.name, status: "connected" });
    } catch (error) {
      serverStatus.push({ name: remote.name, status: "failed" });
    }
  }

  // Try local servers
  for (const local of config.locals) {
    try {
      const client = await createMCPClient({
        transport: new StdioClientTransport({
          command: local.command,
          args: local.args || [],
        }),
      });
      const tools = await client.tools();
      Object.assign(cachedTools, tools);
      serverStatus.push({ name: local.name, status: "connected" });
    } catch (error) {
      serverStatus.push({ name: local.name, status: "failed" });
    }
  }

  console.log(`MCP Status:`, serverStatus);
  return cachedTools;
};

export const getCachedTools = () => cachedTools;
export const getServerStatus = () => serverStatus;
