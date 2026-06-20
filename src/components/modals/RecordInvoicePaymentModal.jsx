import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../services/api";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useBankSearchStore from "../../stores/useBankSearchStore";
import "../../pages/invoice/InvoiceWorkflow.css";

const METHOD_OPTIONS = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "Card", label: "Card" },
  { value: "Other", label: "Other" },
];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const toDateString = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().split("T")[0];
};

const RecordInvoicePaymentModal = ({ invoice, isOpen, onClose, onRecorded }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { banks, searchBanks, loading: banksLoading } = useBankSearchStore();
  const summary = invoice?.payment_summary || {};
  const balanceDue = Number(summary.balance_due ?? Math.max(Number(invoice?.invoice_amount || 0) - Number(invoice?.paid || 0), 0));
  const currency = invoice?.currency || "NGN";

  const [form, setForm] = useState({
    payment_date: new Date(),
    amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : "",
    payment_method: "Bank Transfer",
    bank_id: "",
    transaction_reference: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) searchBanks("");
  }, [isOpen, searchBanks]);

  useEffect(() => {
    if (isOpen) {
      setForm((current) => ({
        ...current,
        amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : "",
      }));
      setErrors({});
    }
  }, [balanceDue, isOpen]);

  const bankOptions = useMemo(
    () => banks
      .filter((bank) => String(bank.account_currency || "").toUpperCase() === String(currency).toUpperCase())
      .map((bank) => ({
        value: String(bank.id),
        label: `${bank.bank_name} · ${bank.account_number}`,
        bank,
      })),
    [banks, currency]
  );

  const methodOption = METHOD_OPTIONS.find((option) => option.value === form.payment_method) || null;
  const bankOption = bankOptions.find((option) => option.value === String(form.bank_id)) || null;
  const requiresBank = ["Bank Transfer", "Cheque", "Card"].includes(form.payment_method);
  const enteredAmount = Number.parseFloat(form.amount) || 0;
  const balanceAfter = Math.max(balanceDue - enteredAmount, 0);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "", form: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.payment_date) next.payment_date = "Payment date is required";
    if (!form.amount || enteredAmount <= 0) next.amount = "Enter a valid payment amount";
    else if (enteredAmount > balanceDue + 0.009) next.amount = "Amount cannot exceed the outstanding balance";
    if (!form.payment_method) next.payment_method = "Select a payment method";
    if (requiresBank && !form.bank_id) next.bank_id = "Select the receiving bank account";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post("/invoice/record-payment", {
        invoice_number: invoice.invoice_number,
        payment_date: toDateString(form.payment_date),
        amount: enteredAmount,
        currency,
        payment_method: form.payment_method,
        bank_id: form.bank_id || null,
        transaction_reference: form.transaction_reference.trim(),
        notes: form.notes.trim(),
      });
      showToast(response.data?.message || "Payment recorded successfully", "success");
      onRecorded?.();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || "The payment could not be recorded.";
      setErrors((current) => ({ ...current, form: message }));
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`invoice-payment-modal theme-${theme}`} role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
      <button type="button" className="invoice-payment-modal__backdrop" onClick={isSubmitting ? undefined : onClose} aria-label="Close payment modal" />

      <motion.form
        className="invoice-payment-modal__panel"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.985 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="invoice-payment-modal__header">
          <div className="invoice-payment-modal__heading">
            <span className="invoice-payment-modal__heading-icon fas fa-wallet" aria-hidden="true" />
            <div>
              <span className="invoice-payment-modal__eyebrow">Payment allocation</span>
              <h2 id="record-payment-title">Record payment for AZ-{invoice?.invoice_number}</h2>
              <p>The receipt will update the paid amount, balance and payment status automatically.</p>
            </div>
          </div>
          <button type="button" className="invoice-payment-modal__close" onClick={onClose} disabled={isSubmitting} aria-label="Close modal">
            <span className="fas fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-payment-modal__body">
          <div className="invoice-payment-modal__summary">
            <div>
              <span>Outstanding balance</span>
              <strong><small>{currency}</small>{formatMoney(balanceDue)}</strong>
            </div>
            <span className="fas fa-arrow-right" aria-hidden="true" />
            <div>
              <span>Balance after payment</span>
              <strong><small>{currency}</small>{formatMoney(balanceAfter)}</strong>
            </div>
          </div>

          {errors.form ? (
            <div className="invoice-payment-modal__error" role="alert">
              <span className="fas fa-circle-exclamation" aria-hidden="true" />
              <span>{errors.form}</span>
            </div>
          ) : null}

          <div className="invoice-payment-modal__grid">
            <label className="invoice-payment-modal__field">
              <span>Payment date</span>
              <div className={`invoice-payment-modal__date ${errors.payment_date ? "has-error" : ""}`}>
                <DatePicker
                  selected={form.payment_date}
                  onChange={(date) => updateField("payment_date", date)}
                  dateFormat="dd MMMM yyyy"
                  maxDate={new Date()}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select payment date"
                  popperClassName="invoice-payment-datepicker-popper"
                  portalId="root"
                />
                <span className="fas fa-calendar" aria-hidden="true" />
              </div>
              {errors.payment_date ? <small className="invoice-payment-modal__field-error">{errors.payment_date}</small> : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Amount received</span>
              <div className={`invoice-payment-modal__money ${errors.amount ? "has-error" : ""}`}>
                <small>{currency}</small>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  min="0.01"
                  max={balanceDue}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              {errors.amount ? <small className="invoice-payment-modal__field-error">{errors.amount}</small> : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Payment method</span>
              <Select
                options={METHOD_OPTIONS}
                value={methodOption}
                onChange={(option) => {
                  updateField("payment_method", option?.value || "");
                  if (!["Bank Transfer", "Cheque", "Card"].includes(option?.value || "")) updateField("bank_id", "");
                }}
                className={`invoice-payment-select ${errors.payment_method ? "has-error" : ""}`}
                classNamePrefix="invoice-payment-select"
                isSearchable={false}
                placeholder="Select method"
              />
              {errors.payment_method ? <small className="invoice-payment-modal__field-error">{errors.payment_method}</small> : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Received into {requiresBank ? "" : <small>Optional</small>}</span>
              <Select
                options={bankOptions}
                value={bankOption}
                onChange={(option) => updateField("bank_id", option?.value || "")}
                className={`invoice-payment-select ${errors.bank_id ? "has-error" : ""}`}
                classNamePrefix="invoice-payment-select"
                isClearable={!requiresBank}
                isLoading={banksLoading}
                placeholder={`Select ${currency} bank account`}
                noOptionsMessage={() => `No ${currency} bank accounts found`}
              />
              {errors.bank_id ? <small className="invoice-payment-modal__field-error">{errors.bank_id}</small> : null}
            </label>

            <label className="invoice-payment-modal__field invoice-payment-modal__field--full">
              <span>Transaction reference <small>Optional</small></span>
              <input
                type="text"
                value={form.transaction_reference}
                onChange={(event) => updateField("transaction_reference", event.target.value)}
                maxLength={255}
                placeholder="Bank reference, cheque number, receipt number…"
                autoComplete="off"
              />
            </label>

            <label className="invoice-payment-modal__field invoice-payment-modal__field--full">
              <span>Internal note <small>Optional</small></span>
              <textarea
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows="4"
                maxLength={2000}
                placeholder="Add a note about this receipt or allocation"
              />
            </label>
          </div>
        </div>

        <footer className="invoice-payment-modal__footer">
          <button type="button" className="invoice-payment-modal__cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="invoice-payment-modal__submit" disabled={isSubmitting || balanceDue <= 0}>
            <span className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-circle-check"}`} aria-hidden="true" />
            <span>{isSubmitting ? "Recording payment…" : "Record payment"}</span>
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default RecordInvoicePaymentModal;
