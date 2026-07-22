import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [vue()],

    resolve: {
      alias: {
        "@": fileURLToPath(
          new URL("./src", import.meta.url)
        ),
      },
    },

    server: {
      host: env.VITE_HOST || "0.0.0.0",
      port: Number(env.VITE_PORT) || 5300,
      strictPort: true,

      proxy: {

        "/api": {
          target:
            env.VITE_API_URL ||
            "http://localhost:8890",

          changeOrigin: true,
          secure: false,
        },
        
        "/api/inventory": {
          target:
            env.VITE_INVENTORY_API_URL ||
            "http://localhost:8888",

          changeOrigin: true,
          secure: false,
        },

        
      },
    },
  };
});