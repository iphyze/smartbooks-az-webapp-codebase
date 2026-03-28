import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import "./Auth.css";
import "./ResponsiveAuth.css";
import { motion } from "framer-motion";
import { fadeInDown, fadeInUp } from "../../utils/animation";
import LightLogo from '../../assets/images/digitInvoice/logo.png';
import DarkLogo from '../../assets/images/digitInvoice/logo-dark.png';
import DashboardImg from '../../assets/images/digitInvoice/dashboard-image.png';
import useThemeStore from "../../stores/useThemeStore";
import useFormPersist from "../../hooks/useFormPersist";

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();
  const Logo = theme === 'dark' ? LightLogo : DarkLogo;

  const [formData, setFormData, clearFormData] = useFormPersist('signupForm', {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Handle input changes and validate as user types
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // 🔹 Validate each field (real-time and on submit)
  const validateField = (field, value) => {
    let message = "";

    switch (field) {
      case "firstName":
        if (!value.trim()) message = ""; // Don't show error while empty
        else if (value.trim().length < 3)
          message = "First name must be at least 3 characters";
        break;

      case "lastName":
        if (!value.trim()) message = "";
        else if (value.trim().length < 3)
          message = "Last name must be at least 3 characters";
        break;

      case "email":
        if (!value.trim()) message = "";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          message = "Please enter a valid email address";
        break;

      case "password":
        if (!value.trim()) message = "";
        else if (value.length < 6)
          message = "Password must be at least 6 characters long";
        else if (!/[A-Z]/.test(value))
          message = "Password must contain at least one uppercase letter";
        else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value))
          message = "Password must contain at least one special character";
        else if (!/\d/.test(value))
          message = "Password must contain at least one number";
        break;

      case "confirmPassword":
        if (!value.trim()) message = "";
        else if (value !== formData.password)
          message = "Passwords do not match";
        break;

      case "agreeToTerms":
        if (!value) message = ""; // only validate on submit
        break;

      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: message }));
  };

  // 🔹 Validate all fields before submitting
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    else if (formData.firstName.length < 3)
      newErrors.firstName = "First name must be at least 3 characters";

    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required";
    else if (formData.lastName.length < 3)
      newErrors.lastName = "Last name must be at least 3 characters";

    if (!formData.email.trim())
      newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";

    if (!formData.password.trim())
      newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long";
    else if (!/[A-Z]/.test(formData.password))
      newErrors.password = "Password must contain at least one uppercase letter";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password))
      newErrors.password = "Password must contain at least one special character";
    else if (!/\d/.test(formData.password))
      newErrors.password = "Password must contain at least one number";

    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.agreeToTerms)
      newErrors.agreeToTerms = "You must agree to the Terms of Service & Privacy Policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Handle Form Submission - navigate to business details instead of completing signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Clear the form data from storage before navigation
    // clearFormData();

    // Navigate to business details page with form data
    navigate("/business-details", { state: { personalInfo: formData } });
  };

  const handleThemeToggle = (event) => {
    event.preventDefault();
    toggleTheme();
  };

  return (
    <div className={`login-container theme-${theme}`}>
      {/* LEFT SIDE */}
      <div className="login-col login-overlay">
        <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="login-logo-box">
          <img src={LightLogo} className="login-logoimg" alt="Digit Invoice Logo" />
        </motion.div>

        <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
          className="login-dashboard-box">
          <img src={DashboardImg} className="login-dashboardimg" alt="Dashboard" />
        </motion.div>

        <motion.h2 variants={fadeInUp} initial="hidden" whileInView="show"
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
          className="login-headertext">
          Smart Invoicing Seamless Compliance
        </motion.h2>

        <motion.p variants={fadeInUp} initial="hidden" whileInView="show"
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
          className="login-brieftext">
          At Digitinvonaija, we are a team of passionate innovators dedicated to
          transforming the way businesses handle invoicing and tax compliance in
          Nigeria.
        </motion.p>
      </div>

      {/* RIGHT SIDE (FORM) */}
      <div className="login-col login-form-wrapper">

        <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="login-logo-box hidden-img">
          <img src={Logo} className="login-logoimg" alt="Digit Invoice Logo" />
        </motion.div>

        <div className='mode-toggle-box'>
          <button id={'theme-toggle'} className={`mode-toggle-btn`} onClick={handleThemeToggle}>
            <span className={`mode-toggle-icon fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></span>
          </button>
          <label htmlFor={'theme-toggle'} className="mode-text">{theme === 'dark' ? 'Dark' : 'Light'}</label>
        </div>

        <div className="login-inner-box">
          <motion.h2 variants={fadeInDown} initial="hidden" whileInView="show"
            transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
            className="login-form-headertext">
            Sign Up
          </motion.h2>
          <motion.p variants={fadeInUp} initial="hidden" whileInView="show"
            transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
            className="login-form-brieftext">
            Create your account to start invoicing with ease!
          </motion.p>

          <motion.div variants={fadeInUp} initial="hidden" whileInView="show"
            transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
            className="login-form-container">
            <form onSubmit={handleSignUp} className="login-form-f-container">

              {/* FIRST NAME */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${errors.firstName ? 'login-error-message' : ''}`}>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="First Name"
                  className={`login-form-input ${errors.firstName ? 'border-error' : ''}`}
                />
                {errors.firstName && <div className="login-error-message">{errors.firstName}</div>}
              </div>

              {/* LAST NAME */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${errors.lastName ? 'login-error-message' : ''}`}>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Last Name"
                  className={`login-form-input ${errors.lastName ? 'border-error' : ''}`}
                />
                {errors.lastName && <div className="login-error-message">{errors.lastName}</div>}
              </div>
              

              {/* EMAIL */}
              <div className="login-form-box">
                <label className={`login-form-label ${errors.email ? 'login-error-message' : ''}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`login-form-input ${errors.email ? 'border-error' : ''}`}
                />
                {errors.email && <div className="login-error-message">{errors.email}</div>}
              </div>

              {/* PASSWORD */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${errors.password ? 'login-error-message' : ''}`}>Password</label>
                <div className="login-form-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={`login-form-input ${errors.password ? 'border-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="login-show-btn"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <div className="login-error-message">{errors.password}</div>}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${errors.confirmPassword ? 'login-error-message' : ''}`}>Confirm Password</label>
                <div className="login-form-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className={`login-form-input ${errors.confirmPassword ? 'border-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="login-show-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.confirmPassword && <div className="login-error-message">{errors.confirmPassword}</div>}
              </div>

              {/* TERMS CHECKBOX */}
              <div className="login-form-box">
                <div className="login-checkbox-box-wrapper">
                  <input type="checkbox" id={'checkbox'} checked={formData.agreeToTerms} 
                  onChange={(e) => handleChange("agreeToTerms", e.target.checked)} className="login-checkbox-input"/>
                  <label className="login-checkbox-label" htmlFor="checkbox">
                    I agree to the <Link to='' className="highlighted-text">Terms of Service &</Link> <Link to='' className="highlighted-text">Privacy Policy</Link>
                  </label>
                </div>
                {errors.agreeToTerms && <div className="login-error-message">{errors.agreeToTerms}</div>}
              </div>
              

              {/* SUBMIT */}
              <button type="submit" disabled={isLoading} className="login-submit-btn">
                {isLoading ? <div className="login-loader"></div> : <span className="login-submit-btn-text">Continue</span>}
              </button>
            </form>



            <div className="auth-pagination-box">
              <div className="auth-pag-col active-auth-pag-col"/>
              <div className="auth-pag-col"/>
              <div className="auth-pag-col"/>
              <div className="auth-pag-col"/>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;