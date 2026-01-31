import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const electronAPI = {
  // Storage
  setStorage: (key: string, value: any) => ipcRenderer.invoke("set-storage", key, value),
  getStorage: (key: string, defaultValue?: any) => ipcRenderer.invoke("get-storage", key, defaultValue),
  // Secure Storage
  setSecureStorage: (key: string, value: string) => ipcRenderer.invoke("set-secure-storage", key, value),
  getSecureStorage: (key: string, defaultValue?: string) => ipcRenderer.invoke("get-secure-storage", key, defaultValue),
  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: any) => ipcRenderer.invoke("save-settings", settings),
  // Provider Settings
  getProviderSettings: () => ipcRenderer.invoke("get-provider-settings"),
  saveProviderSettings: (settings: any) => ipcRenderer.invoke("save-provider-settings", settings),
  getProviderApiKey: (provider: string) => ipcRenderer.invoke("get-provider-api-key", provider),
  getOllamaModels: () => ipcRenderer.invoke("get-ollama-models"),
  // AI Composer
  aiCompose: (prompt: string) => ipcRenderer.send("ai-compose", prompt),
  onAIStep: (callback: (step: any) => void) => {
    ipcRenderer.on("ai-step", (_, step) => callback(step));
  },
  onAIComplete: (callback: (result: any) => void) => {
    ipcRenderer.on("ai-complete", (_, result) => callback(result));
  },
  onAIError: (callback: (error: string) => void) => {
    ipcRenderer.on("ai-error", (_, error) => callback(error));
  },
  // MCP OAuth functions
  // getAvailableMCPs: () => ipcRenderer.invoke('get-available-mcps'),
  // connectMCP: (mcpName: string) => ipcRenderer.invoke('connect-mcp', mcpName),
  // finishOAuth: (mcpName: string, authCode: string) => ipcRenderer.invoke('finish-oauth', mcpName, authCode),
  // getConnectedMCPs: () => ipcRenderer.invoke('get-connected-mcps'),
  // OAuth callback listener
  // onOAuthCallback: (callback: (code: string) => void) => {
  //   ipcRenderer.on('oauth-callback', (_, code) => callback(code));
  // },
  // AI generation
  // generateWithMCP: (prompt: string) => ipcRenderer.send('generate-with-mcp', prompt),
  // onAgentStep: (callback: (step: string) => void) => {
  //   ipcRenderer.on('agent-step', (_, step) => callback(step));
  // },
  // onGenerateComplete: (callback: (result: any) => void) => {
  //   ipcRenderer.on('generate-complete', (_, result) => callback(result));
  // },
  // onGenerateError: (callback: (result: any) => void) => {
  //   ipcRenderer.on('generate-error', (_, result) => callback(result));
  // }
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
