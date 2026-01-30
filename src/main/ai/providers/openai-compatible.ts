import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export default createOpenAICompatible({
  name: process.env.PROVIDER_NAME,
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: process.env.PROVIDER_BASE_URL,
  includeUsage: true,
});
