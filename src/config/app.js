/**
 * API base URL (no trailing slash).
 */
export const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

/** Realtime server (same host as API unless overridden). */
export const SOCKET_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

export const CURRENT_USERNAME =
  import.meta.env.VITE_CHAT_USERNAME?.trim() || "Pavan";
