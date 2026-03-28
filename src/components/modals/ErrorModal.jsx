// src/components/modals/ErrorModal.js
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";

const ErrorModal = ({ isOpen, onClose, onRetry, message }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div 
        className={`modal-content theme-${theme}`} 
        ref={modalRef}
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }} 
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <p className="modal-title text-danger">Error Occurred</p>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-icon modal-confirm-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <p className="modal-text-confirm">
            {message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-update" onClick={onRetry}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorModal;