import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export default createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY ?? "",
});
