import { create } from "zustand";

export interface RemoteMCPServer {
  id: string;
  qualifiedName: string;
  namespace: string | null;
  displayName: string;
  description: string;
  iconUrl: string | null;
  verified: boolean;
  homepage: string;
}

export interface ConnectedMCPServer {
  namespace: string;
  displayName?: string;
  iconUrl?: string;
  tools?: string[];
  connectedAt: Date;
}

interface ServersStore {
  // States
  isLoading: boolean;

  // Remote MCP States
  isSearchingRemoteMCP: boolean;
  remoteMCPSearchResults: RemoteMCPServer[];
  connectedServers: ConnectedMCPServer[];
  isConnecting: boolean;

  // Methods
  getRemoteMCPSearchResults: (term: string) => Promise<void>;
  connectRemoteMCPServer: (
    namespace: string,
    metadata?: { displayName?: string; iconUrl?: string },
  ) => Promise<{ success: boolean; needsAuth?: boolean }>;
  disconnectMCPServer: (namespace: string) => Promise<void>;
  loadConnectedServers: () => Promise<void>;
}

let debounceTimer: NodeJS.Timeout | null = null;

export const useServersStore = create<ServersStore>((set) => ({
  isLoading: false,
  isSearchingRemoteMCP: false,
  remoteMCPSearchResults: [],
  connectedServers: [],
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

  connectRemoteMCPServer: async (namespace: string, metadata?: { displayName?: string; iconUrl?: string }) => {
    set({ isConnecting: true });
    try {
      const result = await window.electronAPI.connectRemoteMCPServer(namespace);

      if (result.success) {
        const newServer: ConnectedMCPServer = {
          namespace,
          displayName: metadata?.displayName,
          iconUrl: metadata?.iconUrl,
          tools: result.tools,
          connectedAt: new Date(),
        };

        set((state) => ({
          connectedServers: [...state.connectedServers.filter((s) => s.namespace !== namespace), newServer],
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
      await window.electronAPI.disconnectMCPServer(namespace);
      set((state) => ({
        connectedServers: state.connectedServers.filter((s) => s.namespace !== namespace),
      }));
    } catch (error) {
      console.error("Error disconnecting MCP server:", error);
      throw error;
    }
  },

  loadConnectedServers: async () => {
    try {
      const namespaces = await window.electronAPI.listConnectedMCPs();
      const servers: ConnectedMCPServer[] = namespaces.map((namespace) => ({
        namespace,
        connectedAt: new Date(),
      }));
      set({ connectedServers: servers });
    } catch (error) {
      console.error("Error loading connected servers:", error);
    }
  },
}));
