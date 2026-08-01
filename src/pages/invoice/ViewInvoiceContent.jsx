import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useNavigate } from "react-router-dom";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import { formatCurrencyDecimals, formatDateLong, formatWithDecimals } from "../../utils/helper";
import { fadeInUp } from "../../utils/animation";
import printPdfDocument from "../../utils/printPdfDocument";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import api from "../../services/api";
import DownloadInvoice from "./DownloadInvoice";
import SendInvoiceModal from "../../components/modals/SendInvoiceModal";
import InvoiceActivityTimeline from "../../components/InvoiceActivityTimeline";
import InvoiceWorkflowModal from "../../components/modals/InvoiceWorkflowModal";
import RecordInvoicePaymentModal from "../../components/modals/RecordInvoicePaymentModal";
import ReverseInvoicePaymentModal from "../../components/modals/ReverseInvoicePaymentModal";
import InvoicePaymentPanel from "../../components/InvoicePaymentPanel";
import InvoiceReminderPanel from "../../components/InvoiceReminderPanel";
import InvoiceReminderModal from "../../components/modals/InvoiceReminderModal";
import "./InvoiceWorkflow.css";
import "./InvoiceView.css";

const LINE_BATCH = 10;

const toNumber = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = (value) => String(value || "pending").toLowerCase().replaceAll(" ", "-");

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
  const [visibleLineCount, setVisibleLineCount] = useState(LINE_BATCH);

  const items = useMemo(() => (Array.isArray(invoice?.items) ? invoice.items : []), [invoice?.items]);
  if (!invoice) return null;

  const paymentSummary = invoice.payment_summary || {};
  const total = toNumber(paymentSummary.invoice_total ?? invoice.invoice_amount);
  const paid = toNumber(paymentSummary.amount_paid ?? invoice.paid);
  const amountReceived = toNumber(paymentSummary.amount_received ?? paid);
  const balance = toNumber(paymentSummary.balance_due ?? Math.max(total - paid, 0));
  const progress = toNumber(paymentSummary.payment_progress ?? (total > 0 ? (paid / total) * 100 : 0));
  const totalAmount = items.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalDiscount = items.reduce((sum, item) => sum + toNumber(item.discount), 0);
  const totalVat = items.reduce((sum, item) => sum + toNumber(item.vat), 0);
  const totalWht = items.reduce((sum, item) => sum + toNumber(item.wht), 0);
  const workflowStatus = invoice.workflow_status || "Issued";
  const isWorkflowLocked = ["Cancelled", "Void"].includes(workflowStatus);
  const visibleItems = items.slice(0, visibleLineCount);
  const hasMoreLines = visibleLineCount < items.length;
  const invoiceReference = String(invoice.invoice_number || "").startsWith("AZ-")
    ? String(invoice.invoice_number)
    : `AZ-${invoice.invoice_number || ""}`;

  const handlePrintInvoice = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    try {
      await printPdfDocument(<DownloadInvoice invoice={invoice} />, `Preparing invoice ${invoiceReference}`);
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
      const response = await api.post("/invoice/duplicate-invoice", { invoice_number: invoice.invoice_number });
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

  return (
    <>
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`invoice-view-card theme-${theme}`}
      >
        <div className="invoice-view-card__glow" aria-hidden="true" />

        <header className="invoice-view-hero">
          <div className="invoice-view-identity">
            <div className="invoice-view-logo-wrap"><img src={CompanyLogo} alt="A to Z Consultancy" /></div>
            <div className="invoice-view-identity__copy">
              <span className="invoice-view-eyebrow"><i className="fas fa-file-invoice-dollar" />Sales invoice</span>
              <h2>{invoiceReference}</h2>
              <p>{invoice.project || "Professional services invoice"} · billed to {invoice.clients_name || "Unnamed client"}</p>
              <div className="invoice-view-badges">
                <span className={`invoice-view-badge invoice-view-badge--${statusClass(invoice.status)}`}><i className="fas fa-circle" />{invoice.status || "Pending"}</span>
                <span className={`invoice-view-badge invoice-view-badge--workflow-${statusClass(workflowStatus)}`}><i className="fas fa-route" />{workflowStatus}</span>
                <span className="invoice-view-badge invoice-view-badge--neutral"><i className="fas fa-coins" />{invoice.currency || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="invoice-view-actions" aria-label="Invoice actions">
            <button type="button" className="invoice-view-action invoice-view-action--secondary" onClick={() => navigate("/invoice/home")}><i className="fas fa-arrow-left" /><span>Back to invoices</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--primary" onClick={() => navigate(`/invoice/edit/${invoice.invoice_number}`, { state: { invoice } })} disabled={isWorkflowLocked}><i className="fas fa-pen-to-square" /><span>Edit invoice</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--send" onClick={() => setShowSendModal(true)} disabled={isWorkflowLocked}><i className="fas fa-paper-plane" /><span>Send</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--payment" onClick={() => setShowPaymentModal(true)} disabled={isWorkflowLocked || balance <= 0.009}><i className="fas fa-wallet" /><span>{balance <= 0.009 ? "Fully paid" : "Record payment"}</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--more" onClick={handleDuplicateInvoice} disabled={isDuplicating}><i className={`fas ${isDuplicating ? "fa-spinner fa-spin" : "fa-copy"}`} /><span>{isDuplicating ? "Preparing…" : "Duplicate"}</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--more" onClick={() => setShowReminderModal(true)} disabled={isWorkflowLocked || balance <= 0.009}><i className="fas fa-bell" /><span>Reminder</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--more" onClick={() => setShowWorkflowModal(true)}><i className="fas fa-route" /><span>Status</span></button>
            <button type="button" className="invoice-view-action invoice-view-action--print" onClick={handlePrintInvoice} disabled={isPrinting}><i className={`fas ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`} /><span>{isPrinting ? "Preparing…" : "Print PDF"}</span></button>
            <PDFDownloadLink document={<DownloadInvoice invoice={invoice} />} className="invoice-view-action invoice-view-action--download" fileName={`Invoice ${invoice.invoice_number} - ${invoice.clients_name}.pdf`}><i className="fas fa-file-pdf" /><span>Download PDF</span></PDFDownloadLink>
          </div>
        </header>

        <div className="invoice-view-highlight-grid">
          <article className="invoice-view-highlight"><span className="invoice-view-highlight__icon"><i className="fas fa-calendar-day" /></span><div><span>Invoice date</span><strong>{formatDateLong(invoice.invoice_date)}</strong></div></article>
          <article className="invoice-view-highlight"><span className="invoice-view-highlight__icon"><i className="fas fa-calendar-check" /></span><div><span>Due date</span><strong>{formatDateLong(invoice.due_date)}</strong></div></article>
          <article className="invoice-view-highlight"><span className="invoice-view-highlight__icon"><i className="fas fa-building" /></span><div><span>Client</span><strong>{invoice.clients_name || "Not recorded"}</strong></div></article>
          <article className="invoice-view-highlight"><span className="invoice-view-highlight__icon"><i className="fas fa-layer-group" /></span><div><span>Service lines</span><strong>{items.length} {items.length === 1 ? "item" : "items"}</strong></div></article>
        </div>

        <div className="invoice-view-financial-strip">
          <article><span>Invoice total</span><strong>{formatCurrencyDecimals(total, invoice.currency)}</strong></article>
          <article className="is-paid"><span>Amount received</span><strong>{formatCurrencyDecimals(amountReceived, invoice.currency)}</strong></article>
          <article className={balance > 0.009 ? "is-balance" : "is-settled"}><span>Balance due</span><strong>{formatCurrencyDecimals(balance, invoice.currency)}</strong></article>
          <article><span>Collection progress</span><strong>{Math.min(100, Math.max(0, Math.round(progress)))}%</strong><div className="invoice-view-progress"><i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div></article>
        </div>

        <section className="invoice-view-section">
          <div className="invoice-view-section-heading">
            <div className="invoice-view-section-heading__copy"><span className="invoice-view-section-heading__icon"><i className="fas fa-table-list" /></span><div><h3>Services and charges</h3><p>Line-by-line details included on this invoice.</p></div></div>
            <span className="invoice-view-section-heading__count">Showing {Math.min(visibleLineCount, items.length)} of {items.length}</span>
          </div>
          <div className="invoice-view-table-shell">
            <div className="invoice-view-table-scroll">
              <table className="invoice-view-table">
                <thead><tr><th>#</th><th>Description of service</th><th className="is-numeric">Amount</th><th className="is-numeric">Discount</th><th className="is-numeric">VAT</th><th className="is-numeric">WHT</th><th className="is-numeric">Line total</th></tr></thead>
                <tbody>
                  {visibleItems.length === 0 ? <tr><td colSpan="7" className="invoice-view-table__empty">No service lines were recorded for this invoice.</td></tr> : visibleItems.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="invoice-view-table__index">{index + 1}</td>
                      <td><strong className="invoice-view-service-name">{item.description || "Untitled service"}</strong></td>
                      <td className="is-numeric">{formatCurrencyDecimals(item.amount, invoice.currency)}</td>
                      <td className="is-numeric">{toNumber(item.discount) > 0 ? `${formatCurrencyDecimals(item.discount, invoice.currency)} (${formatWithDecimals(item.discount_percent)}%)` : "—"}</td>
                      <td className="is-numeric">{toNumber(item.vat) > 0 ? `${formatCurrencyDecimals(item.vat, invoice.currency)} (${formatWithDecimals(item.vat_percent)}%)` : "—"}</td>
                      <td className="is-numeric">{toNumber(item.wht) > 0 ? `${formatCurrencyDecimals(item.wht, invoice.currency)} (${formatWithDecimals(item.wht_percent)}%)` : "—"}</td>
                      <td className="is-numeric invoice-view-table__amount">{formatCurrencyDecimals(item.total, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMoreLines ? <div className="invoice-view-table-footer"><button type="button" onClick={() => setVisibleLineCount((count) => count + LINE_BATCH)}><i className="fas fa-chevron-down" />Show more services</button></div> : null}
          </div>
        </section>

        <div className="invoice-view-bottom-grid">
          <section className="invoice-view-panel">
            <div className="invoice-view-panel__heading"><span><i className="fas fa-address-card" /></span><div><h3>Invoice parties</h3><p>Issuer and billing information.</p></div></div>
            <div className="invoice-view-party-grid">
              <article><span>Issued by</span><strong>A to Z Consultancy Ltd</strong><p>{invoice.company_data?.office_address || "Address not recorded"}</p><small>{invoice.company_data?.email || "—"} · {invoice.company_data?.tel || "—"}</small></article>
              <article><span>Billed to</span><strong>{invoice.clients_name || "Not recorded"}</strong><p>{invoice.clients_data?.clients_address || "Address not recorded"}</p><small>{invoice.clients_data?.clients_email || "—"} · {invoice.clients_data?.clients_number || "—"}</small></article>
            </div>
          </section>

          <section className="invoice-view-panel">
            <div className="invoice-view-panel__heading"><span><i className="fas fa-calculator" /></span><div><h3>Invoice summary</h3><p>Compact totals and payment terms.</p></div></div>
            <div className="invoice-view-summary-list">
              <div><span>Gross service amount</span><strong>{formatCurrencyDecimals(totalAmount, invoice.currency)}</strong></div>
              <div><span>Discount</span><strong>{formatCurrencyDecimals(totalDiscount, invoice.currency)}</strong></div>
              <div><span>VAT</span><strong>{formatCurrencyDecimals(totalVat, invoice.currency)}</strong></div>
              <div><span>WHT</span><strong>{formatCurrencyDecimals(totalWht, invoice.currency)}</strong></div>
              <div className="is-total"><span>Total invoice</span><strong>{formatCurrencyDecimals(total, invoice.currency)}</strong></div>
              <div><span>Payment terms</span><strong>{invoice.payment_terms_label || "Custom due date"}</strong></div>
            </div>
          </section>
        </div>

        <div className="invoice-view-bottom-grid invoice-view-bottom-grid--secondary">
          <section className="invoice-view-panel">
            <div className="invoice-view-panel__heading"><span><i className="fas fa-building-columns" /></span><div><h3>Payment instructions</h3><p>Bank details shown to the client.</p></div></div>
            <div className="invoice-view-detail-list">
              <div><span>Account name</span><strong>{invoice.account_name || "Not provided"}</strong></div>
              <div><span>Account number</span><strong>{invoice.account_number || "Not provided"}</strong></div>
              <div><span>Bank</span><strong>{invoice.bank_name || "Not provided"}</strong></div>
              <div><span>Currency</span><strong>{invoice.account_currency || invoice.currency || "—"}</strong></div>
            </div>
          </section>
          <section className="invoice-view-panel">
            <div className="invoice-view-panel__heading"><span><i className="fas fa-clock-rotate-left" /></span><div><h3>Invoice history</h3><p>Essential creation and update information.</p></div></div>
            <div className="invoice-view-audit-grid">
              <div><span>Created by</span><strong>{invoice.created_by || "Not recorded"}</strong></div>
              <div><span>Created at</span><strong>{formatDateTime(invoice.created_at)}</strong></div>
              <div><span>Last updated by</span><strong>{invoice.updated_by || "Not recorded"}</strong></div>
              <div><span>Last updated at</span><strong>{formatDateTime(invoice.updated_at)}</strong></div>
            </div>
          </section>
        </div>
      </motion.section>

      <InvoicePaymentPanel invoice={invoice} onRecordPayment={() => setShowPaymentModal(true)} onReversePayment={(payment) => setPaymentToReverse(payment)} />
      <InvoiceReminderPanel invoice={invoice} onCreateReminder={() => setShowReminderModal(true)} onRefresh={onRefresh} />
      <InvoiceActivityTimeline invoiceNumber={invoice.invoice_number} initialActivities={invoice.activity_history || []} initialMeta={invoice.activity_meta || {}} />

      <AnimatePresence>{showSendModal && <SendInvoiceModal invoice={invoice} isOpen={showSendModal} onClose={() => setShowSendModal(false)} onSent={onRefresh} />}</AnimatePresence>
      <AnimatePresence>{showWorkflowModal && <InvoiceWorkflowModal invoice={invoice} isOpen={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} onUpdated={onRefresh} />}</AnimatePresence>
      <AnimatePresence>{showPaymentModal && <RecordInvoicePaymentModal invoice={invoice} isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onRecorded={onRefresh} />}</AnimatePresence>
      <AnimatePresence>{showReminderModal && <InvoiceReminderModal invoice={invoice} isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} onSaved={onRefresh} />}</AnimatePresence>
      <AnimatePresence>{paymentToReverse && <ReverseInvoicePaymentModal payment={paymentToReverse} isOpen={Boolean(paymentToReverse)} onClose={() => setPaymentToReverse(null)} onReversed={onRefresh} />}</AnimatePresence>
    </>
  );
};

export default ViewInvoiceContent;
