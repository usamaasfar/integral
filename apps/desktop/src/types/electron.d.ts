export interface MCPConnectionResult {
  success: boolean;
  needsAuth?: boolean;
  namespace?: string;
  tools?: string[];
}

export interface ElectronAPI {
  // Storage
  setStorage: (key: string, value: any) => Promise<boolean>;
  getStorage: (key: string) => Promise<any>;
  setSecureStorage: (key: string, value: string) => Promise<boolean>;
  getSecureStorage: (key: string) => Promise<string>;

  // Providers
  getOllamaHealth: () => Promise<boolean>;
  getOllamaModels: () => Promise<string[]>;

  // MCP Remote Servers
  searchRemoteMCPServers: (term: string) => Promise<any>;
  connectRemoteServer: (namespace: any) => Promise<MCPConnectionResult>;
  disconnectRemoteServer: (namespace: string) => Promise<{ success: boolean }>;
  listConnectedMCPs: () => Promise<any[]>;
  completeMCPOAuth: (namespace: string, authCode: string) => Promise<MCPConnectionResult>;
  onMCPOAuthCallback: (callback: (data: { code: string; state: string }) => void) => void;

  // System
  openExternalLink: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
