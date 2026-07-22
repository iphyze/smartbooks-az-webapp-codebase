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
  const selectMenuPortalTarget = typeof document !== "undefined" ? document.body : null;
  const selectPortalStyles = useMemo(
    () => ({
      menuPortal: (base) => ({
        ...base,
        zIndex: 20050,
        "--pm-surface-strong": theme === "light" ? "#eef5f8" : "#192a42",
        "--pm-border": theme === "light" ? "#dbe7ee" : "#2b405b",
        "--pm-text": theme === "light" ? "#15263a" : "#f4f9fd",
        "--pm-text-soft": theme === "light" ? "#52667b" : "#b7c7d8",
        "--pm-muted": theme === "light" ? "#7c8fa4" : "#8499b0",
        "--pm-brand-soft": "rgba(23, 196, 188, .1)",
      }),
    }),
    [theme]
  );
  const { banks, searchBanks, loading: banksLoading } = useBankSearchStore();
  const summary = invoice?.payment_summary || {};
  const balanceDue = Number(
    summary.balance_due ?? Math.max(Number(invoice?.invoice_amount || 0) - Number(invoice?.paid || 0), 0)
  );
  const currency = invoice?.currency || "NGN";

  const [form, setForm] = useState({
    payment_date: new Date(),
    amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : "",
    payment_method: "Bank Transfer",
    bank_id: "",
    transaction_reference: "",
    notes: "",
    post_journal: false,
    bank_ledger_number: "",
    credit_ledger_number: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [journalContext, setJournalContext] = useState(null);
  const [journalContextLoading, setJournalContextLoading] = useState(false);
  const [journalContextError, setJournalContextError] = useState("");

  useEffect(() => {
    if (isOpen) searchBanks("");
  }, [isOpen, searchBanks]);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      payment_date: new Date(),
      amount: balanceDue > 0 ? String(balanceDue.toFixed(2)) : "",
      payment_method: "Bank Transfer",
      bank_id: "",
      transaction_reference: "",
      notes: "",
      post_journal: false,
      bank_ledger_number: "",
      credit_ledger_number: "",
    });
    setJournalContext(null);
    setJournalContextError("");
    setErrors({});
  }, [balanceDue, isOpen]);

  useEffect(() => {
    if (!isOpen || !form.post_journal || !invoice?.invoice_number || !form.payment_date) return undefined;

    let active = true;
    const loadContext = async () => {
      setJournalContextLoading(true);
      setJournalContextError("");
      try {
        const params = new URLSearchParams({
          invoice_number: String(invoice.invoice_number),
          payment_date: toDateString(form.payment_date),
        });
        if (form.bank_id) params.set("bank_id", String(form.bank_id));
        const response = await api.get(`/invoice/payment-journal-options?${params.toString()}`);
        if (!active) return;
        const context = response.data?.data || null;
        setJournalContext(context);
        setForm((current) => {
          const bankLedgerExists = (context?.bank_ledgers || []).some(
            (ledger) => String(ledger.ledger_number) === String(current.bank_ledger_number)
          );
          const creditLedgerExists = (context?.credit_ledgers || []).some(
            (ledger) => String(ledger.ledger_number) === String(current.credit_ledger_number)
          );
          return {
            ...current,
            bank_ledger_number: bankLedgerExists
              ? current.bank_ledger_number
              : String(context?.suggested_bank_ledger?.ledger_number || ""),
            credit_ledger_number: creditLedgerExists
              ? current.credit_ledger_number
              : String(
                  context?.suggested_credit_ledger?.ledger_number ||
                    context?.customer_ledger?.ledger_number ||
                    ""
                ),
          };
        });
      } catch (error) {
        if (!active) return;
        setJournalContext(null);
        setJournalContextError(
          error.response?.data?.message || "Journal posting details could not be prepared."
        );
      } finally {
        if (active) setJournalContextLoading(false);
      }
    };

    loadContext();
    return () => {
      active = false;
    };
  }, [form.bank_id, form.payment_date, form.post_journal, invoice?.invoice_number, isOpen]);

  const bankOptions = useMemo(
    () =>
      banks
        .filter(
          (bank) =>
            String(bank.account_currency || "").toUpperCase() === String(currency).toUpperCase()
        )
        .map((bank) => ({
          value: String(bank.id),
          label: `${bank.bank_name} · ${bank.account_number}`,
          bank,
        })),
    [banks, currency]
  );

  const allBankLedgerOptions = useMemo(
    () =>
      (journalContext?.bank_ledgers || []).map((ledger) => ({
        value: String(ledger.ledger_number),
        label: `${ledger.ledger_number} · ${ledger.ledger_name}`,
        ledger,
      })),
    [journalContext]
  );

  const allCreditLedgerOptions = useMemo(
    () =>
      (journalContext?.credit_ledgers || []).map((ledger) => ({
        value: String(ledger.ledger_number),
        label: `${ledger.ledger_number} · ${ledger.ledger_name}${
          ledger.ledger_type ? ` — ${ledger.ledger_type}` : ""
        }`,
        ledger,
      })),
    [journalContext]
  );

  const bankLedgerOptions = useMemo(
    () =>
      allBankLedgerOptions.filter(
        (option) => option.value !== String(form.credit_ledger_number || "")
      ),
    [allBankLedgerOptions, form.credit_ledger_number]
  );

  const creditLedgerOptions = useMemo(
    () =>
      allCreditLedgerOptions.filter(
        (option) => option.value !== String(form.bank_ledger_number || "")
      ),
    [allCreditLedgerOptions, form.bank_ledger_number]
  );

  const methodOption = METHOD_OPTIONS.find((option) => option.value === form.payment_method) || null;
  const bankOption = bankOptions.find((option) => option.value === String(form.bank_id)) || null;
  const bankLedgerOption =
    allBankLedgerOptions.find((option) => option.value === String(form.bank_ledger_number)) || null;
  const creditLedgerOption =
    allCreditLedgerOptions.find((option) => option.value === String(form.credit_ledger_number)) || null;
  const requiresBank = ["Bank Transfer", "Cheque", "Card"].includes(form.payment_method);
  const enteredAmount = Number.parseFloat(form.amount) || 0;
  const balanceAfter = Math.max(balanceDue - enteredAmount, 0);
  const receiptType = balanceAfter <= 0.009 ? "complete" : "part";
  const invoiceReference = String(invoice?.invoice_number || "").startsWith("AZ-")
    ? String(invoice.invoice_number)
    : `AZ-${invoice?.invoice_number || ""}`;
  const narration = `Being ${receiptType} receipt on Inv. No. ${invoiceReference} IFO ${invoice?.clients_name || "client"}`;

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "", form: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.payment_date) next.payment_date = "Payment date is required";
    if (!form.amount || enteredAmount <= 0) next.amount = "Enter a valid payment amount";
    else if (enteredAmount > balanceDue + 0.009)
      next.amount = "Amount cannot exceed the outstanding balance";
    if (!form.payment_method) next.payment_method = "Select a payment method";
    if (requiresBank && !form.bank_id) next.bank_id = "Select the receiving bank account";
    if (form.post_journal) {
      if (!form.bank_ledger_number) next.bank_ledger_number = "Select the ledger to debit";
      if (!form.credit_ledger_number) next.credit_ledger_number = "Select the ledger to credit";
      if (
        form.bank_ledger_number &&
        form.credit_ledger_number &&
        String(form.bank_ledger_number) === String(form.credit_ledger_number)
      ) {
        next.form = "The debit and credit sides must use different ledgers.";
      }
      if (!journalContext?.rate) next.form = journalContextError || "An exchange rate is required before posting.";
    }
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
        post_journal: form.post_journal,
        bank_ledger_number: form.post_journal ? Number(form.bank_ledger_number) : null,
        credit_ledger_number: form.post_journal ? Number(form.credit_ledger_number) : null,
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
              <h2 id="record-payment-title">Record payment for {invoiceReference}</h2>
              <p>Update the invoice balance and optionally post the receipt to the ledgers.</p>
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
                <input type="number" value={form.amount} onChange={(event) => updateField("amount", event.target.value)} onWheel={(event) => event.currentTarget.blur()} min="0.01" max={balanceDue} step="0.01" placeholder="0.00" />
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
                  if (!["Bank Transfer", "Cheque", "Card"].includes(option?.value || "") && !form.post_journal) updateField("bank_id", "");
                }}
                className={`invoice-payment-select ${errors.payment_method ? "has-error" : ""}`}
                classNamePrefix="invoice-payment-select"
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectPortalStyles}
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
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectPortalStyles}
                isClearable={!requiresBank}
                isLoading={banksLoading}
                placeholder={`Select ${currency} bank account`}
                noOptionsMessage={() => `No ${currency} bank accounts found`}
              />
              {errors.bank_id ? <small className="invoice-payment-modal__field-error">{errors.bank_id}</small> : null}
            </label>

            <div className="invoice-payment-modal__journal invoice-payment-modal__field--full">
              <div className="invoice-payment-modal__journal-toggle-row">
                <div>
                  <span className="invoice-payment-modal__journal-icon"><i className="fas fa-book" aria-hidden="true" /></span>
                  <div>
                    <strong>Post receipt journal</strong>
                    <p>Choose the ledgers to debit and credit for this receipt.</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.post_journal}
                  className={`invoice-payment-modal__switch ${form.post_journal ? "is-on" : ""}`}
                  onClick={() => updateField("post_journal", !form.post_journal)}
                >
                  <span />
                </button>
              </div>

              {form.post_journal ? (
                <div className="invoice-payment-modal__journal-body">
                  {journalContextError ? <div className="invoice-payment-modal__journal-warning"><i className="fas fa-triangle-exclamation" />{journalContextError}</div> : null}
                  <div className="invoice-payment-modal__journal-ledger-grid">
                    <label className="invoice-payment-modal__field">
                      <span>Ledger to debit <small>Choose manually if needed</small></span>
                      <Select
                        options={bankLedgerOptions}
                        value={bankLedgerOption}
                        onChange={(option) => updateField("bank_ledger_number", option?.value || "")}
                        className={`invoice-payment-select ${errors.bank_ledger_number ? "has-error" : ""}`}
                        classNamePrefix="invoice-payment-select"
                        menuPortalTarget={selectMenuPortalTarget}
                        menuPosition="fixed"
                        menuShouldScrollIntoView={false}
                        styles={selectPortalStyles}
                        isClearable
                        isLoading={journalContextLoading}
                        placeholder="Select ledger to debit"
                        noOptionsMessage={() => "No ledgers found"}
                      />
                      <small className="invoice-payment-modal__field-hint">
                        A matching ledger may be suggested from the receiving bank, but you can select any appropriate ledger, including a partner ledger.
                      </small>
                      {errors.bank_ledger_number ? <small className="invoice-payment-modal__field-error">{errors.bank_ledger_number}</small> : null}
                    </label>

                    <label className="invoice-payment-modal__field">
                      <span>Ledger to credit <small>Customer ledger suggested</small></span>
                      <Select
                        options={creditLedgerOptions}
                        value={creditLedgerOption}
                        onChange={(option) => updateField("credit_ledger_number", option?.value || "")}
                        className={`invoice-payment-select ${errors.credit_ledger_number ? "has-error" : ""}`}
                        classNamePrefix="invoice-payment-select"
                        menuPortalTarget={selectMenuPortalTarget}
                        menuPosition="fixed"
                        menuShouldScrollIntoView={false}
                        styles={selectPortalStyles}
                        isClearable
                        isLoading={journalContextLoading}
                        placeholder="Select ledger to credit"
                        noOptionsMessage={() => "No ledgers found"}
                      />
                      <small className="invoice-payment-modal__field-hint">
                        The customer or Account Receivables ledger is selected automatically. Choose another ledger when required.
                      </small>
                      {errors.credit_ledger_number ? <small className="invoice-payment-modal__field-error">{errors.credit_ledger_number}</small> : null}
                    </label>
                  </div>

                  <div className="invoice-payment-modal__journal-preview">
                    <div><span>Debit</span><strong>{bankLedgerOption?.ledger?.ledger_name || "Select a debit ledger"}</strong><small>{currency} {formatMoney(enteredAmount)}</small></div>
                    <i className="fas fa-arrow-right-arrow-left" aria-hidden="true" />
                    <div><span>Credit</span><strong>{creditLedgerOption?.ledger?.ledger_name || "Select a credit ledger"}</strong><small>{currency} {formatMoney(enteredAmount)}</small></div>
                  </div>
                  <div className="invoice-payment-modal__journal-meta">
                    <span><i className="fas fa-calendar-check" />Rate date: {journalContext?.rate?.rate_date || "—"}</span>
                    <span><i className="fas fa-chart-line" />Rate: {journalContext?.rate?.rate ? formatMoney(journalContext.rate.rate) : "—"}</span>
                  </div>
                  <div className="invoice-payment-modal__narration"><span>Narration</span><p>{narration}</p></div>
                </div>
              ) : null}
            </div>

            <label className="invoice-payment-modal__field invoice-payment-modal__field--full">
              <span>Transaction reference <small>Optional</small></span>
              <input type="text" value={form.transaction_reference} onChange={(event) => updateField("transaction_reference", event.target.value)} maxLength={255} placeholder="Bank reference, cheque number, receipt number…" autoComplete="off" />
            </label>

            <label className="invoice-payment-modal__field invoice-payment-modal__field--full">
              <span>Internal note <small>Optional</small></span>
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows="4" maxLength={2000} placeholder="Add a note about this receipt or allocation" />
            </label>
          </div>
        </div>

        <footer className="invoice-payment-modal__footer">
          <button type="button" className="invoice-payment-modal__cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button type="submit" className="invoice-payment-modal__submit" disabled={isSubmitting || balanceDue <= 0 || (form.post_journal && journalContextLoading)}>
            <span className={`fas ${isSubmitting ? "fa-spinner fa-spin" : form.post_journal ? "fa-book" : "fa-circle-check"}`} aria-hidden="true" />
            <span>{isSubmitting ? "Recording payment…" : form.post_journal ? "Record and post journal" : "Record payment"}</span>
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default RecordInvoicePaymentModal;
