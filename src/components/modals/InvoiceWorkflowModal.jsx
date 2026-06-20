import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import "../../pages/invoice/InvoiceWorkflow.css";

const WORKFLOW_COPY = {
  Cancelled: {
    icon: "fa-ban",
    title: "Cancel this invoice",
    description: "The invoice remains in the audit trail but can no longer be edited or sent until it is restored.",
    submit: "Cancel invoice",
    tone: "danger",
  },
  Void: {
    icon: "fa-circle-xmark",
    title: "Void this invoice",
    description: "Voiding is a final administrative action. The invoice stays visible for audit purposes and cannot be restored.",
    submit: "Void invoice",
    tone: "danger",
  },
  Issued: {
    icon: "fa-rotate-left",
    title: "Restore this invoice",
    description: "Restore the cancelled invoice to Issued so it can be edited, delivered and managed again.",
    submit: "Restore invoice",
    tone: "success",
  },
};

const InvoiceWorkflowModal = ({ invoice, isOpen, onClose, onUpdated }) => {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const currentStatus = invoice?.workflow_status || "Issued";
  const isAdmin = user?.integrity === "Admin";

  const availableActions = useMemo(() => {
    if (currentStatus === "Cancelled") return ["Issued"];
    if (currentStatus === "Void") return [];
    return isAdmin ? ["Cancelled", "Void"] : ["Cancelled"];
  }, [currentStatus, isAdmin]);

  const [selectedStatus, setSelectedStatus] = useState(availableActions[0] || "");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedCopy = WORKFLOW_COPY[selectedStatus] || WORKFLOW_COPY.Cancelled;
  const requiresReason = ["Cancelled", "Void"].includes(selectedStatus);
  const canSubmit = selectedStatus && (!requiresReason || reason.trim().length >= 5);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/invoice/change-workflow-status", {
        invoice_number: invoice.invoice_number,
        workflow_status: selectedStatus,
        reason: reason.trim(),
      });
      showToast(`Invoice marked as ${selectedStatus}`, "success");
      await onUpdated?.();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || "Invoice status could not be updated", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`invoice-workflow-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="invoice-workflow-title">
      <button
        type="button"
        className="invoice-workflow-modal__backdrop"
        onClick={isSubmitting ? undefined : onClose}
        aria-label="Close invoice status modal"
      />

      <motion.form
        className="invoice-workflow-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.985 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="invoice-workflow-modal__header">
          <div className="invoice-workflow-modal__heading">
            <span className="invoice-workflow-modal__heading-icon fas fa-route" aria-hidden="true" />
            <div>
              <span className="invoice-workflow-modal__eyebrow">Invoice workflow</span>
              <h2 id="invoice-workflow-title">Manage invoice AZ-{invoice?.invoice_number}</h2>
              <p>Current status: <strong>{currentStatus}</strong></p>
            </div>
          </div>
          <button type="button" className="invoice-workflow-modal__close" onClick={onClose} disabled={isSubmitting} aria-label="Close modal">
            <span className="fas fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-workflow-modal__body">
          {availableActions.length === 0 ? (
            <div className="invoice-workflow-modal__locked">
              <span className="fas fa-lock" aria-hidden="true" />
              <div>
                <strong>This invoice is void</strong>
                <p>Its final status is retained for audit purposes and cannot be changed.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="invoice-workflow-modal__choices" role="radiogroup" aria-label="Select invoice status action">
                {availableActions.map((status) => {
                  const copy = WORKFLOW_COPY[status];
                  const active = selectedStatus === status;
                  return (
                    <button
                      type="button"
                      key={status}
                      className={`invoice-workflow-choice invoice-workflow-choice--${copy.tone} ${active ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedStatus(status);
                        setReason("");
                      }}
                      aria-pressed={active}
                    >
                      <span className={`invoice-workflow-choice__icon fas ${copy.icon}`} aria-hidden="true" />
                      <span>
                        <strong>{copy.title}</strong>
                        <small>{copy.description}</small>
                      </span>
                      <span className={`invoice-workflow-choice__radio ${active ? "is-selected" : ""}`} aria-hidden="true"><i /></span>
                    </button>
                  );
                })}
              </div>

              {requiresReason ? (
                <label className="invoice-workflow-modal__reason">
                  <span>Reason for this action</span>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Add a clear reason for the audit trail…"
                    maxLength={500}
                    rows={4}
                  />
                  <small>{reason.trim().length}/500 · At least 5 characters</small>
                </label>
              ) : (
                <div className="invoice-workflow-modal__notice">
                  <span className="fas fa-circle-info" aria-hidden="true" />
                  Restoring the invoice will return it to the Issued state.
                </div>
              )}
            </>
          )}
        </div>

        <footer className="invoice-workflow-modal__footer">
          <button type="button" className="invoice-workflow-modal__cancel" onClick={onClose} disabled={isSubmitting}>Close</button>
          {availableActions.length > 0 && (
            <button
              type="submit"
              className={`invoice-workflow-modal__submit invoice-workflow-modal__submit--${selectedCopy.tone}`}
              disabled={!canSubmit || isSubmitting}
            >
              <span className={`fas ${isSubmitting ? "fa-spinner fa-spin" : selectedCopy.icon}`} aria-hidden="true" />
              <span>{isSubmitting ? "Updating status…" : selectedCopy.submit}</span>
            </button>
          )}
        </footer>
      </motion.form>
    </div>
  );
};

export default InvoiceWorkflowModal;
