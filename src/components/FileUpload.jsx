import { useEffect, useRef, useState } from "react";
import { uploadChatFile } from "../services/uploadService";

function FileUpload({ disabled, icon, onUploadComplete }) {
  const inputRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      window.clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setError("");
    setIsSuccess(false);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 30000);
      let payload;

      try {
        payload = await uploadChatFile(selectedFile, {
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      onUploadComplete?.(payload);
      setIsSuccess(true);
      successTimeoutRef.current = window.setTimeout(() => setIsSuccess(false), 1800);
    } catch (uploadError) {
      console.error("[UPLOAD] Upload failed", uploadError);
      setError(
        uploadError.name === "AbortError"
          ? "Upload timed out. Please try again."
          : uploadError.message || "Unable to upload file.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        className="file-upload__input"
        type="file"
        name="file"
        onChange={handleFileChange}
      />

      <button
        className="icon-button"
        type="button"
        aria-label="Attach file"
        disabled={disabled || isUploading}
        onClick={handleButtonClick}
      >
        {isUploading ? <span className="file-upload__spinner" /> : icon}
      </button>

      {error ? <p className="file-upload__feedback">{error}</p> : null}
      {isSuccess ? <p className="file-upload__success">File uploaded</p> : null}
    </div>
  );
}

export default FileUpload;
