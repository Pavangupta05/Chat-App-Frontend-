import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
const apiProxy = {
  target: "http://127.0.0.1:5000",
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react()],
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
