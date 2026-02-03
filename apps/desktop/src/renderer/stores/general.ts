import { create } from "zustand";

interface GeneralSettingsStore {
  isLoading: boolean;
  // State
  username: string;
  customInstructions: string;
  // Methods
  setGeneralSetting: (generalSettings: { username: string; customInstructions: string }) => Promise<void>;
  getGeneralSettings: () => Promise<void>;
}

export const useGeneralSettingsStore = create<GeneralSettingsStore>((set) => ({
  isLoading: false,
  username: "",
  customInstructions: "",

  setGeneralSetting: async (generalSettings) => {
    try {
      await window.electronAPI.setStorage("username", generalSettings.username);
      await window.electronAPI.setStorage("customInstructions", generalSettings.customInstructions);
      set({ ...generalSettings });
    } catch (error) {
      console.error(error);
    }
  },

  getGeneralSettings: async () => {
    set({ isLoading: true });
    try {
      const username = (await window.electronAPI.getStorage("username")) || "";
      const customInstructions = (await window.electronAPI.getStorage("customInstructions")) || "";
      set({ username, customInstructions, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
}));
