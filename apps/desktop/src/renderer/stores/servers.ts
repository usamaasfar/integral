import { create } from "zustand";

export interface RemoteMCPServer {
  id: string;
  qualifiedName: string;
  namespace: string;
  displayName: string;
  description: string;
  iconUrl: string;
  verified: boolean;
  homepage: string;
}

export interface ConnectRemoteServer {
  namespace: string;
  displayName: string;
  iconUrl: string;
  verified: boolean;
  homepage: string;
}

interface ServersStore {
  // States
  isLoading: boolean;

  // Remote MCP States
  isSearchingRemoteMCP: boolean;
  remoteMCPSearchResults: RemoteMCPServer[];
  isConnecting: boolean;
  connectedServers: Record<string, ConnectRemoteServer>;

  // Methods
  getRemoteMCPSearchResults: (term: string) => Promise<void>;
  connectRemoteMCPServer: (server: ConnectRemoteServer) => Promise<{ success: boolean; needsAuth?: boolean }>;
  disconnectMCPServer: (namespace: string) => Promise<void>;
  loadConnectedServers: () => Promise<void>;
}

let debounceTimer: NodeJS.Timeout | null = null;

export const useServersStore = create<ServersStore>((set) => ({
  isLoading: false,
  isSearchingRemoteMCP: false,
  remoteMCPSearchResults: [],
  connectedServers: {},
  isConnecting: false,

  getRemoteMCPSearchResults: async (term: string) => {
    set({ isSearchingRemoteMCP: true });
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      try {
        const results = await window.electronAPI.searchRemoteMCPServers(term);
        set({ remoteMCPSearchResults: results, isSearchingRemoteMCP: false });
      } catch (error) {
        console.error("Error fetching remote MCPs:", error);
        set({ isSearchingRemoteMCP: false });
      }
    }, 500);
  },

  connectRemoteMCPServer: async (server: ConnectRemoteServer) => {
    set({ isConnecting: true });
    try {
      const result = await window.electronAPI.connectRemoteServer(server);

      if (result.success) {
        set((state) => ({
          connectedServers: { ...state.connectedServers, [server.namespace]: server },
          isConnecting: false,
        }));

        return { success: true };
      } else if (result.needsAuth) {
        set({ isConnecting: false });
        return { success: false, needsAuth: true };
      }

      set({ isConnecting: false });
      return { success: false };
    } catch (error) {
      console.error("Error connecting to MCP server:", error);
      set({ isConnecting: false });
      return { success: false };
    }
  },

  disconnectMCPServer: async (namespace: string) => {
    try {
      console.log("disconned mcp server: ", namespace);
      await window.electronAPI.disconnectRemoteServer(namespace);
      set((state) => {
        const { [namespace]: removed, ...rest } = state.connectedServers;
        return { connectedServers: rest };
      });
    } catch (error) {
      console.error("Error disconnecting MCP server:", error);
      throw error;
    }
  },

  loadConnectedServers: async () => {
    try {
      const servers = await window.electronAPI.listConnectedMCPs();
      set({ connectedServers: servers });
    } catch (error) {
      console.error("Error loading connected servers:", error);
    }
  },
}));
