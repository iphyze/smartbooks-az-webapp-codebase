import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useUsersStore from "../../stores/useUsersStore";
import useToastStore from "../../stores/useToastStore";
import useThemeStore from "../../stores/useThemeStore";
import LogoLight from "../../assets/images/smartbooks/smartbooks.png";
import LogoDark from "../../assets/images/smartbooks/smartbooks_dark.png";
import "./ChangePassword.css";

const PasswordField = ({
  id,
  label,
  field,
  visible,
  value,
  error,
  isValid,
  autoComplete,
  placeholder,
  onChange,
  onToggle,
}) => (
  <div
    className={`sb-change-field ${error ? "sb-change-field--error" : ""} ${
      isValid ? "sb-change-field--valid" : ""
    }`}
  >
    <label className="sb-change-label" htmlFor={id}>{label}</label>
    <div className="sb-change-input-wrap">
      <i className="fas fa-lock sb-change-input-icon" aria-hidden="true" />
      <input
        id={id}
        name={id}
        className="sb-change-input"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="sb-change-toggle-password"
        onClick={onToggle}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        <i className={`fas ${visible ? "fa-eye-slash" : "fa-eye"}`} />
      </button>
    </div>
    {error && (
      <p className="sb-change-error">
        <i className="fas fa-triangle-exclamation" /> {error}
      </p>
    )}
  </div>
);

