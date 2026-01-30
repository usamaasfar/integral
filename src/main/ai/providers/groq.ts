import { createGroq } from "@ai-sdk/groq";

export default createGroq({
  apiKey: process.env.GROQ_API_KEY ?? "",
});
