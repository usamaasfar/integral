import { contextBridge, ipcRenderer } from 'electron';

// Custom APIs for renderer
const electronAPI = {
  testRemoteMCP: () => ipcRenderer.invoke('test-remote-mcp'),
  testLocalMCP: () => ipcRenderer.invoke('test-local-mcp'),
  generateWithMCP: (prompt: string) => ipcRenderer.invoke('generate-with-mcp', prompt)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
