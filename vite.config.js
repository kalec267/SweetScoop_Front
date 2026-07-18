import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      "@": fileURLToPath(
        new URL("./src", import.meta.url)
      ),
    },
  },

  server: {
    host: "0.0.0.0",
    // port: 5173,
    port: 5300,

    proxy: {
      "/api": {
        // target: "http://192.168.137.173:8888",
        target: "http://localhost:8888",
        changeOrigin: true,
      },
    },
  },
});