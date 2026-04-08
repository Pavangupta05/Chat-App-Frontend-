import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
const apiProxy = {
  target: "http://127.0.0.1:5000",
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  timeout: 60000, // 60 second timeout
  proxyTimeout: 60000,
  // Add error handling for proxy
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.code, err.message);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Service temporarily unavailable' }));
  },
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
      "/socket.io": { // Add explicit Socket.io proxy
        target: "http://127.0.0.1:5000",
        ws: true,
        changeOrigin: true,
      },
    },
    // HMR configuration for development
    hmr: {
      protocol: "ws",
      port: 5173,
    },
    // Add middleware to handle WebSocket errors
    middlewareMode: false,
    cors: true,
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
