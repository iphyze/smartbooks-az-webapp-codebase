import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useRateStore from "../../stores/useRateStore"; // Added for createRate
import "../../pages/inputs-styles/Inputs.css";
import "./CreateModal.css";

/* ─────────────────────────────────────────────
   Create Rate Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateRateModal = ({ isOpen, onClose, onRateCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createRate } = useRateStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [rateDetails, setRateDetails] = useState({
    created_at: new Date(),
    ngn_rate: "1",
    usd_rate: "",
    gbp_rate: "",
    eur_rate: "",
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
      setRateDetails({ created_at: new Date(), ngn_rate: "1", usd_rate: "", gbp_rate: "", eur_rate: "" });
      setSubmitted(false);
      setIsCreating(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const e = {};
    if (!rateDetails.created_at) e.created_at = "Date is required";
    if (!rateDetails.usd_rate || isNaN(parseFloat(rateDetails.usd_rate)) || parseFloat(rateDetails.usd_rate) < 0) 
      e.usd_rate = "Valid USD rate is required";
    if (!rateDetails.gbp_rate || isNaN(parseFloat(rateDetails.gbp_rate)) || parseFloat(rateDetails.gbp_rate) < 0) 
      e.gbp_rate = "Valid GBP rate is required";
    if (!rateDetails.eur_rate || isNaN(parseFloat(rateDetails.eur_rate)) || parseFloat(rateDetails.eur_rate) < 0) 
      e.eur_rate = "Valid EUR rate is required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  const handleConfirm = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsCreating(true);
    const formattedDate = rateDetails.created_at instanceof Date
      ? rateDetails.created_at.toISOString().split("T")[0]
      : rateDetails.created_at;

    const payload = {
      ngn_cur: "NGN", ngn_rate: rateDetails.ngn_rate,
      usd_cur: "USD", usd_rate: rateDetails.usd_rate,
      gbp_cur: "GBP", gbp_rate: rateDetails.gbp_rate,
      eur_cur: "EUR", eur_rate: rateDetails.eur_rate,
      created_at: formattedDate,
    };

    const success = await createRate(payload);
    setIsCreating(false);

    if (success) {
      onRateCreated();
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
          <p className="modal-title">Create New Rate</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-plus-circle"></i></div>
            <p className="modal-text">Fill the form below to add a new exchange rate</p>
          </div>
          
          
          <div className="invoice-form-flex-box">
            {/* Date */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.created_at ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.created_at ? "input-label-message" : ""}`}>Effective Date</label>
                  <div className="form-wrapper">
                    <DatePicker selected={rateDetails.created_at} onChange={(date) => setRateDetails(p => ({...p, created_at: date}))} className={`form-input ${errors.created_at ? "input-error" : ""}`} dateFormat="yyyy-MM-dd" wrapperClassName="input-date-picker" disabled={isCreating}/>
                    <span className={`chevron-input-icon fas fa-calendar ${errors.created_at ? "input-icon-error" : ""}`}/>
                  </div>
                </div>
                {errors.created_at && <div className="input-error-message">{errors.created_at}</div>}
              </div>
            </div>

            {/* USD */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.usd_rate ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.usd_rate ? "input-label-message" : ""}`}>USD Rate</label>
                  <div className="form-wrapper">
                    <input type="number" className={`form-input form-input-no-padding ${errors.usd_rate ? "input-error" : ""}`} value={rateDetails.usd_rate} onChange={(e) => setRateDetails(p => ({...p, usd_rate: e.target.value}))} step="0.01" placeholder="0.00" disabled={isCreating}/>
                  </div>
                </div>
                {errors.usd_rate && <div className="input-error-message">{errors.usd_rate}</div>}
              </div>
            </div>

            {/* GBP */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.gbp_rate ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.gbp_rate ? "input-label-message" : ""}`}>GBP Rate</label>
                  <div className="form-wrapper">
                    <input type="number" className={`form-input form-input-no-padding ${errors.gbp_rate ? "input-error" : ""}`} value={rateDetails.gbp_rate} onChange={(e) => setRateDetails(p => ({...p, gbp_rate: e.target.value}))} step="0.01" placeholder="0.00" disabled={isCreating}/>
                  </div>
                </div>
                {errors.gbp_rate && <div className="input-error-message">{errors.gbp_rate}</div>}
              </div>
            </div>

            {/* EUR */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.eur_rate ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.eur_rate ? "input-label-message" : ""}`}>EUR Rate</label>
                  <div className="form-wrapper">
                    <input type="number" className={`form-input form-input-no-padding ${errors.eur_rate ? "input-error" : ""}`} value={rateDetails.eur_rate} onChange={(e) => setRateDetails(p => ({...p, eur_rate: e.target.value}))} step="0.01" placeholder="0.00" disabled={isCreating}/>
                  </div>
                </div>
                {errors.eur_rate && <div className="input-error-message">{errors.eur_rate}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Rate"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateRateModal;