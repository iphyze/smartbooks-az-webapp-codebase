import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useProjectStore from "../../stores/useProjectStore";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const CreateProjectForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { createProject, fetchNextProjectCode, nextProjectCode, fetchingNextCode } = useProjectStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── Form State ── */
  const [projectDetails, setProjectDetails] = useState({
    project_name: "",
  });

  /* ── Fetch Next Code on Mount ── */
  useEffect(() => {
    fetchNextProjectCode();
  }, [fetchNextProjectCode]);

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

    // Prevent submission if Code hasn't loaded
    if (!nextProjectCode) {
      showToast("Project code is still loading, please wait", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      project_name: projectDetails.project_name,
      project_code: String(nextProjectCode), // Ensure it's a string if backend expects it, or leave as number depending on API strictness
    };

    const success = await createProject(payload);

    setIsLoading(false);

    if (success) {
      setSubmitted(false);
      setProjectDetails({
        project_name: "",
      });
      navigate("/project/home");
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
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
            <div className="invoice-form-htxt">Create New Project</div>
            <div className="invoice-form-sub-htxt">
              Fill the form below to add a new project
            </div>
          </div>

          <div className="invoice-form-flex-box">
            
            {/* Project Code (Read-only) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label" htmlFor="project_code">
                    Project Code (Auto Generated)
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="project_code"
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
                disabled={isLoading || fetchingNextCode}
                className="invoice-submit-btn"
              >
                {isLoading ? (
                  <div className="invoice-loader" />
                ) : (
                  <span className="invoice-submit-btn-text">Create Project</span>
                )}
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </>
  );
};

export default CreateProjectForm;