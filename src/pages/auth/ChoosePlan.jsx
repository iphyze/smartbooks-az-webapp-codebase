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
import useThemeStore from "../../stores/useThemeStore";
import useFormPersist from "../../hooks/useFormPersist";

const ChoosePlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { showToast } = useToastStore();
  const { theme, toggleTheme } = useThemeStore();
  const Logo = theme === 'dark' ? LightLogo : DarkLogo;
  const [isLoading, setIsLoading] = useState();

  // Get form data from navigation state or use persisted data
  const initialFormData = location.state?.formData || {};
  
  // Use useFormPersist to store the complete form data
  const [formData, setFormData, clearFormData] = useFormPersist('completeFormData', initialFormData);

  // Update formData when new data comes from navigation state
  useEffect(() => {
    if (location.state?.formData && Object.keys(location.state.formData).length > 0) {
      setFormData(prev => ({ ...prev, ...location.state.formData }));
    }
  }, [location.state?.formData, setFormData]);

  const handleThemeToggle = (event) => {
    event.preventDefault();
    toggleTheme();
  };

  const validateForm = () => {
    // Add your validation logic here
    return true;
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulated signup success
    setTimeout(() => {
      setIsLoading(false);
    //   showToast("Account created successfully!", "success");
    //   navigate("/pricing", { state: { formData: formData } });
    sessionStorage.removeItem('completeFormData');
    sessionStorage.removeItem('businessDetailsData');
    sessionStorage.removeItem('personalInfoData');
    sessionStorage.removeItem('signupForm');
    // sessionStorage.clear();
    clearFormData();
      navigate("/login");
    }, 1500);
  };

  const handleBack = () => {
    navigate("/business-details");
  };

  return (
    <div className={`choose-plan-container theme-${theme}`}>
      <div className='mode-toggle-box'>
        <button id={'theme-toggle'} className={`mode-toggle-btn`} onClick={handleThemeToggle}>
          <span className={`mode-toggle-icon fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></span>
        </button>
      </div>

        <button className="back-btn" onClick={handleBack}>
            <span className="fas fa-arrow-left back-btn-icon"></span>
        </button>
      
      {/* Add your form content here */}
      <div className="choose-plan-wrapper">

        <motion.div variants={fadeInDown} initial="hidden" animate="show"
            transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
            className="plan-animation-box">
                <h3 className="choose-plan-headertext">Choose A Plan</h3>
                <p className="choose-plan-text">Select the plan that best fits your business needs</p>
        </motion.div>
        
        <motion.div variants={fadeInUp} initial="hidden" animate="show"
            transition={{ duration: 0.3, delay: 0.6, ease: "easeInOut" }}
            className="plans-flexbox">
            <div className="plans-flex-col">
                <h3 className="plan-title">Starter</h3>
                <h1 className="plan-amount-large">₦5,000.00<span className="plan-amt-duration"> / Month</span></h1>
                
                <div className="plan-amount-box">
                    <p className="plan-amt-text">₦13,500.00<span className="plan-amt-duration-two"> / Quarter</span></p>
                    <p className="plan-savings">Save 10%</p>
                </div>
                <div className="plan-amount-box">
                    <p className="plan-amt-text">₦48,500.00<span className="plan-amt-duration-two"> / Annually</span></p>
                    <p className="plan-savings">Save 20%</p>
                </div>

                <div className="plan-features-flexbox">
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Up to 50 Invoices/Month</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">FIRS Compliant e-invoicing</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Automated VAT Calculation</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Basic Analytics and Report</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Email Support</p>
                    </div>
                </div>

                <button disabled={isLoading} className="continue-submit-btn" onClick={handleContinue}>
                    {isLoading ? <div className="login-loader"></div> : <span className="continue-submit-btn-text">Continue</span>}
                </button>
            </div>

            <div className="plans-flex-col plan-flex-center">

                <p className="plan-savings most-popular">Most Popular</p>

                <h3 className="plan-title plan-title-center">Professional</h3>
                <h1 className="plan-amount-large plan-title-center">₦12,000.00<span className="plan-amt-duration plan-title-center"> / Month</span></h1>
                
                <div className="plan-amount-box">
                    <p className="plan-amt-text plan-title-center">₦32,500.00<span className="plan-amt-duration-two plan-title-center"> / Quarter</span></p>
                    <p className="plan-savings plan-savings-center">Save 10%</p>
                </div>
                <div className="plan-amount-box">
                    <p className="plan-amt-text plan-title-center">₦115,000.00<span className="plan-amt-duration-two plan-title-center"> / Annually</span></p>
                    <p className="plan-savings plan-savings-center">Save 20%</p>
                </div>

                <div className="plan-features-flexbox">
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">Unlimited Invoice</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">Priority FIRS API validation</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">“Pay Now” payment link integration</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">Advanced reports & analytic</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">Multi-user access</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon  plan-title-center fas fa-check-circle"></div>
                        <p className="plan-features-text plan-title-center">Email & phone support</p>
                    </div>
                </div>

                <button disabled={isLoading} className="continue-submit-btn" onClick={handleContinue}>
                    {isLoading ? <div className="login-loader"></div> : <span className="continue-submit-btn-text">Continue</span>}
                </button>
            </div>

            <div className="plans-flex-col">
                <h3 className="plan-title">Enterprise</h3>
                <h1 className="plan-amount-large">Custom Pricing</h1>

                <div className="plan-features-flexbox">
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">All Professional features</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Custom integrations (ERP, accounting software, APIs)</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Dedicated account manager</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">SLA-backed support</p>
                    </div>
                    <div className="plan-features-col">
                        <div className="plan-list-icon fas fa-check-circle"></div>
                        <p className="plan-features-text">Premium onboarding & training</p>
                    </div>
                </div>

                <button disabled={isLoading} className="continue-submit-btn" onClick={handleContinue}>
                    {isLoading ? <div className="login-loader"></div> : <span className="continue-submit-btn-text">Continue</span>}
                </button>
            </div>               
        </motion.div>


        <div className="auth-pagination-box">
            <div className="auth-pag-col" />
            <div className="auth-pag-col" />
            <div className="auth-pag-col active-auth-pag-col" />
            <div className="auth-pag-col" />
        </div>
        
        
      </div>
    </div>
  );
};

export default ChoosePlan;