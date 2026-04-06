import { API_URL } from "../config/app";

export function isPeerMongoId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export async function fetchMessagesBetween(token, withUserId) {
  const params = new URLSearchParams({ withUserId });
  const response = await fetch(`${API_URL}/api/messages?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to load messages.");
  }

  return Array.isArray(data) ? data : [];
}

export async function fetchUserChats(token) {
  const response = await fetch(`${API_URL}/api/chat`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Failed to load chats.");
  }

  return Array.isArray(data) ? data : [];
}
