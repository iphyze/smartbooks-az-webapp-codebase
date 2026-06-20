import React, { useEffect, useState, useMemo, useCallback } from "react";
import NavBar from "../NavBar";
import Header from "../Header";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useAuthStore from "../../stores/useAuthStore";
import useUsersStore from "../../stores/useUsersStore";
import useToastStore from "../../stores/useToastStore";
import PageNav from "../../components/PageNav";
import "../inputs-styles/Inputs.css";

const ROLE_COLORS = {
  Admin: { color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  Controller: { color: "#0891b2", bg: "rgba(8,145,178,0.12)" },
  Timesheet: { color: "#059669", bg: "rgba(5,150,105,0.12)" },
};

/* ─────────────────────────────────────────────────────────────────────────
   Field wrapper at MODULE level — prevents React from unmounting/remounting
   inputs on every state change, which would steal focus after each keystroke.
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
   MyProfile
───────────────────────────────────────────────────────────────────────── */
const MyProfile = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const { updateProfile } = useUsersStore();
  const { showToast } = useToastStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pwSubmitted, setPwSubmitted] = useState(false);

  const [form, setForm] = useState({ fname: "", lname: "", phone: "" });
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "My Profile", to: "/users/my-profile", active: false },
  ];

  useEffect(() => {
    document.title = "Smartbooks | My Profile";
    if (currentUser) {
      setForm({
        fname: currentUser.fname || "",
        lname: currentUser.lname || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handlePwChange = (field, value) => setPwForm((p) => ({ ...p, [field]: value }));

  const validateProfile = useCallback(() => {
    const e = {};
    if (!form.fname.trim()) e.fname = "First name is required";
    if (!form.lname.trim()) e.lname = "Last name is required";
    return e;
  }, [form]);

  const validatePassword = useCallback(() => {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = "Current password is required";
    if (!pwForm.newPassword) e.newPassword = "New password is required";
    else if (pwForm.newPassword.length < 12) e.newPassword = "Must be at least 12 characters";
    else if (pwForm.newPassword === pwForm.currentPassword)
      e.newPassword = "New password must be different from your current password";
    else if (/^Consultancy@\d{4}$/i.test(pwForm.newPassword))
      e.newPassword = "Choose a personal password, not a Consultancy temporary password";
    if (!pwForm.confirmPassword) e.confirmPassword = "Please confirm your new password";
    else if (pwForm.newPassword !== pwForm.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  }, [pwForm]);

  const profileErrors = useMemo(
    () => (submitted ? validateProfile() : {}),
    [submitted, validateProfile]
  );
  const pwErrors = useMemo(
    () => (pwSubmitted ? validatePassword() : {}),
    [pwSubmitted, validatePassword]
  );

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    setIsLoading(true);
    const result = await updateProfile({
      user_id: currentUser?.user_id,
      fname: form.fname,
      lname: form.lname,
      phone: form.phone,
    });
    setIsLoading(false);
    if (result?.success) setSubmitted(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwSubmitted(true);
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      showToast("Please fix the errors above", "error");
      return;
    }
    setIsLoading(true);
    const result = await updateProfile({
      user_id: currentUser?.user_id,
      currentPassword: pwForm.currentPassword,
      password: pwForm.newPassword,
    });
    setIsLoading(false);
    if (result?.success) {
      setPwSubmitted(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  const roleStyle =
    ROLE_COLORS[currentUser?.integrity] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };

  const initials = currentUser
    ? `${currentUser.fname?.[0] || ""}${currentUser.lname?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page">
            <PageNav pageTitle="My Profile" links={links} />

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              {/* ── Avatar / Identity Card ── */}
              <div className={`invoice-section theme-${theme}`} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg, #7c3aed, #5240B8)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 24, fontFamily: "Montserrat-SemiBold",
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontFamily: "Montserrat-SemiBold", fontSize: 18 }}>
                      {currentUser?.fname} {currentUser?.lname}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>
                      {currentUser?.email}
                    </div>
                    <span
                      style={{
                        display: "inline-block", marginTop: 6, padding: "2px 12px",
                        borderRadius: 20, fontSize: 11, fontFamily: "Montserrat-SemiBold",
                        color: roleStyle.color, background: roleStyle.bg,
                      }}
                    >
                      {currentUser?.integrity || "User"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Profile Details Form ── */}
              <div className={`invoice-form-box theme-${theme}`} style={{ marginBottom: 20 }}>
                <form
                  className="invoice-form-f-container"
                  onSubmit={handleProfileSubmit}
                  noValidate
                >
                  <div className="invoice-form-header">
                    <div className="invoice-form-htxt">Personal Information</div>
                    <div className="invoice-form-sub-htxt">
                      Update your name and contact details
                    </div>
                  </div>

                  <div className="invoice-form-details-box">
                    {/* Email (read-only) */}
                    <div className="invoice-form invoice-form-three">
                      <div className="input-form-wrapper">
                        <div className="input-form-group">
                          <label className="input-form-label">Email Address</label>
                          <div className="form-wrapper">
                            <input
                              type="email"
                              className="form-input form-input-no-padding"
                              value={currentUser?.email || ""}
                              readOnly
                              style={{ opacity: 0.6, cursor: "not-allowed" }}
                            />
                          </div>
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, paddingLeft: 2 }}>
                          Email cannot be changed. Contact an Admin if needed.
                        </div>
                      </div>
                    </div>

                    <Field id="fname" label="First Name" required error={profileErrors.fname}>
                      <div className="form-wrapper">
                        <input
                          id="fname"
                          type="text"
                          className={`form-input form-input-no-padding ${profileErrors.fname ? "input-error" : ""}`}
                          value={form.fname}
                          onChange={(e) => handleChange("fname", e.target.value)}
                          placeholder="First name"
                        />
                      </div>
                    </Field>

                    <Field id="lname" label="Last Name" required error={profileErrors.lname}>
                      <div className="form-wrapper">
                        <input
                          id="lname"
                          type="text"
                          className={`form-input form-input-no-padding ${profileErrors.lname ? "input-error" : ""}`}
                          value={form.lname}
                          onChange={(e) => handleChange("lname", e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                    </Field>

                    <Field id="phone" label="Phone Number" error={profileErrors.phone}>
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
                  </div>

                  <div className="invoice-action-btn main-submit-action-btn">
                    <div className="invoice-action-btn-wrapper">
                      <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                        {isLoading ? (
                          <div className="invoice-loader" />
                        ) : (
                          <span className="invoice-submit-btn-text">Save Profile</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* ── Change Password Form ── */}
              <div className={`invoice-form-box theme-${theme}`}>
                <form
                  className="invoice-form-f-container"
                  onSubmit={handlePasswordSubmit}
                  noValidate
                >
                  <div className="invoice-form-header">
                    <div className="invoice-form-htxt">Change Password</div>
                    <div className="invoice-form-sub-htxt">
                      Confirm your current password before creating a new one
                    </div>
                  </div>

                  <div className="invoice-form-details-box">
                    <Field
                      id="currentPassword"
                      label="Current Password"
                      required
                      error={pwErrors.currentPassword}
                    >
                      <div className="form-wrapper">
                        <input
                          id="currentPassword"
                          type="password"
                          className={`form-input form-input-no-padding ${pwErrors.currentPassword ? "input-error" : ""}`}
                          value={pwForm.currentPassword}
                          onChange={(e) => handlePwChange("currentPassword", e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                    </Field>

                    <Field
                      id="newPassword"
                      label="New Password"
                      required
                      error={pwErrors.newPassword}
                    >
                      <div className="form-wrapper">
                        <input
                          id="newPassword"
                          type="password"
                          className={`form-input form-input-no-padding ${pwErrors.newPassword ? "input-error" : ""}`}
                          value={pwForm.newPassword}
                          onChange={(e) => handlePwChange("newPassword", e.target.value)}
                          placeholder="Min. 12 characters"
                        />
                      </div>
                    </Field>

                    <Field
                      id="confirmPassword"
                      label="Confirm New Password"
                      required
                      error={pwErrors.confirmPassword}
                    >
                      <div className="form-wrapper">
                        <input
                          id="confirmPassword"
                          type="password"
                          className={`form-input form-input-no-padding ${pwErrors.confirmPassword ? "input-error" : ""}`}
                          value={pwForm.confirmPassword}
                          onChange={(e) => handlePwChange("confirmPassword", e.target.value)}
                          placeholder="Re-enter new password"
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="invoice-action-btn main-submit-action-btn">
                    <div className="invoice-action-btn-wrapper">
                      <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                        {isLoading ? (
                          <div className="invoice-loader" />
                        ) : (
                          <span className="invoice-submit-btn-text">Update Password</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;