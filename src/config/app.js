/**
 * API base URL (no trailing slash).
 */
export const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

/** Realtime server (same host as API unless overridden). */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim().replace(/\/+$/, "") || API_URL;

console.log("API:", API_URL);
console.log("SOCKET:", SOCKET_URL);

export const CURRENT_USERNAME =
  import.meta.env.VITE_CHAT_USERNAME?.trim() || "Pavan";
