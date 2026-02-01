import { ipcMain } from "electron";

import composer from "~/main/ai/agents/composer";
import ollama from "~/main/services/ollama";
import storage from "~/main/utils/storage";

ipcMain.handle("set-storage", (_event, key: string, value: any) => {
  storage.store.set(key, value);
  return true;
});

ipcMain.handle("get-storage", (_event, key: string) => {
  return storage.store.get(key);
});

ipcMain.handle("set-secure-storage", (_event, key: string, value: string) => {
  storage.secureStore.set(key, value);
  return true;
});

ipcMain.handle("get-secure-storage", (_event, key: string) => {
  return storage.secureStore.get(key);
});

ipcMain.handle("set-settings", (_event, settings) => {
  console.log(settings.username);
  storage.store.set("username", settings.username);
  storage.store.set("customInstructions", settings.customInstructions);
  return true;
});

ipcMain.handle("get-settings", () => {
  return {
    username: storage.store.get("username", ""),
    customInstructions: storage.store.get("customInstructions", ""),
  };
});

ipcMain.handle("save-provider-config", (_event, config) => {
  storage.secureStore.set(`${config.provider}-provider-api-key`, config.apiKey);
  storage.store.set(`${config.provider}-provider-config`, {
    provider: config.provider,
    model: config.model,
    name: config.name,
    baseUrl: config.baseUrl,
  });
  return true;
});

ipcMain.handle("get-provider-config", (_event, provider: string) => {
  if (!provider) {
    return { apiKey: undefined, config: {} };
  }
  return {
    apiKey: storage.secureStore.get(`${provider}-provider-api-key`),
    config: storage.store.get(`${provider}-provider-config`, {}),
  };
});

ipcMain.handle("get-ollama-health", async () => {
  return await ollama.health();
});

ipcMain.handle("get-ollama-models", async () => {
  return await ollama.models();
});
