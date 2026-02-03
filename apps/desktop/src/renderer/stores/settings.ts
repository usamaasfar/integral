import { create } from "zustand";
import { PROVIDERS, type ProviderType } from "~/common/providers";

interface GeneralSettings {
  username: string;
  customInstructions: string;
}

interface ProviderConfig {
  provider: ProviderType;
  model: string;
  apiKey?: string;
  name?: string;
  baseUrl?: string;
}

interface MCPServerConfig {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  namespace: string;
  displayName: string;
  iconUrl: string;
  serverUrl: string;
  connectedAt: string;
}

interface SmitheryServer {
  id: string;
  qualifiedName: string;
  namespace: string | null;
  slug: string | null;
  displayName: string;
  description: string;
  iconUrl: string | null;
  verified: boolean;
  useCount: number;
  remote: boolean | null;
  isDeployed: boolean;
  createdAt: string;
  homepage: string;
  owner: string | null;
}

interface OAuthSession {
  sessionId: string;
  serverMetadata: {
    namespace: string;
    displayName: string;
    iconUrl: string;
  };
}

interface SettingsStore extends GeneralSettings {
  isLoading: boolean;

  // Provider state
  selectedProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;

  // Ollama state
  ollamaHealth: boolean;
  ollamaModels: string[];

  // MCP state
  connectedMCPs: MCPServerConfig[];
  searchResults: SmitheryServer[];
  isSearching: boolean;
  isConnecting: boolean;
  pendingOAuthSession: OAuthSession | null;

  // General settings methods
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<GeneralSettings>) => Promise<void>;

  // Provider methods
  loadProviders: () => Promise<void>;
  saveProvider: (config: ProviderConfig) => Promise<void>;

  // Ollama methods
  checkOllamaHealth: () => Promise<void>;
  loadOllamaModels: () => Promise<void>;

  // MCP methods
  searchMCPs: (term: string) => Promise<void>;
  connectMCP: (serverConfig: SmitheryServer) => Promise<void>;
  disconnectMCP: (namespace: string) => Promise<void>;
  loadConnectedMCPs: () => Promise<void>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state
  username: "",
  customInstructions: "",
  isLoading: false,
  selectedProvider: "ollama",
  providers: {} as Record<ProviderType, ProviderConfig>,
  ollamaHealth: false,
  ollamaModels: [],
  connectedMCPs: [],
  searchResults: [],
  isSearching: false,
  isConnecting: false,
  pendingOAuthSession: null,

  // General settings methods
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      // const settings = await window.electronAPI.getSettings();
      // const selectedProvider = await window.electronAPI.getStorage("selectedProvider");
      // set({
      //   username: settings.username || "",
      //   customInstructions: settings.customInstructions || "",
      //   selectedProvider: selectedProvider || "ollama",
      //   isLoading: false,
      // });
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true });
    try {
      await window.electronAPI.setSettings(newSettings);
      set({ ...newSettings, isLoading: false });
    } catch (error) {
      console.error("Failed to update settings:", error);
      set({ isLoading: false });
    }
  },

  // Provider methods
  loadProviders: async () => {
    set({ isLoading: true });
    try {
      const providers: Record<ProviderType, ProviderConfig> = {} as Record<ProviderType, ProviderConfig>;

      for (const providerInfo of PROVIDERS) {
        try {
          // const config = await window.electronAPI.getProviderConfig(String(providerInfo.type));
          // if (config?.config && Object.keys(config.config).length > 0) {
          //   providers[providerInfo.type] = { ...config.config, apiKey: config.apiKey };
          // }
        } catch (err) {
          console.error(`Failed to load config for ${providerInfo.type}:`, err);
        }
      }

      set({ providers, isLoading: false });
    } catch (error) {
      console.error("Failed to load providers:", error);
      set({ isLoading: false });
    }
  },

  saveProvider: async (config) => {
    set({ isLoading: true });
    try {
      await window.electronAPI.saveProviderConfig(config);
      await window.electronAPI.setStorage("selectedProvider", config.provider);
      set((state) => ({
        providers: { ...state.providers, [config.provider]: config },
        selectedProvider: config.provider,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to save provider:", error);
      set({ isLoading: false });
    }
  },

  // Ollama methods
  checkOllamaHealth: async () => {
    try {
      const health = await window.electronAPI.getOllamaHealth();
      set({ ollamaHealth: health });
    } catch (error) {
      console.error("Failed to check Ollama health:", error);
      set({ ollamaHealth: false });
    }
  },

  loadOllamaModels: async () => {
    try {
      const models = await window.electronAPI.getOllamaModels();
      set({ ollamaModels: models });
    } catch (error) {
      console.error("Failed to load Ollama models:", error);
      set({ ollamaModels: [] });
    }
  },

  // MCP methods
  searchMCPs: async (term: string) => {
    set({ isSearching: true });
    try {
      const results = await window.electronAPI.searchMCPServers(term);
      set({ searchResults: results, isSearching: false });
    } catch (error) {
      console.error("Failed to search MCPs:", error);
      set({ searchResults: [], isSearching: false });
    }
  },

  connectMCP: async (serverConfig: SmitheryServer) => {
    set({ isConnecting: true });
    try {
      console.log("Initiating connection to:", serverConfig.qualifiedName);

      const result = await window.electronAPI.connectMCPServer({
        namespace: serverConfig.qualifiedName,
        qualifiedName: serverConfig.qualifiedName,
        displayName: serverConfig.displayName,
        iconUrl: serverConfig.iconUrl || "",
      });

      if (result.needsAuth) {
        console.log("OAuth authentication required - browser should have opened");

        // Store server metadata for when OAuth callback comes
        set({
          pendingOAuthSession: {
            sessionId: result.serverMetadata.namespace, // Use namespace as session ID
            serverMetadata: result.serverMetadata,
          },
        });

        console.log("Waiting for OAuth callback...");
        // isConnecting will be set to false in handleOAuthCallback
      } else if (result.success) {
        console.log("Connected successfully without OAuth!");
        set({ isConnecting: false });
        await get().loadConnectedMCPs();
      } else {
        throw new Error("Connection failed");
      }
    } catch (error) {
      console.error("Failed to connect MCP:", error);
      set({ isConnecting: false, pendingOAuthSession: null });
      throw error;
    }
  },

  handleOAuthCallback: async (code: string, state: string) => {
    console.log("handleOAuthCallback called with code:", code.substring(0, 10) + "...", "state:", state);

    const session = get().pendingOAuthSession;
    if (!session) {
      console.error("No pending OAuth session found");
      set({ isConnecting: false });
      return;
    }

    try {
      console.log("Completing OAuth flow...");

      // Complete the OAuth flow by passing the auth code to the backend
      await window.electronAPI.finishMCPAuth(code, session.serverMetadata);

      console.log("✅ OAuth completed successfully!");

      // Reload connected MCPs
      await get().loadConnectedMCPs();

      // Clear pending session
      set({ isConnecting: false, pendingOAuthSession: null });
    } catch (error) {
      console.error("❌ Failed to complete OAuth:", error);
      set({ isConnecting: false, pendingOAuthSession: null });
    }
  },

  disconnectMCP: async (namespace: string) => {
    try {
      await window.electronAPI.disconnectMCPServer(namespace);
      await get().loadConnectedMCPs();
    } catch (error) {
      console.error("Failed to disconnect MCP:", error);
    }
  },

  loadConnectedMCPs: async () => {
    try {
      const mcps = await window.electronAPI.listConnectedMCPs();
      set({ connectedMCPs: mcps });
    } catch (error) {
      console.error("Failed to load connected MCPs:", error);
      set({ connectedMCPs: [] });
    }
  },
}));