const securitySteps = [
  {
    number: "01",
    icon: "fa-key",
    title: "Confirm your temporary password",
    copy: "Use the password that gave you access to this session.",
  },
  {
    number: "02",
    icon: "fa-user-shield",
    title: "Create a private password",
    copy: "Choose at least 12 characters that only you know.",
  },
  {
    number: "03",
    icon: "fa-arrow-right-to-bracket",
    title: "Sign in securely",
    copy: "Use your new password when you return to Smartbooks.",
  },
];

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { updateProfile } = useUsersStore();
  const { showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isDark = theme === "dark";
  const firstName = user?.fname || user?.first_name || "there";

  useEffect(() => {
    setMounted(true);
    document.title = "Smartbooks | Change Password";
  }, []);

  const passwordChecks = useMemo(() => ({
    longEnough: form.newPassword.length >= 12,
    different: Boolean(form.newPassword) && form.newPassword !== form.currentPassword,
    privatePassword: Boolean(form.newPassword) && !/^Consultancy@\d{4}$/i.test(form.newPassword),
    passwordsMatch:
      Boolean(form.confirmPassword) && form.newPassword === form.confirmPassword,
  }), [form]);

  const errors = useMemo(() => {
    if (!submitted) return {};

    const nextErrors = {};
    if (!form.currentPassword) {
      nextErrors.currentPassword = "Enter the temporary password you used to sign in";
    }

    if (!form.newPassword) {
      nextErrors.newPassword = "Create a new password";
    } else if (!passwordChecks.longEnough) {
      nextErrors.newPassword = "Your new password must be at least 12 characters";
    } else if (!passwordChecks.different) {
      nextErrors.newPassword = "Your new password must be different from the temporary password";
    } else if (!passwordChecks.privatePassword) {
      nextErrors.newPassword = "Choose a personal password, not a Consultancy temporary password";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password";
    } else if (!passwordChecks.passwordsMatch) {
      nextErrors.confirmPassword = "The passwords do not match";
    }

    return nextErrors;
  }, [form, passwordChecks, submitted]);

  const isFormReady = Boolean(form.currentPassword)
    && passwordChecks.longEnough
    && passwordChecks.different
    && passwordChecks.privatePassword
    && passwordChecks.passwordsMatch;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!isFormReady) {
      showToast("Please correct the highlighted password fields", "error");
      return;
    }

    setIsLoading(true);
    const result = await updateProfile({
      currentPassword: form.currentPassword,
      password: form.newPassword,
    });
    setIsLoading(false);

    if (result?.success) {
      navigate("/login", { replace: true });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const ruleItems = [
    { label: "At least 12 characters", passed: passwordChecks.longEnough },
    { label: "Different from temporary password", passed: passwordChecks.different },
    { label: "Not a Consultancy shared password", passed: passwordChecks.privatePassword },
    { label: "Both new passwords match", passed: passwordChecks.passwordsMatch },
  ];

  return (
    <div className={`sb-change-root ${isDark ? "sb-dark" : "sb-light"} ${mounted ? "sb-change-mounted" : ""}`}>
      <div className="sb-change-bg-grid" aria-hidden="true" />
      <div className="sb-change-bg-orb sb-change-bg-orb-one" aria-hidden="true" />
      <div className="sb-change-bg-orb sb-change-bg-orb-two" aria-hidden="true" />

      <div className="sb-change-shell">
        <aside className="sb-change-hero">
          <div className="sb-change-hero-pattern" aria-hidden="true" />
          <div className="sb-change-hero-inner">
            <img
              src={LogoDark}
              alt="Smartbooks Accounting"
              className="sb-change-logo"
              onError={(event) => { event.currentTarget.src = LogoLight; }}
            />

            <div className="sb-change-product-pill">
              <span className="sb-change-product-dot" />
              First sign-in account security
            </div>

            <div className="sb-change-tagline">
              <span>Secure your access.</span>
              <span className="sb-change-tagline-accent">Keep control.</span>
            </div>

            <p className="sb-change-hero-description">
              Hello {firstName}. Replace the temporary password with one that belongs only to you before entering your workspace.
            </p>

            <div className="sb-change-step-list">
              {securitySteps.map((step, index) => (
                <div
                  className="sb-change-step"
                  key={step.number}
                  style={{ transitionDelay: `${0.32 + index * 0.08}s` }}
                >
                  <div className="sb-change-step-number">{step.number}</div>
                  <div className="sb-change-step-icon">
                    <i className={`fas ${step.icon}`} />
                  </div>
                  <div>
                    <p className="sb-change-step-title">{step.title}</p>
                    <p className="sb-change-step-copy">{step.copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="sb-change-assurance">
              <i className="fas fa-shield-halved" />
              <span>Your password is encrypted and is never visible to administrators.</span>
            </div>
          </div>
        </aside>

        <main className="sb-change-main">
          <div className="sb-change-top-actions">
            <button
              type="button"
              className="sb-change-action-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} />
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>
            <button
              type="button"
              className="sb-change-action-btn sb-change-signout-btn"
              onClick={handleLogout}
            >
              <i className="fas fa-arrow-right-from-bracket" />
              <span>Sign out</span>
            </button>
          </div>

          <section className="sb-change-card" aria-label="Change temporary password">
            <header className="sb-change-card-header">
              <div className="sb-change-secure-chip">
                <i className="fas fa-shield-halved" /> Required security step
              </div>
              <h1 className="sb-change-title">Create your new password</h1>
              <p className="sb-change-subtitle">
                Complete this one-time update to continue to Smartbooks.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="sb-change-form">
              <PasswordField
                id="currentPassword"
                label="Temporary password"
                field="currentPassword"
                visible={show.current}
                value={form.currentPassword}
                error={errors.currentPassword}
                isValid={Boolean(form.currentPassword) && !errors.currentPassword}
                autoComplete="current-password"
                placeholder="Enter your temporary password"
                onChange={updateField}
                onToggle={() => setShow((current) => ({ ...current, current: !current.current }))}
              />

              <PasswordField
                id="newPassword"
                label="New password"
                field="newPassword"
                visible={show.next}
                value={form.newPassword}
                error={errors.newPassword}
                isValid={
                  passwordChecks.longEnough
                  && passwordChecks.different
                  && passwordChecks.privatePassword
                }
                autoComplete="new-password"
                placeholder="Create a private password"
                onChange={updateField}
                onToggle={() => setShow((current) => ({ ...current, next: !current.next }))}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm new password"
                field="confirmPassword"
                visible={show.confirm}
                value={form.confirmPassword}
                error={errors.confirmPassword}
                isValid={passwordChecks.passwordsMatch}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                onChange={updateField}
                onToggle={() => setShow((current) => ({ ...current, confirm: !current.confirm }))}
              />

              <div className="sb-change-rules" aria-label="Password requirements">
                <div className="sb-change-rules-heading">
                  <i className="fas fa-circle-info" />
                  <span>Your new password must meet these requirements</span>
                </div>
                <div className="sb-change-rules-grid">
                  {ruleItems.map((rule) => (
                    <div
                      className={`sb-change-rule ${rule.passed ? "sb-change-rule--passed" : ""}`}
                      key={rule.label}
                    >
                      <i className={`fas ${rule.passed ? "fa-circle-check" : "fa-circle"}`} />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="sb-change-submit"
                disabled={isLoading || !isFormReady}
              >
                {isLoading ? (
                  <span className="sb-change-loader" aria-label="Updating password">
                    <span /><span /><span />
                  </span>
                ) : (
                  <span className="sb-change-submit-content">
                    Update password <i className="fas fa-arrow-right" />
                  </span>
                )}
              </button>
            </form>

            <footer className="sb-change-card-footer">
              <span><i className="fas fa-lock" /> Encrypted connection</span>
              <span><i className="fas fa-shield-halved" /> Protected account</span>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ChangePassword;
