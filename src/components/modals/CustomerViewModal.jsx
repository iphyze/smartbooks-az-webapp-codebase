import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import Logo from '../../assets/images/digitInvoice/logo-dark.png';

const CustomerViewModal = ({ isOpen, onClose, customer }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !customer) return null;

  return (
    <div className="modal-overlay">
      <motion.div className="invoice-view-modal-content" ref={modalRef} initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} 
        exit={{ y: -100, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="invoice-paper">
          <div className="invoice-header">
            <div className="invoice-logo">
              <img src={Logo} alt="Logo" className="inv-details-logo"/>
            </div>
            <h2 className="invoice-title">Customer Details</h2>
          </div>
        
          <div className="invoice-main-body">
            <div className="invoice-details-body">
              <div className="inv-status-badge">
                <span className={`badge ${getStatusBadgeClass(customer.status)}`}>
                  <span className="fas fa-circle badge-size"></span> {customer.status}
                </span>
              </div>
              
              <div className="customer-info">
                <p className="customer-info-title">Customer Information:</p>
                <div className="table-flex-box">
                  <span className="fas fa-user-circle table-user"></span>
                  <p className="customer-info-text">{customer.name}</p>
                </div>
              </div>
              
              <div className="invoice-details-grid">
                <div className="invoice-det-cols">
                  <span className="label">Customer ID:</span>
                  <span className="value thick-value">{customer.id}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Email:</span>
                  <span className="value">{customer.email}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Phone:</span>
                  <span className="value">{customer.phone}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">TIN:</span>
                  <span className="value">{customer.tin}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Address:</span>
                  <span className="value">{customer.address || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">City:</span>
                  <span className="value">{customer.city || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">State/Province:</span>
                  <span className="value">{customer.state || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Country:</span>
                  <span className="value">{customer.country || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Postal Code:</span>
                  <span className="value">{customer.postalCode || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Registration Date:</span>
                  <span className="value">{customer.registrationDate || 'Not provided'}</span>
                </div>
                
                <div className="invoice-det-cols">
                  <span className="label">Last Updated:</span>
                  <span className="value">{customer.lastUpdated || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            <div className="invoice-footer">
              <button className="btn-edit" onClick={() => {
                onClose();
                // Navigate to edit page if needed
              }}>
                <span className="fas fa-pen"></span> &nbsp; Edit Customer
              </button>
            </div>
          </div>
          
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </motion.div>
    </div>
  );

  // Get status badge style
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Active':
        return 'badge-success';
      case 'Inactive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
};

export default CustomerViewModal;