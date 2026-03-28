import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { formatWithDecimals } from "../../utils/helper";
import Logo from '../../assets/images/digitInvoice/logo-dark.png';

const InvoiceViewModal = ({ isOpen, onClose, invoice }) => {
  const { theme } = useThemeStore();
  const modalRef = useRef(null);

  // console.log(invoice);

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

  // Calculate totals from actual invoice items
const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    // Using discountAmount directly (not as percentage)
    return sum + item.discountAmount;
  }, 0);
  const subtotalAfterDiscount = subtotal - totalDiscount;
  const totalVat = items.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const itemDiscount = item.discountAmount;
    const discountedTotal = itemTotal - itemDiscount;
    return sum + (discountedTotal * (item.vatPercent / 100));
  }, 0);
  const total = subtotalAfterDiscount + totalVat;
  
  return { subtotal, totalDiscount, totalVat, total };
};

  if (!isOpen || !invoice) return null;

  // Calculate totals from actual invoice items
  const totals = calculateTotals(invoice.items || []);

  return (
    <div className="modal-overlay">
      <motion.div 
        className="invoice-view-modal-content" 
        ref={modalRef}
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="invoice-paper">
          <div className="invoice-header">
            <div className="invoice-logo">
              <img src={Logo} alt="Logo" className="inv-details-logo"/>
            </div>
          </div>
        
          <div className="invoice-main-body">
            <div className="invoice-details-body">

               <div className="invoice-details">
                <div className="invoice-det-cols">
                    <span className="label">Invoice No:</span>
                    <span className="value thick-value">{invoice.invoiceNo}</span>
                </div>
                <div className="invoice-det-cols">
                    <span className="label">Date Issued:</span>
                    <span className="value">{invoice.dateIssued}</span>
                </div>
                <div className="invoice-det-cols">
                    <span className="label">Due Date:</span>
                    <span className="value">{invoice.dueDate}</span>
                </div>
                </div>

                <div className="inv-status-badge">
                    <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                    {invoice.status}
                    </span>
                </div>
              
              <div className="customer-info">
                <p className="customer-info-title">Billed To:</p> 
                <p className="customer-info-text">{invoice.customer}</p>
                {/* {invoice.customerEmail && <p className="customer-info-text">{invoice.customerEmail}</p>}
                {invoice.customerPhone && <p className="customer-info-text">{invoice.customerPhone}</p>}
                {invoice.customerTin && <p className="customer-info-text">TIN: {invoice.customerTin}</p>} */}
              </div>
              
              <div className="invoice-details-table-wrapper">
                <div className="inv-detailt-tab">
                  <table className="invoice-details-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit unitPrice</th>
                        <th>Discount</th>
                        <th>VAT %</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items && invoice.items.map((item, index) => {
                        // Calculate values for this item
                        const itemTotal = item.unitPrice * item.quantity;
                        const discountAmount = item.discountAmount; // Already an absolute value
                        const afterDiscount = itemTotal - discountAmount;
                        const vatAmount = afterDiscount * (item.vatPercent / 100);
                        const lineTotal = afterDiscount + vatAmount;
                        
                        return (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatWithDecimals(item.unitPrice)}</td>
                            <td>{formatWithDecimals(discountAmount)}</td>
                            <td>{item.vatPercent}%</td>
                            <td>{formatWithDecimals(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="invoice-details-summary">
                <div className="summary-row">
                  <span className="details-summary-title">Subtotal</span>
                  <span className="details-summary-amount">{formatWithDecimals(totals.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span className="details-summary-title">Discount</span>
                  <span className="details-summary-amount">
                    {totals.totalDiscount > 0 ? `(${formatWithDecimals(totals.totalDiscount)})` : formatWithDecimals(totals.totalDiscount)}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="details-summary-title">VAT</span>
                  <span className="details-summary-amount">{formatWithDecimals(totals.totalVat)}</span>
                </div>
                <div className="summary-row total">
                  <span className="details-summary-title">Total</span>
                  <span className="details-summary-amount">{formatWithDecimals(totals.total)}</span>
                </div>
              </div>
            </div>
            
            <div className="invoice-footer">
                <p className="invoice-duration">Payment is due within 15 days</p>
                <p className="invoice-thanks">Thank you for your business!</p>
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
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
};

export default InvoiceViewModal;