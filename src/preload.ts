import { contextBridge, ipcRenderer } from 'electron';

// Custom APIs for renderer
const electronAPI = {
  generateWithMCP: (prompt: string) => ipcRenderer.send('generate-with-mcp', prompt),
  getMCPStatus: () => ipcRenderer.invoke('get-mcp-status'),
  onAgentStep: (callback: (step: string) => void) => {
    ipcRenderer.on('agent-step', (_, step) => callback(step));
  },
  onGenerateComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('generate-complete', (_, result) => callback(result));
  },
  onGenerateError: (callback: (result: any) => void) => {
    ipcRenderer.on('generate-error', (_, result) => callback(result));
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
