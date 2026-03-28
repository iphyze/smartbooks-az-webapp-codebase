import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import 'aos/dist/aos.css';
import useThemeStore from "../../stores/useThemeStore";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn, fadeInUp, fadeInDown } from "../../utils/animation";
import PageNav from "../../components/PageNav";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import { customers } from "./data/customerData";

const EditCustomerForm = ({customerToEdit}) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [customerDetails, setCustomerDetails] = useState({
    name: customerToEdit?.name || "",
    email: customerToEdit?.email || "",
    phone: customerToEdit?.phone || "",
    tin: customerToEdit?.tin || "",
    status: customerToEdit?.status || "Active"
  });

  // Prepare options for react-select
  const statusOptions = useMemo(() => [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" }
  ], []);

  const handleChange = (field, value) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // 🔹 Validate each field (real-time and on submit)
  const validateField = (field, value) => {
    let message = "";

    switch (field) {
      case "name":
        if (!value) message = "Customer name is required";
        else if (value.trim().length < 3)
          message = "Customer name must be at least 3 characters";
        break;
      case "email":
        if (!value) message = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          message = "Please enter a valid email address";
        break;
      case "phone":
        if (!value) message = "Phone number is required";
        else if (!/^[+]?[(\d{1,3})\s]?(\d{1,3})\s]?(\d{4,14})$/.test(value))
          message = "Please enter a valid phone number";
        break;
      case "tin":
        if (!value) message = "Tax Identification Number is required";
        else if (!/^[0-9-]+$/.test(value))
          message = "TIN should contain only numbers and dashes";
        break;
      case "status":
        if (!value) message = "Status is required";
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerDetails.name)
      newErrors.name = "Customer name is required";
    
    if (!customerDetails.email)
      newErrors.email = "Email is required";
    
    if (!customerDetails.phone)
      newErrors.phone = "Phone number is required";
    
    if (!customerDetails.tin)
      newErrors.tin = "Tax Identification Number is required";
    
    if (!customerDetails.status)
      newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    // Simulated API call for updating customer
    setTimeout(() => {
      setIsLoading(false);
      showToast("Customer updated successfully!", "success");
      // In a real app, this would navigate to the customer details page
      // navigate("/customers");
    }, 1500);
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    navigate("/customer/home");
  };

  return (
    <React.Fragment>
          <motion.div 
            variants={fadeInUp} initial="hidden" animate="show"
            transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
            className={`invoice-form-box theme-${theme}`}
          >

          <form className="invoice-form-f-container" onSubmit={handleSubmit}>
            <div className="invoice-form-header">Customer Details</div>

            {/* Name field */}
            <div className={`invoice-form invoice-form-half ${errors.name ? 'has-error' : ''}`}>
              <label className={`invoice-form-label ${errors.name ? 'invoice-error-message' : ''}`}>
                Customer Name
              </label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter customer name"
                className={`invoice-form-input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <div className="invoice-error-message">{errors.name}</div>}
            </div>

            {/* Email field */}
            <div className={`invoice-form invoice-form-half ${errors.email ? 'has-error' : ''}`}>
              <label className={`invoice-form-label ${errors.email ? 'invoice-error-message' : ''}`}>
                Email
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter customer email"
                className={`invoice-form-input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <div className="invoice-error-message">{errors.email}</div>}
            </div>

            {/* Phone field */}
            <div className={`invoice-form invoice-form-half ${errors.phone ? 'has-error' : ''}`}>
              <label className={`invoice-form-label ${errors.phone ? 'invoice-error-message' : ''}`}>
                Phone Number
              </label>
              <input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className={`invoice-form-input ${errors.phone ? 'input-error' : ''}`}
              />
              {errors.phone && <div className="invoice-error-message">{errors.phone}</div>}
            </div>

            {/* TIN field */}
            <div className={`invoice-form invoice-form-half ${errors.tin ? 'has-error' : ''}`}>
              <label className={`invoice-form-label ${errors.tin ? 'invoice-error-message' : ''}`}>
                Tax Identification Number
              </label>
              <input
                type="text"
                value={customerDetails.tin}
                onChange={(e) => handleChange("tin", e.target.value)}
                placeholder="Enter TIN"
                className={`invoice-form-input ${errors.tin ? 'input-error' : ''}`}
              />
              {errors.tin && <div className="invoice-error-message">{errors.tin}</div>}
            </div>

            {/* Status field */}
            <div className={`invoice-form invoice-form-half ${errors.status ? 'has-error' : ''}`}>
              <label className={`invoice-form-label ${errors.status ? 'invoice-error-message' : ''}`}>
                Status
              </label>
              <Select
                options={statusOptions}
                value={customerDetails.status}
                onChange={(option) => handleChange("status", option ? option.value : "")}
                placeholder="Select status"
                className={`customer-select ${errors.status ? 'error-select' : ''}`}
                classNamePrefix="customer-select"
                isClearable
                isSearchable
                name="status"
              />
              {errors.status && <div className="invoice-error-message">{errors.status}</div>}
            </div>

            <div className="invoice-action-btn">
                <div className="invoice-action-btn-wrapper">
                    <button type="button" className="invoice-submit-btn invoice-preview-btn" onClick={handleCancel}>
                        <span className="invoice-submit-btn-text">Cancel</span>
                    </button>
                    <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                        {isLoading ? <div className="invoice-loader"></div> : <span className="invoice-submit-btn-text">Edit Invoice</span>}
                    </button>
                </div>
            </div>
          </form>
        </motion.div>
      </React.Fragment>
  );
};

export default EditCustomerForm;