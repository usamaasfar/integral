import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // Storage
  setStorage: (key: string, value: any) => ipcRenderer.invoke("set-storage", key, value),
  getStorage: (key: string) => ipcRenderer.invoke("get-storage", key),
  setSecureStorage: (key: string, value: string) => ipcRenderer.invoke("set-secure-storage", key, value),
  getSecureStorage: (key: string) => ipcRenderer.invoke("get-secure-storage", key),

  // Settings
  setSettings: (settings: any) => ipcRenderer.invoke("set-settings", settings),
  getSettings: () => ipcRenderer.invoke("get-settings"),

  // Provider Config
  saveProviderConfig: (config: any) => ipcRenderer.invoke("save-provider-config", config),
  getProviderConfig: (provider: string) => ipcRenderer.invoke("get-provider-config", provider),

  // Ollama
  getOllamaHealth: () => ipcRenderer.invoke("get-ollama-health"),
  getOllamaModels: () => ipcRenderer.invoke("get-ollama-models"),

  // AI Composition
  aiCompose: (prompt: string) => ipcRenderer.send("ai-compose", prompt),
  onAIStep: (callback: (step: any) => void) => {
    ipcRenderer.on("ai-step", (_event, step) => callback(step));
  },
  onAIComplete: (callback: (result: any) => void) => {
    ipcRenderer.on("ai-complete", (_event, result) => callback(result));
  },
  onAIError: (callback: (error: any) => void) => {
    ipcRenderer.on("ai-error", (_event, error) => callback(error));
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
