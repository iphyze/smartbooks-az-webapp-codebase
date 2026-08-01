import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import useToastStore from "../../stores/useToastStore";
import InvoicePaymentRegistrationSelect from "../journal/InvoicePaymentRegistrationSelect";
import "./RegisterJournalInvoicePaymentModal.css";

const formatNumber = (value) => (Number(value) || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const emptyForm = {
  invoice_number: "",
  invoice_option: null,
  payment_method: "",
  transaction_reference: "",
  notes: "",
};

const formFromPaymentLink = (paymentLink) => {
  if (!paymentLink?.id) return emptyForm;

  const invoiceNumber = String(paymentLink.invoice_number || "").trim();
  const clientsName = String(paymentLink.clients_name || "").trim();
  const currency = String(
    paymentLink.allocation_currency
    || paymentLink.invoice_currency
    || "NGN"
  ).toUpperCase();

  return {
    invoice_number: invoiceNumber,
    invoice_option: invoiceNumber
      ? {
          value: invoiceNumber,
          label: `INV ${invoiceNumber}`,
          invoice: {
            invoice_number: invoiceNumber,
            clients_name: clientsName,
            currency,
            invoice_total: Number(paymentLink.invoice_amount_settled || 0),
            available_to_register: Number(paymentLink.allocated_amount || paymentLink.invoice_amount_settled || 0),
            registration_status: "Currently linked",
          },
        }
      : null,
    payment_method: String(paymentLink.payment_method || ""),
    transaction_reference: String(paymentLink.transaction_reference || ""),
    notes: String(paymentLink.notes || ""),
  };
};

export default function RegisterJournalInvoicePaymentModal({
  isOpen,
  journal,
  onClose,
  onRegistered,
}) {
  const { showToast } = useToastStore();
  const paymentLink = journal?.payment_link || null;
  const isManageMode = Boolean(paymentLink?.can_manage && paymentLink?.id);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const initialForm = useMemo(
    () => (isManageMode ? formFromPaymentLink(paymentLink) : emptyForm),
    [isManageMode, paymentLink]
  );

  const reset = () => {
    setForm(emptyForm);
    setPreview(null);
    setIsPreviewing(false);
    setIsRegistering(false);
  };

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setPreview(null);
      setIsPreviewing(false);
      setIsRegistering(false);
    } else {
      reset();
    }
  }, [isOpen, initialForm]);

  const close = () => {
    if (isPreviewing || isRegistering) return;
    reset();
    onClose?.();
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const previewRegistration = async () => {
    if (!form.invoice_number.trim()) {
      showToast("Select the invoice to settle.", "error");
      return;
    }

    setIsPreviewing(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await api.post(
        "/journal/preview-invoice-payment-registration",
        {
          journal_id: Number(journal?.journal_id),
          payment_id: isManageMode ? Number(paymentLink?.id) : undefined,
          invoice_number: form.invoice_number.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = response?.data?.data;
      if (!result?.preview_token) throw new Error("The validation preview was incomplete.");
      setPreview(result);
      showToast(
        response?.data?.message
        || (isManageMode ? "Payment link revalidated." : "Journal payment validated."),
        "success"
      );
    } catch (error) {
      setPreview(null);
      showToast(
        error?.response?.data?.message
        || error?.message
        || "The journal could not be matched to the invoice.",
        "error"
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const savePaymentLink = async () => {
    if (!preview?.preview_token) {
      showToast("Preview and validate the payment before saving it.", "error");
      return;
    }

    setIsRegistering(true);
    try {
      const token = useAuthStore.getState().token;
      const payload = {
        journal_id: Number(journal?.journal_id),
        payment_id: isManageMode ? Number(paymentLink?.id) : undefined,
        invoice_number: form.invoice_number.trim(),
        preview_token: preview.preview_token,
        payment_method: form.payment_method.trim(),
        transaction_reference: form.transaction_reference.trim(),
        notes: form.notes.trim(),
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = isManageMode
        ? await api.put("/journal/update-linked-invoice-payment", payload, config)
        : await api.post("/journal/register-existing-invoice-payment", payload, config);

      showToast(
        response?.data?.message
        || (isManageMode
          ? "Invoice payment link updated."
          : "Journal registered as an invoice payment."),
        "success"
      );
      onRegistered?.(response?.data?.data);
      reset();
      onClose?.();
    } catch (error) {
      showToast(
        error?.response?.data?.message
        || error?.message
        || (isManageMode ? "The payment link update failed." : "The payment registration failed."),
        "error"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const settlement = preview?.settlement;
  const busy = isPreviewing || isRegistering;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="journal-payment-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.section
            className="journal-payment-modal"
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-payment-modal-title"
          >
            <header className="journal-payment-modal__header">
              <div>
                <span>{isManageMode ? "Payment link management" : "Historical payment harmonisation"}</span>
                <h2 id="journal-payment-modal-title">
                  {isManageMode
                    ? `Manage payment ${paymentLink?.payment_code || ""}`
                    : `Register journal #${journal?.journal_id} as an invoice payment`}
                </h2>
                <p>
                  {isManageMode
                    ? "Revalidate the journal before changing its invoice allocation or payment details. The posted journal lines will not be changed."
                    : "The existing posted journal will be linked and validated. No second journal will be created."}
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Close modal">
                <i className="fas fa-times" />
              </button>
            </header>

            <div className="journal-payment-modal__body">
              <div className="journal-payment-modal__journal-note">
                <i className="fas fa-book" aria-hidden="true" />
                <div>
                  <strong>{journal?.journal_description || "Journal payment"}</strong>
                  <span>
                    {journal?.journal_date} · NGN debit {formatNumber(journal?.debit_ngn)} · NGN credit {formatNumber(journal?.credit_ngn)}
                  </span>
                </div>
              </div>

              {isManageMode ? (
                <div className="journal-payment-modal__manage-note">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <span>The journal amount and ledger lines are protected. Only the validated invoice allocation and payment metadata can be updated here.</span>
                </div>
              ) : null}

              <div className="journal-payment-modal__fields">
                <div className="journal-payment-modal__field">
                  <span>Invoice Number</span>
                  <InvoicePaymentRegistrationSelect
                    inputId="existing_journal_invoice_payment_number"
                    invoiceNumber={form.invoice_number}
                    value={form.invoice_option}
                    disabled={busy}
                    excludeJournalId={Number(journal?.journal_id || 0)}
                    onChange={(option) => {
                      setForm((current) => ({
                        ...current,
                        invoice_number: option?.value || "",
                        invoice_option: option || null,
                      }));
                      setPreview(null);
                    }}
                  />
                </div>
                <label>
                  <span>Payment Method</span>
                  <input
                    type="text"
                    value={form.payment_method}
                    onChange={(event) => updateField("payment_method", event.target.value)}
                    placeholder="Optional — derived from journal"
                    disabled={busy}
                  />
                </label>
                <label>
                  <span>Transaction Reference</span>
                  <input
                    type="text"
                    value={form.transaction_reference}
                    onChange={(event) => updateField("transaction_reference", event.target.value)}
                    placeholder="Bank reference or receipt number"
                    disabled={busy}
                  />
                </label>
                <label>
                  <span>Notes</span>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Optional reconciliation note"
                    disabled={busy}
                  />
                </label>
              </div>

              <button
                type="button"
                className="journal-payment-modal__preview-button"
                onClick={previewRegistration}
                disabled={busy}
              >
                <i className={`fas ${isPreviewing ? "fa-spinner fa-spin" : "fa-eye"}`} />
                <span>{isPreviewing ? "Validating…" : preview ? "Refresh validation preview" : "Preview and validate"}</span>
              </button>

              {preview && settlement ? (
                <div className="journal-payment-modal__preview">
                  <header>
                    <span><i className="fas fa-circle-check" /> Journal matches invoice {preview.invoice?.invoice_number}</span>
                    <strong>{preview.invoice?.clients_name}</strong>
                  </header>
                  <div>
                    <article>
                      <span>Invoice amount settled</span>
                      <strong>{settlement.invoice_currency} {formatNumber(settlement.invoice_amount_settled)}</strong>
                      {Number(settlement.withholding_tax_settled || 0) > 0 ? (
                        <small>Includes WHT {settlement.invoice_currency} {formatNumber(settlement.withholding_tax_settled)}</small>
                      ) : null}
                    </article>
                    <article>
                      <span>Payment received</span>
                      <strong>{settlement.payment_currency} {formatNumber(settlement.payment_amount_received)}</strong>
                    </article>
                    <article>
                      <span>Settlement value</span>
                      <strong>NGN {formatNumber(settlement.settlement_value_ngn)}</strong>
                    </article>
                    <article>
                      <span>Realized FX</span>
                      <strong>
                        {Number(settlement.realized_fx_gain_ngn || 0) > 0
                          ? `Gain NGN ${formatNumber(settlement.realized_fx_gain_ngn)}`
                          : Number(settlement.realized_fx_loss_ngn || 0) > 0
                            ? `Loss NGN ${formatNumber(settlement.realized_fx_loss_ngn)}`
                            : "No gain or loss"}
                      </strong>
                    </article>
                    <article>
                      <span>Receiving ledger</span>
                      <strong>{settlement.bank_ledger_name}</strong>
                    </article>
                    <article>
                      <span>Receivable ledger</span>
                      <strong>{settlement.customer_ledger_name}</strong>
                    </article>
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="journal-payment-modal__footer">
              <button type="button" className="is-secondary" onClick={close} disabled={busy}>
                Cancel
              </button>
              <button type="button" onClick={savePaymentLink} disabled={!preview || busy}>
                <i className={`fas ${isRegistering ? "fa-spinner fa-spin" : isManageMode ? "fa-floppy-disk" : "fa-link"}`} />
                <span>
                  {isRegistering
                    ? (isManageMode ? "Updating…" : "Registering…")
                    : (isManageMode ? "Update payment link" : "Register payment")}
                </span>
              </button>
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
