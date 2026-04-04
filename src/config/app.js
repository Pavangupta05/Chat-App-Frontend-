/**
 * API base URL (no trailing slash).
 * We default to the real Node port so requests work even when the Vite dev proxy
 * does not run (e.g. preview, wrong dev setup) — CORS on the server allows any origin.
 */
const DEFAULT_API = "http://127.0.0.1:5000";

const resolveApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed && trimmed !== "/") {
    return trimmed.replace(/\/+$/, "");
  }
  return DEFAULT_API;
};

export const API_URL = resolveApiUrl();

/** Realtime server (same host as API unless overridden). */
export const SOCKET_URL = (() => {
  const raw = import.meta.env.VITE_SOCKET_URL?.trim();
  if (raw && raw !== "/") {
    return raw.replace(/\/+$/, "");
  }
  return API_URL || DEFAULT_API;
})();

export const CURRENT_USERNAME =
  import.meta.env.VITE_CHAT_USERNAME?.trim() || "Pavan";
