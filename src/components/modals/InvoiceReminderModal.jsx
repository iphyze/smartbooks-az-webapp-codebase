import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../services/api";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import "../../pages/invoice/InvoiceWorkflow.css";

const REMINDER_KINDS = ["Friendly", "Due Today", "Overdue", "Final"];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const buildMessage = (invoice, kind) => {
  const invoiceNumber = invoice?.invoice_number || "";
  const dueDate = formatDate(invoice?.due_date);
  const balance = formatMoney(invoice?.payment_summary?.balance_due ?? invoice?.invoice_amount ?? 0);
  const currency = invoice?.currency || "";

  switch (kind) {
    case "Due Today":
      return `Invoice AZ-${invoiceNumber} is due today. Kindly arrange payment of ${currency} ${balance} using the payment details supplied on the invoice.`;
    case "Overdue":
      return `Our records show that invoice AZ-${invoiceNumber}, due on ${dueDate}, remains outstanding with a balance of ${currency} ${balance}. Kindly arrange payment at your earliest convenience or let us know if payment has already been made.`;
    case "Final":
      return `This is a final reminder that invoice AZ-${invoiceNumber}, due on ${dueDate}, remains outstanding with a balance of ${currency} ${balance}. Please arrange settlement or contact us immediately if there is an issue requiring attention.`;
    default:
      return `This is a friendly reminder that invoice AZ-${invoiceNumber} has an outstanding balance of ${currency} ${balance}, due on ${dueDate}. Kindly arrange payment by the due date shown on the invoice.`;
  }
};

const buildDefaultScheduleDate = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
};

const formatDateTimeForApi = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const InvoiceReminderModal = ({ invoice, isOpen, onClose, onSaved }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [mode, setMode] = useState("send_now");
  const [kind, setKind] = useState(invoice?.status === "Overdue" ? "Overdue" : "Friendly");
  const [recipient, setRecipient] = useState(invoice?.clients_data?.clients_email || "");
  const [subject, setSubject] = useState(`Payment reminder: Invoice AZ-${invoice?.invoice_number || ""}`);
  const [message, setMessage] = useState(() => buildMessage(invoice, invoice?.status === "Overdue" ? "Overdue" : "Friendly"));
  const [scheduledFor, setScheduledFor] = useState(buildDefaultScheduleDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const balance = useMemo(
    () => Number(invoice?.payment_summary?.balance_due ?? Math.max(Number(invoice?.invoice_amount || 0) - Number(invoice?.paid || 0), 0)),
    [invoice]
  );

  if (!isOpen) return null;

  const handleKindChange = (nextKind) => {
    setKind(nextKind);
    setMessage(buildMessage(invoice, nextKind));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!recipient.trim()) {
      setError("Enter the client email address.");
      return;
    }
    if (!subject.trim()) {
      setError("Enter the reminder subject.");
      return;
    }
    if (mode === "schedule" && (!(scheduledFor instanceof Date) || Number.isNaN(scheduledFor.getTime()))) {
      setError("Select when the reminder should be sent.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/invoice/create-reminder", {
        invoice_number: invoice.invoice_number,
        mode,
        reminder_kind: kind,
        recipient_email: recipient.trim(),
        subject: subject.trim(),
        message: message.trim(),
        scheduled_for: mode === "schedule" ? formatDateTimeForApi(scheduledFor) : null,
      });
      showToast(response.data?.message || (mode === "schedule" ? "Reminder scheduled" : "Reminder sent"), "success");
      await onSaved?.();
      onClose();
    } catch (requestError) {
      const messageText = requestError.response?.data?.message || requestError.message || "The reminder could not be processed.";
      setError(messageText);
      showToast(messageText, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`invoice-mail-modal invoice-reminder-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="invoice-reminder-title">
      <button type="button" className="invoice-mail-modal__backdrop" onClick={isSubmitting ? undefined : onClose} aria-label="Close reminder modal" />
      <motion.form
        className="invoice-mail-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ duration: 0.2 }}
      >
        <header className="invoice-mail-modal__header">
          <div className="invoice-mail-modal__heading">
            <span className="invoice-mail-modal__heading-icon fas fa-bell" aria-hidden="true" />
            <div>
              <span className="invoice-mail-modal__eyebrow">Collections follow-up</span>
              <h2 id="invoice-reminder-title">Payment reminder for AZ-{invoice?.invoice_number}</h2>
              <p>Send a reminder immediately or schedule it for a later date.</p>
            </div>
          </div>
          <button type="button" className="invoice-mail-modal__close" onClick={onClose} disabled={isSubmitting} aria-label="Close">
            <span className="fas fa-times" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-mail-modal__body">
          <div className="invoice-reminder-modal__balance">
            <span>Outstanding balance</span>
            <strong><small>{invoice?.currency}</small>{formatMoney(balance)}</strong>
          </div>

          <div className="invoice-reminder-modal__mode" role="tablist" aria-label="Reminder delivery mode">
            <button type="button" className={mode === "send_now" ? "is-active" : ""} onClick={() => setMode("send_now")}>Send now</button>
            <button type="button" className={mode === "schedule" ? "is-active" : ""} onClick={() => setMode("schedule")}>Schedule</button>
          </div>

          <div className="invoice-reminder-modal__kinds" aria-label="Reminder type">
            {REMINDER_KINDS.map((option) => (
              <button type="button" key={option} className={kind === option ? "is-active" : ""} onClick={() => handleKindChange(option)}>
                {option}
              </button>
            ))}
          </div>

          <div className="invoice-mail-modal__field-grid">
            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Recipient email</span>
              <div className="invoice-mail-modal__input-wrap">
                <span className="fas fa-envelope" aria-hidden="true" />
                <input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} autoComplete="email" disabled={isSubmitting} />
              </div>
            </label>

            {mode === "schedule" ? (
              <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
                <span>Send on</span>
                <div className="invoice-reminder-modal__date-picker">
                  <span className="fas fa-calendar-days" aria-hidden="true" />
                  <DatePicker
                    selected={scheduledFor}
                    onChange={(date) => setScheduledFor(date)}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    showTimeSelect
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="Select reminder date and time"
                    calendarClassName={`smartbooks-datepicker-calendar invoice-reminder-datepicker-calendar theme-${theme}`}
                    popperClassName="smartbooks-datepicker-popper invoice-reminder-datepicker-popper"
                    portalId="smartbooks-datepicker-portal"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
                <small className="invoice-reminder-modal__date-hint">Choose the date and exact time the reminder should be delivered.</small>
              </label>
            ) : null}

            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Subject</span>
              <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={255} disabled={isSubmitting} />
            </label>

            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Message <small>Optional — a professional default is used when blank</small></span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={3000} disabled={isSubmitting} />
            </label>
          </div>

          {error ? <div className="invoice-reminder-modal__error"><span className="fas fa-circle-exclamation" aria-hidden="true" />{error}</div> : null}
        </div>

        <footer className="invoice-mail-modal__footer">
          <button type="button" className="invoice-mail-modal__cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="invoice-mail-modal__submit" disabled={isSubmitting}>
            <span className={`fas ${isSubmitting ? "fa-spinner fa-spin" : mode === "schedule" ? "fa-calendar-check" : "fa-paper-plane"}`} aria-hidden="true" />
            {isSubmitting ? "Processing…" : mode === "schedule" ? "Schedule reminder" : "Send reminder"}
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default InvoiceReminderModal;
