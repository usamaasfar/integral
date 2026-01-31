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
