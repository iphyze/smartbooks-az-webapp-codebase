import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useStaffStore from "../../stores/useStaffStore";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ─────────────────────────────────────────────
   Options
───────────────────────────────────────────── */
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

const GENERATE_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" }
];

/* ─────────────────────────────────────────────
   Create Staff Modal
───────────────────────────────────────────── */
const CreateStaffModal = ({ isOpen, onClose, onStaffCreated }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);
  const { createStaff, fetchNextStaffId, nextStaffId, fetchingStaffId } = useStaffStore();
  const { showToast } = useToastStore();

  const [isCreating, setIsCreating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [staffDetails, setStaffDetails] = useState({
    staff_name: "",
    staff_email: "",
    staff_tel: "",
    staff_address: "",
    date_of_birth: null,
    gender: "",
    job_title: "",
    date_of_joining: new Date(),
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    pension_number: "",
    payee_id: "",
    generate_staff: "No",
  });

  /* ── Effects ── */
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
      // Reset form
      setStaffDetails({
        staff_name: "", staff_email: "", staff_tel: "", staff_address: "",
        date_of_birth: null, gender: "", job_title: "", date_of_joining: new Date(),
        bank_name: "", bank_account_number: "", bank_account_name: "",
        pension_number: "", payee_id: "", generate_staff: "No",
      });
      setSubmitted(false);
      setIsCreating(false);
      fetchNextStaffId();
    }
  }, [isOpen, fetchNextStaffId]);

  /* ── Validation ── */
  const validateForm = () => {
    const e = {};
    if (!staffDetails.staff_name?.trim()) e.staff_name = "Required";
    if (!staffDetails.staff_email?.trim()) e.staff_email = "Required";
    if (!staffDetails.staff_tel?.trim()) e.staff_tel = "Required";
    if (!staffDetails.staff_address?.trim()) e.staff_address = "Required";
    if (!staffDetails.gender) e.gender = "Required";
    if (!staffDetails.date_of_birth) e.date_of_birth = "Required";
    if (!staffDetails.job_title?.trim()) e.job_title = "Required";
    if (!staffDetails.date_of_joining) e.date_of_joining = "Required";
    if (!staffDetails.bank_name?.trim()) e.bank_name = "Required";
    if (!staffDetails.bank_account_number?.trim()) e.bank_account_number = "Required";
    if (!staffDetails.bank_account_name?.trim()) e.bank_account_name = "Required";
    return e;
  };

  const errors = submitted ? validateForm() : {};

  /* ── Handlers ── */
  const handleDetailChange = (field, value) => {
    if (field === "staff_tel") {
      value = value.replace(/[^0-9+]/g, "");
      if (value.indexOf("+") > 0) value = value.replace(/\+/g, "");
      else if (value.indexOf("+") === 0) value = "+" + value.slice(1).replace(/\+/g, "");
    }
    setStaffDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!nextStaffId) {
      showToast("Staff ID is loading, please wait", "error");
      return;
    }

    setIsCreating(true);

    const payload = {
      staff_id: nextStaffId,
      ...staffDetails,
      date_of_birth: staffDetails.date_of_birth ? staffDetails.date_of_birth.toISOString().split("T")[0] : null,
      date_of_joining: staffDetails.date_of_joining ? staffDetails.date_of_joining.toISOString().split("T")[0] : null,
    };

    const result = await createStaff(payload);
    setIsCreating(false);

    if (result && result.success) {
      const newStaff = {
        staff_id: nextStaffId,
        staff_name: staffDetails.staff_name,
      };
      onStaffCreated(newStaff);
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
          <p className="modal-title">Create New Staff</p>
          <button className="modal-close-btn" onClick={onClose} disabled={isCreating}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body-scrollable">
          <div className="">
            <div className="modal-icon"><i className="fas fa-user-plus"></i></div>
            <p className="modal-text">Fill the form below to add a new staff member</p>
          </div>

          <div className="invoice-form-flex-box">
            {/* Staff ID */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group input-disabled">
                  <label className="input-form-label">Staff ID (Auto)</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className="form-input form-input-no-padding"
                      value={fetchingStaffId ? "Loading..." : nextStaffId || "---"}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.staff_name ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Full Name</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.staff_name ? "input-error" : ""}`}
                      value={staffDetails.staff_name}
                      onChange={(e) => handleDetailChange("staff_name", e.target.value)}
                      placeholder="Enter full name"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.staff_name && <div className="input-error-message">{errors.staff_name}</div>}
              </div>
            </div>

            {/* Email */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.staff_email ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Email Address</label>
                  <div className="form-wrapper">
                    <input
                      type="email"
                      className={`form-input form-input-no-padding ${errors.staff_email ? "input-error" : ""}`}
                      value={staffDetails.staff_email}
                      onChange={(e) => handleDetailChange("staff_email", e.target.value)}
                      placeholder="Enter email"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.staff_email && <div className="input-error-message">{errors.staff_email}</div>}
              </div>
            </div>

            {/* Phone */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.staff_tel ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Phone Number</label>
                  <div className="form-wrapper">
                    <input
                      type="tel"
                      className={`form-input form-input-no-padding ${errors.staff_tel ? "input-error" : ""}`}
                      value={staffDetails.staff_tel}
                      onChange={(e) => handleDetailChange("staff_tel", e.target.value)}
                      placeholder="+234..."
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.staff_tel && <div className="input-error-message">{errors.staff_tel}</div>}
              </div>
            </div>

            {/* Gender */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.gender ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Gender</label>
                  <div className="form-wrapper">
                    <Select
                      options={GENDER_OPTIONS}
                      onChange={(opt) => handleDetailChange("gender", opt?.value || "")}
                      value={GENDER_OPTIONS.find((o) => o.value === staffDetails.gender) || null}
                      className={`form-input-select ${errors.gender ? "input-error" : ""}`}
                      classNamePrefix="form-input-select"
                      onMenuOpen={() => setOpenMenuId("gender")}
                      onMenuClose={() => setOpenMenuId(null)}
                      isDisabled={isCreating}
                    />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "gender" ? "chevron-rotate" : "", errors.gender ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.gender && <div className="input-error-message">{errors.gender}</div>}
              </div>
            </div>

            {/* Date of Birth */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.date_of_birth ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Date of Birth</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={staffDetails.date_of_birth}
                      onChange={(date) => handleDetailChange("date_of_birth", date)}
                      className={`form-input ${errors.date_of_birth ? "input-error" : ""}`}
                      dateFormat="yyyy-MM-dd"
                      wrapperClassName="input-date-picker"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <span className={`chevron-input-icon fas fa-calendar ${errors.date_of_birth ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {errors.date_of_birth && <div className="input-error-message">{errors.date_of_birth}</div>}
              </div>
            </div>

            {/* Address */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.staff_address ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Home Address</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.staff_address ? "input-error" : ""}`}
                      value={staffDetails.staff_address}
                      onChange={(e) => handleDetailChange("staff_address", e.target.value)}
                      placeholder="Address"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.staff_address && <div className="input-error-message">{errors.staff_address}</div>}
              </div>
            </div>

            {/* Job Title */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.job_title ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Job Title</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.job_title ? "input-error" : ""}`}
                      value={staffDetails.job_title}
                      onChange={(e) => handleDetailChange("job_title", e.target.value)}
                      placeholder="e.g. Accountant"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.job_title && <div className="input-error-message">{errors.job_title}</div>}
              </div>
            </div>

            {/* Date of Joining */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.date_of_joining ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Date of Joining</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={staffDetails.date_of_joining}
                      onChange={(date) => handleDetailChange("date_of_joining", date)}
                      className={`form-input ${errors.date_of_joining ? "input-error" : ""}`}
                      dateFormat="yyyy-MM-dd"
                      wrapperClassName="input-date-picker"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <span className={`chevron-input-icon fas fa-calendar ${errors.date_of_joining ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {errors.date_of_joining && <div className="input-error-message">{errors.date_of_joining}</div>}
              </div>
            </div>

            {/* Bank Name */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.bank_name ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Bank Name</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.bank_name ? "input-error" : ""}`}
                      value={staffDetails.bank_name}
                      onChange={(e) => handleDetailChange("bank_name", e.target.value)}
                      placeholder="Bank"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.bank_name && <div className="input-error-message">{errors.bank_name}</div>}
              </div>
            </div>

            {/* Account Number */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.bank_account_number ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Account Number</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.bank_account_number ? "input-error" : ""}`}
                      value={staffDetails.bank_account_number}
                      onChange={(e) => handleDetailChange("bank_account_number", e.target.value)}
                      placeholder="Account Number"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.bank_account_number && <div className="input-error-message">{errors.bank_account_number}</div>}
              </div>
            </div>

            {/* Account Name */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.bank_account_name ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Account Name</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className={`form-input form-input-no-padding ${errors.bank_account_name ? "input-error" : ""}`}
                      value={staffDetails.bank_account_name}
                      onChange={(e) => handleDetailChange("bank_account_name", e.target.value)}
                      placeholder="Account Name"
                      disabled={isCreating}
                    />
                  </div>
                </div>
                {errors.bank_account_name && <div className="input-error-message">{errors.bank_account_name}</div>}
              </div>
            </div>

            {/* Pension Number (Optional) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group">
                  <label className="input-form-label">Pension Number (Opt)</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className="form-input form-input-no-padding"
                      value={staffDetails.pension_number}
                      onChange={(e) => handleDetailChange("pension_number", e.target.value)}
                      placeholder="Optional"
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payee ID (Optional) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group">
                  <label className="input-form-label">Payee ID (Opt)</label>
                  <div className="form-wrapper">
                    <input
                      type="text"
                      className="form-input form-input-no-padding"
                      value={staffDetails.payee_id}
                      onChange={(e) => handleDetailChange("payee_id", e.target.value)}
                      placeholder="Optional"
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Payroll Ledger */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${errors.generate_staff ? "input-form-error" : ""}`}>
                  <label className="input-form-label">Generate Payroll Ledger?</label>
                  <div className="form-wrapper">
                    <Select
                      options={GENERATE_OPTIONS}
                      onChange={(opt) => handleDetailChange("generate_staff", opt?.value || "")}
                      value={GENERATE_OPTIONS.find((o) => o.value === staffDetails.generate_staff) || null}
                      className={`form-input-select ${errors.generate_staff ? "input-error" : ""}`}
                      classNamePrefix="form-input-select"
                      onMenuOpen={() => setOpenMenuId("gen_staff")}
                      onMenuClose={() => setOpenMenuId(null)}
                      isDisabled={isCreating}
                    />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "gen_staff" ? "chevron-rotate" : "", errors.generate_staff ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {errors.generate_staff && <div className="input-error-message">{errors.generate_staff}</div>}
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isCreating}>Cancel</button>
          <button className="btn-update" onClick={handleConfirm} disabled={isCreating || fetchingStaffId}>
            {isCreating ? (<><i className="fas fa-spinner fa-spin" style={{ marginRight: "8px" }} />Creating...</>) : "Create Staff"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateStaffModal;