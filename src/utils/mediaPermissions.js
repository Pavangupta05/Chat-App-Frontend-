/**
 * Checks if the browser supports the Permissions API
 */
export function supportsPermissionsAPI() {
  return "permissions" in navigator;
}

/**
 * Check if connection is HTTPS (required for media access)
 */
/**
 * Check if connection is a Secure Context (required for media access)
 * window.isSecureContext is the most reliable way to check.
 * It will be false if accessing via non-localhost IP over HTTP.
 */
export function isSecureContext() {
  if (typeof window.isSecureContext !== "undefined") {
    return window.isSecureContext;
  }
  // Fallback
  return window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

/**
 * Check permission state for userMedia (microphone/camera)
 * @returns {Promise<'prompt' | 'granted' | 'denied' | 'unknown'>}
 */
export async function checkMediaPermission() {
  if (!isSecureContext()) {
    console.warn("⚠️ Non-secure context detected. Media permissions will be blocked by the browser.");
    return "denied";
  }
  
  if (!supportsPermissionsAPI()) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "camera",
    });

    return result.state;
  } catch (error) {
    console.warn("Could not check permission state:", error);
    return "unknown";
  }
}

/**
 * Request media access with specified constraints
 * @param {Object} constraints - { video?: boolean, audio?: boolean }
 * @returns {Promise<MediaStream>}
 */
export async function requestMediaStream(constraints = { video: true, audio: true }) {
  try {
    // Check HTTPS requirement
    if (!isSecureContext()) {
      throw new Error(
        "Secure Context Required: Modern browsers block camera/mic access over insecure HTTP connections. " +
        "On mobile, you MUST use HTTPS (e.g., via ngrok) or access via 'localhost' using USB port forwarding."
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support media access. Please use a modern browser like Chrome, Firefox, or Safari.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: constraints.video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          }
        : false,
      audio: constraints.audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
    })

    return stream;
  } catch (error) {
    const errorName = error.name || "";
    
    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError" || error.message?.includes("Secure Context")) {
      throw new Error(
        error.message?.includes("Secure Context") ? error.message :
        "Permission denied. Please enable camera/mic in browser settings. " +
        "If you are on mobile using an IP address (http://192.168.x.x), permissions are blocked by the browser by default."
      );
    } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      throw new Error("No media devices found. Connect a camera or microphone.");
    } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
      throw new Error("Hardware error: Camera or mic is already in use by another app.");
    } else {
      throw new Error(error.message || "Unable to access media devices.");
    }
  }
}

/**
 * Get user-friendly permission error message
 * @param {Error} error
 * @returns {string}
 */
export function getPermissionErrorMessage(error) {
  if (!error) return "Unknown error occurred";
  const message = error.message || "";

  if (message.includes("Secure Context") || message.includes("HTTPS")) {
    return "❌ Security Block: Calls require HTTPS or Localhost. Mobile IP access (http://192...) is blocked by browsers.";
  }
  if (message.includes("Permission denied")) {
    return "Permission denied. Check your browser/site settings.";
  }
  if (message.includes("already in use")) {
    return "Device already in use. Close other apps.";
  }

  return message || "Unable to access camera/microphone";
}
