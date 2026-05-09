import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import "./Login.css";
import Logo from "../../assets/images/smartbooks/smartbooks.png";
import LogoWhite from "../../assets/images/smartbooks/smartbooks_dark.png";
import useThemeStore from "../../stores/useThemeStore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
    document.title = "Smartbooks | Login";
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Real-time email format check only
  useEffect(() => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "" }));
    } else if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  }, [email]);

  // No real-time password validation on login — just clear error when user types
  useEffect(() => {
    if (password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  }, [password]);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required!";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address!";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required!";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        showToast("Login successful! Welcome back.", "success");
        navigate("/");
      } else {
        showToast(result.error || "Invalid credentials", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !errors.email && !errors.password && email && password;

  return (
    <div className={`sb-login-root ${isDark ? "sb-dark" : "sb-light"} ${mounted ? "sb-mounted" : ""}`}>
      <div className="sb-bg-grid" />
      <div className="sb-bg-glow sb-glow-1" />
      <div className="sb-bg-glow sb-glow-2" />

      <div className="sb-login-wrapper">
        {/* Left Panel */}
        <div className="sb-panel-left">
          <div className="sb-panel-left-inner">
            <div className="sb-logo-wrap">
              <img
                src={isDark ? LogoWhite : Logo}
                alt="Smartbooks Accounting"
                className="sb-logo"
                onError={(e) => { e.target.src = Logo; }}
              />
            </div>

            <div className="sb-tagline">
              <span className="sb-tagline-main">Smart finances,</span>
              <span className="sb-tagline-accent">smarter decisions.</span>
            </div>

            <p className="sb-panel-desc">
              The all-in-one accounting platform built for modern businesses.
            </p>

            <div className="sb-features">
              {[
                { icon: "fa-file-invoice", label: "Invoice Generation" },
                { icon: "fa-chart-line", label: "Expense Tracking" },
                { icon: "fa-coins", label: "Income Management" },
                { icon: "fa-chart-column", label: "Report Generation" },
              ].map((f, i) => (
                <div className="sb-feature-item" key={i} style={{ animationDelay: `${0.1 * i + 0.4}s` }}>
                  <div className="sb-feature-icon">
                    <i className={`fas ${f.icon}`} />
                  </div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="sb-deco-circle sb-dc-1" />
            <div className="sb-deco-circle sb-dc-2" />
            <div className="sb-deco-circle sb-dc-3" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="sb-panel-right">
          <div className="sb-form-card">
            <div className="sb-form-header">
              <h1 className="sb-form-title">Welcome back</h1>
              <p className="sb-form-subtitle">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="sb-form" noValidate>
              {/* Email Field */}
              <div className={`sb-field ${errors.email ? "sb-field--error" : email && !errors.email ? "sb-field--valid" : ""}`}>
                <label className="sb-label" htmlFor="email">Email Address</label>
                <div className="sb-input-wrap">
                  <i className="sb-input-icon fas fa-envelope" />
                  <input
                    type="email"
                    id="email"
                    className="sb-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {email && !errors.email && (
                    <i className="sb-input-status fas fa-circle-check" />
                  )}
                </div>
                {errors.email && (
                  <p className="sb-error-msg">
                    <i className="fas fa-triangle-exclamation" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field — no strength hints on login */}
              <div className={`sb-field ${errors.password ? "sb-field--error" : ""}`}>
                <label className="sb-label" htmlFor="password">Password</label>
                <div className="sb-input-wrap">
                  <i className="sb-input-icon fas fa-lock" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="sb-input sb-input--password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="sb-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                  </button>
                </div>
                {errors.password && (
                  <p className="sb-error-msg">
                    <i className="fas fa-triangle-exclamation" /> {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="sb-submit-btn"
              >
                {isLoading ? (
                  <span className="sb-btn-loader">
                    <span /><span /><span />
                  </span>
                ) : (
                  <span className="sb-btn-content">
                    Sign In <i className="fas fa-arrow-right" />
                  </span>
                )}
                <div className="sb-btn-shimmer" />
              </button>
            </form>

            <div className="sb-form-footer">
              <div className="sb-divider"><span>Secured with enterprise-grade encryption</span></div>
              <div className="sb-security-badges">
                <span><i className="fas fa-shield-halved" /> SSL Protected</span>
                <span><i className="fas fa-lock" /> 256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;