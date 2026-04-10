/**
 * Retry utility with exponential backoff
 * Helps handle temporary server unavailability (503 errors)
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 10000; // 10 seconds
const BACKOFF_MULTIPLIER = 2;

// Global registry for handling authentication errors from within plain JS utilities
let authErrorHandler = null;

/**
 * Register a function to handle authentication errors (e.g., redirect to login)
 * @param {Function} handler 
 */
export function registerAuthErrorHandler(handler) {
  authErrorHandler = handler;
}

/**
 * Explicitly invoke the auth error handler.
 * Call this ONLY from auth-critical flows (login/register) after confirming the
 * session is genuinely expired. Do NOT call from background data fetches.
 */
export function triggerAuthError() {
  if (authErrorHandler) {
    authErrorHandler();
  }
}

/**
 * Retries a fetch request with exponential backoff.
 *
 * ⚠️ IMPORTANT: This function does NOT automatically call authErrorHandler on 401.
 * Callers are responsible for inspecting response.status and deciding what to do.
 * This design prevents a background /api/messages fetch from triggering logout and
 * causing the mobile blank-screen redirect bug.
 */
export async function retryFetch(
  fetchFn,
  maxRetries = DEFAULT_MAX_RETRIES,
  initialDelay = DEFAULT_INITIAL_DELAY,
  maxDelay = DEFAULT_MAX_DELAY
) {
  let lastError;
  let lastResponse;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn();

      console.log(`[API] status: ${response.status} for attempt ${attempt + 1}`);

      // ✅ Success — return immediately
      if (response.ok) {
        return response;
      }

      // 🚫 Client errors (4xx including 401, 403, 404) — do NOT retry.
      // Return the raw response so callers can show appropriate UI.
      // Never call authErrorHandler here to prevent unintended logouts.
      if (response.status >= 400 && response.status < 500) {
        console.warn(`[API] Client error ${response.status} — returning to caller without retry.`);
        return response;
      }

      // 🔄 Server errors (5xx) — retry with exponential backoff
      if (response.status >= 500 && attempt < maxRetries) {
        lastResponse = response;
        const retryDelay = Math.min(
          initialDelay * Math.pow(BACKOFF_MULTIPLIER, attempt),
          maxDelay
        );
        console.warn(`[Retry] Server error ${response.status}. Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const retryDelay = Math.min(initialDelay * Math.pow(BACKOFF_MULTIPLIER, attempt), maxDelay);
        console.warn(`[Retry] Network error. Retrying in ${retryDelay}ms...`, error.message);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error;
    }
  }

  if (lastResponse) return lastResponse;
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Delay helper for use in async contexts
 * @param {number} ms - Milliseconds to wait
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}