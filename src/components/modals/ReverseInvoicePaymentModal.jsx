import React, { useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import "../../pages/invoice/InvoiceWorkflow.css";

const ReverseInvoicePaymentModal = ({ payment, isOpen, onClose, onReversed }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !payment) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setError("Enter a clear reason of at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await api.post("/invoice/reverse-payment", {
        payment_id: payment.id,
        reason: trimmedReason,
      });
      showToast(response.data?.message || "Payment reversed successfully", "success");
      onReversed?.();
      onClose();
    } catch (requestError) {
      const message = requestError.response?.data?.message || "The payment could not be reversed.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`invoice-reversal-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="reverse-payment-title">
      <button type="button" className="invoice-reversal-modal__backdrop" onClick={isSubmitting ? undefined : onClose} aria-label="Close reversal modal" />
      <motion.form
        className="invoice-reversal-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <header className="invoice-reversal-modal__header">
          <span className="invoice-reversal-modal__icon fas fa-rotate-left" aria-hidden="true" />
          <div>
            <span>Payment correction</span>
            <h2 id="reverse-payment-title">Reverse {payment.payment_code}</h2>
            <p>This keeps the receipt in the audit trail and removes its amount from the invoice balance.</p>
          </div>
        </header>

        <div className="invoice-reversal-modal__body">
          <div className="invoice-reversal-modal__payment">
            <span>{payment.currency}</span>
            <strong>{Number(payment.allocated_amount || payment.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>

          <label>
            <span>Reason for reversal</span>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              rows="4"
              maxLength="500"
              placeholder="Explain why this receipt is being reversed"
              autoFocus
            />
          </label>
          {error ? <div className="invoice-reversal-modal__error" role="alert">{error}</div> : null}
        </div>

        <footer className="invoice-reversal-modal__footer">
          <button type="button" onClick={onClose} disabled={isSubmitting}>Keep payment</button>
          <button type="submit" disabled={isSubmitting}>
            <span className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-rotate-left"}`} aria-hidden="true" />
            {isSubmitting ? "Reversing…" : "Reverse payment"}
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default ReverseInvoicePaymentModal;
