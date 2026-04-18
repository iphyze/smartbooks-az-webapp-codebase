import React, { useEffect, useState, useMemo, useCallback } from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useBankStore from "../../stores/useBankStore";
import Select, { components } from "react-select";
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
   Static Options
───────────────────────────────────────────── */
const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditBankForm = ({ bankId, bank, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { editBank } = useBankStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ── Form State ── */
  const [bankDetails, setBankDetails] = useState({
    id: "",
    account_name: "",
    account_number: "",
    bank_name: "",
    account_currency: "NGN",
  });

  /* ── Populate form when bank prop arrives ── */
  useEffect(() => {
    if (!bank) return;

    setBankDetails({
      id: bank.id || "",
      account_name: bank.account_name || "",
      account_number: bank.account_number || "",
      bank_name: bank.bank_name || "",
      account_currency: bank.account_currency || "NGN",
    });
  }, [bank]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
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
  }, [bankDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setBankDetails((prev) => ({ ...prev, [field]: value }));
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
      id: bankDetails.id,
      account_name: bankDetails.account_name,
      account_number: bankDetails.account_number, 
      bank_name: bankDetails.bank_name,
      account_currency: bankDetails.account_currency,
    };

    const success = await editBank(payload);

    setIsLoading(false);

    if (success) {
      // console.log(payload);
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
          <div className="invoice-form-htxt">Edit Bank Account</div>
          <div className="invoice-form-sub-htxt">
            Update the details below for Bank ID #{bankDetails.id || bankId}
          </div>
        </div>

        <div className="invoice-form-flex-box">
          
          {/* Bank ID (Read-only) */}
          <div className="invoice-form invoice-form-half">
            <div className="input-form-wrapper">
              <div className="input-form-group input-disabled">
                <label className="input-form-label" htmlFor="bank_id">
                  Bank ID
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="bank_id"
                    className="form-input form-input-no-padding"
                    value={bankDetails.id || "---"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Account Name */}
          <div className="invoice-form invoice-form-half">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.account_name ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.account_name ? "input-label-message" : ""}`} htmlFor="account_name">
                  Account Name
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="account_name"
                    className={`form-input form-input-no-padding ${errors.account_name ? "input-error" : ""}`}
                    value={bankDetails.account_name}
                    onChange={(e) => handleDetailChange("account_name", e.target.value)}
                    placeholder="Enter account name"
                  />
                </div>
              </div>
              {errors.account_name && (
                <div className="input-error-message">{errors.account_name}</div>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div className="invoice-form invoice-form-half">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.account_number ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.account_number ? "input-label-message" : ""}`} htmlFor="account_number">
                  Account Number
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="account_number"
                    className={`form-input form-input-no-padding ${errors.account_number ? "input-error" : ""}`}
                    value={bankDetails.account_number}
                    onChange={(e) => handleDetailChange("account_number", e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
              </div>
              {errors.account_number && (
                <div className="input-error-message">{errors.account_number}</div>
              )}
            </div>
          </div>

          {/* Bank Name */}
          <div className="invoice-form invoice-form-half">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.bank_name ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.bank_name ? "input-label-message" : ""}`} htmlFor="bank_name">
                  Bank Name
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="bank_name"
                    className={`form-input form-input-no-padding ${errors.bank_name ? "input-error" : ""}`}
                    value={bankDetails.bank_name}
                    onChange={(e) => handleDetailChange("bank_name", e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
              </div>
              {errors.bank_name && (
                <div className="input-error-message">{errors.bank_name}</div>
              )}
            </div>
          </div>

          {/* Account Currency */}
          <div className="invoice-form invoice-form-half">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.account_currency ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.account_currency ? "input-label-message" : ""}`} htmlFor="account_currency">
                  Account Currency
                </label>
                <div className="form-wrapper">
                  <Select
                    options={CURRENCY_OPTIONS}
                    onChange={(opt) =>
                      handleDetailChange("account_currency", opt?.value || "")
                    }
                    value={
                      CURRENCY_OPTIONS.find(
                        (o) => o.value === bankDetails.account_currency
                      ) || null
                    }
                    placeholder="Select currency"
                    className={`form-input-select ${
                      errors.account_currency ? "input-error" : ""
                    }`}
                    classNamePrefix="form-input-select"
                    inputId="account_currency"
                    onMenuOpen={() => setOpenMenuId("account_currency")}
                    onMenuClose={() => setOpenMenuId(null)}
                    components={{ MenuList: CustomMenuList }}
                  />
                  <span
                    className={[
                      "chevron-input-icon fas fa-chevron-down",
                      openMenuId === "account_currency" ? "chevron-rotate" : "",
                      errors.account_currency ? "input-icon-error" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                </div>
              </div>
              {errors.account_currency && (
                <div className="input-error-message">
                  {errors.account_currency}
                </div>
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
                <span className="invoice-submit-btn-text">Update Bank Account</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default EditBankForm;