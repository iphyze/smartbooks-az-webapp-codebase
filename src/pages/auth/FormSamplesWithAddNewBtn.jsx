import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import "./Login.css";
import "../inputs-styles/Inputs.css";
import Logo from "../../assets/images/smartbooks/logo.png";
import 'aos/dist/aos.css';
import AOS from 'aos';
import useThemeStore from "../../stores/useThemeStore";
import Select, { components } from "react-select"; // Imported components
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Custom MenuList Component with "Add New" Button ---
const CustomMenuList = (props) => {
  return (
    <components.MenuList {...props}>
      {props.children}
      {/* The Add New Button */}
      <button
        type="button" // Important: prevent form submission
        className="add-new-select-btn"
        onClick={() => {
          // Add your logic here (e.g., open a modal)
          alert("Add New Bank Clicked!");
          // You can also select the menu to close it automatically if needed
          // props.selectProps.onMenuClose();
        }}
      >
        + Add New Bank
      </button>
    </components.MenuList>
  );
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bank, setBank] = useState("");
  const [date, setDate] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Fixed: should be boolean
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    bank: "",
    date: null,
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasSpecialChar: false,
    hasNumber: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time email validation
  useEffect(() => {
    if (!email) {
      setErrors(prev => ({ ...prev, email: "" }));
    } else if (!validateEmail(email)) {
      setErrors(prev => ({
        ...prev,
        email: "Please enter a valid email address"
      }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  }, [email]);

  // Real-time bank validation
  useEffect(() => {
    if (!bank) {
      setErrors(prev => ({ ...prev, bank: "" }));
    } else {
      setErrors(prev => ({ ...prev, bank: "" }));
    }
  }, [bank]);

  useEffect(() => {
    if (!date) {
      setErrors(prev => ({ ...prev, date: "" }));
    } else {
      setErrors(prev => ({ ...prev, date: "" }));
    }
  }, [date]);

  // Real-time password validation with sequential requirements
  useEffect(() => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: "" }));
      setPasswordRequirements({
        minLength: false,
        hasUpperCase: false,
        hasSpecialChar: false,
        hasNumber: false,
      });
      return;
    }

    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
    const hasNumber = /\d/.test(password);

    setPasswordRequirements({
      minLength: hasMinLength,
      hasUpperCase: hasUpperCase,
      hasSpecialChar: hasSpecialChar,
      hasNumber: hasNumber,
    });

    if (!hasMinLength) {
      setErrors(prev => ({
        ...prev,
        password: "Password must be at least 6 characters long!"
      }));
    } else if (!hasUpperCase) {
      setErrors(prev => ({
        ...prev,
        password: "Password must contain at least one uppercase letter!"
      }));
    } else if (!hasSpecialChar) {
      setErrors(prev => ({
        ...prev,
        password: "Password must contain at least one special character!"
      }));
    } else if (!hasNumber) {
      setErrors(prev => ({
        ...prev,
        password: "Password must contain at least one number!"
      }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  }, [password]);

  const bankOptions = useMemo(() => [
    { value: "first-bank", label: "First Bank" },
    { value: "zenith-bank", label: "Zenith Bank" },
    { value: "gtbank", label: "GTBank" },
    { value: "access-bank", label: "Access Bank" }
  ], []);

  const selectedBank = useMemo(() =>
    bankOptions.find(option => option.value === bank) || null,
    [bankOptions, bank]
  );

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      bank: "",
      date: ""
    };
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required!";
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address!";
      isValid = false;
    }

    if (!bank) {
      newErrors.bank = "Bank is required!";
      isValid = false;
    }

    if (!date) {
      newErrors.date = "Please select a date!";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required!";
      isValid = false;
    } else if (!passwordRequirements.minLength ||
      !passwordRequirements.hasUpperCase ||
      !passwordRequirements.hasSpecialChar ||
      !passwordRequirements.hasNumber
    ) {
      newErrors.password = errors.password;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleBankChange = (value) => {
    setBank(value);
  };

  const handleDateChange = (value) => {
    setDate(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password, bank);

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

  useEffect(() => {
    AOS.init({
      duration: 1000,
      offset: 100,
      easing: 'ease-in-out',
      once: true,
    });

    document.title = "Acctlab | Login";

  }, []);

  return (
    <div className={`login-container theme-${theme}`}>
      <div className="login-box-overlay" />

      <div className="login-flexbox">

        <form onSubmit={handleLogin} className="login-form-container" data-aos='fade-up'>

          <div className="animated-circle-container">
            <div className="animated-circle" />
            <div className="animated-circle animated-circle-2" />
            <div className="animated-circle animated-circle-3" />
          </div>

          <div className="login-inner-flexbox-col">
            <div className="welcome-text" data-aos='fade-right'>
              <div className="login-logo-img-box">
                <img src={Logo} alt="smartbooks.png" className="smartbooks-logo" />
              </div>
              <div className="login-welcome">Welcome to SmartBooks Accounting App!</div>
              <div className="login-sub-welcome">Manage your finances with ease and precision. Our app provides features such as:</div>
              <ul className="feature-list">
                <li>Invoice Generation</li>
                <li>Expense Tracking</li>
                <li>Income Management</li>
                <li>Report Generation</li>
                <li>And much more!</li>
              </ul>
            </div>
          </div>

          <div className="login-inner-flexbox-col login-col-form">

            {/* Email Input */}
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.email ? 'input-form-error' : ''}`}>
                <label className={`input-form-label ${errors.email ? 'input-label-message' : ''}`} htmlFor="email">Email</label>
                <div className="form-wrapper">
                  <input type="email" placeholder="Enter Email" value={email} onChange={(e) => setEmail(e.target.value)} id="email"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                  />
                  <span className={`input-icon fas fa-envelope ${errors.email ? 'input-icon-error' : ''}`}></span>
                </div>
              </div>
              {errors.email && <div className="input-error-message" data-aos='fade-in'>{errors.email}</div>}
            </div>

            {/* Password Input */}
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.password ? 'input-form-error' : ''}`}>
                <label className={`input-form-label ${errors.password ? 'input-label-message' : ''}`} htmlFor="password">Password</label>
                <div className="form-wrapper">
                  <input type={showPassword ? "text" : "password"} placeholder="Enter Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} id="password" autoComplete="none"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                  />
                  <span className={`input-icon fas fa-lock ${errors.password ? 'input-icon-error' : ''}`}></span>
                  <button type="button" className={`login-show-btn ${errors.password ? 'input-icon-error' : ''}`} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {errors.password && <div className="input-error-message" data-aos='fade-in'>{errors.password}</div>}
            </div>

            {/* Bank Select with Custom MenuList */}
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.bank ? 'input-form-error' : ''}`}>
                <label className={`input-form-label ${errors.bank ? 'input-label-message' : ''}`} htmlFor="bank">Bank</label>
                <div className="form-wrapper">
                  <Select
                    options={bankOptions}
                    value={selectedBank}
                    onChange={(option) => handleBankChange(option ? option.value : "")}
                    placeholder="Select bank"
                    className={`form-input-select ${errors.bank ? 'input-error' : ''}`}
                    classNamePrefix="form-input-select"
                    isClearable
                    isSearchable
                    name="bank"
                    inputId="bank"
                    onMenuOpen={() => setMenuOpen(true)}
                    onMenuClose={() => setMenuOpen(false)}
                    components={{ MenuList: CustomMenuList }}
                  />
                  <span className={`chevron-input-icon fas fa-chevron-down ${menuOpen ? 'chevron-rotate' : ''} ${errors.bank ? 'input-icon-error' : ''}`}></span>
                </div>
              </div>
              {errors.bank && <div className="input-error-message" data-aos='fade-in'>{errors.bank}</div>}
            </div>

            {/* Date Picker */}
            <div className="input-form-wrapper">
              <div className={`input-form-group ${errors.date ? 'input-form-error' : ''}`}>
                <label className={`input-form-label ${errors.date ? 'input-label-message' : ''}`} htmlFor="date">Date</label>
                <div className="form-wrapper">
                  <DatePicker
                    selected={date}
                    onChange={(date) => handleDateChange(date)}
                    className={`form-input ${errors.date ? 'input-error' : ''}`} // Fixed: should use form-input for styling consistency
                    dateFormat="yyyy-MM-dd"
                    wrapperClassName="input-date-picker"
                    placeholderText="Select Date"
                    id="date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <span className={`chevron-input-icon fas fa-calendar ${errors.date ? 'input-icon-error' : ''}`}></span>
                </div>
              </div>
              {errors.date && <div className="input-error-message" data-aos='fade-in'>{errors.date}</div>}
            </div>

            <button type="submit" disabled={isLoading || errors.email || errors.password} className="login-submit-btn">
              <div className="login-inner-bg" />
              {isLoading ? (<div className="login-loader-loader"></div>) : (<div className="login-inner-text">Sign In &nbsp; <span className="fas fa-right-to-bracket"></span></div>)}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;