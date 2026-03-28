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
import useFormValidation from "../../hooks/useFormValidation";
import { validationRules } from "./validationRules";

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

  const validationSchema = {
    firstName: [
      validationRules.required,
      validationRules.minLength(3)
    ],
    lastName: [
      validationRules.required,
      validationRules.minLength(3)
    ],
    email: [
      validationRules.required,
      validationRules.email
    ],
    password: [
      validationRules.required,
      validationRules.password
    ],
    confirmPassword: [
      validationRules.required,
      validationRules.match(formData.password)
    ],
    agreeToTerms: [
      validationRules.checkbox
    ]
  };

  const { errors, setErrors, validateField, validateForm, handleBlur, touched, touchField } = useFormValidation(validationSchema, formData);
  

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Handle input changes and validate as user types
  const handleChange = (field, value) => {
    // build new form state immediately to validate against up-to-date values
    const newForm = { ...formData, [field]: value };
    setFormData(newForm);

    // mark field touched so validation messages appear as user types
    touchField(field);

    // validate this field right away and update errors
    const errorMessage = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: errorMessage }));

    // if password changed, re-validate confirmPassword (so mismatch shows/clears immediately)
    if (field === 'password' && newForm.confirmPassword !== undefined) {
      const confirmError = validateField('confirmPassword', newForm.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
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
                <label className={`login-form-label ${touched.firstName && errors.firstName ? 'login-error-message' : ''}`}>First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="First Name"
                  className={`login-form-input ${touched.firstName && errors.firstName ? 'border-error' : ''}`}
                />
                {touched.firstName && errors.firstName && <div className="login-error-message">{errors.firstName}</div>}
              </div>

              {/* LAST NAME */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${touched.lastName && errors.lastName ? 'login-error-message' : ''}`}>Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="Last Name"
                  className={`login-form-input ${touched.lastName && errors.lastName ? 'border-error' : ''}`}
                />
                {touched.lastName && errors.lastName && <div className="login-error-message">{errors.lastName}</div>}
              </div>
              

              {/* EMAIL */}
              <div className="login-form-box">
                <label className={`login-form-label ${touched.email && errors.email ? 'login-error-message' : ''}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`login-form-input ${touched.email && errors.email ? 'border-error' : ''}`}
                />
                {touched.email && errors.email && <div className="login-error-message">{errors.email}</div>}
              </div>

              {/* PASSWORD */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${touched.password && errors.password ? 'login-error-message' : ''}`}>Password</label>
                <div className="login-form-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`login-form-input ${touched.password && errors.password ? 'border-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="login-show-btn"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {touched.password && errors.password && <div className="login-error-message">{errors.password}</div>}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="login-form-box login-form-half">
                <label className={`login-form-label ${touched.confirmPassword && errors.confirmPassword ? 'login-error-message' : ''}`}>Confirm Password</label>
                <div className="login-form-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`login-form-input ${touched.confirmPassword && errors.confirmPassword ? 'border-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="login-show-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && <div className="login-error-message">{errors.confirmPassword}</div>}
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
                {touched.agreeToTerms && errors.agreeToTerms && <div className="login-error-message">{errors.agreeToTerms}</div>}
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