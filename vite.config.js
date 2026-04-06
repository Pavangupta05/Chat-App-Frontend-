import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
const apiProxy = {
  target: "http://127.0.0.1:5000",
  changeOrigin: true,
};

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["process", "Buffer", "stream", "util", "events"],
    }),
  ],
  server: {
    proxy: {
      "/api": apiProxy,
      "/upload": apiProxy,
      "/uploads": apiProxy,
      "/health": apiProxy,
    },
  },
  preview: {
    proxy: {
      "/api": apiProxy,
      "/upload": apiProxy,
      "/uploads": apiProxy,
      "/health": apiProxy,
    },
  },
});
