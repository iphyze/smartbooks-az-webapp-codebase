import React from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong, formatWithDecimals } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadInvoice from "./DownloadInvoice";

const ViewInvoiceContent = ({ invoice }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!invoice) {
    return null; 
  }

  const handleEditInvoice = (invoice) => {
    navigate(`/invoice/edit/${invoice.invoice_number}`, { state: { invoice } });
  };

  const total_amount = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const total_discount = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.discount || 0), 0);
  const total_vat = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.vat || 0), 0);


  const statusType = (type) => {
    switch (type){
      case 'Paid':
        return 'paid';
      case 'Pending':
        return 'pending';
      case 'Overdue':
        return 'overdue';
      case 'Cancelled':
        return 'cancelled';
      default:
        return null;
    }
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" 
      animate="show" transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
      className={`view-content-box theme-${theme}`}
    >
      <img src={CompanyLogo} alt="Company Logo" className="company-logo"/>

      <div className="vc-button-box">
          <button className="vc-edit-btn" onClick={() => handleEditInvoice(invoice)}><span className="fas fa-pen"></span> Edit invoice</button>
          <PDFDownloadLink
            document={<DownloadInvoice invoice={invoice}/>} 
            className="vc-export-btn" 
            fileName={`Invoice ${invoice?.invoice_number} - ${invoice?.clients_name}.pdf`}
          >
            <span className="fas fa-file-pdf"></span> Download Pdf
          </PDFDownloadLink>
      </div>

      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          
          <div className="vc-header-group">
            <div className="vc-header-title">Invoice Date:</div>
            <div className="vc-header-text">{formatDateLong(invoice?.invoice_date)}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Invoice Due Date:</div>
            <div className="vc-header-text">{formatDateLong(invoice?.due_date)}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Office:</div>
            <div className="vc-header-text">{invoice?.company_data?.office_address || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Email:</div>
            <div className="vc-header-text">{invoice?.company_data?.email || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Tel:</div>
            <div className="vc-header-text">{invoice?.company_data?.tel || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title vc-header-title-tcolor">Billed To</div>
            {/* <div className="vc-header-text">{invoice.invoice_currency || 'N/A'}</div> */}
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Company's Name:</div>
            <div className="vc-header-text">{invoice?.clients_name || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Company's Address:</div>
            <div className="vc-header-text">{invoice?.clients_data?.clients_address || 'N/A'}</div>
          </div>
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type vc-inv-type">SALES INVOICE #</div>
          <div className="vc-voucher-type-number vc-inv-type-number">AZ-{invoice?.invoice_number || 'N/A'}</div>
          <span className={`inv-stat inv-stat-${statusType(invoice?.status)}`}>{invoice?.status}</span>
          {invoice?.tin_number === "Yes" &&
            <div className="vc-voucher-type vc-inv-tin">TIN: {invoice?.company_data?.tin}</div>
          }
        </div>
      </div>


      <div className="vc-table">
        <div className="vc-table-wrapper">
          
          <div className="vc-table-flexbox vc-table-header vc-inv-table">
              <div className="vc-table-data vc-tb-inv-sn">S/N</div>
              <div className="vc-table-data vc-tb-inv-desc">Description of Services</div>
              {total_discount > 0 && <div className="vc-table-data vc-tb-inv-disc">Discount (%)</div>}
              {total_vat > 0 && <div className="vc-table-data vc-tb-inv-vat">VAT (%)</div>}
              <div className="vc-table-data vc-tb-inv-amt">Amount ({invoice?.currency || 'N/A'})</div>
          </div>

          {invoice?.items.length !== "" &&

            invoice?.items.map((rows, index) => {
              const {
                id, invoice_number, clients_name, description, amount, discount, discount_percent,
                vat, vat_percent, total,  
              } = rows;

              return(
                  <div className="vc-table-flexbox vc-table-body vc-inv-table" key={index + 1}>
                    <div className="vc-table-data vc-tb-inv-sn">{index + 1 || ''}</div>
                    <div className="vc-table-data vc-tb-inv-desc">{description || ''}</div>
                    {total_discount > 0 && 
                    <div className="vc-table-data vc-tb-inv-disc">{formatWithDecimals(discount_percent) || ''}%</div>
                    }
                    {total_vat > 0 && 
                    <div className="vc-table-data vc-tb-inv-vat">{formatWithDecimals(vat_percent) || ''}%</div>
                    }
                    <div className="vc-table-data vc-tb-inv-amt vc-boldtext">{formatCurrencyDecimals(amount, invoice?.currency)}</div>
                  </div>
              );

            })

          }

        </div>
      </div>

      <div className="vc-summary-table">
          
          <div className="vc-summary-col" />

          <div className="invoice-totals invoice-summary-grid vc-summary-grid">
              
              <div className="invoice-totals">
              
              {total_vat > 0 && total_discount > 0 &&
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Subtotal</div>
                  <div className="invoice-total-value">{formatWithDecimals(total_amount)}</div>
                </div>
              }

              {total_discount > 0 &&
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Discount</div>
                  <div className="invoice-total-value">{formatWithDecimals(total_discount)}</div>
                </div>
              }

              {total_vat > 0 &&
                <div className="invoice-total-row">
                  <div className="invoice-total-label">VAT (7.5%)</div>
                  <div className="invoice-total-value">{formatWithDecimals(total_vat)}</div>
                </div>
              }


              <div className="invoice-total-row invoice-grand-total">
                <div className="invoice-total-label inv-bold large-text">Total</div>
                <div className="invoice-total-value inv-bold large-text">{formatCurrencyDecimals(invoice.invoice_amount, invoice.currency)}</div>
              </div>
            </div>

            </div>

      </div>
      

      {invoice?.bank_name !== "" && invoice?.bank_name !== "N/A" &&

      <div className="vc-payment-details-box">
        <div className="vc-payment-heading">Kindly make your payment into:</div>
        <div className="vc-payment-group">
          <div className="vc-payment-title">Account Name:</div>
          <div className="vc-payment-text">{invoice?.account_name}</div>
        </div>
        <div className="vc-payment-group">
          <div className="vc-payment-title">Account Number:</div>
          <div className="vc-payment-text">{invoice?.account_number}</div>
        </div>
        <div className="vc-payment-group">
          <div className="vc-payment-title">Bank Name:</div>
          <div className="vc-payment-text">{invoice?.bank_name}</div>
        </div>
        <div className="vc-payment-group">
          <div className="vc-payment-title">Currency:</div>
          <div className="vc-payment-text">{invoice?.account_currency}</div>
        </div>
      </div>

      }


      <div className="vc-signature-box">
        <div className="vc-signature-group">
          <div className="vc-signature-line">_______________________</div>
          <div className="vc-signature-text">Authorized Signatory</div>
        </div>

        <div className="vc-signature-group vc-signature-group-right">
          <div className="vc-signature-line">_______________________</div>
          <div className="vc-signature-text">Authorized Signatory</div>
        </div>
      </div>

      <div className="vc-thanks-text">Thank you for doing business with us!</div>

    </motion.div>
  );
};

export default ViewInvoiceContent;