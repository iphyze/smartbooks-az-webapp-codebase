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
import useRateStore from "../../stores/useRateStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import useClientSearchStore from "../../stores/useClientSearchStore";
import useProjectSearchStore from "../../stores/useProjectSearchStore";
import useBankSearchStore from "../../stores/useBankSearchStore";
import useClientStore from "../../stores/useClientStore"; // Added for createClientModal
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import CreateRateModal from "../../components/modals/CreateRateModal";
import CreateClientsModal from "../../components/modals/CreateClientsModal"; // Added
import CreateProjectModal from "../../components/modals/CreateProjectModal";
import CreateBankModal from "../../components/modals/CreateBankModal";


/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;
function createEmptyItem(sn) {
  _itemCounter++;
  return { id: `item_${Date.now()}_${_itemCounter}`, sn, description: "", amount: "", discount: "", vat: "", wht: "" };
}

const formatNumber = (num) => Number(num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CURRENCY_OPTIONS = [{ value: "NGN", label: "NGN" }, { value: "USD", label: "USD" }, { value: "GBP", label: "GBP" }, { value: "EUR", label: "EUR" }];
const POST_JV_OPTIONS = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
const TIN_OPTIONS = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];

function calculateTotals(items) {
  let totalDiscount = 0, totalVat = 0, totalWht = 0, grandTotal = 0;
  items.forEach((item) => {
    const amount = parseFloat(item.amount) || 0; const discountPct = parseFloat(item.discount) || 0;
    const vatPct = parseFloat(item.vat) || 0; const whtPct = parseFloat(item.wht) || 0;
    const discountAmt = (amount * discountPct) / 100; const afterDiscount = amount - discountAmt;
    const vatAmt = (afterDiscount * vatPct) / 100; const whtAmt = (afterDiscount * whtPct) / 100;
    totalDiscount += discountAmt; totalVat += vatAmt; totalWht += whtAmt; grandTotal += afterDiscount + vatAmt;
  });
  return { totalDiscount, totalVat, totalWht, grandTotal };
}

