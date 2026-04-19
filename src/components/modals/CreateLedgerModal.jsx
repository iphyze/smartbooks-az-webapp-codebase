import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import useToastStore from "../../stores/useToastStore";
import useLedgerStore from "../../stores/useLedgerStore";
import useAccountSearchStore from "../../stores/useAccountSearchStore";
import CreateAccountModal from "./CreateAccountModal"; // Import nested modal
import Select from "react-select";
import "../../pages/inputs-styles/Inputs.css";
import "./CreateModal.css";

/* ─────────────────────────────────────────────
   Create Ledger Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateLedgerModal = ({ isOpen, onClose, onLedgerCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createLedger } = useLedgerStore();
  const { accounts, searchAccounts, isLoading: accountsLoading } = useAccountSearchStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  
  const [ledgerDetails, setLedgerDetails] = useState({
    ledger_name: "",
    account_type: "",
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
      setLedgerDetails({ ledger_name: "", account_type: "" });
      setSubmitted(false);
      setIsCreating(false);
      searchAccounts("");
    }
  }, [isOpen, searchAccounts]);

  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({ value: acc.type, label: acc.type }));
  }, [accounts]);

  const validateForm = () => {
    const e = {};
    if (!ledgerDetails.ledger_name || ledgerDetails.ledger_name.trim() === "") 
      e.ledger_name = "Ledger name is required";
    if (!ledgerDetails.account_type) 
      e.account_type = "Account type is required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  const handleDetailChange = (field, value) => {
    setLedgerDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountCreated = (newAccount) => {
    setShowCreateAccountModal(false);
    searchAccounts("");
    if (newAccount) {
      handleDetailChange("account_type", newAccount.type);
    }
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
    const success = await createLedger(ledgerDetails);
    setIsCreating(false);

    if (success) {
      onLedgerCreated(ledgerDetails);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
            <p className="modal-title">Create New Ledger</p>
            <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body-scrollable">
            <div className="">
              <div className="modal-icon"><i className="fas fa-book"></i></div>
              <p className="modal-text">Fill the form below to add a new ledger</p>
            </div>
            
            <div className="invoice-form-flex-box">
              {/* Ledger Name */}
              <div className="invoice-form">
                <div className="input-form-wrapper">
                  <div className={`input-form-group ${errors.ledger_name ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${errors.ledger_name ? "input-label-message" : ""}`}>Ledger Name</label>
                    <div className="form-wrapper">
                      <input type="text" className={`form-input form-input-no-padding ${errors.ledger_name ? "input-error" : ""}`} value={ledgerDetails.ledger_name} onChange={(e) => handleDetailChange("ledger_name", e.target.value)} placeholder="e.g. Office Refreshments" disabled={isCreating}/>
                    </div>
                  </div>
                  {errors.ledger_name && <div className="input-error-message">{errors.ledger_name}</div>}
                </div>
              </div>

              {/* Account Type */}
              <div className="invoice-form">
                <div className="inv-form-flex">
                  <div className="input-form-wrapper inv-form-flex-wrap">
                    <div className={`input-form-group ${errors.account_type ? "input-form-error" : ""}`}>
                      <label className={`input-form-label ${errors.account_type ? "input-label-message" : ""}`}>Account Type</label>
                      <div className="form-wrapper">
                        <Select 
                          options={accountOptions} 
                          onChange={(opt) => handleDetailChange("account_type", opt?.value || "")} 
                          value={accountOptions.find((o) => o.value === ledgerDetails.account_type) || null} 
                          placeholder="Search account type..." 
                          className={`form-input-select ${errors.account_type ? "input-error" : ""}`} 
                          classNamePrefix="form-input-select" 
                          isDisabled={isCreating}
                          onMenuOpen={() => setOpenMenuId("modal_account_type")}
                          onMenuClose={() => setOpenMenuId(null)}
                        />
                        <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "modal_account_type" ? "chevron-rotate" : "", errors.account_type ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                      </div>
                    </div>
                    {errors.account_type && <div className="input-error-message">{errors.account_type}</div>}
                  </div>
                  <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateAccountModal(true)} title="Add New Account Type" disabled={isCreating}>
                    <span className="fas fa-plus"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
            <button className="btn-update" onClick={handleConfirm} disabled={isCreating}>
              {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Ledger"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Nested Account Modal */}
      <AnimatePresence>
        {showCreateAccountModal && (
          <CreateAccountModal 
            isOpen={showCreateAccountModal} 
            onClose={() => setShowCreateAccountModal(false)} 
            onAccountCreated={handleAccountCreated} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateLedgerModal;