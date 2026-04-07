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
      error: `Invalid response (HTTP ${response.status}) from ${API_URL}.`,
    };
  }
}

export async function fetchUsers(token) {
  const authToken = token?.trim();
  if (!authToken) {
    throw new Error("You are not signed in. Please log in again.");
  }

  let response;
  try {
    response = await retryFetch(
      () => fetch(`${API_URL}/api/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      }),
      2 // maxRetries for GET requests
    );
  } catch {
    throw new Error(`Cannot reach the server at ${API_URL}. Please try again.`);
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data.error ||
        (response.status === 503
          ? "Database is not ready. Start MongoDB (e.g. docker compose up -d) and restart the API."
          : `Failed to load users (${response.status}).`),
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(data.error || "Unexpected response when loading users.");
  }

  return data;
}

/**
 * Delete the current user's account
 * @param {string} token - Authentication token
 */
export async function deleteCurrentUser(token) {
  const authToken = token?.trim();
  if (!authToken) {
    throw new Error("You are not signed in. Please log in again.");
  }

  let response;
  try {
    response = await retryFetch(
      () => fetch(`${API_URL}/api/users`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }),
      1 // minimal retries for DELETE
    );
  } catch {
    throw new Error(`Cannot reach the server at ${API_URL}. Please try again.`);
  }

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete user account.");
  }

  return data;
}
