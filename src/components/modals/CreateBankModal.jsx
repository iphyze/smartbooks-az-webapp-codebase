import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import useToastStore from "../../stores/useToastStore";
import useBankStore from "../../stores/useBankStore";
import Select, { components } from "react-select";
import "../../pages/inputs-styles/Inputs.css";
import "./CreateModal.css";

/* ─────────────────────────────────────────────
   Custom MenuList (Matches Journal Form)
───────────────────────────────────────────── */
const CustomMenuList = (props) => (
  <components.MenuList {...props}>
    {props.children}
  </components.MenuList>
);

/* ─────────────────────────────────────────────
   Static Options
───────────────────────────────────────────── */
const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
];

/* ─────────────────────────────────────────────
   Create Bank Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateBankModal = ({ isOpen, onClose, onBankCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createBank } = useBankStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [bankDetails, setBankDetails] = useState({
    account_name: "A-Z Consultancy Ltd",
    account_number: "",
    bank_name: "",
    account_currency: "NGN",
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
      setBankDetails({
        account_name: "A-Z Consultancy Ltd",
        account_number: "",
        bank_name: "",
        account_currency: "NGN",
      });
      setSubmitted(false);
      setIsCreating(false);
      setOpenMenuId(null);
    }
  }, [isOpen]);

  const validateForm = () => {
    const e = {};
    if (!bankDetails.account_name || bankDetails.account_name.trim() === "") 
      e.account_name = "Account name is required";
    if (!bankDetails.account_number || bankDetails.account_number.trim() === "") 
      e.account_number = "Account number is required";
    if (!bankDetails.bank_name || bankDetails.bank_name.trim() === "") 
      e.bank_name = "Bank name is required";
    if (!bankDetails.account_currency) 
      e.account_currency = "Currency is required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  const handleDetailChange = (field, value) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsCreating(true);

    const payload = {
      account_name: bankDetails.account_name,
      account_number: bankDetails.account_number,
      bank_name: bankDetails.bank_name,
      account_currency: bankDetails.account_currency,
    };

    const success = await createBank(payload);
    setIsCreating(false);

    if (success) {
      onBankCreated({
        account_name: bankDetails.account_name,
        account_number: bankDetails.account_number,
        bank_name: bankDetails.bank_name,
        account_currency: bankDetails.account_currency,
      });
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
          <p className="modal-title">Create New Bank Account</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-university"></i></div>
            <p className="modal-text">Fill the form below to add a new bank account</p>
          </div>
          
          <div className="invoice-form-flex-box">
            {/* Account Name */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.account_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.account_name ? "input-label-message" : ""}`}>Account Name</label>
                  <div className="form-wrapper">
                    <input type="text" className={`form-input form-input-no-padding ${errors.account_name ? "input-error" : ""}`} value={bankDetails.account_name} onChange={(e) => handleDetailChange("account_name", e.target.value)} placeholder="Enter account name" disabled={isCreating}/>
                  </div>
                </div>
                {errors.account_name && <div className="input-error-message">{errors.account_name}</div>}
              </div>
            </div>

            {/* Account Number */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.account_number ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.account_number ? "input-label-message" : ""}`}>Account Number</label>
                  <div className="form-wrapper">
                    <input type="text" className={`form-input form-input-no-padding ${errors.account_number ? "input-error" : ""}`} value={bankDetails.account_number} onChange={(e) => handleDetailChange("account_number", e.target.value)} placeholder="Enter account number" disabled={isCreating}/>
                  </div>
                </div>
                {errors.account_number && <div className="input-error-message">{errors.account_number}</div>}
              </div>
            </div>

            {/* Bank Name */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.bank_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.bank_name ? "input-label-message" : ""}`}>Bank Name</label>
                  <div className="form-wrapper">
                    <input type="text" className={`form-input form-input-no-padding ${errors.bank_name ? "input-error" : ""}`} value={bankDetails.bank_name} onChange={(e) => handleDetailChange("bank_name", e.target.value)} placeholder="Enter bank name" disabled={isCreating}/>
                  </div>
                </div>
                {errors.bank_name && <div className="input-error-message">{errors.bank_name}</div>}
              </div>
            </div>

            {/* Account Currency */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.account_currency ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.account_currency ? "input-label-message" : ""}`}>Account Currency</label>
                  <div className="form-wrapper">
                    <Select options={CURRENCY_OPTIONS} onChange={(opt) => handleDetailChange("account_currency", opt?.value || "")} value={CURRENCY_OPTIONS.find((o) => o.value === bankDetails.account_currency) || null} placeholder="Select currency" className={`form-input-select ${errors.account_currency ? "input-error" : ""}`} classNamePrefix="form-input-select" onMenuOpen={() => setOpenMenuId("account_currency")} onMenuClose={() => setOpenMenuId(null)} isDisabled={isCreating} components={{ MenuList: CustomMenuList }} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "account_currency" ? "chevron-rotate" : "", errors.account_currency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.account_currency && <div className="input-error-message">{errors.account_currency}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Bank Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateBankModal;