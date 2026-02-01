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

interface SettingsStore extends GeneralSettings {
  isLoading: boolean;

  // Provider state
  selectedProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;

  // Ollama state
  ollamaHealth: boolean;
  ollamaModels: string[];

  // General settings methods
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<GeneralSettings>) => Promise<void>;

  // Provider methods
  loadProviders: () => Promise<void>;
  saveProvider: (config: ProviderConfig) => Promise<void>;

  // Ollama methods
  checkOllamaHealth: () => Promise<void>;
  loadOllamaModels: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  // Initial state
  username: "",
  customInstructions: "",
  isLoading: false,
  selectedProvider: "ollama",
  providers: {} as Record<ProviderType, ProviderConfig>,
  ollamaHealth: false,
  ollamaModels: [],

  // General settings methods
  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await window.electronAPI.getSettings();
      const selectedProvider = await window.electronAPI.getStorage("selectedProvider");
      set({
        username: settings.username || "",
        customInstructions: settings.customInstructions || "",
        selectedProvider: selectedProvider || "ollama",
        isLoading: false,
      });
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
          const config = await window.electronAPI.getProviderConfig(String(providerInfo.type));
          if (config?.config && Object.keys(config.config).length > 0) {
            providers[providerInfo.type] = { ...config.config, apiKey: config.apiKey };
          }
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
}));
