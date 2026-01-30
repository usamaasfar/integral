import { createAnthropic } from "@ai-sdk/anthropic";

export default createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});
