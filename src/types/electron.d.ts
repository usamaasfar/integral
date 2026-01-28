export interface ElectronAPI {
  testRemoteMCP: () => Promise<{
    success: boolean;
    tools?: Array<{ name: string; description: string }>;
    error?: string;
  }>;
  testLocalMCP: () => Promise<{
    success: boolean;
    tools?: Array<{ name: string; description: string }>;
    error?: string;
  }>;
  generateWithMCP: (prompt: string) => Promise<{
    success: boolean;
    text?: string;
    steps?: number;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
