import { create } from "zustand";

interface GeneralSettings {
  username: string;
  customInstructions: string;
}

interface SettingsStore extends GeneralSettings {
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  username: "",
  customInstructions: "",
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await window.electronAPI.getSettings();
      set({
        username: settings.username || "",
        customInstructions: settings.customInstructions || "",
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
}));
