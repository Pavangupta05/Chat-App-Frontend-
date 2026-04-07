import { API_URL } from "../config/app";
import { retryFetch } from "../utils/retry";

// Maximum file size after compression (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Image compression quality (0-1, higher = better quality)
const COMPRESSION_QUALITY = 0.85;

/**
 * Compress image file using canvas
 * Reduces file size while maintaining acceptable quality
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    // If not an image, return original file
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Scale down if image is very large
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Create a new File object from the compressed blob
            const compressedFile = new File(
              [blob],
              file.name,
              { type: "image/jpeg", lastModified: Date.now() }
            );

            console.log("[COMPRESSION] Image compressed", {
              original: file.size,
              compressed: compressedFile.size,
              ratio: ((1 - compressedFile.size / file.size) * 100).toFixed(2) + "%",
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          COMPRESSION_QUALITY
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
}

/**
 * Validate file before upload
 */
function validateFile(file) {
  if (!file) {
    throw new Error("Please select a file first.");
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
    throw new Error(`File is too large. Maximum size is ${sizeMB}MB.`);
  }

  // Allowed file types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("File type not supported. Please upload images, PDFs, or documents.");
  }
}

/**
 * Upload file to backend with proper timeout and error handling
 */
export async function uploadChatFile(file, { signal, onProgress } = {}) {
  try {
    validateFile(file);

    let uploadFile = file;

    // Compress image if it's an image file
    if (file.type.startsWith("image/")) {
      uploadFile = await compressImage(file);

      // Check size again after compression
      if (uploadFile.size > MAX_FILE_SIZE) {
        throw new Error("Image is too large even after compression. Please try a smaller image.");
      }
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    console.log("[UPLOAD] Starting upload", {
      fileName: uploadFile.name,
      fileSize: uploadFile.size,
      fileType: uploadFile.type,
      targetUrl: `${API_URL}/upload`,
    });

    // Create abort controller with 60 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await retryFetch(
        () => fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
          signal: signal || controller.signal,
        }),
        2 // maxRetries for uploads
      );

      if (!response.ok) {
        let errorMessage = "Upload failed. Please try again.";

        try {
          const errorPayload = await response.json();
          errorMessage = errorPayload.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const payload = await response.json();
      console.log("[UPLOAD] Upload complete", payload);
      return payload;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Handle specific error types
    if (error.name === "AbortError") {
      throw new Error("Upload timed out. Please try again or use a smaller file.");
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Connection error. Please check your internet and try again.");
    }

    throw error;
  }
}
