import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import useRateStore from "../../stores/useRateStore"; // Added for createRate
import CreateRateModal from "../../components/modals/CreateRateModal"; // Added for Rate Modal
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import useClientSearchStore from "../../stores/useClientSearchStore";
import useProjectSearchStore from "../../stores/useProjectSearchStore";
import useBankSearchStore from "../../stores/useBankSearchStore";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;

/**
 * Create a blank row for newly added lines (no db_id yet).
 */
function createEmptyItem(sn) {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    db_id: null,       // null = new, not yet saved
    sn,
    description: "",
    amount: "",
    discount: "",
    vat: "",
    wht: "",
  };
}

/**
 * Seed a row from the API response item.
 * Maps API field names (discount_percent, vat_percent, wht_percent) → form fields.
 */
function createItemFromDb(row, sn) {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    db_id: row.id ?? null,
    sn,
    description: row.description || "",
    amount: String(parseFloat(row.amount) || ""),
    discount: String(parseFloat(row.discount_percent) || "0"),
    vat: String(parseFloat(row.vat_percent) || "0"),
    wht: String(parseFloat(row.wht_percent) || "0"),
  };
}

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ─────────────────────────────────────────────
   Static Option Arrays
───────────────────────────────────────────── */
const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
];

const STATUS_OPTIONS = [
  { value: "Paid", label: "Paid" },
  { value: "Pending", label: "Pending" },
  { value: "Overdue", label: "Overdue" },
  { value: "Cancelled", label: "Cancelled" },
];

const TIN_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

/* ─────────────────────────────────────────────
   calculateTotals
───────────────────────────────────────────── */
function calculateTotals(items) {
  let totalDiscount = 0;
  let totalVat = 0;
  let totalWht = 0;
  let grandTotal = 0;

  items.forEach((item) => {
    const amount = parseFloat(item.amount) || 0;
    const discountPct = parseFloat(item.discount) || 0;
    const vatPct = parseFloat(item.vat) || 0;
    const whtPct = parseFloat(item.wht) || 0;

    const discountAmt = (amount * discountPct) / 100;
    const afterDiscount = amount - discountAmt;
    const vatAmt = (afterDiscount * vatPct) / 100;
    const subtotal = afterDiscount + vatAmt;
    const whtAmt = (afterDiscount * whtPct) / 100;

    totalDiscount += discountAmt;
    totalVat += vatAmt;
    totalWht += whtAmt;
    grandTotal += subtotal;
  });

  return { totalDiscount, totalVat, totalWht, grandTotal };
}

