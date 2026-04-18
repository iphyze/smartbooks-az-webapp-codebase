import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import useToastStore from "../../stores/useToastStore";
import useProjectStore from "../../stores/useProjectStore";
import "../../pages/inputs-styles/Inputs.css";
import "./CreateModal.css";

/* ─────────────────────────────────────────────
   Create Project Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createProject, fetchNextProjectCode, nextProjectCode, fetchingNextCode } = useProjectStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [projectDetails, setProjectDetails] = useState({
    project_name: "",
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCreating) return;
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, isCreating]);

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (isCreating) return;
      if (event.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose, isCreating]);

  useEffect(() => {
    if (isOpen) {
      setProjectDetails({ project_name: "" });
      setSubmitted(false);
      setIsCreating(false);
      fetchNextProjectCode();
    }
  }, [isOpen, fetchNextProjectCode]);

  const validateForm = () => {
    const e = {};
    if (!projectDetails.project_name || projectDetails.project_name.trim() === "") 
      e.project_name = "Project name is required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  const handleDetailChange = (field, value) => {
    setProjectDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!nextProjectCode) {
      showToast("Project code is still loading, please wait", "error");
      return;
    }

    setIsCreating(true);

    const payload = {
      project_name: projectDetails.project_name,
      project_code: String(nextProjectCode),
    };

    const success = await createProject(payload);
    setIsCreating(false);

    if (success) {
      const newProject = {
        project_name: projectDetails.project_name,
        project_code: String(nextProjectCode),
      };
      onProjectCreated(newProject);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay theme-${theme}`}>
      <motion.div 
        className="modal-content-scrollable" 
        ref={modalRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <p className="modal-title">Create New Project</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-folder-plus"></i></div>
            <p className="modal-text">Fill the form below to add a new project</p>
          </div>
          
          <div className="invoice-form-flex-box">
            {/* Project Code (Read-only) */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label" htmlFor="modal_project_code">
                    Project Code (Auto Generated)
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="modal_project_code"
                      className="form-input form-input-no-padding"
                      value={fetchingNextCode ? "Loading..." : nextProjectCode || "---"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Project Name */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.project_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.project_name ? "input-label-message" : ""}`}>Project Name</label>
                  <div className="form-wrapper">
                    <input 
                      type="text" 
                      className={`form-input form-input-no-padding ${errors.project_name ? "input-error" : ""}`} 
                      value={projectDetails.project_name} 
                      onChange={(e) => handleDetailChange("project_name", e.target.value)} 
                      placeholder="Enter project name" 
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.project_name && <div className="input-error-message">{errors.project_name}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating || fetchingNextCode}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Project"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProjectModal;