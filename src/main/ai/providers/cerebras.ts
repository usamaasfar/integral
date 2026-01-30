import { createCerebras } from "@ai-sdk/cerebras";

export default createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY ?? "",
});
