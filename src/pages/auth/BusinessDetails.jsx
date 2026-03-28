import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import "./Auth.css";
import "./ResponsiveAuth.css";
import { motion } from "framer-motion";
import { fadeInDown, fadeInUp } from "../../utils/animation";
import LightLogo from '../../assets/images/digitInvoice/logo.png';
import DarkLogo from '../../assets/images/digitInvoice/logo-dark.png';
import DashboardImg from '../../assets/images/digitInvoice/firs-img.png';
import StatOne from '../../assets/images/digitInvoice/stat-1-img.png';
import StatTwo from '../../assets/images/digitInvoice/stat-2-img.png';
import useThemeStore from "../../stores/useThemeStore";
import { businessSizes, businessTypes, industries } from "./localData";
import LocalSearchableSelect from "../../components/LocalSearchableSelect";
import useFormPersist from "../../hooks/useFormPersist";

const BusinessDetails = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const { showToast } = useToastStore();
    const { theme, toggleTheme } = useThemeStore();
    const Logo = theme === 'dark' ? LightLogo : DarkLogo;

    const [businessDetails, setBusinessDetails, clearBusinessDetails] = useFormPersist('businessDetailsData', {
        businessName: "",
        businessType: "",
        businessSize: "",
        tin: "",
        industry: "",
    });


    const [personalInfoData, setPersonalInfoData] = useFormPersist('personalInfoData', {});

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        if (location.state?.personalInfo && Object.keys(location.state.personalInfo).length > 0) {
            setPersonalInfoData(location.state.personalInfo);
        }
    }, [location.state?.personalInfo, setPersonalInfoData]);



    // 🔹 Handle input changes and validate as user types
    const handleChange = (field, value) => {
        setBusinessDetails(prev => ({ ...prev, [field]: value }));
        validateField(field, value);
    };

    // 🔹 Validate each field (real-time and on submit)
    const validateField = (field, value) => {
        let message = "";

        switch (field) {
            case "businessName":
                if (!value.trim()) message = ""; // Don't show error while empty
                else if (value.trim().length < 3)
                    message = "Business name must be at least 3 characters";
                break;

            case "businessType":
                if (!value) message = ""; // only validate on submit
                break;

            case "businessSize":
                if (!value) message = ""; // only validate on submit
                break;

            case "tin":
                if (!value.trim()) message = ""; // Don't show error while empty
                else if (!/^[0-9-]+$/.test(value))
                    message = "TIN should contain only numbers and dashes";
                break;

            case "industry":
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

        if (!businessDetails.businessName.trim())
            newErrors.businessName = "Business name is required";
        else if (businessDetails.businessName.length < 3)
            newErrors.businessName = "Business name must be at least 3 characters";

        if (!businessDetails.businessType)
            newErrors.businessType = "Please select a business type";

        if (!businessDetails.businessSize)
            newErrors.businessSize = "Please select a business size";

        if (!businessDetails.tin.trim())
            newErrors.tin = "Tax Identification Number is required";
        else if (!/^[0-9-]+$/.test(businessDetails.tin))
            newErrors.tin = "TIN should contain only numbers and dashes";

        if (!businessDetails.industry)
            newErrors.industry = "Please select an industry";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 🔹 Handle Form Submission
    const handleContinue = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        // Combine personal info and business details
        const allData = {
            ...personalInfoData,
            ...businessDetails
        };

        // Simulated signup success
        setTimeout(() => {
            setIsLoading(false);
            //clearBusinessDetails();
            showToast("Account created successfully!", "success");
            navigate("/choose-plan", { state: { formData: allData } });
        }, 1500);
    };

    const handleThemeToggle = (event) => {
        event.preventDefault();
        toggleTheme();
    };


    const handleBack = () => {
        navigate("/");
    };

    return (
        <div className={`login-container login-container-reverse theme-${theme}`}>
            {/* LEFT SIDE */}
            <div className="login-col login-overlay">
                {/* <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
          transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
          className="login-logo-box">
          <img src={LightLogo} className="login-logoimg" alt="Digit Invoice Logo" />
        </motion.div> */}

                <motion.h2 variants={fadeInUp} initial="hidden" whileInView="show"
                    transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
                    className="login-headertext">
                    Smart Invoicing Seamless Compliance
                </motion.h2>

                <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
                    transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
                    className="login-dashboard-box business-img-box">
                    <img src={DashboardImg} className="login-dashboardimg" alt="Dashboard" />
                    <img src={StatOne} className="stat-oneimg" alt="Dashboard" />
                    <img src={StatTwo} className="stat-twoimg" alt="Dashboard" />
                </motion.div>

                {/* <motion.p variants={fadeInUp} initial="hidden" whileInView="show"
          transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
          className="login-brieftext">
          At Digitinvonaija, we are a team of passionate innovators dedicated to
          transforming the way businesses handle invoicing and tax compliance in
          Nigeria.
        </motion.p> */}
            </div>

            {/* RIGHT SIDE (FORM) */}
            <div className="login-col login-form-wrapper">

                <motion.div variants={fadeInDown} initial="hidden" whileInView="show"
                    transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
                    className="login-logo-box hidden-img">
                    <img src={Logo} className="login-logoimg" alt="Digit Invoice Logo" />
                </motion.div>

                <div className='mode-toggle-box'>
                    <button id={'theme-toggle'} className={`mode-toggle-btn`} onClick={handleThemeToggle}>
                        <span className={`mode-toggle-icon fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></span>
                    </button>
                    {/* <label htmlFor={'theme-toggle'} className="mode-text">{theme === 'dark' ? 'Dark' : 'Light'}</label> */}
                </div>

                <div className="login-inner-box">
                    <motion.h2 variants={fadeInDown} initial="hidden" animate="show"
                        transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
                        className="login-form-headertext">
                        Business Details
                    </motion.h2>
                    <motion.p variants={fadeInDown} initial="hidden" animate="show"
                        transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
                        className="login-form-brieftext">
                        Tell us about your business to get started!
                    </motion.p>

                    <motion.div variants={fadeInUp} initial="hidden" whileInView="show"
                        transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
                        className="login-form-container">
                        <form onSubmit={handleContinue} className="login-form-f-container">

                            {/* BUSINESS NAME */}
                            <div className="login-form-box">
                                <label className={`login-form-label ${errors.businessName ? 'login-error-message' : ''}`}>Business Name</label>
                                <input type="text" value={businessDetails.businessName} onChange={(e) => handleChange("businessName", e.target.value)}
                                    placeholder="Enter your business name" className={`login-form-input ${errors.businessName ? 'border-error' : ''}`}
                                />
                                {errors.businessName && <div className="login-error-message">{errors.businessName}</div>}
                            </div>

                            {/* BUSINESS TYPE */}
                            <LocalSearchableSelect
                                options={businessTypes}
                                value={businessDetails.businessType}
                                onChange={(value) => handleChange("businessType", value)}
                                placeholder="Select your business type"
                                label="Business Type"
                                error={errors.businessType}
                                name="businessType"
                                className="login-form-half"
                            />


                            {/* TAX IDENTIFICATION NUMBER */}
                            <div className="login-form-box login-form-half">
                                <label className={`login-form-label ${errors.tin ? 'login-error-message' : ''}`}>Tax Identification Number</label>
                                <input
                                    type="text"
                                    value={businessDetails.tin}
                                    onChange={(e) => handleChange("tin", e.target.value)}
                                    placeholder="Enter your TIN (e.g., 12345678-0001)"
                                    className={`login-form-input ${errors.tin ? 'border-error' : ''}`}
                                />
                                {errors.tin && <div className="login-error-message">{errors.tin}</div>}
                            </div>

                            <LocalSearchableSelect
                                options={industries}
                                value={businessDetails.industry}
                                onChange={(value) => handleChange("industry", value)}
                                placeholder="Select your industry"
                                label="Industry"
                                error={errors.industry}
                                name="industry"
                            />

                            {/* BUSINESS SIZE - RADIO BUTTONS STYLED AS CHECKBOXES */}
                            <div className="login-form-box">
                                <label className={`login-form-label ${errors.businessSize ? 'login-error-message' : ''}`}>Business Size</label>
                                <div className="radio-checkbox-group">
                                    {businessSizes.map(size => (
                                        <div key={size.id} className="login-checkbox-box-wrapper">
                                            <input type="radio" id={`size-${size.id}`}
                                                name="businessSize" value={size.id}
                                                checked={businessDetails.businessSize === size.id}
                                                onChange={() => handleChange("businessSize", size.id)}
                                                className="login-checkbox-input"
                                            />
                                            <label className="login-checkbox-label" htmlFor={`size-${size.id}`}>
                                                {size.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {errors.businessSize && <div className="login-error-message">{errors.businessSize}</div>}
                            </div>

                            {/* BUTTONS */}
                            <div className="form-buttons-container">
                                <button type="button" onClick={handleBack} className="login-back-btn">
                                    Back
                                </button>
                                <button type="submit" disabled={isLoading} className="login-submit-btn login-submit-btn-half">
                                    {isLoading ? <div className="login-loader"></div> : <span className="login-submit-btn-text">Continue</span>}
                                </button>
                            </div>
                        </form>

                        <div className="auth-pagination-box">
                            <div className="auth-pag-col" />
                            <div className="auth-pag-col active-auth-pag-col" />
                            <div className="auth-pag-col" />
                            <div className="auth-pag-col" />
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDetails;