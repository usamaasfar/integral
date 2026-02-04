import anthropicProvider from "~/main/ai/providers/anthropic";
import googleProvider from "~/main/ai/providers/google";
import ollamaProvider from "~/main/ai/providers/ollama";
import openaiProvider from "~/main/ai/providers/openai";
import openaiCompatibleProvider from "~/main/ai/providers/openai-compatible";
import storage from "~/main/utils/storage";

const providers = {
  ollama: ollamaProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
  google: googleProvider,
  openaiCompatible: openaiCompatibleProvider,
};

export const getModel = () => {
  const selectedProvider = storage.store.get("selectedProvider", "ollama") as keyof typeof providers;
  const providerConfigString = storage.secureStore.get(`provider::${selectedProvider}`);

  if (!providerConfigString) {
    throw new Error(`Provider config for '${selectedProvider}' is not configured`);
  }

  const providerConfig = JSON.parse(providerConfigString) as {
    model: string;
    apiKey?: string;
    name?: string;
    baseUrl?: string;
  };

  if (!providers[selectedProvider]) {
    throw new Error(`Provider '${selectedProvider}' is not supported`);
  }

  return providers[selectedProvider](providerConfig.model);
};
