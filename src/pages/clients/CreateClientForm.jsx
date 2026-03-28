import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useClientStore from "../../stores/useClientStore";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const CreateClientForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { createClient, fetchNextClientId, nextClientId, fetchingNextId } = useClientStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ── Form State ── */
  const [clientDetails, setClientDetails] = useState({
    clients_name: "",
    clients_email: "",
    clients_number: "",
    clients_address: "",
  });

  /* ── Fetch Next ID on Mount ── */
  useEffect(() => {
    fetchNextClientId();
  }, [fetchNextClientId]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!clientDetails.clients_name || clientDetails.clients_name.trim() === "") 
      e.clients_name = "Client name is required";
    if (!clientDetails.clients_email || clientDetails.clients_email.trim() === "") 
      e.clients_email = "Client email is required";
    if (!clientDetails.clients_number || clientDetails.clients_number.trim() === "") 
      e.clients_number = "Client phone number is required";
    if (!clientDetails.clients_address || clientDetails.clients_address.trim() === "") 
      e.clients_address = "Client address is required";
    return e;
  }, [clientDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    if (field === "clients_number") {
      // Strip out everything that is not a digit or '+'
      value = value.replace(/[^0-9+]/g, "");
      
      // Ensure '+' is only at the very beginning
      if (value.indexOf("+") > 0) {
        value = value.replace(/\+/g, ""); // Remove all '+' if it appears after the start
      } else if (value.indexOf("+") === 0) {
        // If it starts with '+', remove any other '+' in the string
        value = "+" + value.slice(1).replace(/\+/g, "");
      }
    }

    setClientDetails((prev) => ({ ...prev, [field]: value }));
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

    // Prevent submission if ID hasn't loaded
    if (!nextClientId) {
      showToast("Client ID is still loading, please wait", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      clients_id: nextClientId,
      ...clientDetails,
      create_ledger: "Yes",
    };

    const success = await createClient(payload);

    setIsLoading(false);

    if (success) {
      setSubmitted(false);
      setClientDetails({
        clients_name: "",
        clients_email: "",
        clients_number: "",
        clients_address: "",
      });
      navigate("/client/home");
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
            <div className="invoice-form-htxt">Create New Client</div>
            <div className="invoice-form-sub-htxt">
              Fill the form below to add a new client
            </div>
          </div>

          <div className="invoice-form-flex-box">
            
            {/* Client ID (Read-only) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label" htmlFor="clients_id">
                    Client ID (Auto Generated)
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="clients_id"
                      className="form-input form-input-no-padding"
                      value={fetchingNextId ? "Loading..." : nextClientId || "---"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Client Name */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_name ? "input-label-message" : ""}`} htmlFor="clients_name">
                    Client Name
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="clients_name"
                      className={`form-input form-input-no-padding ${errors.clients_name ? "input-error" : ""}`}
                      value={clientDetails.clients_name}
                      onChange={(e) => handleDetailChange("clients_name", e.target.value)}
                      placeholder="Enter client name"
                    />
                  </div>
                </div>
                {errors.clients_name && (
                  <div className="input-error-message">{errors.clients_name}</div>
                )}
              </div>
            </div>

            {/* Client Email */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_email ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_email ? "input-label-message" : ""}`} htmlFor="clients_email">
                    Client Email
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="email"
                      id="clients_email"
                      className={`form-input form-input-no-padding ${errors.clients_email ? "input-error" : ""}`}
                      value={clientDetails.clients_email}
                      onChange={(e) => handleDetailChange("clients_email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                {errors.clients_email && (
                  <div className="input-error-message">{errors.clients_email}</div>
                )}
              </div>
            </div>

            {/* Client Phone Number */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_number ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_number ? "input-label-message" : ""}`} htmlFor="clients_number">
                    Phone Number
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="tel"
                      id="clients_number"
                      className={`form-input form-input-no-padding ${errors.clients_number ? "input-error" : ""}`}
                      value={clientDetails.clients_number}
                      onChange={(e) => handleDetailChange("clients_number", e.target.value)}
                      placeholder="e.g. +2348100000000"
                      pattern="^\+?[0-9]+$"
                    />
                  </div>
                </div>
                {errors.clients_number && (
                  <div className="input-error-message">{errors.clients_number}</div>
                )}
              </div>
            </div>

            {/* Client Address */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_address ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_address ? "input-label-message" : ""}`} htmlFor="clients_address">
                    Address
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="clients_address"
                      className={`form-input form-input-no-padding ${errors.clients_address ? "input-error" : ""}`}
                      value={clientDetails.clients_address}
                      onChange={(e) => handleDetailChange("clients_address", e.target.value)}
                      placeholder="Enter client address"
                    />
                  </div>
                </div>
                {errors.clients_address && (
                  <div className="input-error-message">{errors.clients_address}</div>
                )}
              </div>
            </div>

          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button
                type="submit"
                disabled={isLoading || fetchingNextId}
                className="invoice-submit-btn"
              >
                {isLoading ? (
                  <div className="invoice-loader" />
                ) : (
                  <span className="invoice-submit-btn-text">Create Client</span>
                )}
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </>
  );
};

export default CreateClientForm;