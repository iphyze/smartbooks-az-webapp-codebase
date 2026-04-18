import React, { useEffect, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useLedgerStore from "../../stores/useLedgerStore";
import useAccountSearchStore from "../../stores/useAccountSearchStore";
import Select, { components } from "react-select";
import CreateAccountModal from "../../components/modals/CreateAccountModal";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Custom MenuList (Matches Journal Form)
───────────────────────────────────────────── */
const CustomMenuList = (props) => (
  <components.MenuList {...props}>
    {props.children}
  </components.MenuList>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditLedgerForm = ({ ledgerNumber, ledger, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { editLedger } = useLedgerStore();
  const { accounts, searchAccounts, isLoading: accountsLoading } = useAccountSearchStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

  /* ── Form State ── */
  const [ledgerDetails, setLedgerDetails] = useState({
    ledger_number: "",
    ledger_name: "",
    account_type: "", // Maps to ledger_type from the backend
  });

  /* ── Fetch Accounts on Mount ── */
  useEffect(() => {
    searchAccounts("");
  }, [searchAccounts]);

  /* ── Populate form when ledger prop arrives ── */
  useEffect(() => {
    if (!ledger) return;

    setLedgerDetails({
      ledger_number: ledger.ledger_number || "",
      ledger_name: ledger.ledger_name || "",
      account_type: ledger.ledger_type || "", // Backend sends ledger_type
    });
  }, [ledger]);

  /* ── Dynamic Options to prevent missing initial values ── */
  const accountOptions = useMemo(() => {
    const currentVal = ledgerDetails.account_type;
    const baseOptions = accounts.map((acc) => ({
      value: acc.type,
      label: acc.type,
    }));
    
    const exists = baseOptions.some(opt => opt.value === currentVal);
    if (currentVal && !exists) {
      return [...baseOptions, { value: currentVal, label: currentVal }];
    }
    return baseOptions;
  }, [accounts, ledgerDetails.account_type]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!ledgerDetails.ledger_name || ledgerDetails.ledger_name.trim() === "") 
      e.ledger_name = "Ledger name is required";
    if (!ledgerDetails.account_type) 
      e.account_type = "Account type is required";
    return e;
  }, [ledgerDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setLedgerDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountCreated = (newAccount) => {
    setShowCreateAccountModal(false);
    searchAccounts(""); // Refresh options
    if (newAccount) {
      handleDetailChange("account_type", newAccount.type);
    }
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
      ledger_number: ledgerDetails.ledger_number,
      ledger_name: ledgerDetails.ledger_name,
      account_type: ledgerDetails.account_type, // API expects account_type
    };

    const success = await editLedger(payload);

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
            <div className="invoice-form-htxt">Edit Ledger</div>
            <div className="invoice-form-sub-htxt">
              Update the details below for Ledger #{ledgerDetails.ledger_number || ledgerNumber}
            </div>
          </div>

          <div className="invoice-form-flex-box">
            
            {/* Ledger Number (Read-only) */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label" htmlFor="ledger_number">
                    Ledger Number
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="ledger_number"
                      className="form-input form-input-no-padding"
                      value={ledgerDetails.ledger_number || "---"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Name */}
            <div className="invoice-form invoice-form-half">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.ledger_name ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.ledger_name ? "input-label-message" : ""}`} htmlFor="ledger_name">
                    Ledger Name
                  </label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      id="ledger_name"
                      className={`form-input form-input-no-padding ${errors.ledger_name ? "input-error" : ""}`}
                      value={ledgerDetails.ledger_name}
                      onChange={(e) => handleDetailChange("ledger_name", e.target.value)}
                      placeholder="Enter ledger name"
                    />
                  </div>
                </div>
                {errors.ledger_name && (
                  <div className="input-error-message">{errors.ledger_name}</div>
                )}
              </div>
            </div>

            {/* Account Type with Add Button */}
            <div className="invoice-form invoice-form-half">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${errors.account_type ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${errors.account_type ? "input-label-message" : ""}`} htmlFor="account_type">
                      Account Type
                    </label>
                    <div className="form-wrapper">
                      <Select
                        options={accountOptions}
                        onInputChange={(val) => { if (val.length > 1) searchAccounts(val); }}
                        onMenuOpen={() => setOpenMenuId("account_type")}
                        onMenuClose={() => { setOpenMenuId(null); searchAccounts(""); }}
                        onChange={(opt) => handleDetailChange("account_type", opt ? opt.value : "")}
                        value={ledgerDetails.account_type ? { value: ledgerDetails.account_type, label: ledgerDetails.account_type } : null}
                        placeholder="Search account type..."
                        className={`form-input-select ${errors.account_type ? "input-error" : ""}`}
                        classNamePrefix="form-input-select"
                        isClearable
                        inputId="account_type"
                        isLoading={accountsLoading}
                        components={{ MenuList: CustomMenuList }}
                      />
                      <span className={[
                        "chevron-input-icon fas fa-chevron-down", 
                        openMenuId === "account_type" ? "chevron-rotate" : "", 
                        errors.account_type ? "input-icon-error" : ""
                      ].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {errors.account_type && (
                    <div className="input-error-message">{errors.account_type}</div>
                  )}
                </div>
                {/* Button to trigger Create Account Modal */}
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateAccountModal(true)} title="Add New Account Type">
                  <span className="fas fa-plus"></span>
                </button>
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
                  <span className="invoice-submit-btn-text">Update Ledger</span>
                )}
              </button>
            </div>
          </div>

        </form>
      </motion.div>

      {/* Create Account Modal */}
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

export default EditLedgerForm;