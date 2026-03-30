// src/components/DeleteConfirmationModal.js
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count, page }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false); // 1. Add loading state

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Prevent closing while deleting
      if (isDeleting) return;
      
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
  }, [isOpen, onClose, isDeleting]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      // Prevent closing while deleting
      if (isDeleting) return;
      
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, isDeleting]);

  // 2. Update handler to manage loading state
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      // Ensure loading stops if modal is still open (e.g., on error)
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay theme-${theme}`}>
      <motion.div 
        className="modal-content" 
        ref={modalRef}
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }} 
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <p className="modal-title">Confirm Delete</p>
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            disabled={isDeleting} // Disable close button while loading
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-icon modal-confirm-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p className="modal-text-confirm">
            Are you sure you want to delete ({count}) {page || 'Item'}{count > 1 ? 's' : ''}?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose} 
            disabled={isDeleting} // Disable cancel while loading
          >
            Cancel
          </button>
          
          {/* 3. Update button UI for loading state */}
          <button 
            className="btn-delete" 
            onClick={handleConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;