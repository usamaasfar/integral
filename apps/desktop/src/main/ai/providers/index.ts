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
  const providerConfig = storage.store.get(`${selectedProvider}-provider-config`) as {
    provider: keyof typeof providers;
    model: string;
  };

  return providers[providerConfig.provider](providerConfig.model);
};
