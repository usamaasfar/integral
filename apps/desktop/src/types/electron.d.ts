export interface ElectronAPI {
  // Storage
  setStorage: (key: string, value: any) => Promise<boolean>;
  getStorage: (key: string) => Promise<any>;
  setSecureStorage: (key: string, value: string) => Promise<boolean>;
  getSecureStorage: (key: string) => Promise<string>;

  // Settings
  setSettings: (settings: any) => Promise<boolean>;
  getSettings: () => Promise<{ username: string; customInstructions: string }>;

  // Provider Config
  saveProviderConfig: (config: any) => Promise<boolean>;
  getProviderConfig: (provider: string) => Promise<{ apiKey: string; config: any }>;

  // Ollama
  getOllamaHealth: () => Promise<boolean>;
  getOllamaModels: () => Promise<string[]>;

  // AI Composition
  aiCompose: (prompt: string, mentions?: string[]) => Promise<any>;
  onAIStep: (callback: (step: any) => void) => void;
  onAIComplete: (callback: (result: any) => void) => void;
  onAIError: (callback: (error: any) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
