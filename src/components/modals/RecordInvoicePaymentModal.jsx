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

const DEFAULT_PAYMENT_CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatRate = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

const toDateString = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().split("T")[0];
};

const numericString = (value, decimals = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return numeric.toFixed(decimals);
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
  const invoiceCurrency = String(invoice?.currency || "NGN").toUpperCase();
  const invoiceWithholdingTotal = (invoice?.items || []).reduce(
    (total, item) => total + Math.max(0, Number(item?.wht || 0)),
    0
  );
  const withholdingAlreadySettled = Math.max(0, Number(summary.withholding_tax_settled || 0));
  const remainingWithholding = Math.max(0, invoiceWithholdingTotal - withholdingAlreadySettled);
  const receivableOutstanding = Math.max(0, balanceDue - remainingWithholding);

  const suggestedSettlementForReceivable = (receivableValue) => {
    const receivable = Math.max(0, Number(receivableValue) || 0);
    if (receivable <= 0 || balanceDue <= 0 || remainingWithholding <= 0 || receivableOutstanding <= 0) {
      return Math.min(balanceDue, receivable);
    }
    if (Math.abs(receivable - receivableOutstanding) <= 0.009) return balanceDue;
    return Math.min(balanceDue, receivable * (balanceDue / receivableOutstanding));
  };

  const suggestedReceivableForSettlement = (settledValue) => {
    const settled = Math.max(0, Number(settledValue) || 0);
    if (settled <= 0 || balanceDue <= 0 || remainingWithholding <= 0) return settled;
    const proportionalWithholding = Math.min(
      remainingWithholding,
      remainingWithholding * (settled / balanceDue)
    );
    return Math.max(0, settled - proportionalWithholding);
  };

  const createInitialForm = () => {
    const today = new Date();
    const settled = balanceDue > 0 ? String(balanceDue.toFixed(2)) : "";
    const receivable = balanceDue > 0
      ? String(suggestedReceivableForSettlement(balanceDue).toFixed(2))
      : "";
    return {
      payment_date: today,
      invoice_amount_settled: settled,
      payment_currency: invoiceCurrency,
      payment_amount_received: receivable,
      journal_receivable_amount: receivable,
      cross_currency_rate: "1",
      payment_rate_date: today,
      payment_currency_rate_ngn: "",
      payment_method: "Bank Transfer",
      bank_id: "",
      transaction_reference: "",
      notes: "",
      post_journal: false,
      bank_ledger_number: "",
      credit_ledger_number: "",
    };
  };

  const [form, setForm] = useState(createInitialForm);
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
    setForm(createInitialForm());
    setJournalContext(null);
    setJournalContextError("");
    setJournalContextLoading(false);
    setErrors({});
  }, [balanceDue, invoiceCurrency, isOpen, remainingWithholding]);

  useEffect(() => {
    if (!isOpen || !form.post_journal || !invoice?.invoice_number || !form.payment_date) {
      setJournalContextLoading(false);
      return undefined;
    }

    let active = true;
    setJournalContextLoading(true);
    setJournalContextError("");
    setJournalContext((current) =>
      current ? { ...current, journal_preview: null, preview_token: null } : current
    );

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          invoice_number: String(invoice.invoice_number),
          payment_date: toDateString(form.payment_date),
          invoice_amount_settled: String(Number.parseFloat(form.invoice_amount_settled) || 0),
          journal_receivable_amount: String(Number.parseFloat(form.journal_receivable_amount) || 0),
          payment_currency: form.payment_currency,
          payment_rate_date: toDateString(form.payment_rate_date || form.payment_date),
        });

        const amountReceived = Number.parseFloat(form.payment_amount_received);
        const crossRate = Number.parseFloat(form.cross_currency_rate);
        const paymentRateNgn = Number.parseFloat(form.payment_currency_rate_ngn);

        if (Number.isFinite(amountReceived) && amountReceived > 0) {
          params.set("payment_amount_received", String(amountReceived));
        }
        if (Number.isFinite(crossRate) && crossRate > 0) {
          params.set("cross_currency_rate", String(crossRate));
        }
        if (Number.isFinite(paymentRateNgn) && paymentRateNgn > 0) {
          params.set("payment_currency_rate_ngn", String(paymentRateNgn));
        }
        if (form.bank_id) params.set("bank_id", String(form.bank_id));
        if (form.bank_ledger_number) {
          params.set("debit_ledger_number", String(form.bank_ledger_number));
        }
        if (form.credit_ledger_number) {
          params.set("credit_ledger_number", String(form.credit_ledger_number));
        }

        const response = await api.get(`/invoice/payment-journal-options?${params.toString()}`);
        if (!active) return;

        const context = response.data?.data || null;
        setJournalContext(context);
        setForm((current) => {
          const debitLedgerExists = (context?.bank_ledgers || []).some(
            (ledger) => String(ledger.ledger_number) === String(current.bank_ledger_number)
          );
          const creditLedgerExists = (context?.credit_ledgers || []).some(
            (ledger) => String(ledger.ledger_number) === String(current.credit_ledger_number)
          );
          return {
            ...current,
            bank_ledger_number: debitLedgerExists
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
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    form.bank_id,
    form.bank_ledger_number,
    form.credit_ledger_number,
    form.cross_currency_rate,
    form.invoice_amount_settled,
    form.journal_receivable_amount,
    form.payment_amount_received,
    form.payment_currency,
    form.payment_currency_rate_ngn,
    form.payment_date,
    form.payment_rate_date,
    form.post_journal,
    invoice?.invoice_number,
    isOpen,
  ]);

  const supportedCurrencies = useMemo(() => {
    const configured = Array.isArray(journalContext?.supported_payment_currencies)
      ? journalContext.supported_payment_currencies
      : DEFAULT_PAYMENT_CURRENCIES;
    return [...new Set([invoiceCurrency, ...configured.map((item) => String(item).toUpperCase())])];
  }, [invoiceCurrency, journalContext]);

  const currencyOptions = useMemo(
    () => supportedCurrencies.map((currency) => ({ value: currency, label: currency })),
    [supportedCurrencies]
  );

  const bankOptions = useMemo(
    () =>
      banks
        .filter(
          (bank) =>
            String(bank.account_currency || "").toUpperCase() ===
            String(form.payment_currency || "").toUpperCase()
        )
        .map((bank) => ({
          value: String(bank.id),
          label: `${bank.bank_name} · ${bank.account_number}`,
          bank,
        })),
    [banks, form.payment_currency]
  );

  const allDebitLedgerOptions = useMemo(
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

  const debitLedgerOptions = useMemo(
    () =>
      allDebitLedgerOptions.filter(
        (option) => option.value !== String(form.credit_ledger_number || "")
      ),
    [allDebitLedgerOptions, form.credit_ledger_number]
  );

  const creditLedgerOptions = useMemo(
    () =>
      allCreditLedgerOptions.filter(
        (option) => option.value !== String(form.bank_ledger_number || "")
      ),
    [allCreditLedgerOptions, form.bank_ledger_number]
  );

  const methodOption = METHOD_OPTIONS.find((option) => option.value === form.payment_method) || null;
  const paymentCurrencyOption =
    currencyOptions.find((option) => option.value === form.payment_currency) || null;
  const bankOption = bankOptions.find((option) => option.value === String(form.bank_id)) || null;
  const debitLedgerOption =
    allDebitLedgerOptions.find(
      (option) => option.value === String(form.bank_ledger_number)
    ) || null;
  const creditLedgerOption =
    allCreditLedgerOptions.find(
      (option) => option.value === String(form.credit_ledger_number)
    ) || null;

  const requiresBank = ["Bank Transfer", "Cheque", "Card"].includes(form.payment_method);
  const invoiceAmountSettled = Number.parseFloat(form.invoice_amount_settled) || 0;
  const paymentAmountReceived = Number.parseFloat(form.payment_amount_received) || 0;
  const journalReceivableAmount = Number.parseFloat(form.journal_receivable_amount) || 0;
  const withholdingTaxApplied = Math.max(0, invoiceAmountSettled - journalReceivableAmount);
  const crossCurrencyRate = Number.parseFloat(form.cross_currency_rate) || 0;
  const balanceAfter = Math.max(balanceDue - invoiceAmountSettled, 0);
  const receiptType = balanceAfter <= 0.009 ? "complete" : "part";
  const invoiceReference = String(invoice?.invoice_number || "").startsWith("AZ-")
    ? String(invoice.invoice_number)
    : `AZ-${invoice?.invoice_number || ""}`;
  const narration = `Being ${receiptType} receipt on Inv. No. ${invoiceReference} IFO ${invoice?.clients_name || "client"}`;
  const isMixedCurrency = form.payment_currency !== invoiceCurrency;
  const isForeignCurrency = invoiceCurrency !== "NGN" || form.payment_currency !== "NGN";

  const journalPreview = journalContext?.journal_preview || null;
  const journalPreviewError =
    journalContext?.journal_preview_error || journalContextError || "";
  const journalWarnings = Array.isArray(journalContext?.journal_warnings)
    ? journalContext.journal_warnings.filter((warning) => warning?.message)
    : Array.isArray(journalPreview?.validation_warnings)
      ? journalPreview.validation_warnings.filter((warning) => warning?.message)
      : [];
  const journalLines = Array.isArray(journalPreview?.lines) ? journalPreview.lines : [];
  const realizedGain = Number(journalPreview?.realized_fx_gain_ngn || 0);
  const realizedLoss = Number(journalPreview?.realized_fx_loss_ngn || 0);
  const previewReady = Boolean(journalPreview && journalContext?.preview_token);
  const configuredPaymentRate = Number(journalContext?.rate?.rate || 0);

  if (!isOpen) return null;

  const clearFieldError = (field) => {
    setErrors((current) => ({ ...current, [field]: "", form: "" }));
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearFieldError(field);
  };

  const handlePaymentDateChange = (date) => {
    setForm((current) => ({
      ...current,
      payment_date: date,
      payment_rate_date: date,
      payment_currency_rate_ngn: "",
    }));
    setErrors((current) => ({
      ...current,
      payment_date: "",
      payment_rate_date: "",
      form: "",
    }));
  };

  const handleInvoiceAmountChange = (value) => {
    setForm((current) => {
      const settled = Number.parseFloat(value) || 0;
      const receivable = suggestedReceivableForSettlement(settled);
      const receivableValue = settled > 0 ? numericString(receivable, 2) : "";
      if (current.payment_currency === invoiceCurrency) {
        return {
          ...current,
          invoice_amount_settled: value,
          journal_receivable_amount: receivableValue,
          payment_amount_received: receivableValue,
          cross_currency_rate: "1",
        };
      }
      const rate = Number.parseFloat(current.cross_currency_rate) || 0;
      const received = rate > 0 && receivable > 0
        ? numericString(receivable * rate, 2)
        : current.payment_amount_received;
      return {
        ...current,
        invoice_amount_settled: value,
        journal_receivable_amount: receivableValue,
        payment_amount_received: received,
      };
    });
    setErrors((current) => ({
      ...current,
      invoice_amount_settled: "",
      journal_receivable_amount: "",
      payment_amount_received: "",
      cross_currency_rate: "",
      form: "",
    }));
  };

  const handlePaymentAmountChange = (value) => {
    setForm((current) => {
      if (current.payment_currency === invoiceCurrency) {
        const settlement = suggestedSettlementForReceivable(value);
        return {
          ...current,
          invoice_amount_settled: value ? numericString(settlement, 2) : "",
          payment_amount_received: value,
          journal_receivable_amount: value,
          cross_currency_rate: "1",
        };
      }
      const received = Number.parseFloat(value) || 0;
      const receivable = Number.parseFloat(current.journal_receivable_amount) || 0;
      const rate = received > 0 && receivable > 0 ? numericString(received / receivable, 8) : "";
      return { ...current, payment_amount_received: value, cross_currency_rate: rate };
    });
    setErrors((current) => ({
      ...current,
      invoice_amount_settled: "",
      payment_amount_received: "",
      journal_receivable_amount: "",
      cross_currency_rate: "",
      form: "",
    }));
  };

  const handleJournalReceivableChange = (value) => {
    setForm((current) => {
      const receivable = Number.parseFloat(value) || 0;
      const settlement = suggestedSettlementForReceivable(receivable);
      if (current.payment_currency === invoiceCurrency) {
        return {
          ...current,
          invoice_amount_settled: value ? numericString(settlement, 2) : "",
          journal_receivable_amount: value,
          payment_amount_received: value,
          cross_currency_rate: "1",
        };
      }
      const received = Number.parseFloat(current.payment_amount_received) || 0;
      const rate = received > 0 && receivable > 0 ? numericString(received / receivable, 8) : "";
      return {
        ...current,
        invoice_amount_settled: value ? numericString(settlement, 2) : "",
        journal_receivable_amount: value,
        cross_currency_rate: rate,
      };
    });
    setErrors((current) => ({
      ...current,
      invoice_amount_settled: "",
      journal_receivable_amount: "",
      payment_amount_received: "",
      cross_currency_rate: "",
      form: "",
    }));
  };

  const handleCrossRateChange = (value) => {
    setForm((current) => {
      const rate = Number.parseFloat(value) || 0;
      const receivable = Number.parseFloat(current.journal_receivable_amount) || 0;
      const received = rate > 0 && receivable > 0 ? numericString(receivable * rate, 2) : "";
      return { ...current, cross_currency_rate: value, payment_amount_received: received };
    });
    setErrors((current) => ({
      ...current,
      cross_currency_rate: "",
      payment_amount_received: "",
      form: "",
    }));
  };

  const handlePaymentCurrencyChange = (currency) => {
    setForm((current) => {
      const sameCurrency = currency === invoiceCurrency;
      return {
        ...current,
        payment_currency: currency,
        payment_amount_received: sameCurrency ? current.journal_receivable_amount : "",
        cross_currency_rate: sameCurrency ? "1" : "",
        payment_currency_rate_ngn: "",
        bank_id: "",
        bank_ledger_number: "",
      };
    });
    setJournalContext(null);
    setJournalContextError("");
    setErrors((current) => ({
      ...current,
      payment_currency: "",
      payment_amount_received: "",
      cross_currency_rate: "",
      bank_id: "",
      bank_ledger_number: "",
      form: "",
    }));
  };

  const validate = () => {
    const next = {};
    const paymentDate = toDateString(form.payment_date);
    const rateDate = toDateString(form.payment_rate_date);

    if (!form.payment_date) next.payment_date = "Payment date is required";
    if (!form.invoice_amount_settled || invoiceAmountSettled <= 0) {
      next.invoice_amount_settled = "Enter the invoice amount being settled";
    } else if (invoiceAmountSettled > balanceDue + 0.009) {
      next.invoice_amount_settled = "Amount cannot exceed the outstanding invoice balance";
    }
    if (!form.payment_currency) next.payment_currency = "Select the currency received";
    if (!form.journal_receivable_amount || journalReceivableAmount <= 0) {
      next.journal_receivable_amount = "Enter the receivable amount for the journal";
    } else if (journalReceivableAmount > invoiceAmountSettled + 0.009) {
      next.journal_receivable_amount = "Receivable amount cannot exceed the invoice amount settled";
    } else if (withholdingTaxApplied > remainingWithholding + 0.009) {
      next.journal_receivable_amount = `The WHT difference cannot exceed ${formatMoney(remainingWithholding)} ${invoiceCurrency}`;
    }
    if (!form.payment_amount_received || paymentAmountReceived <= 0) {
      next.payment_amount_received = "Enter the amount actually received";
    }
    if (
      !isMixedCurrency &&
      paymentAmountReceived > 0 &&
      journalReceivableAmount > 0 &&
      Math.abs(paymentAmountReceived - journalReceivableAmount) > 0.009
    ) {
      next.payment_amount_received = "For the same currency, amount received must equal the receivable amount posted";
    }
    if (isMixedCurrency && crossCurrencyRate <= 0) {
      next.cross_currency_rate = "Enter the cross-currency settlement rate";
    }
    if (!form.payment_rate_date) {
      next.payment_rate_date = "Rate effective date is required";
    } else if (paymentDate && rateDate && rateDate > paymentDate) {
      next.payment_rate_date = "Rate date cannot be later than the payment date";
    }
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
      if (isForeignCurrency && journalContext?.fx_schema_ready === false) {
        next.form = "The FX database migration must be applied before posting this receipt journal.";
      } else if (!previewReady) {
        next.form = journalPreviewError || "Wait for the exact journal preview before posting.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      const paymentRateOverride = Number.parseFloat(form.payment_currency_rate_ngn);
      const response = await api.post("/invoice/record-payment", {
        invoice_number: invoice.invoice_number,
        payment_date: toDateString(form.payment_date),
        invoice_amount_settled: invoiceAmountSettled,
        journal_receivable_amount: journalReceivableAmount,
        payment_currency: form.payment_currency,
        payment_amount_received: paymentAmountReceived,
        cross_currency_rate: isMixedCurrency ? crossCurrencyRate : 1,
        payment_rate_date: toDateString(form.payment_rate_date || form.payment_date),
        payment_currency_rate_ngn:
          Number.isFinite(paymentRateOverride) && paymentRateOverride > 0
            ? paymentRateOverride
            : null,
        payment_method: form.payment_method,
        bank_id: form.bank_id || null,
        transaction_reference: form.transaction_reference.trim(),
        notes: form.notes.trim(),
        post_journal: form.post_journal,
        bank_ledger_number: form.post_journal ? Number(form.bank_ledger_number) : null,
        credit_ledger_number: form.credit_ledger_number
          ? Number(form.credit_ledger_number)
          : null,
        journal_preview_token: form.post_journal ? journalContext?.preview_token || "" : "",
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
    <div
      className={`invoice-payment-modal theme-${theme}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-payment-title"
    >
      <button
        type="button"
        className="invoice-payment-modal__backdrop"
        onClick={isSubmitting ? undefined : onClose}
        aria-label="Close payment modal"
      />

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
              <p>Record the currency received, clear the invoice balance, and preview the exact journal before posting.</p>
            </div>
          </div>
          <button
            type="button"
            className="invoice-payment-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <span className="fas fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <div className="invoice-payment-modal__body">
          <div className="invoice-payment-modal__summary invoice-payment-modal__summary--payment-flow">
            <div>
              <span>{remainingWithholding > 0.009 ? "Receivable due after WHT" : "Receivable due"}</span>
              <strong><small>{invoiceCurrency}</small>{formatMoney(receivableOutstanding)}</strong>
            </div>
            <span className="fas fa-arrow-right" aria-hidden="true" />
            <div>
              <span>Invoice amount settled</span>
              <strong><small>{invoiceCurrency}</small>{formatMoney(invoiceAmountSettled)}</strong>
            </div>
            <span className="fas fa-arrow-right" aria-hidden="true" />
            <div>
              <span>Amount received</span>
              <strong><small>{form.payment_currency}</small>{formatMoney(paymentAmountReceived)}</strong>
            </div>
            <span className="fas fa-arrow-right" aria-hidden="true" />
            <div>
              <span>Balance after payment</span>
              <strong><small>{invoiceCurrency}</small>{formatMoney(balanceAfter)}</strong>
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
                  onChange={handlePaymentDateChange}
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
              {errors.payment_date ? (
                <small className="invoice-payment-modal__field-error">{errors.payment_date}</small>
              ) : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Invoice currency</span>
              <div className="invoice-payment-modal__readonly-value">
                <i className="fas fa-file-invoice-dollar" aria-hidden="true" />
                <strong>{invoiceCurrency}</strong>
                <small>Fixed by the invoice</small>
              </div>
            </label>

            <label className="invoice-payment-modal__field">
              <span>Invoice amount settled</span>
              <div className={`invoice-payment-modal__money ${errors.invoice_amount_settled ? "has-error" : ""}`}>
                <small>{invoiceCurrency}</small>
                <input
                  type="number"
                  value={form.invoice_amount_settled}
                  onChange={(event) => handleInvoiceAmountChange(event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  min="0.01"
                  max={balanceDue}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <small className="invoice-payment-modal__field-hint">
                This is the amount removed from the invoice balance.
              </small>
              {errors.invoice_amount_settled ? (
                <small className="invoice-payment-modal__field-error">{errors.invoice_amount_settled}</small>
              ) : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Payment currency</span>
              <Select
                options={currencyOptions}
                value={paymentCurrencyOption}
                onChange={(option) => handlePaymentCurrencyChange(option?.value || invoiceCurrency)}
                className={`invoice-payment-select ${errors.payment_currency ? "has-error" : ""}`}
                classNamePrefix="invoice-payment-select"
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                styles={selectPortalStyles}
                isSearchable={false}
                placeholder="Select currency received"
              />
              <small className="invoice-payment-modal__field-hint">
                This may differ from the invoice currency.
              </small>
              {errors.payment_currency ? (
                <small className="invoice-payment-modal__field-error">{errors.payment_currency}</small>
              ) : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Amount actually received</span>
              <div className={`invoice-payment-modal__money ${errors.payment_amount_received ? "has-error" : ""}`}>
                <small>{form.payment_currency}</small>
                <input
                  type="number"
                  value={form.payment_amount_received}
                  onChange={(event) => handlePaymentAmountChange(event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <small className="invoice-payment-modal__field-hint">
                Enter the amount received into the selected currency account.
              </small>
              {errors.payment_amount_received ? (
                <small className="invoice-payment-modal__field-error">{errors.payment_amount_received}</small>
              ) : null}
            </label>

            <label className="invoice-payment-modal__field">
              <span>Receivable amount to post</span>
              <div className={`invoice-payment-modal__money ${errors.journal_receivable_amount ? "has-error" : ""}`}>
                <small>{invoiceCurrency}</small>
                <input
                  type="number"
                  value={form.journal_receivable_amount}
                  onChange={(event) => handleJournalReceivableChange(event.target.value)}
                  onWheel={(event) => event.currentTarget.blur()}
                  min="0.01"
                  max={invoiceAmountSettled || balanceDue}
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <small className="invoice-payment-modal__field-hint">
                Credit this amount to receivables. Any permitted difference from the invoice amount settled is treated as WHT in the invoice register only.
              </small>
              {withholdingTaxApplied > 0.009 ? (
                <small className="invoice-payment-modal__field-hint">
                  WHT applied to this settlement: {invoiceCurrency} {formatMoney(withholdingTaxApplied)}.
                </small>
              ) : null}
              {errors.journal_receivable_amount ? (
                <small className="invoice-payment-modal__field-error">{errors.journal_receivable_amount}</small>
              ) : null}
            </label>

            {isMixedCurrency ? (
              <label className="invoice-payment-modal__field">
                <span>Cross-currency settlement rate</span>
                <div className={`invoice-payment-modal__rate-input ${errors.cross_currency_rate ? "has-error" : ""}`}>
                  <span>1 {invoiceCurrency}</span>
                  <input
                    type="number"
                    value={form.cross_currency_rate}
                    onChange={(event) => handleCrossRateChange(event.target.value)}
                    onWheel={(event) => event.currentTarget.blur()}
                    min="0.00000001"
                    step="0.00000001"
                    placeholder="0.00000000"
                  />
                  <small>{form.payment_currency}</small>
                </div>
                <small className="invoice-payment-modal__field-hint">
                  The rate converts the receivable amount posted into the amount actually received.
                </small>
                {errors.cross_currency_rate ? (
                  <small className="invoice-payment-modal__field-error">{errors.cross_currency_rate}</small>
                ) : null}
              </label>
            ) : null}

            <label className="invoice-payment-modal__field">
              <span>Rate effective date</span>
              <div className={`invoice-payment-modal__date ${errors.payment_rate_date ? "has-error" : ""}`}>
                <DatePicker
                  selected={form.payment_rate_date}
                  onChange={(date) => updateField("payment_rate_date", date)}
                  dateFormat="dd MMMM yyyy"
                  maxDate={form.payment_date || new Date()}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  placeholderText="Select rate date"
                  popperClassName="invoice-payment-datepicker-popper"
                  portalId="root"
                />
                <span className="fas fa-calendar-check" aria-hidden="true" />
              </div>
              <small className="invoice-payment-modal__field-hint">
                The rate may be entered later, but its effective date cannot be after the payment date.
              </small>
              {errors.payment_rate_date ? (
                <small className="invoice-payment-modal__field-error">{errors.payment_rate_date}</small>
              ) : null}
            </label>

            {form.payment_currency !== "NGN" ? (
              <label className="invoice-payment-modal__field">
                <span>Payment currency NGN rate <small>Optional override</small></span>
                <div className="invoice-payment-modal__rate-input invoice-payment-modal__rate-input--simple">
                  <span>1 {form.payment_currency}</span>
                  <input
                    type="number"
                    value={form.payment_currency_rate_ngn}
                    onChange={(event) => updateField("payment_currency_rate_ngn", event.target.value)}
                    onWheel={(event) => event.currentTarget.blur()}
                    min="0.00000001"
                    step="0.00000001"
                    placeholder={configuredPaymentRate > 0 ? formatRate(configuredPaymentRate) : "Use configured rate"}
                  />
                  <small>NGN</small>
                </div>
                <small className="invoice-payment-modal__field-hint">
                  Leave blank to use the configured rate on or before the effective date.
                </small>
              </label>
            ) : null}

            <label className="invoice-payment-modal__field">
              <span>Payment method</span>
              <Select
                options={METHOD_OPTIONS}
                value={methodOption}
                onChange={(option) => {
                  updateField("payment_method", option?.value || "");
                  if (!["Bank Transfer", "Cheque", "Card"].includes(option?.value || "") && !form.post_journal) {
                    updateField("bank_id", "");
                  }
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
              {errors.payment_method ? (
                <small className="invoice-payment-modal__field-error">{errors.payment_method}</small>
              ) : null}
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
                placeholder={`Select ${form.payment_currency} account`}
                noOptionsMessage={() => `No ${form.payment_currency} bank accounts found`}
              />
              <small className="invoice-payment-modal__field-hint">
                The receiving account must use the payment currency.
              </small>
              {errors.bank_id ? (
                <small className="invoice-payment-modal__field-error">{errors.bank_id}</small>
              ) : null}
            </label>

            <div className="invoice-payment-modal__journal invoice-payment-modal__field--full">
              <div className="invoice-payment-modal__journal-toggle-row">
                <div>
                  <span className="invoice-payment-modal__journal-icon"><i className="fas fa-book" aria-hidden="true" /></span>
                  <div>
                    <strong>Post receipt journal</strong>
                    <p>Preview and post the balanced receipt, receivable, and realized FX lines.</p>
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

              {!form.post_journal ? (
                <div className="invoice-payment-modal__manual-note">
                  <i className="fas fa-circle-info" aria-hidden="true" />
                  <span>The payment will be recorded as journal pending. A validated manual settlement journal can be linked later.</span>
                </div>
              ) : (
                <div className="invoice-payment-modal__journal-body">
                  {journalPreviewError ? (
                    <div className="invoice-payment-modal__journal-warning">
                      <i className="fas fa-triangle-exclamation" />
                      <span>
                        {journalPreviewError}
                        <small> You can still change either ledger below and the preview will refresh automatically.</small>
                      </span>
                    </div>
                  ) : null}

                  {journalWarnings.length ? (
                    <div className="invoice-payment-modal__journal-warning" role="status">
                      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                      <span>
                        <strong>Review before posting</strong>
                        {journalWarnings.map((warning) => (
                          <small key={warning.code || warning.message}>{warning.message}</small>
                        ))}
                      </span>
                    </div>
                  ) : null}

                  <div className="invoice-payment-modal__journal-ledger-grid">
                    <label className="invoice-payment-modal__field">
                      <span>Ledger to debit <small>Receiving side</small></span>
                      <Select
                        options={debitLedgerOptions}
                        value={debitLedgerOption}
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
                        Select the receiving bank, cash, partner, or other appropriate ledger.
                      </small>
                      {errors.bank_ledger_number ? (
                        <small className="invoice-payment-modal__field-error">{errors.bank_ledger_number}</small>
                      ) : null}
                    </label>

                    <label className="invoice-payment-modal__field">
                      <span>Ledger to credit <small>Invoice ledger suggested</small></span>
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
                        Use the suggested invoice ledger or intentionally choose another ledger. Differences are warnings, not posting blocks.
                      </small>
                      {errors.credit_ledger_number ? (
                        <small className="invoice-payment-modal__field-error">{errors.credit_ledger_number}</small>
                      ) : null}
                    </label>
                  </div>

                  {journalContextLoading ? (
                    <div className="invoice-payment-modal__journal-loading">
                      <i className="fas fa-spinner fa-spin" /> Preparing the exact journal preview…
                    </div>
                  ) : null}

                  {previewReady ? (
                    <>
                      <div className="invoice-payment-modal__conversion-summary">
                        <div>
                          <span>Invoice cleared</span>
                          <strong>{invoiceCurrency} {formatMoney(journalPreview.invoice_amount_settled)}</strong>
                        </div>
                        <div>
                          <span>Receivable posted</span>
                          <strong>{invoiceCurrency} {formatMoney(journalPreview.journal_receivable_amount)}</strong>
                        </div>
                        <div>
                          <span>Receipt recorded</span>
                          <strong>{form.payment_currency} {formatMoney(journalPreview.payment_amount_received)}</strong>
                        </div>
                        <div>
                          <span>Cross-currency rate</span>
                          <strong>
                            {isMixedCurrency
                              ? `1 ${invoiceCurrency} = ${formatRate(journalPreview.cross_currency_rate)} ${form.payment_currency}`
                              : `1 ${invoiceCurrency} = 1 ${form.payment_currency}`}
                          </strong>
                        </div>
                      </div>

                      <div className="invoice-payment-modal__journal-preview-table-wrap">
                        <table className="invoice-payment-modal__journal-preview-table">
                          <thead>
                            <tr>
                              <th>Ledger</th>
                              <th>Purpose</th>
                              <th>Currency</th>
                              <th>Debit</th>
                              <th>Credit</th>
                              <th>Debit NGN</th>
                              <th>Credit NGN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {journalLines.map((line, index) => (
                              <tr key={`${line.ledger?.ledger_number || index}-${line.purpose || index}`}>
                                <td>
                                  <strong>{line.ledger?.ledger_name || "—"}</strong>
                                  <small>{line.ledger?.ledger_number || "—"}</small>
                                </td>
                                <td>{String(line.purpose || "journal line").replaceAll("_", " ")}</td>
                                <td>{line.currency || "—"}</td>
                                <td>{Number(line.debit || 0) > 0 ? formatMoney(line.debit) : "—"}</td>
                                <td>{Number(line.credit || 0) > 0 ? formatMoney(line.credit) : "—"}</td>
                                <td>{Number(line.debit_ngn || 0) > 0 ? formatMoney(line.debit_ngn) : "—"}</td>
                                <td>{Number(line.credit_ngn || 0) > 0 ? formatMoney(line.credit_ngn) : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="5">Balanced journal total</td>
                              <td>{formatMoney(journalPreview.total_debit_ngn)}</td>
                              <td>{formatMoney(journalPreview.total_credit_ngn)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {isForeignCurrency ? (
                        <div className="invoice-payment-modal__fx-summary">
                          <div>
                            <span>Settlement value</span>
                            <strong>NGN {formatMoney(journalPreview.settlement_value_ngn)}</strong>
                            <small>
                              {form.payment_currency} rate {formatRate(journalPreview.payment_currency_rate_ngn)} on {journalPreview.rate_date}
                            </small>
                          </div>
                          <div>
                            <span>Receivable carrying value</span>
                            <strong>NGN {formatMoney(journalPreview.carrying_value_settled_ngn)}</strong>
                            <small>Carrying rate {formatRate(journalPreview.carrying_rate)}</small>
                          </div>
                          <div className={realizedGain > 0 ? "is-gain" : realizedLoss > 0 ? "is-loss" : "is-neutral"}>
                            <span>Realized FX result</span>
                            <strong>
                              {realizedGain > 0
                                ? `Gain NGN ${formatMoney(realizedGain)}`
                                : realizedLoss > 0
                                  ? `Loss NGN ${formatMoney(realizedLoss)}`
                                  : "No gain or loss"}
                            </strong>
                            <small>
                              {journalPreview.realized_fx_ledger_number
                                ? `Posted to ledger ${journalPreview.realized_fx_ledger_number}`
                                : "No FX balancing line required"}
                            </small>
                          </div>
                        </div>
                      ) : null}

                      <div className="invoice-payment-modal__journal-meta">
                        <span><i className="fas fa-calendar-check" />Rate date: {journalPreview.rate_date || "—"}</span>
                        <span><i className="fas fa-scale-balanced" />Preview verified before posting</span>
                      </div>
                      <div className="invoice-payment-modal__narration">
                        <span>Narration</span>
                        <p>{journalPreview.narration || narration}</p>
                      </div>
                    </>
                  ) : !journalContextLoading && !journalPreviewError ? (
                    <div className="invoice-payment-modal__journal-warning">
                      <i className="fas fa-circle-info" /> Select both ledgers and complete the payment amounts to generate the exact journal preview.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
          <button
            type="button"
            className="invoice-payment-modal__cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="invoice-payment-modal__submit"
            disabled={
              isSubmitting ||
              balanceDue <= 0 ||
              (form.post_journal && (journalContextLoading || !previewReady))
            }
          >
            <span
              className={`fas ${
                isSubmitting ? "fa-spinner fa-spin" : form.post_journal ? "fa-book" : "fa-circle-check"
              }`}
              aria-hidden="true"
            />
            <span>
              {isSubmitting
                ? "Recording payment…"
                : form.post_journal
                  ? "Record and post journal"
                  : "Record payment"}
            </span>
          </button>
        </footer>
      </motion.form>
    </div>
  );
};

export default RecordInvoicePaymentModal;
