import React, { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
import api from "../../services/api";
import "./InvoicePaymentRegistrationSelect.css";

const formatAmount = (value) => (Number(value) || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const mapInvoiceOption = (invoice) => {
  const invoiceNumber = String(invoice?.invoice_number || "").trim();
  const clientName = String(invoice?.clients_name || "Unknown client").trim();
  const currency = String(invoice?.currency || "NGN").trim().toUpperCase();
  const available = Number(invoice?.available_to_register || 0);
  const total = Number(invoice?.invoice_total || 0);
  const registrationStatus = String(invoice?.registration_status || "Not registered");

  return {
    value: invoiceNumber,
    label: `INV ${invoiceNumber} ${clientName} ${currency} ${formatAmount(available)} ${registrationStatus}`,
    invoice: {
      ...invoice,
      invoice_number: invoiceNumber,
      clients_name: clientName,
      currency,
      available_to_register: available,
      invoice_total: total,
    },
  };
};

const InvoiceOptionLabel = ({ data, context }) => {
  const invoice = data?.invoice || {};
  const isFullyRegistered = Boolean(invoice.is_fully_registered);

  if (context === "value") {
    return (
      <span className="invoice-payment-select__selected-label">
        <strong>INV {invoice.invoice_number || data.value}</strong>
        <span>{invoice.clients_name || ""}</span>
      </span>
    );
  }

  return (
    <div className="invoice-payment-select__option-copy">
      <div className="invoice-payment-select__option-heading">
        <strong>INV {invoice.invoice_number || data.value}</strong>
        <span className={isFullyRegistered ? "is-complete" : ""}>
          {invoice.registration_status || "Not registered"}
        </span>
      </div>
      <span className="invoice-payment-select__client">{invoice.clients_name || "Unknown client"}</span>
      <small>
        {invoice.currency || "NGN"} {formatAmount(invoice.available_to_register)} available
        <b aria-hidden="true">·</b>
        {invoice.currency || "NGN"} {formatAmount(invoice.invoice_total)} total
      </small>
    </div>
  );
};

export default function InvoicePaymentRegistrationSelect({
  inputId = "invoice_payment_invoice_number",
  value = null,
  invoiceNumber = "",
  onChange,
  disabled = false,
  excludeJournalId = 0,
}) {
  const [options, setOptions] = useState([]);
  const [includeFullyRegistered, setIncludeFullyRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const timerRef = useRef(null);
  const requestRef = useRef(0);

  const fetchOptions = useCallback(async (search = "") => {
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/journal/invoice-payment-registration-options", {
        params: {
          search: String(search || "").trim(),
          limit: 250,
          include_fully_registered: includeFullyRegistered ? 1 : 0,
          exclude_journal_id: Number(excludeJournalId) > 0 ? Number(excludeJournalId) : undefined,
        },
      });
      if (requestId !== requestRef.current) return;

      const invoices = Array.isArray(response?.data?.data) ? response.data.data : [];
      setOptions(invoices.map(mapInvoiceOption));
    } catch (error) {
      if (requestId !== requestRef.current) return;
      setOptions([]);
      setLoadError(
        error?.response?.data?.message
        || error?.message
        || "Invoices could not be loaded."
      );
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [includeFullyRegistered, excludeJournalId]);

  useEffect(() => {
    fetchOptions("");
    return () => {
      requestRef.current += 1;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchOptions]);

  const searchOptions = (search) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchOptions(search), 220);
  };

  const selectedValue = value
    || options.find((option) => String(option.value) === String(invoiceNumber))
    || (invoiceNumber
      ? {
          value: invoiceNumber,
          label: `INV ${invoiceNumber}`,
          invoice: { invoice_number: invoiceNumber, clients_name: "" },
        }
      : null);

  return (
    <div className="invoice-payment-select">
      <Select
        inputId={inputId}
        className="invoice-payment-select__field"
        classNamePrefix="invoice-payment-react-select"
        options={options}
        value={selectedValue}
        onChange={(option) => onChange?.(option || null)}
        onInputChange={(search, action) => {
          if (action.action === "input-change") searchOptions(search);
        }}
        onMenuOpen={() => {
          if (!options.length && !isLoading) fetchOptions("");
        }}
        isLoading={isLoading}
        isDisabled={disabled}
        isClearable
        isSearchable
        filterOption={null}
        formatOptionLabel={(option, meta) => <InvoiceOptionLabel data={option} context={meta.context} />}
        placeholder="Search invoice number or client"
        loadingMessage={() => "Loading invoices…"}
        noOptionsMessage={({ inputValue }) => {
          if (loadError) return "Unable to load invoices";
          return inputValue ? "No matching invoices" : "No eligible invoices available";
        }}
      />

      <div className="invoice-payment-select__footer">
        <label className={`invoice-payment-select__filter ${disabled ? "is-disabled" : ""}`}>
          <input
            type="checkbox"
            className="table-checkbox invoice-payment-select__checkbox"
            checked={includeFullyRegistered}
            onChange={(event) => setIncludeFullyRegistered(event.target.checked)}
            disabled={disabled}
          />
          <span>Show fully registered invoices</span>
        </label>
        {loadError ? <span className="invoice-payment-select__error" title={loadError}>{loadError}</span> : null}
      </div>
    </div>
  );
}
