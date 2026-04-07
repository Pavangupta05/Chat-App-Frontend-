/**
 * Retry utility with exponential backoff
 * Helps handle temporary server unavailability (503 errors)
 */

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 10000; // 10 seconds
const BACKOFF_MULTIPLIER = 2;

/**
 * Retries a fetch request with exponential backoff
 * @param {Function} fetchFn - Function that returns a fetch promise
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay between retries (ms)
 * @param {number} maxDelay - Maximum delay between retries (ms)
 * @returns {Promise} - Response from successful request or final failed attempt
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
      
      // Success - return immediately
      if (response.ok || response.status < 500) {
        return response;
      }

      // Server error (5xx) - retry if we have attempts left
      if (response.status >= 500 && attempt < maxRetries) {
        lastResponse = response;
        const delay = Math.min(
          initialDelay * Math.pow(BACKOFF_MULTIPLIER, attempt),
          maxDelay
        );
        
        console.warn(
          `[Retry] Server error ${response.status}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Return response if no more retries or not a server error
      return response;
    } catch (error) {
      lastError = error;

      // Network error or timeout - retry if we have attempts left
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(BACKOFF_MULTIPLIER, attempt),
          maxDelay
        );
        
        console.warn(
          `[Retry] Network error. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`,
          error.message
        );
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Out of retries
      throw error;
    }
  }

  // If we have a response, return it (after all retries exhausted)
  if (lastResponse) {
    return lastResponse;
  }

  // Otherwise throw the last error
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Delay helper for use in async contexts
 * @param {number} ms - Milliseconds to wait
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}