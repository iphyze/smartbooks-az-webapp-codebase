import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useStaffStore from "../../stores/useStaffStore";
import useToastStore from "../../stores/useToastStore";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../inputs-styles/Inputs.css";

/* ─────────────────────────────────────────────
   Options
───────────────────────────────────────────── */
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditStaffForm = ({ staffId, staff, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { updateStaff } = useStaffStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  /* ── Form State ── */
  const [staffDetails, setStaffDetails] = useState({
    staff_id: "",
    staff_name: "",
    staff_email: "",
    staff_tel: "",
    staff_address: "",
    date_of_birth: null,
    gender: "",
    job_title: "",
    date_of_joining: null,
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    pension_number: "",
    payee_id: "",
  });

  /* ── Populate form when staff prop arrives ── */
  useEffect(() => {
    if (!staff) return;

    setStaffDetails({
      staff_id: staff.staff_id ?? "",
      staff_name: staff.staff_name ?? "",
      staff_email: staff.staff_email ?? "",
      staff_tel: staff.staff_tel ?? "",
      staff_address: staff.staff_address ?? "",
      // Handle date conversion safely
      date_of_birth: staff.date_of_birth ? new Date(staff.date_of_birth) : null,
      gender: staff.gender ?? "",
      job_title: staff.job_title ?? "",
      date_of_joining: staff.date_of_joining ? new Date(staff.date_of_joining) : null,
      bank_name: staff.bank_name ?? "",
      bank_account_number: staff.bank_account_number ?? "",
      bank_account_name: staff.bank_account_name ?? "",
      pension_number: staff.pension_number ?? "",
      payee_id: staff.payee_id ?? "",
    });
  }, [staff]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateForm = useCallback(() => {
    const e = {};
    if (!staffDetails.staff_name || staffDetails.staff_name.trim() === "")
      e.staff_name = "Staff name is required";
    if (!staffDetails.staff_email || staffDetails.staff_email.trim() === "")
      e.staff_email = "Staff email is required";
    if (!staffDetails.staff_tel || staffDetails.staff_tel.trim() === "")
      e.staff_tel = "Phone number is required";
    if (!staffDetails.staff_address || staffDetails.staff_address.trim() === "")
      e.staff_address = "Address is required";
    if (!staffDetails.gender)
      e.gender = "Gender is required";
    if (!staffDetails.date_of_birth)
      e.date_of_birth = "Date of birth is required";
    if (!staffDetails.job_title || staffDetails.job_title.trim() === "")
      e.job_title = "Job title is required";
    if (!staffDetails.date_of_joining)
      e.date_of_joining = "Date of joining is required";
    if (!staffDetails.bank_name || staffDetails.bank_name.trim() === "")
      e.bank_name = "Bank name is required";
    if (!staffDetails.bank_account_number || staffDetails.bank_account_number.trim() === "")
      e.bank_account_number = "Account number is required";
    if (!staffDetails.bank_account_name || staffDetails.bank_account_name.trim() === "")
      e.bank_account_name = "Account name is required";
    return e;
  }, [staffDetails]);

  const errors = useMemo(() => (submitted ? validateForm() : {}), [submitted, validateForm]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    if (field === "staff_tel") {
      value = value.replace(/[^0-9+]/g, "");
      if (value.indexOf("+") > 0) {
        value = value.replace(/\+/g, "");
      } else if (value.indexOf("+") === 0) {
        value = "+" + value.slice(1).replace(/\+/g, "");
      }
    }
    setStaffDetails((prev) => ({ ...prev, [field]: value }));
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
      ...staffDetails,
      // Format dates for backend
      date_of_birth: staffDetails.date_of_birth ? staffDetails.date_of_birth.toISOString().split("T")[0] : null,
      date_of_joining: staffDetails.date_of_joining ? staffDetails.date_of_joining.toISOString().split("T")[0] : null,
    };

    const result = await updateStaff(payload);

    setIsLoading(false);

    if (result && result.success) {
      setSubmitted(false);
      if (onSaveSuccess) onSaveSuccess();
      navigate(`/staff/view/${staffDetails.staff_id}`);
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
          <div className="invoice-form-htxt">Edit Staff Record</div>
          <div className="invoice-form-sub-htxt">
            Update the details for <strong>{staff?.staff_name}</strong>
          </div>
        </div>

        <div className="invoice-form-flex-box">

          {/* Staff ID (Read-only) */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group input-disabled">
                <label className="input-form-label" htmlFor="staff_id">
                  Staff ID
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="staff_id"
                    className="form-input form-input-no-padding"
                    value={staffDetails.staff_id || "---"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Staff Name */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.staff_name ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.staff_name ? "input-label-message" : ""}`} htmlFor="staff_name">
                  Full Name
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="staff_name"
                    className={`form-input form-input-no-padding ${errors.staff_name ? "input-error" : ""}`}
                    value={staffDetails.staff_name}
                    onChange={(e) => handleDetailChange("staff_name", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
              </div>
              {errors.staff_name && (
                <div className="input-error-message">{errors.staff_name}</div>
              )}
            </div>
          </div>

          {/* Staff Email */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.staff_email ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.staff_email ? "input-label-message" : ""}`} htmlFor="staff_email">
                  Email Address
                </label>
                <div className="form-wrapper">
                  <input
                    type="email"
                    id="staff_email"
                    className={`form-input form-input-no-padding ${errors.staff_email ? "input-error" : ""}`}
                    value={staffDetails.staff_email}
                    onChange={(e) => handleDetailChange("staff_email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              {errors.staff_email && (
                <div className="input-error-message">{errors.staff_email}</div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.staff_tel ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.staff_tel ? "input-label-message" : ""}`} htmlFor="staff_tel">
                  Phone Number
                </label>
                <div className="form-wrapper">
                  <input
                    type="tel"
                    id="staff_tel"
                    className={`form-input form-input-no-padding ${errors.staff_tel ? "input-error" : ""}`}
                    value={staffDetails.staff_tel}
                    onChange={(e) => handleDetailChange("staff_tel", e.target.value)}
                    placeholder="e.g. +2348100000000"
                  />
                </div>
              </div>
              {errors.staff_tel && (
                <div className="input-error-message">{errors.staff_tel}</div>
              )}
            </div>
          </div>

          {/* Gender */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.gender ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.gender ? "input-label-message" : ""}`} htmlFor="gender">
                  Gender
                </label>
                <div className="form-wrapper">
                  <Select
                    options={GENDER_OPTIONS}
                    onChange={(opt) => handleDetailChange("gender", opt?.value || "")}
                    value={GENDER_OPTIONS.find((o) => o.value === staffDetails.gender) || null}
                    placeholder="Select Gender"
                    className={`form-input-select ${errors.gender ? "input-error" : ""}`}
                    classNamePrefix="form-input-select"
                    inputId="gender"
                    onMenuOpen={() => setOpenMenuId("gender")}
                    onMenuClose={() => setOpenMenuId(null)}
                  />
                  <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "gender" ? "chevron-rotate" : "", errors.gender ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                </div>
              </div>
              {errors.gender && (
                <div className="input-error-message">{errors.gender}</div>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.date_of_birth ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.date_of_birth ? "input-label-message" : ""}`} htmlFor="date_of_birth">
                  Date of Birth
                </label>
                <div className="form-wrapper">
                  <DatePicker
                    selected={staffDetails.date_of_birth}
                    onChange={(date) => handleDetailChange("date_of_birth", date)}
                    className={`form-input ${errors.date_of_birth ? "input-error" : ""}`}
                    dateFormat="yyyy-MM-dd"
                    wrapperClassName="input-date-picker"
                    id="date_of_birth"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <span className={`chevron-input-icon fas fa-calendar ${errors.date_of_birth ? "input-icon-error" : ""}`} />
                </div>
              </div>
              {errors.date_of_birth && (
                <div className="input-error-message">{errors.date_of_birth}</div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.staff_address ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.staff_address ? "input-label-message" : ""}`} htmlFor="staff_address">
                  Home Address
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="staff_address"
                    className={`form-input form-input-no-padding ${errors.staff_address ? "input-error" : ""}`}
                    value={staffDetails.staff_address}
                    onChange={(e) => handleDetailChange("staff_address", e.target.value)}
                    placeholder="Enter home address"
                  />
                </div>
              </div>
              {errors.staff_address && (
                <div className="input-error-message">{errors.staff_address}</div>
              )}
            </div>
          </div>

          {/* Job Title */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.job_title ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.job_title ? "input-label-message" : ""}`} htmlFor="job_title">
                  Job Title
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="job_title"
                    className={`form-input form-input-no-padding ${errors.job_title ? "input-error" : ""}`}
                    value={staffDetails.job_title}
                    onChange={(e) => handleDetailChange("job_title", e.target.value)}
                    placeholder="e.g. Accountant"
                  />
                </div>
              </div>
              {errors.job_title && (
                <div className="input-error-message">{errors.job_title}</div>
              )}
            </div>
          </div>

          {/* Date of Joining */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.date_of_joining ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.date_of_joining ? "input-label-message" : ""}`} htmlFor="date_of_joining">
                  Date of Joining
                </label>
                <div className="form-wrapper">
                  <DatePicker
                    selected={staffDetails.date_of_joining}
                    onChange={(date) => handleDetailChange("date_of_joining", date)}
                    className={`form-input ${errors.date_of_joining ? "input-error" : ""}`}
                    dateFormat="yyyy-MM-dd"
                    wrapperClassName="input-date-picker"
                    id="date_of_joining"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <span className={`chevron-input-icon fas fa-calendar ${errors.date_of_joining ? "input-icon-error" : ""}`} />
                </div>
              </div>
              {errors.date_of_joining && (
                <div className="input-error-message">{errors.date_of_joining}</div>
              )}
            </div>
          </div>

          {/* Pension Number */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group">
                <label className="input-form-label" htmlFor="pension_number">
                  Pension Number
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="pension_number"
                    className="form-input form-input-no-padding"
                    value={staffDetails.pension_number}
                    onChange={(e) => handleDetailChange("pension_number", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payee ID */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group">
                <label className="input-form-label" htmlFor="payee_id">
                  Payee ID
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="payee_id"
                    className="form-input form-input-no-padding"
                    value={staffDetails.payee_id}
                    onChange={(e) => handleDetailChange("payee_id", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Name */}
          <div className="invoice-form invoice-form-three">
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
                    value={staffDetails.bank_name}
                    onChange={(e) => handleDetailChange("bank_name", e.target.value)}
                    placeholder="e.g. First Bank"
                  />
                </div>
              </div>
              {errors.bank_name && (
                <div className="input-error-message">{errors.bank_name}</div>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.bank_account_number ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.bank_account_number ? "input-label-message" : ""}`} htmlFor="bank_account_number">
                  Account Number
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="bank_account_number"
                    className={`form-input form-input-no-padding ${errors.bank_account_number ? "input-error" : ""}`}
                    value={staffDetails.bank_account_number}
                    onChange={(e) => handleDetailChange("bank_account_number", e.target.value)}
                    placeholder="10-digit account number"
                  />
                </div>
              </div>
              {errors.bank_account_number && (
                <div className="input-error-message">{errors.bank_account_number}</div>
              )}
            </div>
          </div>

          {/* Account Name */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.bank_account_name ? "input-form-error" : ""}`}>
                <label className={`input-form-label ${errors.bank_account_name ? "input-label-message" : ""}`} htmlFor="bank_account_name">
                  Account Name
                </label>
                <div className="form-wrapper">
                  <input
                    type="text"
                    id="bank_account_name"
                    className={`form-input form-input-no-padding ${errors.bank_account_name ? "input-error" : ""}`}
                    value={staffDetails.bank_account_name}
                    onChange={(e) => handleDetailChange("bank_account_name", e.target.value)}
                    placeholder="Name on account"
                  />
                </div>
              </div>
              {errors.bank_account_name && (
                <div className="input-error-message">{errors.bank_account_name}</div>
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
                <span className="invoice-submit-btn-text">Update Staff</span>
              )}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default EditStaffForm;