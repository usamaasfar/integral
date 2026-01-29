import fs from "node:fs";
import path from "node:path";

const MCP_CONFIG_PATH = path.join(process.cwd(), "mcp-servers.json");

export const loadMCPServers = () => {
  try {
    const data = fs.readFileSync(MCP_CONFIG_PATH, "utf8");
    return JSON.parse(data);
  } catch {
    return { remotes: [], locals: [] };
  }
};

export const saveMCPServers = (config: any) => {
  fs.writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
};
