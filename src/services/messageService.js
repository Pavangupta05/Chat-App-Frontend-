import { API_URL } from "../config/app";
import { retryFetch } from "../utils/retry";

export function isPeerMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export async function fetchMessagesBetween(token, withUserId) {
  const params = new URLSearchParams({ withUserId });
  const response = await retryFetch(
    () => fetch(`${API_URL}/api/messages?${params}&t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    }),
    2 // maxRetries for GET requests
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to load messages.");
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchUserChats(token) {
  const response = await retryFetch(
    () => fetch(`${API_URL}/api/chat?t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    }),
    2 // maxRetries for GET requests
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to load chats.");
  }

  return Array.isArray(data) ? data : [];
}

/**
 * Clear all messages from a chat
 * @param {string} token - Authentication token
 * @param {string} chatId - Chat ID to clear
 */
export async function clearChatHistory(token, chatId) {
  if (!chatId) {
    throw new Error("chatId is required.");
  }

  const response = await retryFetch(
    () => fetch(`${API_URL}/api/messages/${chatId}?t=${Date.now()}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    }),
    1 // minimal retries for DELETE
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to clear chat history.");
  }

  return data;
}

/**
 * Delete a chat
 * @param {string} token - Authentication token
 * @param {string} chatId - Chat ID to delete
 */
export async function deleteChat(token, chatId) {
  if (!chatId) {
    throw new Error("chatId is required.");
  }

  const response = await retryFetch(
    () => fetch(`${API_URL}/api/chat/${chatId}?t=${Date.now()}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    }),
    1 // minimal retries for DELETE
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete chat.");
  }

  return data;
}
