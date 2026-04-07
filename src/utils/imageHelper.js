import { API_URL } from "../config/app";

/**
 * Ensures an image URL is absolute and uses the backend URL if needed.
 * Falls back to a default avatar if the URL is invalid.
 * @param {string} url - The image URL
 * @param {string} defaultValue - Fallback value if URL is invalid
 * @returns {string} - The absolute URL or default value
 */
export function getImageUrl(url, defaultValue = null) {
  if (!url || typeof url !== "string") {
    return defaultValue;
  }

  // Already an absolute URL (http/https)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative path - prepend the API URL
  if (url.startsWith("/uploads/")) {
    return `${API_URL}${url}`;
  }

  // Invalid or empty
  return defaultValue;
}

/**
 * Creates a default avatar with initials in a canvas element
 * @param {string} name - The name to generate initials from
 * @param {string} bgColor - Optional background color
 * @returns {string} - Data URL of the avatar canvas
 */
export function createDefaultAvatar(name = "?", bgColor = "#69b2ff") {
  const canvas = document.createElement("canvas");
  canvas.width = 120;
  canvas.height = 120;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials || "?", canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL("image/png");
}

/**
 * Handles image load error gracefully
 * @param {Event} e - The error event
 * @param {Function} onError - Optional callback when error occurs
 */
export function handleImageError(e, onError) {
  console.warn("❌ Image failed to load:", e.target?.src);
  if (onError) {
    onError(e);
  } else {
    // Set a transparent 1x1 pixel as fallback
    e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8f8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  }
}
