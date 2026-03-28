// src/components/modals/DeleteLineItemModal.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";

/**
 * DeleteLineItemModal
 *
 * Props:
 *  isOpen    {boolean}  – controls visibility
 *  onClose   {function} – called when user cancels or clicks outside
 *  onConfirm {function} – called when user confirms the delete
 *  isNew     {boolean}  – true = row was never saved (no API call needed)
 */
const DeleteLineItemModal = ({ isOpen, onClose, onConfirm, isNew = false }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-content"
        ref={modalRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <p className="modal-title">Remove Line Item</p>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-icon modal-confirm-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <p className="modal-text-confirm">
            {isNew
              ? "Are you sure you want to remove this line item?"
              : "Are you sure you want to remove this line item? This will permanently delete it from the database and cannot be undone."}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            {isNew ? "Remove" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteLineItemModal;