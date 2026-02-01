import storage from "~/main/utils/storage";

const providers = {
  ollama: require("~/main/ai/providers/ollama"),
  openai: require("~/main/ai/providers/openai"),
  anthropic: require("~/main/ai/providers/anthropic"),
  google: require("~/main/ai/providers/google"),
  openaiCompatible: require("~/main/ai/providers/openai-compatible"),
};

export const model = (() => {
  const model = storage.store.get("model") as {
    provider: keyof typeof providers;
    name: string;
  };

  return providers[model.provider](model.name);
})();
