import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import useToastStore from "../../stores/useToastStore";
import useClientStore from "../../stores/useClientStore";
import Select from "react-select";
import "../../pages/inputs-styles/Inputs.css";
import "./CreateModal.css";

/* ─────────────────────────────────────────────
   Options
───────────────────────────────────────────── */
const LEDGER_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" }
];

/* ─────────────────────────────────────────────
   Create Client Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateClientsModal = ({ isOpen, onClose, onClientCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createClient, fetchNextClientId, nextClientId, fetchingNextId } = useClientStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [clientDetails, setClientDetails] = useState({
    clients_name: "",
    clients_email: "",
    clients_number: "",
    clients_address: "",
    create_ledger: "Yes",
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
      setClientDetails({
        clients_name: "",
        clients_email: "",
        clients_number: "",
        clients_address: "",
        create_ledger: "Yes",
      });
      setSubmitted(false);
      setIsCreating(false);
      fetchNextClientId();
    }
  }, [isOpen, fetchNextClientId]);

  const validateForm = () => {
    const e = {};
    if (!clientDetails.clients_name || clientDetails.clients_name.trim() === "") 
      e.clients_name = "Client name is required";
    if (!clientDetails.clients_email || clientDetails.clients_email.trim() === "") 
      e.clients_email = "Client email is required";
    if (!clientDetails.clients_number || clientDetails.clients_number.trim() === "") 
      e.clients_number = "Client phone number is required";
    if (!clientDetails.clients_address || clientDetails.clients_address.trim() === "") 
      e.clients_address = "Client address is required";
    if (!clientDetails.create_ledger) 
      e.create_ledger = "Ledger option is required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  const handleDetailChange = (field, value) => {
    if (field === "clients_number") {
      value = value.replace(/[^0-9+]/g, "");
      if (value.indexOf("+") > 0) {
        value = value.replace(/\+/g, "");
      } else if (value.indexOf("+") === 0) {
        value = "+" + value.slice(1).replace(/\+/g, "");
      }
    }
    setClientDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!nextClientId) {
      showToast("Client ID is still loading, please wait", "error");
      return;
    }

    setIsCreating(true);

    const payload = {
      clients_id: nextClientId,
      ...clientDetails,
    };

    const success = await createClient(payload);
    setIsCreating(false);

    if (success) {
      const newClient = {
        clients_id: nextClientId,
        clients_name: clientDetails.clients_name,
        clients_email: clientDetails.clients_email,
        clients_number: clientDetails.clients_number,
        clients_address: clientDetails.clients_address,
      };
      onClientCreated(newClient);
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
          <p className="modal-title">Create New Client</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-user-plus"></i></div>
            <p className="modal-text">Fill the form below to add a new client</p>
          </div>
          
          <div className="invoice-form-flex-box">
            {/* Client ID (Read-only) */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label" htmlFor="modal_clients_id">
                    Client ID (Auto Generated)
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="modal_clients_id"
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
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_name ? "input-label-message" : ""}`}>Client Name</label>
                  <div className="form-wrapper">
                    <input type="text" className={`form-input form-input-no-padding ${errors.clients_name ? "input-error" : ""}`} value={clientDetails.clients_name} onChange={(e) => handleDetailChange("clients_name", e.target.value)} placeholder="Enter client name" disabled={isCreating}/>
                  </div>
                </div>
                {errors.clients_name && <div className="input-error-message">{errors.clients_name}</div>}
              </div>
            </div>

            {/* Client Email */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_email ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_email ? "input-label-message" : ""}`}>Client Email</label>
                  <div className="form-wrapper">
                    <input type="email" className={`form-input form-input-no-padding ${errors.clients_email ? "input-error" : ""}`} value={clientDetails.clients_email} onChange={(e) => handleDetailChange("clients_email", e.target.value)} placeholder="Enter email address" disabled={isCreating}/>
                  </div>
                </div>
                {errors.clients_email && <div className="input-error-message">{errors.clients_email}</div>}
              </div>
            </div>

            {/* Client Phone Number */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_number ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_number ? "input-label-message" : ""}`}>Phone Number</label>
                  <div className="form-wrapper">
                    <input type="tel" className={`form-input form-input-no-padding ${errors.clients_number ? "input-error" : ""}`} value={clientDetails.clients_number} onChange={(e) => handleDetailChange("clients_number", e.target.value)} placeholder="e.g. +2348100000000" disabled={isCreating}/>
                  </div>
                </div>
                {errors.clients_number && <div className="input-error-message">{errors.clients_number}</div>}
              </div>
            </div>

            {/* Client Address */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.clients_address ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.clients_address ? "input-label-message" : ""}`}>Address</label>
                  <div className="form-wrapper">
                    <input type="text" className={`form-input form-input-no-padding ${errors.clients_address ? "input-error" : ""}`} value={clientDetails.clients_address} onChange={(e) => handleDetailChange("clients_address", e.target.value)} placeholder="Enter client address" disabled={isCreating}/>
                  </div>
                </div>
                {errors.clients_address && <div className="input-error-message">{errors.clients_address}</div>}
              </div>
            </div>

            {/* Create Ledger Select Field */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.create_ledger ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.create_ledger ? "input-label-message" : ""}`}>Create Ledger?</label>
                  <div className="form-wrapper">
                    <Select options={LEDGER_OPTIONS} onChange={(opt) => handleDetailChange("create_ledger", opt?.value || "")} value={LEDGER_OPTIONS.find((o) => o.value === clientDetails.create_ledger) || null} placeholder="Select" className={`form-input-select ${errors.create_ledger ? "input-error" : ""}`} classNamePrefix="form-input-select" onMenuOpen={() => setOpenMenuId("create_ledger")} onMenuClose={() => setOpenMenuId(null)} isDisabled={isCreating}/>
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "create_ledger" ? "chevron-rotate" : "", errors.create_ledger ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.create_ledger && <div className="input-error-message">{errors.create_ledger}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating || fetchingNextId}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Client"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateClientsModal;