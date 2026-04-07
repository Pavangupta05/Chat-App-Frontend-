import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import { uploadChatFile } from "../services/uploadService";

function FileUpload({ disabled, icon, onUploadComplete }) {
  const inputRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [lastFailedFile, setLastFailedFile] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(successTimeoutRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRetry = async () => {
    if (lastFailedFile) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(lastFailedFile);
      inputRef.current.files = dataTransfer.files;

      setError("");
      setLastFailedFile(null);

      // Trigger the same upload flow
      try {
        await performUpload(lastFailedFile);
      } catch (uploadError) {
        handleUploadError(uploadError, lastFailedFile);
      }
    }
  };

  const performUpload = async (selectedFile) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setIsSuccess(false);

    try {
      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();

      // Simulate progress updates (since fetch doesn't have built-in progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 300);

      const payload = await uploadChatFile(selectedFile, {
        signal: abortControllerRef.current.signal,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      onUploadComplete?.(payload);
      setIsSuccess(true);
      setLastFailedFile(null);

      successTimeoutRef.current = window.setTimeout(() => {
        setIsSuccess(false);
        setUploadProgress(0);
      }, 2500);
    } catch (uploadError) {
      handleUploadError(uploadError, selectedFile);
    } finally {
      setIsUploading(false);
      inputRef.current.value = "";
    }
  };

  const handleUploadError = (uploadError, selectedFile) => {
    console.error("[UPLOAD] Upload failed", uploadError);

    // Store file for retry
    setLastFailedFile(selectedFile);

    // Determine user-friendly error message
    let errorMsg = "Upload failed. Please try again.";

    if (uploadError.name === "AbortError") {
      errorMsg = "Upload timed out. Please try again with a smaller file.";
    } else if (uploadError.message.includes("too large")) {
      errorMsg = uploadError.message;
    } else if (uploadError.message.includes("not supported")) {
      errorMsg = uploadError.message;
    } else if (uploadError.message.includes("Connection")) {
      errorMsg = uploadError.message;
    } else if (uploadError.message) {
      errorMsg = uploadError.message;
    }

    setError(errorMsg);
    setUploadProgress(0);
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    try {
      await performUpload(selectedFile);
    } catch (uploadError) {
      handleUploadError(uploadError, selectedFile);
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
        accept="image/*,.pdf,.txt,.doc,.docx"
      />

      <motion.button
        className="icon-button"
        type="button"
        aria-label={isUploading ? "Uploading..." : "Attach file"}
        disabled={disabled || isUploading}
        onClick={handleButtonClick}
        whileHover={!isUploading ? { scale: 1.1 } : undefined}
        whileTap={!isUploading ? { scale: 0.9 } : undefined}
      >
        {isUploading ? (
          <div className="file-upload__uploading">
            <span className="file-upload__spinner" />
          </div>
        ) : (
          icon
        )}
      </motion.button>

      {/* Upload progress indicator */}
      {isUploading && (
        <motion.div
          className="file-upload__progress-bar"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: uploadProgress / 100 }}
          transition={{ type: "tween", duration: 0.2 }}
        />
      )}

      {/* Status messages */}
      {isUploading && (
        <motion.p
          className="file-upload__status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Uploading...
        </motion.p>
      )}

      {error && (
        <motion.div
          className="file-upload__error-box"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <div className="file-upload__error-content">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
          {lastFailedFile && (
            <button
              type="button"
              className="file-upload__retry-btn"
              onClick={handleRetry}
              aria-label="Retry upload"
              title="Retry upload"
            >
              <RotateCcw size={14} />
              Retry
            </button>
          )}
        </motion.div>
      )}

      {isSuccess && (
        <motion.p
          className="file-upload__success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          ✓ File uploaded
        </motion.p>
      )}
    </div>
  );
}

export default FileUpload;
