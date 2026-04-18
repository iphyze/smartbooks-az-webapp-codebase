import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import useToastStore from "../../stores/useToastStore";
import useAccountStore from "../../stores/useAccountStore";
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
   Static Options (From CreateAccountForm)
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
   Create Account Modal (Scrollable Inner Box)
───────────────────────────────────────────── */
const CreateAccountModal = ({ isOpen, onClose, onAccountCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createAccountType } = useAccountStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const [accountDetails, setAccountDetails] = useState({
    type: "",
    category_id: "",
    category: "",
    sub_category: "",
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
      setAccountDetails({
        type: "",
        category_id: "",
        category: "",
        sub_category: "",
      });
      setSubmitted(false);
      setIsCreating(false);
      setOpenMenuId(null);
    }
  }, [isOpen]);

  const validateForm = () => {
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
  };

  const errors = submitted ? validateForm() : {};

  const handleDetailChange = (field, value) => {
    if (field === "category_id") {
      value = value.replace(/[^0-9]/g, ""); // Only numbers
    }
    setAccountDetails((prev) => ({ ...prev, [field]: value }));
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
      type: accountDetails.type,
      category_id: parseInt(accountDetails.category_id, 10),
      category: accountDetails.category,
      sub_category: accountDetails.sub_category,
    };

    const success = await createAccountType(payload);
    setIsCreating(false);

    if (success) {
      onAccountCreated({
        type: accountDetails.type,
        category_id: accountDetails.category_id,
        category: accountDetails.category,
        sub_category: accountDetails.sub_category,
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
          <p className="modal-title">Create New Account Type</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-book"></i></div>
            <p className="modal-text">Fill the form below to add a new account type</p>
          </div>
          
          <div className="invoice-form-flex-box">
            {/* Account Type Name */}
            <div className="invoice-form invoice-form-full">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.type ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.type ? "input-label-message" : ""}`}>Account Type</label>
                  <div className="form-wrapper">
                    <input 
                      type="text" 
                      className={`form-input form-input-no-padding ${errors.type ? "input-error" : ""}`} 
                      value={accountDetails.type} 
                      onChange={(e) => handleDetailChange("type", e.target.value)} 
                      placeholder="e.g. Cash, Equity, Liability"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.type && <div className="input-error-message">{errors.type}</div>}
              </div>
            </div>

            {/* Category ID */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.category_id ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.category_id ? "input-label-message" : ""}`}>Category ID</label>
                  <div className="form-wrapper">
                    <input 
                      type="text" 
                      className={`form-input form-input-no-padding ${errors.category_id ? "input-error" : ""}`} 
                      value={accountDetails.category_id} 
                      onChange={(e) => handleDetailChange("category_id", e.target.value)} 
                      placeholder="e.g. 9000000"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.category_id && <div className="input-error-message">{errors.category_id}</div>}
              </div>
            </div>

            {/* Category */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.category ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.category ? "input-label-message" : ""}`}>Category</label>
                  <div className="form-wrapper">
                    <Select 
                      options={CATEGORY_OPTIONS} 
                      onChange={(opt) => handleDetailChange("category", opt?.value || "")} 
                      value={CATEGORY_OPTIONS.find((o) => o.value === accountDetails.category) || null} 
                      placeholder="Select Category"
                      className={`form-input-select ${errors.category ? "input-error" : ""}`}
                      classNamePrefix="form-input-select"
                      onMenuOpen={() => setOpenMenuId("category")}
                      onMenuClose={() => setOpenMenuId(null)}
                      isDisabled={isCreating}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "category" ? "chevron-rotate" : "", errors.category ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.category && <div className="input-error-message">{errors.category}</div>}
              </div>
            </div>

            {/* Sub Category */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.sub_category ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${errors.sub_category ? "input-label-message" : ""}`}>Sub Category</label>
                  <div className="form-wrapper">
                    <Select 
                      options={SUB_CATEGORY_OPTIONS} 
                      onChange={(opt) => handleDetailChange("sub_category", opt?.value || "")} 
                      value={SUB_CATEGORY_OPTIONS.find((o) => o.value === accountDetails.sub_category) || null} 
                      placeholder="Select Sub Category"
                      className={`form-input-select ${errors.sub_category ? "input-error" : ""}`}
                      classNamePrefix="form-input-select"
                      onMenuOpen={() => setOpenMenuId("sub_category")}
                      onMenuClose={() => setOpenMenuId(null)}
                      isDisabled={isCreating}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "sub_category" ? "chevron-rotate" : "", errors.sub_category ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.sub_category && <div className="input-error-message">{errors.sub_category}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Account Type"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateAccountModal;