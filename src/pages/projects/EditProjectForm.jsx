import React, { useEffect, useState, useMemo, useCallback } from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useProjectStore from "../../stores/useProjectStore";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditProjectForm = ({ projectId, project, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { editProject } = useProjectStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── Form State ── */
  const [projectDetails, setProjectDetails] = useState({
    id: "",
    project_name: "",
    project_code: "",
    code: "",
  });

  /* ── Populate form when project prop arrives ── */
  useEffect(() => {
    if (!project) return;

    setProjectDetails({
      id: project.id || "",
      project_name: project.project_name || "",
      project_code: project.project_code || "",
      code: project.code || "",
    });
  }, [project]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!projectDetails.project_name || projectDetails.project_name.trim() === "") 
      e.project_name = "Project name is required";
    return e;
  }, [projectDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setProjectDetails((prev) => ({ ...prev, [field]: value }));
  };

  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      id: projectDetails.id,
      project_name: projectDetails.project_name,
      project_code: projectDetails.project_code,
    };

    const success = await editProject(payload);

    setIsLoading(false);

    if (success) {
      setSubmitted(false);
      if (onSaveSuccess) onSaveSuccess();
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`invoice-form-box theme-${theme}`}
    >
      <form
        className="invoice-form-f-container"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ── HEADER DETAILS ── */}
        <div className="invoice-form-header">
          <div className="invoice-form-htxt">Edit Project</div>
          <div className="invoice-form-sub-htxt">
            Update the details below to edit Project Code #{projectDetails.project_code || projectId}
          </div>
        </div>

        <div className="invoice-form-flex-box">
          
          {/* Project Code (Read-only) */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group input-disabled">
                <label className="input-form-label" htmlFor="project_code">
                  Project Code
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="project_code"
                    className="form-input form-input-no-padding"
                    value={projectDetails.project_code || "---"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Code Tag (Read-only) */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group input-disabled">
                <label className="input-form-label" htmlFor="code">
                  Code Tag
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="code"
                    className="form-input form-input-no-padding"
                    value={projectDetails.code || "---"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.project_name ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.project_name ? "input-label-message" : ""}`} htmlFor="project_name">
                  Project Name
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="project_name"
                    className={`form-input form-input-no-padding ${errors.project_name ? "input-error" : ""}`}
                    value={projectDetails.project_name}
                    onChange={(e) => handleDetailChange("project_name", e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
              </div>
              {errors.project_name && (
                <div className="input-error-message">{errors.project_name}</div>
              )}
            </div>
          </div>

        </div>

        {/* ── SUBMIT ── */}
        <div className="invoice-action-btn main-submit-action-btn">
          <div className="invoice-action-btn-wrapper">
            <button
              type="submit"
              disabled={isLoading}
              className="invoice-submit-btn"
            >
              {isLoading ? (
                <div className="invoice-loader" />
              ) : (
                <span className="invoice-submit-btn-text">Update Project</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default EditProjectForm;