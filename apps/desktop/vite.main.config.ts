import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    resolve: { alias: { "~": path.resolve(__dirname, "./src") } },
    define: {
      'process.env.SMITHERY_API_KEY': JSON.stringify(env.SMITHERY_API_KEY),
    },
  };
});
