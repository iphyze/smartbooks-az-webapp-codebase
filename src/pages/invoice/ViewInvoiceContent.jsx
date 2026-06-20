import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong, formatWithDecimals } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadInvoice from "./DownloadInvoice";
import useToastStore from "../../stores/useToastStore";
import printPdfDocument from "../../utils/printPdfDocument";
import api from "../../services/api";
import SendInvoiceModal from "../../components/modals/SendInvoiceModal";
import InvoiceActivityTimeline from "../../components/InvoiceActivityTimeline";
import InvoiceWorkflowModal from "../../components/modals/InvoiceWorkflowModal";
import RecordInvoicePaymentModal from "../../components/modals/RecordInvoicePaymentModal";
import ReverseInvoicePaymentModal from "../../components/modals/ReverseInvoicePaymentModal";
import InvoicePaymentPanel from "../../components/InvoicePaymentPanel";
import InvoiceReminderPanel from "../../components/InvoiceReminderPanel";
import InvoiceReminderModal from "../../components/modals/InvoiceReminderModal";
import "./InvoiceWorkflow.css";

const ViewInvoiceContent = ({ invoice, onRefresh }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  if (!invoice) {
    return null; 
  }

  const handleEditInvoice = (invoice) => {
    navigate(`/invoice/edit/${invoice.invoice_number}`, { state: { invoice } });
  };

  const handlePrintInvoice = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      await printPdfDocument(
        <DownloadInvoice invoice={invoice} />,
        `Preparing invoice AZ-${invoice?.invoice_number || ""}`
      );
    } catch (error) {
      showToast(error?.message || "The invoice could not be prepared for printing.", "error");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDuplicateInvoice = async () => {
    if (isDuplicating) return;

    setIsDuplicating(true);
    try {
      const response = await api.post("/invoice/duplicate-invoice", {
        invoice_number: invoice.invoice_number,
      });
      const draftUuid = response.data?.data?.draft_uuid;
      if (!draftUuid) throw new Error("Duplicate draft was not returned.");
      showToast("Duplicate invoice draft prepared", "success");
      navigate(`/invoice/create?draft=${encodeURIComponent(draftUuid)}`);
    } catch (error) {
      showToast(error.response?.data?.message || error.message || "Invoice could not be duplicated", "error");
    } finally {
      setIsDuplicating(false);
    }
  };

  const workflowStatus = invoice?.workflow_status || "Issued";
  const isWorkflowLocked = ["Cancelled", "Void"].includes(workflowStatus);

  const total_amount = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const total_discount = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.discount || 0), 0);
  const total_vat = (invoice.items || []).reduce((sum, item) => sum + parseFloat(item.vat || 0), 0);


  const statusType = (type) => {
    switch (type){
      case 'Paid':
        return 'paid';
      case 'Pending':
        return 'pending';
      case 'Partially Paid':
        return 'partial';
      case 'Overdue':
        return 'overdue';
      case 'Cancelled':
        return 'cancelled';
      default:
        return null;
    }
  };

  return (
    <>
    <motion.div variants={fadeInUp} initial="hidden" 
      animate="show" transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
      className={`view-content-box vc-document-view vc-invoice-view theme-${theme}`}
    >
      <div className="vc-invoice-document-top">
        <img src={CompanyLogo} alt="Company Logo" className="company-logo"/>

        <div className="vc-button-box vc-invoice-action-toolbar" aria-label="Invoice actions">
          <div className="vc-invoice-action-group vc-invoice-action-group--primary">
            <button
              className="vc-action-btn vc-edit-btn"
              onClick={() => handleEditInvoice(invoice)}
              disabled={isWorkflowLocked}
              title={isWorkflowLocked ? `A ${workflowStatus.toLowerCase()} invoice cannot be edited` : "Edit invoice"}
            >
              <span className="vc-action-btn__icon fas fa-pen" aria-hidden="true"></span>
              <span>Edit invoice</span>
            </button>
            <button
              type="button"
              className="vc-action-btn vc-send-btn"
              onClick={() => setShowSendModal(true)}
              disabled={isWorkflowLocked}
              title={isWorkflowLocked ? `A ${workflowStatus.toLowerCase()} invoice cannot be sent` : "Send invoice"}
            >
              <span className="vc-action-btn__icon fas fa-paper-plane" aria-hidden="true"></span>
              <span>Send invoice</span>
            </button>
          </div>

          <div className="vc-invoice-action-group vc-invoice-action-group--management">
            <button
              type="button"
              className="vc-action-btn vc-duplicate-btn"
              onClick={handleDuplicateInvoice}
              disabled={isDuplicating}
            >
              <span className={`vc-action-btn__icon fas ${isDuplicating ? "fa-spinner fa-spin" : "fa-copy"}`} aria-hidden="true"></span>
              <span>{isDuplicating ? "Preparing…" : "Duplicate"}</span>
            </button>
            <button
              type="button"
              className="vc-action-btn vc-payment-btn"
              onClick={() => setShowPaymentModal(true)}
              disabled={isWorkflowLocked || Number(invoice?.payment_summary?.balance_due ?? invoice?.invoice_amount ?? 0) <= 0}
              title={isWorkflowLocked ? `A ${workflowStatus.toLowerCase()} invoice cannot receive payments` : "Record a client payment"}
            >
              <span className="vc-action-btn__icon fas fa-wallet" aria-hidden="true"></span>
              <span>{Number(invoice?.payment_summary?.balance_due ?? invoice?.invoice_amount ?? 0) <= 0 ? "Fully paid" : "Record payment"}</span>
            </button>
            <button
              type="button"
              className="vc-action-btn vc-reminder-btn"
              onClick={() => setShowReminderModal(true)}
              disabled={isWorkflowLocked || Number(invoice?.payment_summary?.balance_due ?? invoice?.invoice_amount ?? 0) <= 0}
              title={isWorkflowLocked ? `A ${workflowStatus.toLowerCase()} invoice cannot receive reminders` : "Send or schedule a payment reminder"}
            >
              <span className="vc-action-btn__icon fas fa-bell" aria-hidden="true"></span>
              <span>Payment reminder</span>
            </button>
            <button
              type="button"
              className="vc-action-btn vc-workflow-btn"
              onClick={() => setShowWorkflowModal(true)}
            >
              <span className="vc-action-btn__icon fas fa-route" aria-hidden="true"></span>
              <span>Manage status</span>
            </button>
          </div>

          <div className="vc-invoice-action-group vc-invoice-action-group--document">
            <button
              type="button"
              className="vc-action-btn vc-print-btn"
              onClick={handlePrintInvoice}
              disabled={isPrinting}
            >
              <span className={`vc-action-btn__icon fas ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`} aria-hidden="true"></span>
              <span>{isPrinting ? "Preparing…" : "Print PDF"}</span>
            </button>
            <PDFDownloadLink
              document={<DownloadInvoice invoice={invoice} />}
              className="vc-action-btn vc-export-btn"
              fileName={`Invoice ${invoice?.invoice_number} - ${invoice?.clients_name}.pdf`}
            >
              <span className="vc-action-btn__icon fas fa-file-pdf" aria-hidden="true"></span>
              <span>Download PDF</span>
            </PDFDownloadLink>
          </div>
        </div>
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
            <div className="vc-header-title">Payment Terms:</div>
            <div className="vc-header-text">{invoice?.payment_terms_label || "Custom due date"}</div>
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
          <div className="vc-invoice-status-stack" aria-label="Invoice statuses">
            <span className={`inv-stat inv-stat-${statusType(invoice?.status)}`}>{invoice?.status}</span>
            <span className={`invoice-workflow-badge invoice-workflow-badge--${String(invoice?.workflow_status || "Issued").toLowerCase()}`}>
              {invoice?.workflow_status || "Issued"}
            </span>
          </div>
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

          <div className="vc-invoice-totals">

              
              {total_vat > 0 && total_discount > 0 &&
                <div className="vc-invoice-total-row">
                  <div className="vc-invoice-total-label">Subtotal</div>
                  <div className="vc-invoice-total-value">{formatWithDecimals(total_amount)}</div>
                </div>
              }

              {total_discount > 0 &&
                <div className="vc-invoice-total-row">
                  <div className="vc-invoice-total-label">Discount</div>
                  <div className="vc-invoice-total-value">{formatWithDecimals(total_discount)}</div>
                </div>
              }

              {total_vat > 0 &&
                <div className="vc-invoice-total-row">
                  <div className="vc-invoice-total-label">VAT (7.5%)</div>
                  <div className="vc-invoice-total-value">{formatWithDecimals(total_vat)}</div>
                </div>
              }


              <div className="vc-invoice-total-row invoice-grand-total">
                <div className="vc-invoice-total-label inv-bold large-text">Total</div>
                <div className="vc-invoice-total-value inv-bold large-text">{formatCurrencyDecimals(invoice.invoice_amount, invoice.currency)}</div>
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
          <div className="vc-signature-line" aria-hidden="true" />
          <div className="vc-signature-text">Authorized Signatory</div>
        </div>

        <div className="vc-signature-group vc-signature-group-right">
          <div className="vc-signature-line" aria-hidden="true" />
          <div className="vc-signature-text">Authorized Signatory</div>
        </div>
      </div>

      <div className="vc-thanks-text">Thank you for doing business with us!</div>

    </motion.div>

    <InvoicePaymentPanel
      invoice={invoice}
      onRecordPayment={() => setShowPaymentModal(true)}
      onReversePayment={(payment) => setPaymentToReverse(payment)}
    />

    <InvoiceReminderPanel
      invoice={invoice}
      onCreateReminder={() => setShowReminderModal(true)}
      onRefresh={onRefresh}
    />

    <InvoiceActivityTimeline
      invoiceNumber={invoice?.invoice_number}
      initialActivities={invoice?.activity_history || []}
      initialMeta={invoice?.activity_meta || {}}
    />

    <AnimatePresence>
      {showSendModal && (
        <SendInvoiceModal
          invoice={invoice}
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSent={onRefresh}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showWorkflowModal && (
        <InvoiceWorkflowModal
          invoice={invoice}
          isOpen={showWorkflowModal}
          onClose={() => setShowWorkflowModal(false)}
          onUpdated={onRefresh}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showPaymentModal && (
        <RecordInvoicePaymentModal
          invoice={invoice}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onRecorded={onRefresh}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {showReminderModal && (
        <InvoiceReminderModal
          invoice={invoice}
          isOpen={showReminderModal}
          onClose={() => setShowReminderModal(false)}
          onSaved={onRefresh}
        />
      )}
    </AnimatePresence>

    <AnimatePresence>
      {paymentToReverse && (
        <ReverseInvoicePaymentModal
          payment={paymentToReverse}
          isOpen={Boolean(paymentToReverse)}
          onClose={() => setPaymentToReverse(null)}
          onReversed={onRefresh}
        />
      )}
    </AnimatePresence>
    </>
  );
};

export default ViewInvoiceContent;