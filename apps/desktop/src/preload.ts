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
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
