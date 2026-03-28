import React from "react";
import useThemeStore from "../../stores/useThemeStore";
import useClientStore from "../../stores/useClientStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadClient from "./DownloadClient"; // Updated Import

const ViewClientContent = ({ client }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  
  // Pull invoices and summary directly from the store to avoid complex prop drilling
  const invoices = useClientStore((state) => state.singleClientInvoices) || [];
  const summary = useClientStore((state) => state.singleClientSummary) || {};

  if (!client) {
    return null; 
  }

  const handleEditClient = () => {
    navigate(`/client/edit/${client.clients_id}`, { state: { client } });
  };

  const handleViewInvoice = (invoiceNumber) => {
    navigate(`/invoice/view/${invoiceNumber}`);
  };

  const statusType = (type) => {
    switch (type) {
      case 'Paid': return 'paid';
      case 'Pending': return 'pending';
      case 'Overdue': return 'overdue';
      case 'Cancelled': return 'cancelled';
      default: return null;
    }
  };

  return (
    <motion.div 
      variants={fadeInUp} 
      initial="hidden" 
      animate="show" 
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
      className={`view-content-box theme-${theme}`}
    >
      <img src={CompanyLogo} alt="Company Logo" className="company-logo"/>

      <div className="vc-button-box">
        <button className="vc-edit-btn" onClick={handleEditClient}>
          <span className="fas fa-pen"></span> Edit Client
        </button>
        <PDFDownloadLink
          document={<DownloadClient client={client} invoices={invoices} summary={summary}/>} 
          className="vc-export-btn" 
          fileName={`Client Profile - ${client?.clients_name || 'Client'}.pdf`}
        >
          <span className="fas fa-file-pdf"></span> Download Pdf
        </PDFDownloadLink>
      </div>

      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <div className="vc-header-group">
            <div className="vc-header-title">Client Name:</div>
            <div className="vc-header-text">{client.clients_name || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Client ID:</div>
            <div className="vc-header-text">{client.clients_id || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Email Address:</div>
            <div className="vc-header-text">{client.clients_email || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Phone Number:</div>
            <div className="vc-header-text">{client.clients_number || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Office Address:</div>
            <div className="vc-header-text">{client.clients_address || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created By:</div>
            <div className="vc-header-text">{client.created_by || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created On:</div>
            <div className="vc-header-text">{formatDateLong(client.created_at)}</div>
          </div>
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type vc-inv-type">CLIENT ID #</div>
          <div className="vc-voucher-type-number vc-inv-type-number">{client.clients_id || 'N/A'}</div>
        </div>
      </div>


      {/* ── FINANCIAL SUMMARY CARDS ── */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="vc-client-summary-section">
          <div className="vc-payment-heading">Financial Summary by currency</div>
          <div className="vc-client-summary-grid">
            {Object.entries(summary).map(([currency, data]) => (
              <div key={currency} className={`vc-client-summary-card theme-${theme}`}>
                <div className="vc-card-header">{currency} Invoices</div>
                <div className="vc-card-body">
                  <div className="vc-card-row pending">
                    <span>Pending ({data.pending_count || 0})</span>
                    <span>{formatCurrencyDecimals(data.pending_total || 0, currency)}</span>
                  </div>
                  <div className="vc-card-row paid">
                    <span>Paid ({data.paid_count || 0})</span>
                    <span>{formatCurrencyDecimals(data.paid_total || 0, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INVOICES TABLE ── */}
      <div className="vc-payment-heading" style={{ marginTop: '30px', marginBottom: '20px' }}>Associated Invoices ({invoices.length})</div>
      
      {invoices.length > 0 ? (
        <div className="vc-table">
          <div className="vc-table-wrapper">
            <div className="vc-table-flexbox vc-table-header vc-inv-table">
                <div className="vc-table-data vc-tb-inv-sn">S/N</div>
                <div className="vc-table-data vc-tb-inv-desc">Invoice #</div>
                <div className="vc-table-data vc-tb-inv-desc">Date</div>
                <div className="vc-table-data vc-tb-inv-disc">Currency</div>
                <div className="vc-table-data vc-tb-inv-amt">Amount</div>
                <div className="vc-table-data vc-tb-inv-vat">Status</div>
                <div className="vc-table-data vc-tb-inv-side">Action</div>
            </div>

            {invoices.map((inv, index) => (
              <div className="vc-table-flexbox vc-table-body vc-inv-table" key={inv.id || index}>
                <div className="vc-table-data vc-tb-inv-sn">{index + 1}</div>
                <div className="vc-table-data vc-tb-inv-desc" style={{cursor:'pointer'}} onClick={() => handleViewInvoice(inv.invoice_number)}>
                  <span className="vc-inv-link">AZ-{inv.invoice_number}</span>
                </div>
                <div className="vc-table-data vc-tb-inv-desc">{formatDateLong(inv.invoice_date)}</div>
                <div className="vc-table-data vc-tb-inv-disc">{inv.currency}</div>
                <div className="vc-table-data vc-tb-inv-amt vc-boldtext">{formatCurrencyDecimals(inv.invoice_amount, inv.currency)}</div>
                <div className="vc-table-data vc-tb-inv-vat">
                  <span className={`inv-stat inv-stat-${statusType(inv.status)}`} style={{padding: '5px 10px', fontSize: '11px'}}>
                    {inv.status}
                  </span>
                </div>
                <div className="vc-table-data vc-tb-inv-side">
                  <button className="btn-edit" title="View Invoice" onClick={() => handleViewInvoice(inv.invoice_number)}>
                    <span className="fas fa-eye"></span> 
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="vc-no-invoices-message">
          No invoices have been generated for this client yet.
        </div>
      )}

    </motion.div>
  );
};

export default ViewClientContent;