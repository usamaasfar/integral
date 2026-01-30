import { createOllama } from "ollama-ai-provider-v2";

export default createOllama({
  baseURL: "http://127.0.0.1:11434/api",
});
