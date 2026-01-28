import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ToolLoopAgent } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import started from "electron-squirrel-startup";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// AI Models
const models = {
  kimi: ollama("kimi-k2.5:cloud"),
  llama: ollama("llama3.2:3b"),
};

// MCP IPC handlers - register before app ready
ipcMain.handle('test-remote-mcp', async () => {
  try {
    const mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: {
          'CONTEXT7_API_KEY': 'ctx7sk-7e00e5fc-131e-4c20-a4e1-1f383780ff1d',
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }
    });

    const tools = await mcpClient.tools();
    await mcpClient.close();
    
    return {
      success: true,
      tools: Object.keys(tools).map(name => ({
        name,
        description: tools[name].description || 'No description'
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('test-local-mcp', async () => {
  try {
    const mcpClient = await createMCPClient({
      transport: new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp', '--api-key', 'ctx7sk-7e00e5fc-131e-4c20-a4e1-1f383780ff1d']
      })
    });

    const tools = await mcpClient.tools();
    await mcpClient.close();
    
    return {
      success: true,
      tools: Object.keys(tools).map(name => ({
        name,
        description: tools[name].description || 'No description'
      }))
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('generate-with-mcp', async (_, prompt: string) => {
  try {
    // Get tools from both remote and local MCP
    const remoteMcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: 'https://mcp.context7.com/mcp',
        headers: {
          'CONTEXT7_API_KEY': 'ctx7sk-7e00e5fc-131e-4c20-a4e1-1f383780ff1d',
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        }
      }
    });

    const localMcpClient = await createMCPClient({
      transport: new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp', '--api-key', 'ctx7sk-7e00e5fc-131e-4c20-a4e1-1f383780ff1d']
      })
    });

    const remoteTools = await remoteMcpClient.tools();
    const localTools = await localMcpClient.tools();
    
    // Combine tools
    const allTools = { ...remoteTools, ...localTools };

    const agent = new ToolLoopAgent({
      model: models.kimi,
      tools: allTools,
    });

    const result = await agent.generate({ prompt });
    
    await remoteMcpClient.close();
    await localMcpClient.close();

    return {
      success: true,
      text: result.text,
      steps: result.steps.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
