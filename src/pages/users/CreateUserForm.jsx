import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useUsersStore from "../../stores/useUsersStore";
import useTimesheetReferenceStore from "../../stores/useTimesheetReferenceStore";
import Select from "react-select";
import "../inputs-styles/Inputs.css";
import "./UserPasswordNotice.css";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Controller", label: "Controller" },
  { value: "Timesheet", label: "Timesheet" },
];

/* ─────────────────────────────────────────────────────────────────────────
   Field wrapper — defined at MODULE level so it is never recreated on
   render. If it were inside the parent component, React would treat it as
   a brand-new component every time state changes and unmount/remount the
   input, stealing focus after every keystroke.
───────────────────────────────────────────────────────────────────────── */
const Field = ({ id, label, required, error, children }) => (
  <div className="invoice-form invoice-form-three">
    <div className="input-form-wrapper">
      <div className={`input-form-group ${error ? "input-form-error" : ""}`}>
        <label
          className={`input-form-label ${error ? "input-label-message" : ""}`}
          htmlFor={id}
        >
          {label}{required && " *"}
        </label>
        {children}
      </div>
      {error && <div className="input-error-message">{error}</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   CreateUserForm
───────────────────────────────────────────────────────────────────────── */
const CreateUserForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { createUser } = useUsersStore();
  const { staff, searchStaff } = useTimesheetReferenceStore();
  const navigate = useNavigate();
  const temporaryPassword = `Consultancy@${new Date().getFullYear()}`;

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [form, setForm] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    integrity: "",
    staff_id: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (form.integrity === "Timesheet") searchStaff("");
  }, [form.integrity, searchStaff]);

  const staffOptions = useMemo(
    () => staff.map((item) => ({ value: item.staff_id, label: item.staff_name })),
    [staff]
  );

  const validateForm = useCallback(() => {
    const e = {};
    if (!form.fname.trim()) e.fname = "First name is required";
    if (!form.lname.trim()) e.lname = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.integrity) e.integrity = "Role is required";
    if (form.integrity === "Timesheet" && !form.staff_id) e.staff_id = "Assign a staff profile for Timesheet access";
    return e;
  }, [form]);

  const errors = useMemo(
    () => (submitted ? validateForm() : {}),
    [submitted, validateForm]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsLoading(true);
    const result = await createUser(form);
    setIsLoading(false);

    if (result?.success) {
      setSubmitted(false);
      navigate("/users/home");
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`invoice-form-box theme-${theme}`}
    >
      <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
        <div className="invoice-form-header">
          <div className="invoice-form-htxt">Add New User</div>
          <div className="invoice-form-sub-htxt">
            Add the account details. Smartbooks will assign the current temporary password automatically.
          </div>
        </div>

        <div className={`user-password-notice theme-${theme}`}>
          <div className="user-password-notice-icon">
            <i className="fas fa-key" />
          </div>
          <div className="user-password-notice-copy">
            <span className="user-password-notice-label">Temporary sign-in password</span>
            <strong>{temporaryPassword}</strong>
            <p>
              Share this password securely with the new user. They will be required to create
              a private password immediately after their first sign-in.
            </p>
          </div>
        </div>

        <div className="invoice-form-details-box">
          {/* First Name */}
          <Field id="fname" label="First Name" required error={errors.fname}>
            <div className="form-wrapper">
              <input
                id="fname"
                type="text"
                className={`form-input form-input-no-padding ${errors.fname ? "input-error" : ""}`}
                value={form.fname}
                onChange={(e) => handleChange("fname", e.target.value)}
                placeholder="e.g. John"
              />
            </div>
          </Field>

          {/* Last Name */}
          <Field id="lname" label="Last Name" required error={errors.lname}>
            <div className="form-wrapper">
              <input
                id="lname"
                type="text"
                className={`form-input form-input-no-padding ${errors.lname ? "input-error" : ""}`}
                value={form.lname}
                onChange={(e) => handleChange("lname", e.target.value)}
                placeholder="e.g. Doe"
              />
            </div>
          </Field>

          {/* Email */}
          <Field id="email" label="Email Address" required error={errors.email}>
            <div className="form-wrapper">
              <input
                id="email"
                type="email"
                className={`form-input form-input-no-padding ${errors.email ? "input-error" : ""}`}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g. john@example.com"
              />
            </div>
          </Field>

          {/* Phone */}
          <Field id="phone" label="Phone Number" error={errors.phone}>
            <div className="form-wrapper">
              <input
                id="phone"
                type="text"
                className="form-input form-input-no-padding"
                value={form.phone}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9+]/g, "");
                  if (v.indexOf("+") > 0) v = v.replace(/\+/g, "");
                  handleChange("phone", v);
                }}
                placeholder="e.g. +2348012345678"
              />
            </div>
          </Field>

          {/* Role */}
          <Field id="integrity" label="Role" required error={errors.integrity}>
            <div className="form-wrapper">
              <Select
                options={ROLE_OPTIONS}
                onChange={(opt) => {
                  const role = opt?.value || "";
                  setForm((prev) => ({ ...prev, integrity: role, staff_id: role === "Timesheet" ? prev.staff_id : "" }));
                }}
                value={ROLE_OPTIONS.find((o) => o.value === form.integrity) || null}
                placeholder="Select role"
                className={`form-input-select ${errors.integrity ? "input-error" : ""}`}
                classNamePrefix="form-input-select"
                inputId="integrity"
                onMenuOpen={() => setOpenMenuId("integrity")}
                onMenuClose={() => setOpenMenuId(null)}
              />
              <span
                className={[
                  "chevron-input-icon fas fa-chevron-down",
                  openMenuId === "integrity" ? "chevron-rotate" : "",
                  errors.integrity ? "input-icon-error" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </div>
          </Field>

          {form.integrity === "Timesheet" && (
            <Field id="staff_id" label="Linked Staff Profile" required error={errors.staff_id}>
              <div className="form-wrapper">
                <Select
                  options={staffOptions}
                  onInputChange={(value) => searchStaff(value.length > 1 ? value : "")}
                  onChange={(opt) => handleChange("staff_id", opt?.value || "")}
                  value={staffOptions.find((option) => String(option.value) === String(form.staff_id)) || null}
                  placeholder="Select the staff account this user owns"
                  className={`form-input-select ${errors.staff_id ? "input-error" : ""}`}
                  classNamePrefix="form-input-select"
                  inputId="staff_id"
                  isClearable
                />
              </div>
            </Field>
          )}
        </div>

        <div className="invoice-action-btn main-submit-action-btn">
          <div className="invoice-action-btn-wrapper">
            <button
              type="button"
              className="invoice-cancel-btn"
              onClick={() => navigate("/users/home")}
            >
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="invoice-submit-btn">
              {isLoading ? (
                <div className="invoice-loader" />
              ) : (
                <span className="invoice-submit-btn-text">Create User</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CreateUserForm;