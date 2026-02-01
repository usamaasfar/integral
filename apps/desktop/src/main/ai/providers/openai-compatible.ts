import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import storage from "~/main/utils/storage";

export default function openaiCompatibleProvider(model: string) {
  const config = storage.store.get("openai-compatible-provider-config") as {
    name: string;
    baseUrl: string;
  };

  const provider = createOpenAICompatible({
    name: config.name || "openai-compatible",
    apiKey: storage.secureStore.get("openai-compatible-provider-api-key"),
    baseURL: config.baseUrl,
    includeUsage: true,
  });

  return provider(model);
}
