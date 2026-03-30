import React, { useEffect, useState, useMemo, useCallback } from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useAccountStore from "../../stores/useAccountStore";
import Select from "react-select";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Options
───────────────────────────────────────────── */
const CATEGORY_OPTIONS = [
  { value: "Asset", label: "Asset" },
  { value: "Equity", label: "Equity" },
  { value: "Expense", label: "Expense" },
  { value: "Income", label: "Income" },
  { value: "Liability", label: "Liability" },
];

const SUB_CATEGORY_OPTIONS = [
  { value: "Current Assets", label: "Current Assets" },
  { value: "Current Liability", label: "Current Liability" },
  { value: "Equity", label: "Equity" },
  { value: "Expense", label: "Expense" },
  { value: "Fixed Assets", label: "Fixed Assets" },
  { value: "Income", label: "Income" },
  { value: "Non-Current Liability", label: "Non-Current Liability" },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditAccountForm = ({ accountId, account, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { editAccountType } = useAccountStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ── Form State ── */
  const [accountDetails, setAccountDetails] = useState({
    id: "",
    type: "",
    category_id: "",
    category: "",
    sub_category: "",
  });

  /* ── Populate form when account prop arrives ── */
  useEffect(() => {
    if (!account) return;

    setAccountDetails({
      id: account.id || "",
      type: account.type || "",
      category_id: account.category_id ? account.category_id.toString() : "",
      category: account.category || "",
      sub_category: account.sub_category || "",
    });
  }, [account]);

  /* ── Dynamic Options to prevent missing initial values (e.g. singular vs plural mismatches) ── */
  const dynamicCategoryOptions = useMemo(() => {
    const currentVal = accountDetails.category;
    const exists = CATEGORY_OPTIONS.some(opt => opt.value === currentVal);
    if (currentVal && !exists) {
      return [...CATEGORY_OPTIONS, { value: currentVal, label: currentVal }];
    }
    return CATEGORY_OPTIONS;
  }, [accountDetails.category]);

  const dynamicSubCategoryOptions = useMemo(() => {
    const currentVal = accountDetails.sub_category;
    const exists = SUB_CATEGORY_OPTIONS.some(opt => opt.value === currentVal);
    if (currentVal && !exists) {
      return [...SUB_CATEGORY_OPTIONS, { value: currentVal, label: currentVal }];
    }
    return SUB_CATEGORY_OPTIONS;
  }, [accountDetails.sub_category]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!accountDetails.type || accountDetails.type.trim() === "") 
      e.type = "Account type is required";
    if (!accountDetails.category_id || accountDetails.category_id.toString().trim() === "") 
      e.category_id = "Category ID is required";
    if (!accountDetails.category) 
      e.category = "Account category is required";
    if (!accountDetails.sub_category) 
      e.sub_category = "Sub category is required";
    return e;
  }, [accountDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    // Prevent non-numeric characters for category_id
    if (field === "category_id") {
      value = value.replace(/[^0-9]/g, "");
    }
    setAccountDetails((prev) => ({ ...prev, [field]: value }));
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
      id: accountDetails.id,
      type: accountDetails.type,
      category_id: parseInt(accountDetails.category_id, 10),
      category: accountDetails.category,
      sub_category: accountDetails.sub_category,
    };

    const success = await editAccountType(payload);

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
          <div className="invoice-form-htxt">Edit Account Type</div>
          <div className="invoice-form-sub-htxt">
            Update the details below to edit Account Type #{accountDetails.category_id || accountId}
          </div>
        </div>

        <div className="invoice-form-flex-box">
          
          {/* Account Type */}
          <div className="invoice-form invoice-form-full">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.type ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.type ? "input-label-message" : ""}`} htmlFor="type">
                  Account Type (e.g cash, equity, liability)
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="type"
                    className={`form-input form-input-no-padding ${errors.type ? "input-error" : ""}`}
                    value={accountDetails.type}
                    onChange={(e) => handleDetailChange("type", e.target.value)}
                    placeholder="Account Type (e.g Cash, Equity, Liability)"
                  />
                </div>
              </div>
              {errors.type && (
                <div className="input-error-message">{errors.type}</div>
              )}
            </div>
          </div>

          {/* Category ID */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.category_id ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.category_id ? "input-label-message" : ""}`} htmlFor="category_id">
                  Category ID
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="category_id"
                    className={`form-input form-input-no-padding ${errors.category_id ? "input-error" : ""}`}
                    value={accountDetails.category_id}
                    onChange={(e) => handleDetailChange("category_id", e.target.value)}
                    placeholder="e.g. 9000000"
                  />
                </div>
              </div>
              {errors.category_id && (
                <div className="input-error-message">{errors.category_id}</div>
              )}
            </div>
          </div>

          {/* Account Category */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.category ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.category ? "input-label-message" : ""}`} htmlFor="category">
                  Account Category
                </label>
                <div className="form-wrapper">
                  <Select
                    options={dynamicCategoryOptions}
                    onChange={(opt) => handleDetailChange("category", opt?.value || "")}
                    value={dynamicCategoryOptions.find((o) => o.value === accountDetails.category) || null}
                    placeholder="Select Category"
                    className={`form-input-select ${errors.category ? "input-error" : ""}`}
                    classNamePrefix="form-input-select"
                    inputId="category"
                    onMenuOpen={() => setOpenMenuId("category")}
                    onMenuClose={() => setOpenMenuId(null)}
                  />
                  <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "category" ? "chevron-rotate" : "", errors.category ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                </div>
              </div>
              {errors.category && (
                <div className="input-error-message">{errors.category}</div>
              )}
            </div>
          </div>

          {/* Sub Category */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.sub_category ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.sub_category ? "input-label-message" : ""}`} htmlFor="sub_category">
                  Sub Category
                </label>
                <div className="form-wrapper">
                  <Select
                    options={dynamicSubCategoryOptions}
                    onChange={(opt) => handleDetailChange("sub_category", opt?.value || "")}
                    value={dynamicSubCategoryOptions.find((o) => o.value === accountDetails.sub_category) || null}
                    placeholder="Select Sub Category"
                    className={`form-input-select ${errors.sub_category ? "input-error" : ""}`}
                    classNamePrefix="form-input-select"
                    inputId="sub_category"
                    onMenuOpen={() => setOpenMenuId("sub_category")}
                    onMenuClose={() => setOpenMenuId(null)}
                  />
                  <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "sub_category" ? "chevron-rotate" : "", errors.sub_category ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                </div>
              </div>
              {errors.sub_category && (
                <div className="input-error-message">{errors.sub_category}</div>
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
                <span className="invoice-submit-btn-text">Update Account Type</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default EditAccountForm;