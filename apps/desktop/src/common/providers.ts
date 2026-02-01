export const PROVIDERS = [
  {
    type: "ollama",
    name: "ollama",
    displayName: "Ollama",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/ollama.png",
  },
  {
    type: "openai",
    name: "openai",
    displayName: "OpenAI",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/openai.png",
  },
  {
    type: "anthropic",
    name: "anthropic",
    displayName: "Anthropic",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png",
  },
  {
    type: "google",
    name: "google",
    displayName: "Google",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/gemini-color.png",
  },
  {
    type: "openai-compatible",
    name: "openai-compatible",
    displayName: "OpenAI Compatible",
    logo: "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/openai.png",
  },
] as const;

export type ProviderType = (typeof PROVIDERS)[number]["type"];
