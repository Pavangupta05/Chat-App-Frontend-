/**
 * Checks if the browser supports the Permissions API
 */
export function supportsPermissionsAPI() {
  return "permissions" in navigator;
}

/**
 * Check permission state for userMedia (microphone/camera)
 * @returns {Promise<'prompt' | 'granted' | 'denied' | 'unknown'>}
 */
export async function checkMediaPermission() {
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
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      throw new Error(
        "Permission denied. Please enable microphone/camera in your browser settings and try again."
      );
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      throw new Error(
        "No microphone or camera found. Please connect a device and try again."
      );
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      throw new Error(
        "Your camera/microphone is in use by another application. Please close it and try again."
      );
    } else if (error.name === "TypeError") {
      throw new Error(
        "Invalid permission request. Please ensure you're using HTTPS (required for secure connections)."
      );
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
