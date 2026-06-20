import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import useThemeStore from "../../stores/useThemeStore";
import { defaultRouteForRole } from "../../utils/permissions";
import LogoLight from "../../assets/images/smartbooks/smartbooks.png";
import LogoDark from "../../assets/images/smartbooks/smartbooks_dark.png";
import "./Login.css";

const workspaceBenefits = [
  { icon: "fa-file-invoice", label: "Invoicing", copy: "Create and track bills" },
  { icon: "fa-chart-line", label: "Reports", copy: "Clear performance insight" },
  { icon: "fa-coins", label: "Controls", copy: "Reliable finance records" },
  { icon: "fa-lock", label: "Secure", copy: "Protected user access" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
    document.title = "Smartbooks | Sign In";
  }, []);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  useEffect(() => {
    if (!email) {
      setErrors((previous) => ({ ...previous, email: "" }));
    } else if (!validateEmail(email)) {
      setErrors((previous) => ({ ...previous, email: "Please enter a valid email address" }));
    } else {
      setErrors((previous) => ({ ...previous, email: "" }));
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      setErrors((previous) => ({ ...previous, password: "" }));
    }
  }, [password]);

  const validateForm = () => {
    const validationErrors = { email: "", password: "" };
    let valid = true;

    if (!email) {
      validationErrors.email = "Email address is required";
      valid = false;
    } else if (!validateEmail(email)) {
      validationErrors.email = "Please enter a valid email address";
      valid = false;
    }

    if (!password) {
      validationErrors.password = "Password is required";
      valid = false;
    }

    setErrors(validationErrors);
    return valid;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast("Login successful! Welcome back.", "success");
        navigate(
          result.user?.must_change_password
            ? "/change-password"
            : defaultRouteForRole(result.user),
          { replace: true }
        );
      } else {
        showToast(result.error || "Invalid credentials", "error");
      }
    } catch (error) {
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !errors.email && !errors.password && email && password;

  return (
    <div className={`sb-login-root ${isDark ? "sb-dark" : "sb-light"} ${mounted ? "sb-mounted" : ""}`}>
      <div className="sb-bg-grid" aria-hidden="true" />
      <div className="sb-bg-orb sb-orb-one" aria-hidden="true" />
      <div className="sb-bg-orb sb-orb-two" aria-hidden="true" />

      <div className="sb-login-shell">
        <aside className="sb-panel-left">
          <div className="sb-panel-pattern" aria-hidden="true" />
          <div className="sb-panel-left-inner">
            <img
              src={LogoDark}
              alt="Smartbooks Accounting"
              className="sb-logo"
              onError={(event) => { event.currentTarget.src = LogoLight; }}
            />

            <div className="sb-product-pill">
              <span className="sb-product-dot" />
              Financial workspace built for clarity
            </div>

            <div className="sb-tagline">
              <span>Control every</span>
              <span className="sb-tagline-accent">financial move.</span>
            </div>

            <p className="sb-panel-desc">
              Run accounting operations, monitor performance and make informed decisions from one dependable workspace.
            </p>

            <div className="sb-benefit-grid">
              {workspaceBenefits.map((benefit, index) => (
                <div className="sb-benefit" key={benefit.label} style={{ animationDelay: `${0.34 + index * 0.08}s` }}>
                  <div className="sb-benefit-icon">
                    <i className={`fas ${benefit.icon}`} />
                  </div>
                  <div>
                    <p className="sb-benefit-title">{benefit.label}</p>
                    <p className="sb-benefit-copy">{benefit.copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="sb-panel-assurance">
              <i className="fas fa-shield-halved" />
              <span>Secure access with protected sessions and role-based controls</span>
            </div>
          </div>
        </aside>

        <main className="sb-panel-right">
          <div className="sb-top-actions">
            <button
              type="button"
              className="sb-theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} />
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>

          <section className="sb-form-card" aria-label="Sign in">
            <header className="sb-form-header">
              <div className="sb-secure-chip">
                <i className="fas fa-shield-halved" /> Secure sign in
              </div>
              <h1 className="sb-form-title">Welcome back</h1>
              <p className="sb-form-subtitle">Enter your details to access Smartbooks.</p>
            </header>

            <form onSubmit={handleLogin} className="sb-form" noValidate>
              <div className={`sb-field ${errors.email ? "sb-field--error" : email && !errors.email ? "sb-field--valid" : ""}`}>
                <label className="sb-label" htmlFor="email">Email address</label>
                <div className="sb-input-wrap">
                  <i className="sb-input-icon fas fa-envelope" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="sb-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    spellCheck="false"
                  />
                  {email && !errors.email && <i className="sb-input-status fas fa-circle-check" />}
                </div>
                {errors.email && (
                  <p className="sb-error-msg"><i className="fas fa-triangle-exclamation" /> {errors.email}</p>
                )}
              </div>

              <div className={`sb-field ${errors.password ? "sb-field--error" : ""}`}>
                <label className="sb-label" htmlFor="password">Password</label>
                <div className="sb-input-wrap">
                  <i className="sb-input-icon fas fa-lock" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="sb-input sb-input--password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="sb-toggle-pw"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
                {errors.password && (
                  <p className="sb-error-msg"><i className="fas fa-triangle-exclamation" /> {errors.password}</p>
                )}
              </div>

              <button type="submit" disabled={isLoading || !isFormValid} className="sb-submit-btn">
                {isLoading ? (
                  <span className="sb-btn-loader" aria-label="Signing in">
                    <span /><span /><span />
                  </span>
                ) : (
                  <span className="sb-btn-content">Sign in <i className="fas fa-arrow-right" /></span>
                )}
              </button>
            </form>

            <footer className="sb-form-footer">
              <div className="sb-security-badges">
                <span><i className="fas fa-lock" /> Encrypted connection</span>
                <span><i className="fas fa-shield-halved" /> Protected workspace</span>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Login;