function computeRowSubtotal(item) {
  const amount = parseFloat(item.amount) || 0;
  const discountPct = parseFloat(item.discount) || 0;
  const vatPct = parseFloat(item.vat) || 0;
  const whtPct = parseFloat(item.wht) || 0;

  const discountAmt = (amount * discountPct) / 100;
  const afterDiscount = amount - discountAmt;
  const vatAmt = (afterDiscount * vatPct) / 100;
  const whtAmt = (afterDiscount * whtPct) / 100;
  return afterDiscount + vatAmt;
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EditInvoiceForm = ({ invoiceNumber, invoice, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { rates, searchRates, isLoading: ratesLoading } = useRateSearchStore(); // Added isLoading
  const { clients, searchClients, isLoading: clientsLoading } = useClientSearchStore(); // Added isLoading
  const { projects, searchProjects, isLoading: projectsLoading } = useProjectSearchStore(); // Added isLoading
  const { banks, searchBanks, isLoading: banksLoading } = useBankSearchStore(); // Added isLoading

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateRateModal, setShowCreateRateModal] = useState(false); // State for Rate Modal

  /* ── Delete-line-item modal state ── */
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    itemId: null,   // local row id
    db_id: null,    // backend id (null = new row)
    isNew: true,
    isDeleting: false,
  });

  /* ── Header State ── */
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoice_date: new Date(),
    due_date: new Date(),
    clients_name: "",
    clients_id: "",
    project: "",
    currency: "NGN",
    tin_number: "No",
    bank_name: "",
    account_name: "",
    account_number: "",
    account_currency: "",
    status: "",
    rate_date: "",
  });

  /* ── Row State ── */
  const [invoiceItems, setInvoiceItems] = useState([createEmptyItem(1)]);
  const prevInvoiceItemsRef = useRef(invoiceItems);

  /* ── On mount: fetch supporting data ── */
  useEffect(() => {
    searchRates("");
    searchClients("");
    searchProjects("");
    searchBanks("");
  }, []);

  /* ── Populate form when invoice prop arrives ── */
  useEffect(() => {
    if (!invoice) return;

    setInvoiceDetails({
      invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(),
      due_date: invoice.due_date ? new Date(invoice.due_date) : new Date(),
      clients_name: invoice.clients_name || "",
      clients_id: String(invoice.clients_id || ""),
      project: invoice.project || "",
      currency: invoice.currency || "NGN",
      tin_number: invoice.tin_number || "No",
      bank_name: invoice.bank_name || "",
      account_name: invoice.account_name || "",
      account_number: invoice.account_number || "",
      account_currency: invoice.account_currency || "",
      status: invoice.status || "",
      rate_date: invoice.rate_date || "",
    });

    if (invoice.items && invoice.items.length > 0) {
      setInvoiceItems(invoice.items.map((row, idx) => createItemFromDb(row, idx + 1)));
    }
  }, [invoice]);

  useEffect(() => {
    prevInvoiceItemsRef.current = invoiceItems;
  }, [invoiceItems]);

  /* ── Rate options based on selected currency ── */
  const rateOptions = useMemo(() => {
    const curr = invoiceDetails.currency?.toLowerCase();
    if (!curr) return [];
    return rates
      .filter((r) => r[`${curr}_rate`] != null)
      .map((r) => ({
        value: r.created_at,
        label: `${r.created_at} | ${invoiceDetails.currency} @ ${r[`${curr}_rate`]}`,
        rate: r,
      }));
  }, [rates, invoiceDetails.currency]);

  /* ── Bank options ── */
  const bankOptions = useMemo(() => banks.map((b) => ({ value: b.id, label: `${b.bank_name} - ${b.account_number}`, bank: b })), [banks]);
  /* ── Client options ── */
  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.clients_name, label: c.clients_name, client: c })), [clients]);
  /* ── Project options ── */
  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.project_name, label: p.project_name })), [projects]);
  
  /* ── Totals ── */
  const totals = useMemo(() => calculateTotals(invoiceItems), [invoiceItems]);

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateHeader = useCallback(() => {
    const e = {};
    if (!invoiceDetails.invoice_date) e.invoice_date = "Invoice date is required";
    if (!invoiceDetails.due_date) e.due_date = "Due date is required";
    if (!invoiceDetails.clients_name) e.clients_name = "Client is required";
    if (!invoiceDetails.currency) e.currency = "Currency is required";
    if (!invoiceDetails.rate_date) e.rate_date = "Rate date is required";
    if (!invoiceDetails.status) e.status = "Status is required";
    if (!invoiceDetails.tin_number) e.tin_number = "TIN display option is required";
    return e;
  }, [invoiceDetails]);

  const validateItems = useCallback(() => {
    return invoiceItems.map((item) => {
      const e = {};
      if (!item.description?.trim()) e.description = "Description required";
      if (item.amount === "" || item.amount === null) e.amount = "Amount required";
      else if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) e.amount = "Invalid amount";
      if (item.discount === "" || item.discount === null) e.discount = "Required";
      if (item.vat === "" || item.vat === null) e.vat = "Required";
      if (item.wht === "" || item.wht === null) e.wht = "Required";
      return e;
    });
  }, [invoiceItems]);

  const headerErrors = useMemo(() => (submitted ? validateHeader() : {}), [submitted, validateHeader]);

  const itemErrorMap = useMemo(() => {
    if (!submitted) return {};
    const errs = validateItems();
    const prevItems = prevInvoiceItemsRef.current;
    return Object.fromEntries(
      invoiceItems.map((item, i) => {
        const isNew = !prevItems.some((p) => p.id === item.id);
        if (isNew) return [item.id, {}];
        return [item.id, errs[i] || {}];
      })
    );
  }, [submitted, validateItems, invoiceItems]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setInvoiceDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setInvoiceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    );
  };

  const addItem = () => setInvoiceItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);

  /* ── Request remove: open confirmation modal ── */
  const requestRemoveItem = (item) => {
    if (invoiceItems.length === 1) return;
    setDeleteModal({
      open: true,
      itemId: item.id,
      db_id: item.db_id,
      isNew: item.db_id === null,
      isDeleting: false,
    });
  };

  /* ── Confirmed remove ── */
  const confirmRemoveItem = async () => {
    const { itemId, db_id, isNew } = deleteModal;

    if (!isNew && db_id) {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const token = useAuthStore.getState().token;
      try {
        await api.delete("/invoice/delete-single-line", {
          headers: { Authorization: `Bearer ${token}` },
          data: { line_item_id: db_id },
        });
        showToast("Line item deleted successfully", "success");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to delete line item", "error");
        setDeleteModal({ open: false, itemId: null, db_id: null, isNew: true, isDeleting: false });
        return;
      }
    }

    setInvoiceItems((prev) => {
      const filtered = prev.filter((i) => i.id !== itemId);
      return filtered.map((item, idx) => ({ ...item, sn: idx + 1 }));
    });

    setDeleteModal({ open: false, itemId: null, db_id: null, isNew: true, isDeleting: false });
  };

  const handleRateCreated = () => {
    setShowCreateRateModal(false);
    searchRates(""); // Refresh the dropdown list
  };

  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const hErr = validateHeader();
    const iErr = validateItems();
    const hasFieldErrors = Object.keys(hErr).length > 0 || iErr.some((rowE) => Object.keys(rowE).length > 0);

    if (hasFieldErrors) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsLoading(true);
    const token = useAuthStore.getState().token;

    const payload = {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDetails.invoice_date instanceof Date ? invoiceDetails.invoice_date.toISOString().split("T")[0] : invoiceDetails.invoice_date,
      due_date: invoiceDetails.due_date instanceof Date ? invoiceDetails.due_date.toISOString().split("T")[0] : invoiceDetails.due_date,
      clients_name: invoiceDetails.clients_name,
      clients_id: invoiceDetails.clients_id,
      project: invoiceDetails.project || undefined,
      currency: invoiceDetails.currency,
      tin_number: invoiceDetails.tin_number,
      bank_name: invoiceDetails.bank_name,
      account_name: invoiceDetails.account_name,
      account_number: invoiceDetails.account_number,
      account_currency: invoiceDetails.account_currency,
      rate_date: invoiceDetails.rate_date,
      status: invoiceDetails.status,
      id: invoiceItems.map((i) => i.db_id ?? 0),
      description: invoiceItems.map((i) => i.description),
      amount: invoiceItems.map((i) => parseFloat(i.amount) || 0),
      discount: invoiceItems.map((i) => parseFloat(i.discount) || 0),
      vat: invoiceItems.map((i) => parseFloat(i.vat) || 0),
      wht: invoiceItems.map((i) => parseFloat(i.wht) || 0),
    };

    try {
      await api.put("/invoice/edit-invoice", payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Invoice updated successfully!", "success");
      setSubmitted(false);
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update invoice", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
        className={`invoice-form-box theme-${theme}`}
      >
        <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
          {/* ── HEADER DETAILS ── */}
          <div className="invoice-form-header">
            <div className="invoice-form-htxt">Edit Invoice</div>
            <div className="invoice-form-sub-htxt">
              Update the details below to edit Invoice #{invoiceNumber}
            </div>
          </div>

          <div className="invoice-form-flex-box">
            {/* Invoice Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.invoice_date ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.invoice_date ? "input-label-message" : ""}`} htmlFor="invoice_date">Invoice Date</label>
                  <div className="form-wrapper">
                    <DatePicker selected={invoiceDetails.invoice_date} onChange={(date) => handleDetailChange("invoice_date", date)} className={`form-input ${headerErrors.invoice_date ? "input-error" : ""}`} dateFormat="yyyy-MM-dd" wrapperClassName="input-date-picker" id="invoice_date" />
                    <span className={`chevron-input-icon fas fa-calendar ${headerErrors.invoice_date ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {headerErrors.invoice_date && <div className="input-error-message">{headerErrors.invoice_date}</div>}
              </div>
            </div>

            {/* Due Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.due_date ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.due_date ? "input-label-message" : ""}`} htmlFor="due_date">Due Date</label>
                  <div className="form-wrapper">
                    <DatePicker selected={invoiceDetails.due_date} onChange={(date) => handleDetailChange("due_date", date)} className={`form-input ${headerErrors.due_date ? "input-error" : ""}`} dateFormat="yyyy-MM-dd" wrapperClassName="input-date-picker" id="due_date" />
                    <span className={`chevron-input-icon fas fa-calendar ${headerErrors.due_date ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {headerErrors.due_date && <div className="input-error-message">{headerErrors.due_date}</div>}
              </div>
            </div>

            {/* Currency */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.currency ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.currency ? "input-label-message" : ""}`} htmlFor="currency">Currency</label>
                  <div className="form-wrapper">
                    <Select options={CURRENCY_OPTIONS} onChange={(opt) => { handleDetailChange("currency", opt?.value || ""); handleDetailChange("rate_date", ""); }} value={CURRENCY_OPTIONS.find((o) => o.value === invoiceDetails.currency) || null} placeholder="Select currency" className={`form-input-select ${headerErrors.currency ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId="currency" onMenuOpen={() => setOpenMenuId("currency")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "currency" ? "chevron-rotate" : "", headerErrors.currency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.currency && <div className="input-error-message">{headerErrors.currency}</div>}
              </div>
            </div>

            {/* Client Name */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${headerErrors.clients_name ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.clients_name ? "input-label-message" : ""}`} htmlFor="clients_name">Client Name</label>
                    <div className="form-wrapper">
                      <Select options={clientOptions} onInputChange={(val) => { if (val.length > 1) searchClients(val); }} onMenuOpen={() => setOpenMenuId("clients_name")} onMenuClose={() => { setOpenMenuId(null); searchClients(""); }} onChange={(opt) => { if (opt) { handleDetailChange("clients_name", opt.value); handleDetailChange("clients_id", opt.client?.clients_id ? String(opt.client.clients_id) : ""); } else { handleDetailChange("clients_name", ""); handleDetailChange("clients_id", ""); }}} value={invoiceDetails.clients_name ? { value: invoiceDetails.clients_name, label: invoiceDetails.clients_name } : null} placeholder="Search client..." className={`form-input-select ${headerErrors.clients_name ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="clients_name" isLoading={clientsLoading} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "clients_name" ? "chevron-rotate" : "", headerErrors.clients_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.clients_name && <div className="input-error-message">{headerErrors.clients_name}</div>}
                </div>
                <button type="button" className="inv-form-flex-btn" onClick={() => alert("Open Create Client Modal")} title="Add New Client"><span className="fas fa-plus"></span></button>
              </div>
            </div>

            {/* Client ID (disabled) */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group">
                  <label className="input-form-label" htmlFor="clients_id">Client ID</label>
                  <div className="form-wrapper"><input type="text" id="clients_id" className="form-input form-input-no-padding" value={invoiceDetails.clients_id} disabled readOnly placeholder="Auto-filled" /></div>
                </div>
              </div>
            </div>

            {/* Project (optional) */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className="input-form-group">
                    <label className="input-form-label" htmlFor="project">Project <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span></label>
                    <div className="form-wrapper">
                      <Select options={projectOptions} onInputChange={(val) => { if (val.length > 1) searchProjects(val); }} onMenuOpen={() => setOpenMenuId("project")} onMenuClose={() => { setOpenMenuId(null); searchProjects(""); }} onChange={(opt) => handleDetailChange("project", opt ? opt.value : "")} value={invoiceDetails.project ? { value: invoiceDetails.project, label: invoiceDetails.project } : null} placeholder="Search project..." className="form-input-select" classNamePrefix="form-input-select" isClearable inputId="project" isLoading={projectsLoading} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "project" ? "chevron-rotate" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                </div>
                <button type="button" className="inv-form-flex-btn" onClick={() => alert("Open Create Project Modal")} title="Add New Project"><span className="fas fa-plus"></span></button>
              </div>
            </div>

            {/* Rate Date */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${headerErrors.rate_date ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.rate_date ? "input-label-message" : ""}`} htmlFor="rate_date">Rate Date</label>
                    <div className="form-wrapper">
                      <Select options={rateOptions} onChange={(opt) => handleDetailChange("rate_date", opt ? opt.value : "")} value={rateOptions.find((o) => o.value === invoiceDetails.rate_date) || null} placeholder="Select rate..." className={`form-input-select ${headerErrors.rate_date ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="rate_date" onMenuOpen={() => setOpenMenuId("rate_date")} onMenuClose={() => setOpenMenuId(null)} noOptionsMessage={() => rates.length === 0 ? "Loading rates..." : `No rates for ${invoiceDetails.currency}`} isLoading={ratesLoading} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "rate_date" ? "chevron-rotate" : "", headerErrors.rate_date ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.rate_date && <div className="input-error-message">{headerErrors.rate_date}</div>}
                </div>
                {/* Button to trigger Create Rate Modal */}
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateRateModal(true)} title="Add New Rate"><span className="fas fa-plus"></span></button>
              </div>
            </div>

            {/* Select Bank Account */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${headerErrors.bank_name ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.bank_name ? "input-label-message" : ""}`} htmlFor="bank_account">Select Bank Account <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span></label>
                    <div className="form-wrapper">
                      <Select options={bankOptions} onInputChange={(val) => { if (val.length > 1) searchBanks(val); }} onMenuOpen={() => setOpenMenuId("bank_account")} onMenuClose={() => { setOpenMenuId(null); searchBanks(""); }} onChange={(opt) => { if (opt) { handleDetailChange("bank_name", opt.bank.bank_name); handleDetailChange("account_name", opt.bank.account_name); handleDetailChange("account_number", opt.bank.account_number); handleDetailChange("account_currency", opt.bank.account_currency); } else { handleDetailChange("bank_name", ""); handleDetailChange("account_name", ""); handleDetailChange("account_number", ""); handleDetailChange("account_currency", ""); }}} value={invoiceDetails.bank_name ? { value: invoiceDetails.bank_name, label: `${invoiceDetails.bank_name} - ${invoiceDetails.account_number}` } : null} placeholder="Search bank account..." className={`form-input-select ${headerErrors.bank_name ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="bank_account" isLoading={banksLoading} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "bank_account" ? "chevron-rotate" : "", headerErrors.bank_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.bank_name && <div className="input-error-message">{headerErrors.bank_name}</div>}
                </div>
                <button type="button" className="inv-form-flex-btn" onClick={() => alert("Open Create Bank Modal")} title="Add New Bank"><span className="fas fa-plus"></span></button>
              </div>
            </div>

            {/* Display TIN Number */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.tin_number ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.tin_number ? "input-label-message" : ""}`} htmlFor="tin_number">Display TIN Number?</label>
                  <div className="form-wrapper">
                    <Select options={TIN_OPTIONS} onChange={(opt) => handleDetailChange("tin_number", opt?.value || "")} value={TIN_OPTIONS.find((o) => o.value === invoiceDetails.tin_number) || null} placeholder="Select" className={`form-input-select ${headerErrors.tin_number ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId="tin_number" onMenuOpen={() => setOpenMenuId("tin_number")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "tin_number" ? "chevron-rotate" : "", headerErrors.tin_number ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.tin_number && <div className="input-error-message">{headerErrors.tin_number}</div>}
              </div>
            </div>

            {/* Status */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.status ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.status ? "input-label-message" : ""}`} htmlFor="status">Status</label>
                  <div className="form-wrapper">
                    <Select options={STATUS_OPTIONS} onChange={(opt) => { handleDetailChange("status", opt?.value || ""); }} value={STATUS_OPTIONS.find((o) => o.value === invoiceDetails.status) || null} placeholder="Select status" className={`form-input-select ${headerErrors.status ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId="status" onMenuOpen={() => setOpenMenuId("status")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "status" ? "chevron-rotate" : "", headerErrors.status ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.status && <div className="input-error-message">{headerErrors.status}</div>}
              </div>
            </div>
          </div>

          {/* ── INVOICE ITEMS TABLE ── */}
          <div className="invoice-form-full">
            <div className="invoice-items-table invoice-items-table-inv">
              <div className="invoice-table-header journal-table-header">
                <div className="invoice-table-cell cell-sn">S/N</div>
                <div className="invoice-table-cell">Description of Services</div>
                <div className="invoice-table-cell cell-small">Amount</div>
                <div className="invoice-table-cell cell-small">Disc (%)</div>
                <div className="invoice-table-cell cell-small">Vat (%)</div>
                <div className="invoice-table-cell cell-small">Wht (%)</div>
                <div className="invoice-table-cell cell-small">Subtotal</div>
                <div className="invoice-table-cell cell-action">Action</div>
              </div>

              {invoiceItems.map((item) => {
                const rowErr = itemErrorMap[item.id] || {};
                const subtotal = computeRowSubtotal(item);

                return (
                  <div key={item.id} className="invoice-table-row">
                    <div className="invoice-table-cell cell-sn"><span className="invoice-sn-badge">{item.sn}</span></div>
                    <div className="invoice-table-cell"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.description ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="text" className={`form-input-select form-input-textarea-row ${rowErr.description ? "input-error" : ""}`} value={item.description} onChange={(e) => handleItemChange(item.id, "description", e.target.value)} placeholder="Service Description" /></div></div>{rowErr.description && <div className="input-error-message">{rowErr.description}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.amount ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.amount ? "input-error" : ""}`} value={item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value)} onWheel={(e) => e.target.blur()} step="0.01" min="0" placeholder="0.00" /></div></div>{rowErr.amount && <div className="input-error-message">{rowErr.amount}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.discount ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.discount ? "input-error" : ""}`} value={item.discount} onChange={(e) => handleItemChange(item.id, "discount", e.target.value)} onWheel={(e) => e.target.blur()} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.discount && <div className="input-error-message">{rowErr.discount}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.vat ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.vat ? "input-error" : ""}`} value={item.vat} onChange={(e) => handleItemChange(item.id, "vat", e.target.value)} onWheel={(e) => e.target.blur()} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.vat && <div className="input-error-message">{rowErr.vat}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.wht ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.wht ? "input-error" : ""}`} value={item.wht} onChange={(e) => handleItemChange(item.id, "wht", e.target.value)} onWheel={(e) => e.target.blur()} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.wht && <div className="input-error-message">{rowErr.wht}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className="input-form-group"><div className="form-wrapper"><input type="text" className="form-input form-input-number invoice-subtotal-field" value={formatNumber(subtotal)} readOnly disabled /></div></div></div></div>
                    <div className="invoice-table-cell cell-action"><button type="button" onClick={() => requestRemoveItem(item)} className="invoice-remove-btn" disabled={invoiceItems.length === 1} title="Remove row"><span className="fas fa-trash" /></button></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SUMMARY ── */}
          <div className="invoice-form-summary">
            <button type="button" onClick={addItem} className="invoice-add-btn"><span className="fas fa-plus-circle" /> Add New Service</button>
            <div className="invoice-totals">
              <div className="invoice-total-row"><div className="invoice-total-label">Total Discount</div><div className="invoice-total-value">{formatNumber(totals.totalDiscount)}</div></div>
              <div className="invoice-total-row"><div className="invoice-total-label">Total VAT</div><div className="invoice-total-value">{formatNumber(totals.totalVat)}</div></div>
              <div className="invoice-total-row invoice-grand-total"><div className="invoice-total-label inv-bold large-text">Grand Total</div><div className="invoice-total-value inv-bold large-text">{formatNumber(totals.grandTotal)}</div></div>
            </div>
          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                {isLoading ? (<div className="invoice-loader" />) : (<span className="invoice-submit-btn-text">Update Invoice</span>)}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* ── Line-item delete confirmation ── */}
      <AnimatePresence>
        {deleteModal.open && (
          <DeleteLineItemModal
            isOpen={deleteModal.open}
            onClose={() => setDeleteModal({ open: false, itemId: null, db_id: null, isNew: true, isDeleting: false })}
            onConfirm={confirmRemoveItem}
            isNew={deleteModal.isNew}
            isDeleting={deleteModal.isDeleting}
          />
        )}
        {showCreateRateModal && (
          <CreateRateModal
            isOpen={showCreateRateModal}
            onClose={() => setShowCreateRateModal(false)}
            onRateCreated={handleRateCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EditInvoiceForm;