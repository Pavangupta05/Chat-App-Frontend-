import { API_URL } from "../config/app";
import { retryFetch } from "../utils/retry";

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: `The API returned non-JSON (HTTP ${response.status}). Failed to parse response from ${API_URL}.`,
    };
  }
}

function ensureJsonContentType(response) {
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(
      "Chat API is not reachable as JSON. From the project folder: run \"docker compose up -d\" for MongoDB, then start the API (cd server && npm run dev), then this app (cd Chat && npm run dev).",
    );
  }
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }
  const id = user.id != null ? String(user.id) : "";
  return {
    ...user,
    id,
    username: user.username ?? "",
    email: user.email ?? "",
  };
}

export const register = async ({ username, email, password }) => {
  const body = {
    username: String(username ?? "").trim(),
    email: String(email ?? "").trim().toLowerCase(),
    password: String(password ?? ""),
  };

  let response;
  try {
    response = await retryFetch(
      () => fetch(`${API_URL}/api/auth/register?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify(body),
      }),
      3 // maxRetries
    );
  } catch {
    throw new Error(`Cannot reach the server at ${API_URL}. Please check your connection and ensure the backend is running.`);
  }

  if (response.ok) {
    ensureJsonContentType(response);
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || `Registration failed (${response.status}).`);
  }

  if (!data.user && !data.message) {
    throw new Error(data.error || "Unexpected response from server after registration.");
  }

  if (data.user) {
    data.user = normalizeUser(data.user);
  }

  return data;
};

export const login = async ({ email, password }) => {
  const body = {
    email: String(email ?? "").trim().toLowerCase(),
    password: String(password ?? ""),
  };

  let response;
  try {
    response = await retryFetch(
      () => fetch(`${API_URL}/api/auth/login?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        body: JSON.stringify(body),
      }),
      3 // maxRetries
    );
  } catch {
    throw new Error(`Cannot reach the server at ${API_URL}. Please check your connection and ensure the backend is running.`);
  }

  if (response.ok) {
    ensureJsonContentType(response);
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || `Login failed (${response.status}).`);
  }

  if (!data.token || !data.user) {
    throw new Error(data.error || "Login response was incomplete. Check API and database.");
  }

  data.user = normalizeUser(data.user);
  if (!data.user?.id) {
    throw new Error("Login response contained an invalid user profile.");
  }

  localStorage.setItem("chat-user", JSON.stringify(data.user));
  localStorage.setItem("chat-token", data.token);

  return data;
};

export const logout = () => {
  localStorage.removeItem("chat-user");
  localStorage.removeItem("chat-token");
};