function computeRowSubtotal(item) {
  const amount = parseFloat(item.amount) || 0; const discountPct = parseFloat(item.discount) || 0;
  const vatPct = parseFloat(item.vat) || 0;
  const discountAmt = (amount * discountPct) / 100; const afterDiscount = amount - discountAmt;
  return afterDiscount + (afterDiscount * vatPct) / 100;
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const CreateInvoiceForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { rates, searchRates, isLoading: ratesLoading } = useRateSearchStore();
  const { clients, searchClients, isLoading: clientsLoading } = useClientSearchStore();
  const { projects, searchProjects, isLoading: projectsLoading } = useProjectSearchStore();
  const { banks, searchBanks, isLoading: banksLoading } = useBankSearchStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateRateModal, setShowCreateRateModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false); // Added for Client Modal
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false); // Added for Project Modal
  const [showCreateBankModal, setShowCreateBankModal] = useState(false); // Added for Bank Modal

  const [deleteModal, setDeleteModal] = useState({ open: false, itemId: null });

  const [invoiceDetails, setInvoiceDetails] = useState({
    invoice_date: new Date(), due_date: new Date(), clients_name: "", clients_id: "",
    project: "", currency: "NGN", tin_number: "No", bank_name: "", account_name: "",
    account_number: "", account_currency: "", rate_date: "", post_jv: "",
  });

  const [invoiceItems, setInvoiceItems] = useState([createEmptyItem(1)]);
  const prevInvoiceItemsRef = useRef(invoiceItems);

  useEffect(() => { searchRates(""); searchClients(""); searchProjects(""); searchBanks(""); }, []);
  useEffect(() => { prevInvoiceItemsRef.current = invoiceItems; }, [invoiceItems]);

  const rateOptions = useMemo(() => {
    const curr = invoiceDetails.currency?.toLowerCase();
    if (!curr) return [];
    return rates.filter((r) => r[`${curr}_rate`] != null).map((r) => ({
      value: r.created_at, label: `${r.created_at} | ${invoiceDetails.currency} @ ${r[`${curr}_rate`]}`, rate: r,
    }));
  }, [rates, invoiceDetails.currency]);

  const bankOptions = useMemo(() => banks.map((b) => ({ value: b.id, label: `${b.bank_name} - ${b.account_number}`, bank: b })), [banks]);
  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.clients_name, label: c.clients_name, client: c })), [clients]);
  const projectOptions = useMemo(() => projects.map((p) => ({ value: p.project_name, label: p.project_name })), [projects]);
  const totals = useMemo(() => calculateTotals(invoiceItems), [invoiceItems]);

  const validateHeader = useCallback(() => {
    const e = {};
    if (!invoiceDetails.invoice_date) e.invoice_date = "Invoice date is required";
    if (!invoiceDetails.due_date) e.due_date = "Due date is required";
    if (!invoiceDetails.clients_name) e.clients_name = "Client is required";
    if (!invoiceDetails.currency) e.currency = "Currency is required";
    if (!invoiceDetails.rate_date) e.rate_date = "Rate date is required";
    if (!invoiceDetails.post_jv) e.post_jv = "Post Journal Entry is required";
    if (!invoiceDetails.tin_number) e.tin_number = "TIN display option is required";
    return e;
  }, [invoiceDetails]);

  const validateItems = useCallback(() => invoiceItems.map((item) => {
    const e = {};
    if (!item.description?.trim()) e.description = "Description required";
    if (item.amount === "" || item.amount === null) e.amount = "Amount required";
    else if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) e.amount = "Invalid amount";
    if (item.discount === "" || item.discount === null) e.discount = "Required";
    if (item.vat === "" || item.vat === null) e.vat = "Required";
    if (item.wht === "" || item.wht === null) e.wht = "Required";
    return e;
  }), [invoiceItems]);

  const headerErrors = useMemo(() => (submitted ? validateHeader() : {}), [submitted, validateHeader]);
  const itemErrorMap = useMemo(() => {
    if (!submitted) return {};
    const errs = validateItems(); const prevItems = prevInvoiceItemsRef.current;
    return Object.fromEntries(invoiceItems.map((item, i) => {
      const isNew = !prevItems.some((p) => p.id === item.id); if (isNew) return [item.id, {}]; return [item.id, errs[i] || {}];
    }));
  }, [submitted, validateItems, invoiceItems]);

  const handleDetailChange = (field, value) => setInvoiceDetails((prev) => ({ ...prev, [field]: value }));
  const handleItemChange = (id, field, value) => setInvoiceItems((prev) => prev.map((item) => item.id !== id ? item : { ...item, [field]: value }));

  const addItem = () => setInvoiceItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);
  const requestRemoveItem = (itemId) => { if (invoiceItems.length === 1) return; setDeleteModal({ open: true, itemId }); };
  const confirmRemoveItem = () => {
    setInvoiceItems((prev) => { const filtered = prev.filter((i) => i.id !== deleteModal.itemId); return filtered.map((item, idx) => ({ ...item, sn: idx + 1 })); });
    setDeleteModal({ open: false, itemId: null });
  };

  const handleRateCreated = () => {
    setShowCreateRateModal(false);
    searchRates("");
  };

  const handleClientCreated = (newClient) => {
    setShowCreateClientModal(false);
    searchClients("");
    // Auto-populate the client fields with the newly created client
    if (newClient) {
      handleDetailChange("clients_name", newClient.clients_name);
      handleDetailChange("clients_id", newClient.clients_id);
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProjectModal(false);
    searchProjects("");
    // Auto-populate the project field with the newly created project
    if (newProject) {
      handleDetailChange("project", newProject.project_name);
    }
  };

    const handleBankCreated = (newBank) => {
    setShowCreateBankModal(false);
    searchBanks("");
    // Auto-populate all 4 bank fields with the newly created bank data
    if (newBank) {
      handleDetailChange("bank_name", newBank.bank_name);
      handleDetailChange("account_name", newBank.account_name);
      handleDetailChange("account_number", newBank.account_number);
      handleDetailChange("account_currency", newBank.account_currency);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitted(true);
    const hErr = validateHeader(); const iErr = validateItems();
    if (Object.keys(hErr).length > 0 || iErr.some((rowE) => Object.keys(rowE).length > 0)) {
      showToast("Please fill in all required fields", "error"); return;
    }
    setIsLoading(true); const token = useAuthStore.getState().token;
    const payload = {
      invoice_date: invoiceDetails.invoice_date instanceof Date ? invoiceDetails.invoice_date.toISOString().split("T")[0] : invoiceDetails.invoice_date,
      due_date: invoiceDetails.due_date instanceof Date ? invoiceDetails.due_date.toISOString().split("T")[0] : invoiceDetails.due_date,
      clients_name: invoiceDetails.clients_name, clients_id: invoiceDetails.clients_id, project: invoiceDetails.project || undefined,
      currency: invoiceDetails.currency, tin_number: invoiceDetails.tin_number, bank_name: invoiceDetails.bank_name,
      account_name: invoiceDetails.account_name, account_number: invoiceDetails.account_number, account_currency: invoiceDetails.account_currency,
      rate_date: invoiceDetails.rate_date, post_jv: invoiceDetails.post_jv,
      sn: invoiceItems.map((i) => i.sn), description: invoiceItems.map((i) => i.description),
      amount: invoiceItems.map((i) => parseFloat(i.amount) || 0), discount: invoiceItems.map((i) => parseFloat(i.discount) || 0),
      vat: invoiceItems.map((i) => parseFloat(i.vat) || 0), wht: invoiceItems.map((i) => parseFloat(i.wht) || 0),
    };
    try {
      await api.post("/invoice/create-invoice", payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast("Invoice created successfully!", "success"); setSubmitted(false);
      setInvoiceDetails({ invoice_date: new Date(), due_date: new Date(), clients_name: "", clients_id: "", project: "", currency: "NGN", tin_number: "No", bank_name: "", account_name: "", account_number: "", account_currency: "", rate_date: "", post_jv: "" });
      setInvoiceItems([createEmptyItem(1)]);
    } catch (error) { showToast(error.response?.data?.message || "Failed to create invoice", "error"); } finally { setIsLoading(false); }
  };

  return (
    <>
      <motion.div variants={fadeInUp} initial="hidden" animate="show" transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} className={`invoice-form-box theme-${theme}`}>
        <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>
          <div className="invoice-form-header">
            <div className="invoice-form-htxt">Create Invoice</div>
            <div className="invoice-form-sub-htxt">Fill the form below to create a new invoice</div>
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
                      <Select options={clientOptions} onInputChange={(val) => { if (val.length > 1) searchClients(val); }} onMenuOpen={() => setOpenMenuId("clients_name")} onMenuClose={() => { setOpenMenuId(null); searchClients(""); }} onChange={(opt) => { if (opt) { handleDetailChange("clients_name", opt.value); handleDetailChange("clients_id", opt.client?.clients_id || ""); } else { handleDetailChange("clients_name", ""); handleDetailChange("clients_id", ""); } }} value={invoiceDetails.clients_name ? { value: invoiceDetails.clients_name, label: invoiceDetails.clients_name } : null} placeholder="Search client..." className={`form-input-select ${headerErrors.clients_name ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="clients_name" isLoading={clientsLoading} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "clients_name" ? "chevron-rotate" : "", headerErrors.clients_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.clients_name && <div className="input-error-message">{headerErrors.clients_name}</div>}
                </div>
                {/* Button to trigger Create Client Modal */}
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateClientModal(true)} title="Add New Client"><span className="fas fa-plus"></span></button>
              </div>
            </div>

            {/* Client ID */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className="input-form-group">
                  <label className="input-form-label" htmlFor="clients_id">Client ID</label>
                  <div className="form-wrapper"><input type="text" id="clients_id" className="form-input form-input-no-padding" value={invoiceDetails.clients_id} disabled readOnly placeholder="Auto-filled" /></div>
                </div>
              </div>
            </div>

            {/* Project */}
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
                {/* UPDATE THIS BUTTON BELOW */}
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateProjectModal(true)} title="Add New project"><span className="fas fa-plus"></span></button>
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
                {/* UPDATE THIS BUTTON BELOW */}
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateBankModal(true)} title="Add New Bank"><span className="fas fa-plus"></span></button>
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

            {/* Post Journal Entry */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.post_jv ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.post_jv ? "input-label-message" : ""}`} htmlFor="post_jv">Post Journal Entry</label>
                  <div className="form-wrapper">
                    <Select options={POST_JV_OPTIONS} onChange={(opt) => handleDetailChange("post_jv", opt?.value || "")} value={POST_JV_OPTIONS.find((o) => o.value === invoiceDetails.post_jv) || null} placeholder="Select" className={`form-input-select ${headerErrors.post_jv ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="post_jv" onMenuOpen={() => setOpenMenuId("post_jv")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "post_jv" ? "chevron-rotate" : "", headerErrors.post_jv ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.post_jv && <div className="input-error-message">{headerErrors.post_jv}</div>}
              </div>
            </div>
          </div>

          {/* INVOICE ITEMS TABLE */}
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
                const rowErr = itemErrorMap[item.id] || {}; const subtotal = computeRowSubtotal(item);
                return (
                  <div key={item.id} className="invoice-table-row">
                    <div className="invoice-table-cell cell-sn"><span className="invoice-sn-badge">{item.sn}</span></div>
                    <div className="invoice-table-cell"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.description ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="text" className={`form-input-select form-input-textarea-row ${rowErr.description ? "input-error" : ""}`} value={item.description} onChange={(e) => handleItemChange(item.id, "description", e.target.value)} placeholder="Service Description" /></div></div>{rowErr.description && <div className="input-error-message">{rowErr.description}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.amount ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.amount ? "input-error" : ""}`} value={item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value)} step="0.01" min="0" placeholder="0.00" /></div></div>{rowErr.amount && <div className="input-error-message">{rowErr.amount}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.discount ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.discount ? "input-error" : ""}`} value={item.discount} onChange={(e) => handleItemChange(item.id, "discount", e.target.value)} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.discount && <div className="input-error-message">{rowErr.discount}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.vat ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.vat ? "input-error" : ""}`} value={item.vat} onChange={(e) => handleItemChange(item.id, "vat", e.target.value)} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.vat && <div className="input-error-message">{rowErr.vat}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className={`input-form-group ${rowErr.wht ? "input-form-error" : ""}`}><div className="form-wrapper"><input type="number" className={`form-input form-input-number ${rowErr.wht ? "input-error" : ""}`} value={item.wht} onChange={(e) => handleItemChange(item.id, "wht", e.target.value)} step="0.01" min="0" max="100" placeholder="0.00" /></div></div>{rowErr.wht && <div className="input-error-message">{rowErr.wht}</div>}</div></div>
                    <div className="invoice-table-cell cell-small"><div className="input-form-wrapper" style={{ margin: 0 }}><div className="input-form-group"><div className="form-wrapper"><input type="text" className="form-input form-input-number invoice-subtotal-field" value={formatNumber(subtotal)} readOnly disabled /></div></div></div></div>
                    <div className="invoice-table-cell cell-action"><button type="button" onClick={() => requestRemoveItem(item.id)} className="invoice-remove-btn" disabled={invoiceItems.length === 1} title="Remove row"><span className="fas fa-trash" /></button></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUMMARY & SUBMIT */}
          <div className="invoice-form-summary">
            <button type="button" onClick={addItem} className="invoice-add-btn"><span className="fas fa-plus-circle" /> Add New Service</button>
            <div className="invoice-totals">
              <div className="invoice-total-row"><div className="invoice-total-label">Total Discount</div><div className="invoice-total-value">{formatNumber(totals.totalDiscount)}</div></div>
              <div className="invoice-total-row"><div className="invoice-total-label">Total VAT</div><div className="invoice-total-value">{formatNumber(totals.totalVat)}</div></div>
              <div className="invoice-total-row invoice-grand-total"><div className="invoice-total-label inv-bold large-text">Grand Total</div><div className="invoice-total-value inv-bold large-text">{formatNumber(totals.grandTotal)}</div></div>
            </div>
          </div>
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                {isLoading ? (<div className="invoice-loader" />) : (<span className="invoice-submit-btn-text">Generate Invoice</span>)}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {deleteModal.open && (<DeleteLineItemModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, itemId: null })} onConfirm={confirmRemoveItem} isNew={true} />)}
        {showCreateRateModal && (<CreateRateModal isOpen={showCreateRateModal} onClose={() => setShowCreateRateModal(false)} onRateCreated={handleRateCreated} />)}
        {showCreateClientModal && (<CreateClientsModal isOpen={showCreateClientModal} onClose={() => setShowCreateClientModal(false)} onClientCreated={handleClientCreated} />)}
        {showCreateProjectModal && (<CreateProjectModal isOpen={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} onProjectCreated={handleProjectCreated} />)}
        {showCreateBankModal && (<CreateBankModal isOpen={showCreateBankModal} onClose={() => setShowCreateBankModal(false)} onBankCreated={handleBankCreated} />)}
      </AnimatePresence>
    </>
  );
};

export default CreateInvoiceForm;