/**
 * Checks if the browser supports the Permissions API
 */
export function supportsPermissionsAPI() {
  return "permissions" in navigator;
}

/**
 * Check if connection is HTTPS (required for media access)
 */
export function isSecureContext() {
  return window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

/**
 * Check permission state for userMedia (microphone/camera)
 * @returns {Promise<'prompt' | 'granted' | 'denied' | 'unknown'>}
 */
export async function checkMediaPermission() {
  if (!isSecureContext()) {
    return "unknown";
  }
  
  if (!supportsPermissionsAPI()) {
    return "unknown";
  }

  try {
    const result = await navigator.permissions.query({
      name: "camera",
    });

    return result.state; // 'prompt' | 'granted' | 'denied'
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
        "Security Error: Video/audio calls require a secure connection (HTTPS). Please ensure your site uses HTTPS."
      );
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support media access. Please use Chrome, Firefox, Edge, or Safari.");
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
    });

    return stream;
  } catch (error) {
    const errorName = error.name || "";
    
    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      throw new Error(
        "Permission denied for camera/microphone. Please enable camera and microphone in your browser settings, then try again." +
        (error.message?.includes("Permission") ? ` (${error.message})` : "")
      );
    } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      throw new Error(
        "No microphone or camera found. Please connect a device and ensure it's not being used by another application, then try again."
      );
    } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
      throw new Error(
        "Your camera/microphone is in use by another application or is not available. Please close other apps using them and try again."
      );
    } else if (errorName === "TypeError") {
      throw new Error(
        "Invalid permission request. Please ensure you're using HTTPS (required for secure connections) or localhost for testing."
      );
    } else if (error.message?.includes("HTTPS")) {
      throw new Error(
        "Security Error: Video/audio calls require HTTPS. Please access the app using HTTPS connection."
      );
    } else {
      throw new Error(error.message || "Unable to access media devices. Please check your settings.");
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

  if (message.includes("Permission denied")) {
    return "Permission denied. Please enable microphone/camera in your browser settings and try again.";
  }
  if (message.includes("not supported")) {
    return "Your browser does not support video calls. Please use Chrome, Firefox, Edge, or Safari.";
  }
  if (message.includes("HTTPS")) {
    return "Video calls require a secure connection (HTTPS). Your site must use HTTPS.";
  }
  if (message.includes("No microphone") || message.includes("No camera")) {
    return "No camera or microphone found. Please connect a device and try again.";
  }
  if (message.includes("in use")) {
    return "Your camera/microphone is already in use. Please close other applications and try again.";
  }

  return message || "Unable to access camera/microphone";
}
