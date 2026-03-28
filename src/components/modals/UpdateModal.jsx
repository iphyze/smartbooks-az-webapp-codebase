import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import ChartSearchableSelect from "../ChartSearchableSelect";

const UpdateModal = ({ isOpen, onClose, onConfirm, count, statusOptions }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const [selectedStatus, setSelectedStatus] = useState("Paid");
  const [isUpdating, setIsUpdating] = useState(false); // 1. Add loading state

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Prevent closing while updating
      if (isUpdating) return;
      
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
  }, [isOpen, onClose, isUpdating]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      // Prevent closing while updating
      if (isUpdating) return;
      
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, isUpdating]);

  // Reset status when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus("Paid");
      setIsUpdating(false); // Reset loading state on open
    }
  }, [isOpen]);

  // 2. Update handler to manage loading state
  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onConfirm(selectedStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      // Only stop loading if the modal is still open 
      // (usually onConfirm closes the modal on success, but just in case)
      setIsUpdating(false);
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
          <p className="modal-title">Invoice Status Update</p>
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            disabled={isUpdating} // Disable close button while loading
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-icon">
            <i className="fas fa-pen"></i>
          </div>
          <p className="modal-text">
            Update status for ({count}) invoice{count > 1 ? 's' : ''}
          </p>
          <p className="modal-select-label">Select an option below</p>
          <div className="status-select-wrapper">
            <ChartSearchableSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              className="status-update-select-box"
              isDisabled={isUpdating} // Disable select while loading
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose} 
            disabled={isUpdating} // Disable cancel while loading
          >
            Cancel
          </button>
          
          {/* 3. Update button UI for loading state */}
          <button 
            className="btn-update" 
            onClick={handleConfirm} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UpdateModal;