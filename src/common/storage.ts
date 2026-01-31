import Store from "electron-store";

const store = new Store() as any;

export const mainSet = (key: string, value: any) => {
  store.set(key, value);
};

export const mainGet = (key: string, defaultValue?: any) => {
  return store.get(key, defaultValue);
};

export const rendererSet = async (key: string, value: any) => {
  return window.electronAPI.setStorage(key, value);
};

export const rendererGet = async (key: string, defaultValue?: any) => {
  return window.electronAPI.getStorage(key, defaultValue);
};

// Secure storage for sensitive data (API keys)
export const mainSetSecure = (key: string, value: string) => {
  const { safeStorage } = require("electron");
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Encryption not available");
  }
  const encrypted = safeStorage.encryptString(value);
  store.set(`secure_${key}`, encrypted.toString('base64'));
};

export const mainGetSecure = (key: string, defaultValue?: string) => {
  const { safeStorage } = require("electron");
  if (!safeStorage.isEncryptionAvailable()) {
    return defaultValue;
  }
  const encrypted = store.get(`secure_${key}`);
  if (!encrypted) return defaultValue;
  try {
    const buffer = Buffer.from(encrypted as string, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    return defaultValue;
  }
};

export const rendererSetSecure = async (key: string, value: string) => {
  return window.electronAPI.setSecureStorage(key, value);
};

export const rendererGetSecure = async (key: string, defaultValue?: string) => {
  return window.electronAPI.getSecureStorage(key, defaultValue);
};
