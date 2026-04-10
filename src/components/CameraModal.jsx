import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RefreshCcw, Check, RotateCcw } from "lucide-react";

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" or "environment"
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = useCallback(async (mode) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedImage]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    // If front camera, flip horizontally for the photo to match viewfinder
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    
    // Stop stream to save battery/perf
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert dataUrl to File or blob if needed, but onCapture can handle dataUrl
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="camera-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="camera-modal-container">
          <div className="camera-modal__header">
            <button className="camera-modal__close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="camera-modal__viewfinder">
            {error ? (
              <div className="camera-modal__error">
                <p>{error}</p>
                <button onClick={() => startCamera(facingMode)}>Retry</button>
              </div>
            ) : capturedImage ? (
              <motion.img 
                src={capturedImage} 
                className="camera-modal__preview" 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                alt="Captured"
              />
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`camera-modal__video ${facingMode === 'user' ? 'is-flipped' : ''}`}
              />
            )}
          </div>

          <div className="camera-modal__footer">
            {!capturedImage ? (
              <div className="camera-modal__controls">
                <button className="camera-modal__btn camera-modal__btn--flip" onClick={toggleCamera}>
                  <RefreshCcw size={24} />
                </button>
                <button className="camera-modal__btn camera-modal__btn--capture" onClick={capturePhoto}>
                  <div className="capture-inner" />
                </button>
                <div style={{ width: 44 }} /> {/* Spacer */}
              </div>
            ) : (
              <div className="camera-modal__confirm">
                <button className="camera-modal__btn camera-modal__btn--retake" onClick={handleRetake}>
                  <RotateCcw size={22} />
                  <span>Retake</span>
                </button>
                <button className="camera-modal__btn camera-modal__btn--send" onClick={handleConfirm}>
                  <Check size={22} />
                  <span>Use Photo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CameraModal;
