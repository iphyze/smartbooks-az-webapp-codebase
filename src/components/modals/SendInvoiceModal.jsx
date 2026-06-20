import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { pdf } from "@react-pdf/renderer";
import api from "../../services/api";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import DownloadInvoice from "../../pages/invoice/DownloadInvoice";
import "../../pages/invoice/InvoiceWorkflow.css";

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const splitEmails = (value) => value
  .split(/[,;\s]+/)
  .map((email) => email.trim())
  .filter(Boolean);

const SendInvoiceModal = ({ invoice, isOpen, onClose, onSent }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const defaultRecipient = invoice?.clients_data?.clients_email || "";
  const defaultSubject = `Invoice AZ-${invoice?.invoice_number || ""} from A to Z Consultancy Ltd`;

  const [form, setForm] = useState({
    recipient_email: defaultRecipient,
    cc_emails: "",
    bcc_emails: "",
    subject: defaultSubject,
    message: "",
    attach_pdf: true,
  });
  const [isSending, setIsSending] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const canSend = useMemo(
    () => form.recipient_email.trim() !== "" && form.subject.trim() !== "",
    [form.recipient_email, form.subject]
  );

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setDeliveryError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSend || isSending) return;

    setIsSending(true);
    setDeliveryError("");

    try {
      let pdfBase64 = "";
      if (form.attach_pdf) {
        const blob = await pdf(<DownloadInvoice invoice={invoice} />).toBlob();
        pdfBase64 = await blobToBase64(blob);
      }

      const response = await api.post("/invoice/send-invoice", {
        invoice_number: invoice.invoice_number,
        recipient_email: form.recipient_email.trim(),
        cc_emails: splitEmails(form.cc_emails),
        bcc_emails: splitEmails(form.bcc_emails),
        subject: form.subject.trim(),
        message: form.message.trim(),
        attach_pdf: form.attach_pdf,
        pdf_base64: pdfBase64 || undefined,
      });

      showToast(response.data?.message || "Invoice sent successfully", "success");
      onSent?.();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message
        || (error.code === "ECONNABORTED"
          ? "The mail server took too long to respond. Please verify the SMTP settings and try again."
          : "The invoice email could not be sent.");

      setDeliveryError(message);
      showToast(message, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`invoice-mail-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="send-invoice-title">
      <button type="button" className="invoice-mail-modal__backdrop" onClick={isSending ? undefined : onClose} aria-label="Close send invoice modal" />

      <motion.form
        className="invoice-mail-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="invoice-mail-modal__header">
          <div className="invoice-mail-modal__heading">
            <span className="invoice-mail-modal__heading-icon fas fa-paper-plane" aria-hidden="true" />
            <div>
              <span className="invoice-mail-modal__eyebrow">Invoice delivery</span>
              <h2 id="send-invoice-title">Send invoice AZ-{invoice?.invoice_number}</h2>
              <p>Send a branded email and optionally attach the existing PDF invoice.</p>
            </div>
          </div>
          <button type="button" className="invoice-mail-modal__close" onClick={onClose} disabled={isSending} aria-label="Close modal">
            <span className="fas fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-mail-modal__body">
          {deliveryError && (
            <div className="invoice-mail-modal__error" role="alert">
              <span className="fas fa-circle-exclamation" aria-hidden="true" />
              <span>{deliveryError}</span>
            </div>
          )}

          <div className="invoice-mail-modal__field-grid">
            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Recipient email</span>
              <div className="invoice-mail-modal__input-wrap">
                <span className="fas fa-envelope" aria-hidden="true" />
                <input
                  type="email"
                  value={form.recipient_email}
                  onChange={(event) => updateField("recipient_email", event.target.value)}
                  placeholder="client@example.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="invoice-mail-modal__field">
              <span>CC <small>Optional</small></span>
              <input
                type="text"
                value={form.cc_emails}
                onChange={(event) => updateField("cc_emails", event.target.value)}
                placeholder="Separate emails with commas"
                autoComplete="off"
              />
            </label>

            <label className="invoice-mail-modal__field">
              <span>BCC <small>Optional</small></span>
              <input
                type="text"
                value={form.bcc_emails}
                onChange={(event) => updateField("bcc_emails", event.target.value)}
                placeholder="Separate emails with commas"
                autoComplete="off"
              />
            </label>

            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Subject</span>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => updateField("subject", event.target.value)}
                maxLength={255}
                autoComplete="off"
              />
            </label>

            <label className="invoice-mail-modal__field invoice-mail-modal__field--full">
              <span>Message <small>Optional</small></span>
              <textarea
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Add a short message for the client…"
                maxLength={3000}
                rows={5}
              />
            </label>
          </div>

          <button
            type="button"
            className={`invoice-mail-modal__attachment ${form.attach_pdf ? "is-selected" : ""}`}
            onClick={() => updateField("attach_pdf", !form.attach_pdf)}
            aria-pressed={form.attach_pdf}
          >
            <span className="invoice-mail-modal__attachment-icon fas fa-file-pdf" aria-hidden="true" />
            <span className="invoice-mail-modal__attachment-copy">
              <strong>Attach invoice PDF</strong>
              <small>Uses the same PDF document already available on the invoice page.</small>
            </span>
            <span className={`invoice-mail-modal__switch ${form.attach_pdf ? "is-on" : ""}`} aria-hidden="true"><i /></span>
          </button>
        </div>

        <footer className="invoice-mail-modal__footer">
          <button type="button" className="invoice-mail-modal__cancel" onClick={onClose} disabled={isSending}>Cancel</button>
          <button type="submit" className="invoice-mail-modal__submit" disabled={!canSend || isSending}>
            <span className={`fas ${isSending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} aria-hidden="true" />
            <span>{isSending ? "Sending invoice…" : "Send invoice"}</span>
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default SendInvoiceModal;
