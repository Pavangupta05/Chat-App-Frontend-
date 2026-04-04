import { API_URL } from "../config/app";

export async function uploadChatFile(file, { signal } = {}) {
  if (!file) {
    throw new Error("Please select a file first.");
  }

  const formData = new FormData();
  formData.append("file", file);

  console.log("[UPLOAD] Starting upload", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    targetUrl: `${API_URL}/upload`,
  });

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    signal,
  });

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
}
