import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useAuthStore from "../../stores/useAuthStore";
import usePermissionsStore from "../../stores/usePermissionsStore";
import useToastStore from "../../stores/useToastStore";
import useUsersStore from "../../stores/useUsersStore";
import useTimesheetReferenceStore from "../../stores/useTimesheetReferenceStore";
import useCostCenterOptions from "../../hooks/useCostCenterOptions";
import { canManagePermissionTarget, hasPermission, isSuperAdmin } from "../../utils/permissions";
import UserPermissionMatrix from "./UserPermissionMatrix";
import Select from "react-select";
import "../inputs-styles/Inputs.css";
import "./UserPasswordNotice.css";
import "./UserCostCentreAccess.css";
import "./UserPermissionMatrix.css";

const ACCESS_MODE_OPTIONS = [
  { value: "all", label: "All Cost Centres" },
  { value: "restricted", label: "Restricted Cost Centres" },
];

const roleOptionFromUser = (user) => ({
  value: user?.integrity || "User",
  label: user?.rbac_role_name || user?.integrity || "User",
  code: user?.rbac_role_code || "user",
  permissions: Array.isArray(user?.permissions) ? user.permissions : [],
});

/* ─────────────────────────────────────────────────────────────────────────
   Field wrapper — defined at MODULE level so React never unmounts/remounts
   inputs on re-render, which would steal focus after every keystroke.
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
   EditUserForm
───────────────────────────────────────────────────────────────────────── */
const EditUserForm = ({ userId, user, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const { updateUser } = useUsersStore();
  const {
    catalogue: permissionCatalogue,
    roles: permissionRoles,
    loading: permissionsLoading,
    error: permissionsError,
    loadConfiguration,
  } = usePermissionsStore();
  const { staff, searchStaff } = useTimesheetReferenceStore();
  const { options: costCenterOptions, loading: costCentersLoading, error: costCentersError } = useCostCenterOptions();
  const navigate = useNavigate();
  const temporaryPassword = `Consultancy@${new Date().getFullYear()}`;

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [form, setForm] = useState({
    id: "",
    fname: "",
    lname: "",
    email: "",
    phone: "",
    integrity: "",
    staff_id: "",
    cost_center_access_mode: "all",
    cost_center_ids: [],
    permissions: [],
    resetPassword: false,
  });

  const targetIsSuperAdmin = isSuperAdmin(user);
  const isSelf = String(currentUser?.id || "") === String(user?.id || userId || "");
  const canManageTargetAccount = canManagePermissionTarget(currentUser, user);
  const canManagePermissions = hasPermission(currentUser, "user.manage_permissions");
  const canCustomizePermissions = canManagePermissions && canManageTargetAccount && !targetIsSuperAdmin && !isSelf;

  const grantablePermissions = useMemo(() => {
    if (isSuperAdmin(currentUser)) {
      return permissionCatalogue.flatMap((module) => (module.permissions || []).map((permission) => permission.code));
    }
    return Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  }, [currentUser, permissionCatalogue]);

  const roleOptions = useMemo(() => {
    const currentOption = roleOptionFromUser(user);
    if (!canCustomizePermissions) return [currentOption];

    const grantableSet = new Set(grantablePermissions);
    const options = permissionRoles
      .filter((role) => !role.is_super_admin)
      .filter((role) => isSuperAdmin(currentUser) || (role.permissions || []).every((code) => grantableSet.has(code)))
      .map((role) => ({
        value: role.name,
        label: role.name,
        code: role.code,
        permissions: role.permissions || [],
      }));

    if (currentOption.value && !options.some((option) => option.value === currentOption.value)) {
      options.unshift(currentOption);
    }
    return options;
  }, [canCustomizePermissions, currentUser, grantablePermissions, permissionRoles, user]);

  const selectedRole = useMemo(
    () => roleOptions.find((role) => role.value === form.integrity) || roleOptionFromUser(user),
    [form.integrity, roleOptions, user]
  );

  useEffect(() => {
    if (!user) return;
    setForm({
      id: user.id ?? "",
      fname: user.fname ?? "",
      lname: user.lname ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      integrity: user.integrity ?? "",
      staff_id: user.staff_id ?? "",
      cost_center_access_mode: String(user.cost_center_access_mode || "all").toLowerCase(),
      cost_center_ids: Array.isArray(user.cost_centers) ? user.cost_centers.map((item) => Number(item.id)).filter(Boolean) : [],
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      resetPassword: false,
    });
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (canManagePermissions) loadConfiguration();
  }, [canManagePermissions, loadConfiguration]);

  useEffect(() => {
    if (form.integrity === "Timesheet") searchStaff("", "user_admin");
  }, [form.integrity, searchStaff]);

  const staffOptions = useMemo(() => {
    const options = staff.map((item) => ({ value: item.staff_id, label: item.staff_name }));
    if (form.staff_id && user?.linked_staff_name && !options.some((option) => String(option.value) === String(form.staff_id))) {
      options.unshift({ value: form.staff_id, label: user.linked_staff_name });
    }
    return options;
  }, [staff, form.staff_id, user]);

  const validateForm = useCallback(() => {
    const e = {};
    if (!form.fname.trim()) e.fname = "First name is required";
    if (!form.lname.trim()) e.lname = "Last name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.integrity) e.integrity = "Role is required";
    if (form.integrity === "Timesheet" && !form.staff_id) e.staff_id = "Assign a staff profile for Timesheet access";
    if (form.integrity !== "Timesheet" && form.cost_center_access_mode === "restricted" && form.cost_center_ids.length === 0) {
      e.cost_center_ids = "Select at least one cost centre for restricted access";
    }
    return e;
  }, [form]);

  const errors = useMemo(
    () => (submitted ? validateForm() : {}),
    [submitted, validateForm]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!canManageTargetAccount) {
      showToast("You cannot edit an account whose permissions exceed your own access", "error");
      return;
    }

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      showToast("Please fill in all required fields correctly", "error");
      return;
    }

    setIsLoading(true);

    const payload = {
      id: form.id,
      fname: form.fname,
      lname: form.lname,
      email: form.email,
      phone: form.phone,
      integrity: form.integrity,
      staff_id: form.integrity === "Timesheet" ? form.staff_id : null,
      cost_center_access_mode: form.integrity === "Timesheet" ? "all" : form.cost_center_access_mode,
      cost_center_ids: form.integrity === "Timesheet" ? [] : form.cost_center_ids,
      reset_password: form.resetPassword,
    };
    if (canCustomizePermissions) payload.permissions = form.permissions;

    const result = await updateUser(payload);
    setIsLoading(false);

    if (result?.success) {
      setSubmitted(false);
      if (onSaveSuccess) onSaveSuccess();
      else navigate("/users/home");
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
          <div className="invoice-form-htxt">Edit User</div>
          <div className="invoice-form-sub-htxt">Update user account details below</div>
        </div>

        <div className="invoice-form-details-box">
          {/* User ID (read-only) */}
          <div className="invoice-form invoice-form-three">
            <div className="input-form-wrapper">
              <div className="input-form-group">
                <label className="input-form-label" htmlFor="id">User ID</label>
                <div className="form-wrapper">
                  <input
                    id="id"
                    type="text"
                    className="form-input form-input-no-padding"
                    value={form.id}
                    readOnly
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  />
                </div>
              </div>
            </div>
          </div>

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
                options={roleOptions}
                onChange={(opt) => {
                  const role = opt?.value || "";
                  const roleDefinition = roleOptions.find((item) => item.value === role);
                  setForm((prev) => ({
                    ...prev,
                    integrity: role,
                    staff_id: role === "Timesheet" ? prev.staff_id : "",
                    cost_center_access_mode: role === "Timesheet" ? "all" : prev.cost_center_access_mode,
                    cost_center_ids: role === "Timesheet" ? [] : prev.cost_center_ids,
                    permissions: canCustomizePermissions ? (roleDefinition?.permissions || []) : prev.permissions,
                  }));
                }}
                value={selectedRole}
                placeholder="Select role"
                isLoading={canManagePermissions && permissionsLoading}
                isDisabled={!canCustomizePermissions}
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
                  onInputChange={(value) => searchStaff(value.length > 1 ? value : "", "user_admin")}
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



          {form.integrity && form.integrity !== "Timesheet" && (
            <section className="user-cost-centre-access" aria-label="Cost centre access">
              <div className="user-cost-centre-access__heading">
                <span className="user-cost-centre-access__icon"><i className="fas fa-layer-group" /></span>
                <div>
                  <h3>Cost Centre Data Access</h3>
                  <p>
                    Choose whether this account can see the whole company or only transactions and reports for selected divisions.
                  </p>
                </div>
              </div>

              <div className="user-cost-centre-access__grid">
                <div className="user-cost-centre-access__field">
                  <label htmlFor="cost_center_access_mode">Access scope *</label>
                  <div className="form-wrapper">
                    <Select
                      options={ACCESS_MODE_OPTIONS}
                      value={ACCESS_MODE_OPTIONS.find((option) => option.value === form.cost_center_access_mode) || ACCESS_MODE_OPTIONS[0]}
                      onChange={(option) => setForm((prev) => ({
                        ...prev,
                        cost_center_access_mode: option?.value || "all",
                        cost_center_ids: option?.value === "restricted" ? prev.cost_center_ids : [],
                      }))}
                      className="form-input-select"
                      classNamePrefix="form-input-select"
                      inputId="cost_center_access_mode"
                      isSearchable={false}
                    />
                  </div>
                  <p className="user-cost-centre-access__help">
                    Changing this setting is a security change and revokes the user&apos;s active sessions.
                  </p>
                </div>

                <div className="user-cost-centre-access__field">
                  <label htmlFor="cost_center_ids">Assigned cost centres{form.cost_center_access_mode === "restricted" ? " *" : ""}</label>
                  {form.cost_center_access_mode === "restricted" ? (
                    costCentersLoading ? (
                      <div className="user-cost-centre-access__loading">Loading cost centres…</div>
                    ) : costCentersError ? (
                      <div className="user-cost-centre-access__notice">{costCentersError}</div>
                    ) : (
                      <>
                        <div className="form-wrapper">
                          <Select
                            isMulti
                            closeMenuOnSelect={false}
                            options={costCenterOptions}
                            value={costCenterOptions.filter((option) => form.cost_center_ids.includes(option.id))}
                            onChange={(selected) => handleChange("cost_center_ids", (selected || []).map((option) => option.id))}
                            placeholder="Select one or more cost centres"
                            className={`form-input-select ${errors.cost_center_ids ? "input-error" : ""}`}
                            classNamePrefix="form-input-select"
                            inputId="cost_center_ids"
                            noOptionsMessage={() => "No cost centres available"}
                          />
                        </div>
                        {errors.cost_center_ids && <div className="user-cost-centre-access__error">{errors.cost_center_ids}</div>}
                      </>
                    )
                  ) : (
                    <div className="user-cost-centre-access__notice">
                      This user can access transactions and reports across all cost centres.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {!canManageTargetAccount && user && (
            <div className="user-permission-matrix__state user-permission-matrix__state--error">
              This account has permissions outside your own access. You can view it, but you cannot edit it.
            </div>
          )}

          {canManagePermissions && !targetIsSuperAdmin && !isSelf && form.integrity && (
            <UserPermissionMatrix
              catalogue={permissionCatalogue}
              selectedPermissions={form.permissions}
              rolePermissions={selectedRole?.permissions || []}
              grantablePermissions={grantablePermissions}
              onChange={(permissions) => handleChange("permissions", permissions)}
              loading={permissionsLoading}
              error={permissionsError || ""}
            />
          )}

          {targetIsSuperAdmin && (
            <div className="user-permission-matrix__state">
              <strong>Super Admin access is automatic.</strong> Permission checkboxes do not apply to this account.
            </div>
          )}

          {canManagePermissions && isSelf && !targetIsSuperAdmin && (
            <div className="user-permission-matrix__state">
              Your own role and permission matrix cannot be changed from User Administration.
            </div>
          )}

          <div className="invoice-form user-password-reset-span">
            {user?.email?.toLowerCase() === "admin@a-zconsultancyltd.com" ? (
              <div className={`user-password-notice user-password-notice--protected theme-${theme}`}>
                <div className="user-password-notice-icon">
                  <i className="fas fa-shield-halved" />
                </div>
                <div className="user-password-notice-copy">
                  <span className="user-password-notice-label">Primary Admin User</span>
                  <strong>Password reset protected</strong>
                  <p>
                    The primary Admin User is excluded from the shared temporary-password reset.
                    It can still change its own password from My Profile.
                  </p>
                </div>
              </div>
            ) : (
              <label className={`user-password-reset-card theme-${theme}`}>
                <input
                  type="checkbox"
                  checked={form.resetPassword}
                  onChange={(event) => handleChange("resetPassword", event.target.checked)}
                />
                <span className="user-password-reset-check">
                  <i className="fas fa-check" />
                </span>
                <span className="user-password-reset-content">
                  <span className="user-password-notice-label">Optional password reset</span>
                  <strong>Reset to {temporaryPassword}</strong>
                  <small>
                    Active sessions will be revoked. At the next sign-in, this user must create
                    a new private password before accessing Smartbooks.
                  </small>
                </span>
                <span className="user-password-reset-icon">
                  <i className="fas fa-rotate" />
                </span>
              </label>
            )}
          </div>
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
            <button type="submit" disabled={isLoading || !canManageTargetAccount} className="invoice-submit-btn">
              {isLoading ? (
                <div className="invoice-loader" />
              ) : (
                <span className="invoice-submit-btn-text">Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default EditUserForm;