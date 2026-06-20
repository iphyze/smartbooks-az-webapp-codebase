import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./InvoiceForm.css";
import useToastStore from "../../stores/useToastStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import useRateStore from "../../stores/useRateStore"; // Added for createRate
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import useClientSearchStore from "../../stores/useClientSearchStore";
import useProjectSearchStore from "../../stores/useProjectSearchStore";
import useBankSearchStore from "../../stores/useBankSearchStore";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import CreateRateModal from "../../components/modals/CreateRateModal"; // Added for Rate Modal
import CreateClientsModal from "../../components/modals/CreateClientsModal";
import CreateProjectModal from "../../components/modals/CreateProjectModal";
import CreateBankModal from "../../components/modals/CreateBankModal";
import { findEffectiveRate } from "../../utils/helper";
import useInvoiceAutosave from "../../hooks/useInvoiceAutosave";
import InvoiceDraftBar from "../../components/InvoiceDraftBar";
import InvoiceLineEditor from "../../components/invoice/InvoiceLineEditor";
import CreateInvoiceServiceModal from "../../components/modals/CreateInvoiceServiceModal";
import useInvoiceServiceStore from "../../stores/useInvoiceServiceStore";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;

/**
 * Create a blank row for newly added lines (no db_id yet).
 */
function createEmptyItem(sn, defaults = {}) {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    db_id: null,
    sn,
    service_catalogue_id: defaults.service_catalogue_id ?? null,
    description: defaults.description || "",
    amount: defaults.amount ?? "",
    discount: defaults.discount ?? "0",
    vat: defaults.vat ?? "0",
    wht: defaults.wht ?? "0",
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
    service_catalogue_id: row.service_catalogue_id ? Number(row.service_catalogue_id) : null,
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
const PAYMENT_TERM_OPTIONS = [
  { value: 0, label: "Due on receipt" },
  { value: 7, label: "Net 7 days" },
  { value: 14, label: "Net 14 days" },
  { value: 30, label: "Net 30 days" },
  { value: 45, label: "Net 45 days" },
  { value: 60, label: "Net 60 days" },
  { value: null, label: "Custom due date" },
];

const addDays = (date, days) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return date;
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

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
  const { services, fetchServices, isLoading: servicesLoading } = useInvoiceServiceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showCreateRateModal, setShowCreateRateModal] = useState(false); // State for Rate Modal
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [serviceModal, setServiceModal] = useState({ open: false, line: null });
  const [clientPreferences, setClientPreferences] = useState(null);
  const [clientPreferencesLoading, setClientPreferencesLoading] = useState(false);
  const [saveClientPreferences, setSaveClientPreferences] = useState(false);
  const [taxDefaults, setTaxDefaults] = useState({ discount: "0", vat: "0", wht: "0" });
  const hasUserChangedDateOrCurrency = useRef(false);

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
    payment_terms_days: 0,
    payment_terms_label: "Due on receipt",
    clients_name: "",
    clients_id: "",
    project: "",
    currency: "NGN",
    tin_number: "No",
    bank_id: null,
    bank_name: "",
    account_name: "",
    account_number: "",
    account_currency: "",
    post_jv: "No",
    rate_date: "",
    paid: "",
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
    fetchServices({ currency: "NGN" });
  }, []);

  useEffect(() => {
    if (!invoiceDetails.currency) return;
    fetchServices({ currency: invoiceDetails.currency }).catch(() => {});
  }, [invoiceDetails.currency, fetchServices]);

  useEffect(() => {
    if (invoiceDetails.payment_terms_days === null || !invoiceDetails.invoice_date) return;
    const nextDueDate = addDays(invoiceDetails.invoice_date, invoiceDetails.payment_terms_days);
    setInvoiceDetails((current) => {
      if (current.due_date instanceof Date && current.due_date.getTime() === nextDueDate.getTime()) return current;
      return { ...current, due_date: nextDueDate };
    });
  }, [invoiceDetails.invoice_date, invoiceDetails.payment_terms_days]);

  /* ── Populate form when invoice prop arrives ── */
  useEffect(() => {
    if (!invoice) return;

    setInvoiceDetails({
      invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(),
      due_date: invoice.due_date ? new Date(invoice.due_date) : new Date(),
      payment_terms_days: invoice.payment_terms_days === null || invoice.payment_terms_days === undefined ? null : Number(invoice.payment_terms_days),
      payment_terms_label: invoice.payment_terms_label || "Custom due date",
      clients_name: invoice.clients_name || "",
      clients_id: String(invoice.clients_id || ""),
      project: invoice.project || "",
      currency: invoice.currency || "NGN",
      tin_number: invoice.tin_number || "No",
      bank_id: null,
      bank_name: (invoice.bank_name === "" || invoice.bank_name === "N/A") ? "" : invoice.bank_name,
      account_name: invoice.account_name || "",
      account_number: invoice.account_number || "",
      account_currency: invoice.account_currency || "",
      post_jv: "No",
      rate_date: invoice.rate_date || "",
      paid: invoice.paid ? String(parseFloat(invoice.paid) || 0.00) : 0.00, // Added paid population
    });

    if (invoice.items && invoice.items.length > 0) {
      setInvoiceItems(invoice.items.map((row, idx) => createItemFromDb(row, idx + 1)));
      const first = invoice.items[0];
      setTaxDefaults({
        discount: String(parseFloat(first.discount_percent) || 0),
        vat: String(parseFloat(first.vat_percent) || 0),
        wht: String(parseFloat(first.wht_percent) || 0),
      });
    }
  }, [invoice]);

  useEffect(() => {
    prevInvoiceItemsRef.current = invoiceItems;
  }, [invoiceItems]);

  useEffect(() => {
    if (!invoiceDetails.bank_name || invoiceDetails.bank_id || banks.length === 0) return;
    const matchingBank = banks.find((bank) =>
      bank.account_number === invoiceDetails.account_number && bank.bank_name === invoiceDetails.bank_name
    );
    if (matchingBank) setInvoiceDetails((current) => ({ ...current, bank_id: matchingBank.id }));
  }, [banks, invoiceDetails.bank_name, invoiceDetails.account_number, invoiceDetails.bank_id]);

  useEffect(() => {
    const clientId = Number(invoice?.clients_id || 0);
    if (!clientId) return;
    setClientPreferencesLoading(true);
    api.get("/invoice/client-preferences", { params: { client_id: clientId } })
      .then((response) => {
        const preferences = response.data?.data?.preferences || null;
        setClientPreferences(preferences);
        if (preferences) {
          setTaxDefaults({
            discount: String(preferences.default_discount_percent ?? 0),
            vat: String(preferences.default_vat_percent ?? 0),
            wht: String(preferences.default_wht_percent ?? 0),
          });
          setInvoiceDetails((current) => ({ ...current, post_jv: preferences.post_journal_entry || "No" }));
        }
      })
      .catch(() => setClientPreferences(null))
      .finally(() => setClientPreferencesLoading(false));
  }, [invoice?.clients_id]);

  // Add alongside the other useEffects, after the invoice populate effect
  useEffect(() => {
    if (!hasUserChangedDateOrCurrency.current) return;
    if (!invoiceDetails.invoice_date || !invoiceDetails.currency) return;

    const effectiveRateDate = findEffectiveRate(
      rates,
      invoiceDetails.currency,
      invoiceDetails.invoice_date
    );

    if (effectiveRateDate && effectiveRateDate !== invoiceDetails.rate_date) {
      handleDetailChange("rate_date", effectiveRateDate);
    }
  }, [invoiceDetails.invoice_date, invoiceDetails.currency, rates]);

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
  const grossAmount = useMemo(
    () => invoiceItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    [invoiceItems]
  );
  const balanceDue = useMemo(
    () => Math.max(totals.grandTotal - (parseFloat(invoiceDetails.paid) || 0), 0),
    [totals.grandTotal, invoiceDetails.paid]
  );

  const restoreDraft = useCallback((savedDraft) => {
    const savedDetails = savedDraft?.invoiceDetails || {};
    const savedItems = Array.isArray(savedDraft?.invoiceItems) ? savedDraft.invoiceItems : [];

    setInvoiceDetails((current) => ({
      ...current,
      ...savedDetails,
      invoice_date: savedDetails.invoice_date ? new Date(savedDetails.invoice_date) : current.invoice_date,
      due_date: savedDetails.due_date ? new Date(savedDetails.due_date) : current.due_date,
      paid: current.paid,
    }));

    if (savedItems.length > 0) {
      setInvoiceItems(savedItems.map((item, index) => ({
        ...createEmptyItem(index + 1),
        db_id: item.db_id ?? null,
        service_catalogue_id: item.service_catalogue_id ?? null,
        description: item.description || "",
        amount: item.amount === null || item.amount === undefined ? "" : String(item.amount),
        discount: item.discount === null || item.discount === undefined ? "" : String(item.discount),
        vat: item.vat === null || item.vat === undefined ? "" : String(item.vat),
        wht: item.wht === null || item.wht === undefined ? "" : String(item.wht),
      })));
    }
    if (savedDraft?.clientPreferenceState) {
      setSaveClientPreferences(Boolean(savedDraft.clientPreferenceState.saveClientPreferences));
      if (savedDraft.clientPreferenceState.taxDefaults) {
        setTaxDefaults(savedDraft.clientPreferenceState.taxDefaults);
      }
    }
  }, []);

  const draftPayload = useMemo(() => ({
    invoiceDetails: {
      ...invoiceDetails,
      invoice_date: invoiceDetails.invoice_date instanceof Date
        ? invoiceDetails.invoice_date.toISOString().split("T")[0]
        : invoiceDetails.invoice_date,
      due_date: invoiceDetails.due_date instanceof Date
        ? invoiceDetails.due_date.toISOString().split("T")[0]
        : invoiceDetails.due_date,
    },
    invoiceItems: invoiceItems.map(({ id, ...item }) => item),
    clientPreferenceState: { saveClientPreferences, taxDefaults },
  }), [invoiceDetails, invoiceItems, saveClientPreferences, taxDefaults]);

  const {
    draftUuid,
    saveState,
    lastSavedAt,
    isDirty,
    isRestoring,
    saveNow,
    clearDraft,
  } = useInvoiceAutosave({
    mode: "edit",
    invoiceNumber,
    payload: draftPayload,
    onRestore: restoreDraft,
    enabled: Boolean(invoiceNumber),
  });

  const handleManualDraftSave = async () => {
    try {
      const saved = await saveNow();
      if (saved) showToast("Invoice edit draft saved", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Invoice draft could not be saved", "error");
    }
  };

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
    // if (!invoiceDetails.status) e.status = "Status is required";
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
    setInvoiceDetails((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "currency" && prev.account_currency && prev.account_currency !== value) {
        next.bank_id = null;
        next.bank_name = "";
        next.account_name = "";
        next.account_number = "";
        next.account_currency = "";
      }
      return next;
    });
    if (field === "currency") {
      setInvoiceItems((prev) => prev.map((item) => ({ ...item, service_catalogue_id: null })));
    }
  };

  const handleItemChange = (id, field, value) => {
    if (id === invoiceItems[0]?.id && ["discount", "vat", "wht"].includes(field)) {
      setTaxDefaults((current) => ({ ...current, [field]: value }));
    }
    setInvoiceItems((prev) => prev.map((item) => item.id !== id ? item : { ...item, [field]: value }));
  };

  const handlePaymentTermsChange = (option) => {
    const days = option?.value ?? null;
    setInvoiceDetails((current) => ({
      ...current,
      payment_terms_days: days,
      payment_terms_label: option?.label || "Custom due date",
      due_date: days === null ? current.due_date : addDays(current.invoice_date, days),
    }));
  };

  const applyClientPreferences = useCallback((preferences) => {
    if (!preferences) return;
    const termsDays = preferences.payment_terms_days === null ? null : Number(preferences.payment_terms_days || 0);
    const nextTaxDefaults = {
      discount: String(preferences.default_discount_percent ?? 0),
      vat: String(preferences.default_vat_percent ?? 0),
      wht: String(preferences.default_wht_percent ?? 0),
    };
    setTaxDefaults(nextTaxDefaults);
    setInvoiceDetails((current) => ({
      ...current,
      currency: preferences.default_currency || current.currency,
      payment_terms_days: termsDays,
      payment_terms_label: termsDays === null ? "Custom due date" : termsDays === 0 ? "Due on receipt" : `Net ${termsDays} days`,
      due_date: termsDays === null ? current.due_date : addDays(current.invoice_date, termsDays),
      project: preferences.default_project || "",
      tin_number: preferences.display_tin || "No",
      post_jv: preferences.post_journal_entry || "No",
      bank_id: preferences.default_bank_id || null,
      bank_name: preferences.bank_name || "",
      account_name: preferences.account_name || "",
      account_number: preferences.account_number || "",
      account_currency: preferences.account_currency || "",
    }));
    setInvoiceItems((currentItems) => currentItems.map((item) => {
      const isBlank = !item.description && !Number(item.amount || 0);
      return isBlank
        ? { ...item, service_catalogue_id: null, ...nextTaxDefaults }
        : { ...item, service_catalogue_id: null };
    }));
  }, []);

  const handleClientSelection = async (option) => {
    if (!option) {
      setInvoiceDetails((current) => ({ ...current, clients_name: "", clients_id: "" }));
      setClientPreferences(null);
      setSaveClientPreferences(false);
      return;
    }

    const clientId = option.client?.clients_id || "";
    setInvoiceDetails((current) => ({ ...current, clients_name: option.value, clients_id: String(clientId) }));
    setClientPreferencesLoading(true);
    try {
      const response = await api.get("/invoice/client-preferences", { params: { client_id: clientId } });
      const preferences = response.data?.data?.preferences || null;
      setClientPreferences(preferences);
      if (preferences) {
        applyClientPreferences(preferences);
        showToast("Saved invoice defaults applied for this client", "success");
      }
    } catch (error) {
      setClientPreferences(null);
      showToast(error.response?.data?.message || "Client defaults could not be loaded", "error");
    } finally {
      setClientPreferencesLoading(false);
    }
  };

  const handleApplyService = (itemId, service) => {
    if (service && itemId === invoiceItems[0]?.id) {
      setTaxDefaults({
        discount: String(service.discount_percent ?? 0),
        vat: String(service.vat_percent ?? 0),
        wht: String(service.wht_percent ?? 0),
      });
    }
    setInvoiceItems((current) => current.map((item) => {
      if (item.id !== itemId) return item;
      if (!service) return { ...item, service_catalogue_id: null };
      return {
        ...item,
        service_catalogue_id: service.id,
        description: service.description || service.service_name || "",
        amount: String(service.default_amount ?? ""),
        discount: String(service.discount_percent ?? 0),
        vat: String(service.vat_percent ?? 0),
        wht: String(service.wht_percent ?? 0),
      };
    }));
  };

  const handleServiceSearch = (search) => {
    fetchServices({ currency: invoiceDetails.currency, search }).catch(() => {});
  };

  const handleServiceCreated = (service) => {
    if (serviceModal.line && service) handleApplyService(serviceModal.line.id, service);
    setServiceModal({ open: false, line: null });
    fetchServices({ currency: invoiceDetails.currency }).catch(() => {});
  };

  const addItem = () => setInvoiceItems((prev) => [...prev, createEmptyItem(prev.length + 1, taxDefaults)]);

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

  const handleClientCreated = (newClient) => {
    setShowCreateClientModal(false);
    searchClients("");
    if (newClient) {
      handleClientSelection({ value: newClient.clients_name, client: newClient });
    }
  };

  const handleProjectCreated = (newProject) => {
    setShowCreateProjectModal(false);
    searchProjects("");
    if (newProject) {
      handleDetailChange("project", newProject.project_name);
    }
  };

  const handleBankCreated = (newBank) => {
    setShowCreateBankModal(false);
    searchBanks("");
    if (newBank) {
      handleDetailChange("bank_id", newBank.id || null);
      handleDetailChange("bank_name", newBank.bank_name);
      handleDetailChange("account_name", newBank.account_name);
      handleDetailChange("account_number", newBank.account_number);
      handleDetailChange("account_currency", newBank.account_currency);
    }
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
      payment_terms_days: invoiceDetails.payment_terms_days,
      payment_terms_label: invoiceDetails.payment_terms_label,
      clients_name: invoiceDetails.clients_name,
      clients_id: invoiceDetails.clients_id,
      project: invoiceDetails.project || "",
      currency: invoiceDetails.currency,
      tin_number: invoiceDetails.tin_number,
      bank_id: invoiceDetails.bank_id,
      bank_name: invoiceDetails.bank_name,
      account_name: invoiceDetails.account_name,
      account_number: invoiceDetails.account_number,
      account_currency: invoiceDetails.account_currency,
      rate_date: invoiceDetails.rate_date,
      post_jv: invoiceDetails.post_jv,
      save_client_preferences: saveClientPreferences,
      client_preferences: {
        default_currency: invoiceDetails.currency,
        payment_terms_days: invoiceDetails.payment_terms_days,
        default_bank_id: invoiceDetails.bank_id,
        display_tin: invoiceDetails.tin_number,
        post_journal_entry: invoiceDetails.post_jv,
        default_project: invoiceDetails.project,
        default_discount_percent: invoiceItems[0]?.discount ?? taxDefaults.discount,
        default_vat_percent: invoiceItems[0]?.vat ?? taxDefaults.vat,
        default_wht_percent: invoiceItems[0]?.wht ?? taxDefaults.wht,
      },
      // Payment totals are maintained through the dedicated payment workflow.
      draft_uuid: draftUuid || undefined,
      id: invoiceItems.map((i) => i.db_id ?? 0),
      service_catalogue_id: invoiceItems.map((i) => i.service_catalogue_id || null),
      description: invoiceItems.map((i) => i.description),
      amount: invoiceItems.map((i) => parseFloat(i.amount) || 0),
      discount: invoiceItems.map((i) => parseFloat(i.discount) || 0),
      vat: invoiceItems.map((i) => parseFloat(i.vat) || 0),
      wht: invoiceItems.map((i) => parseFloat(i.wht) || 0),
    };

    try {
      await api.put("/invoice/edit-invoice", payload, { headers: { Authorization: `Bearer ${token}` } });
      await clearDraft();
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
        transition={{ duration: 0.22, delay: 0.02, ease: "easeOut" }}
        className={`invoice-form-box invoice-builder theme-${theme}`}
      >
        <form className="invoice-builder__form" onSubmit={handleSubmit} noValidate>
          <header className="invoice-builder__hero">
            <div className="invoice-builder__hero-copy">
              <span className="invoice-builder__eyebrow">
                <span className="fas fa-pen-to-square" aria-hidden="true" />
                Invoice maintenance
              </span>
              <h2 className="invoice-builder__title">Edit invoice #{invoiceNumber}</h2>
              <p className="invoice-builder__subtitle">
                Update the billing details, service lines and payment information while keeping the invoice totals visible.
              </p>
            </div>

            <div className="invoice-builder__hero-meta" aria-label="Invoice overview">
              <span className="invoice-builder__meta-pill">
                <span className="fas fa-coins" aria-hidden="true" />
                {invoiceDetails.currency || "Currency"}
              </span>
              <span className="invoice-builder__meta-pill">
                <span className="fas fa-list-check" aria-hidden="true" />
                {invoiceItems.length} {invoiceItems.length === 1 ? "service" : "services"}
              </span>
            </div>
          </header>

          <section className="invoice-builder__section">
            <div className="invoice-builder__section-heading">
              <div className="invoice-builder__section-icon">
                <span className="fas fa-calendar-check" aria-hidden="true" />
              </div>
              <div className="invoice-builder__section-copy">
                <span className="invoice-builder__section-index">01</span>
                <h3 className="invoice-builder__section-title">Invoice details</h3>
                <p className="invoice-builder__section-text">Adjust the billing period, currency and applicable exchange rate.</p>
              </div>
            </div>

            <div className="invoice-builder__field-grid invoice-builder__field-grid--four">
              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className={`input-form-group ${headerErrors.invoice_date ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.invoice_date ? "input-label-message" : ""}`} htmlFor="invoice_date">Invoice Date</label>
                    <div className="form-wrapper">
                      <DatePicker
                        selected={invoiceDetails.invoice_date}
                        onChange={(date) => {
                          hasUserChangedDateOrCurrency.current = true;
                          handleDetailChange("invoice_date", date);
                        }}
                        className={`form-input ${headerErrors.invoice_date ? "input-error" : ""}`}
                        dateFormat="yyyy-MM-dd"
                        wrapperClassName="input-date-picker"
                        id="invoice_date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                      <span className={`chevron-input-icon fas fa-calendar ${headerErrors.invoice_date ? "input-icon-error" : ""}`} />
                    </div>
                  </div>
                  {headerErrors.invoice_date && <div className="input-error-message">{headerErrors.invoice_date}</div>}
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className="input-form-group">
                    <label className="input-form-label" htmlFor="payment_terms">Payment Terms</label>
                    <div className="form-wrapper">
                      <Select
                        options={PAYMENT_TERM_OPTIONS}
                        onChange={handlePaymentTermsChange}
                        value={PAYMENT_TERM_OPTIONS.find((option) => option.value === invoiceDetails.payment_terms_days) || PAYMENT_TERM_OPTIONS[PAYMENT_TERM_OPTIONS.length - 1]}
                        placeholder="Select payment terms"
                        className="form-input-select"
                        classNamePrefix="form-input-select"
                        inputId="payment_terms"
                        onMenuOpen={() => setOpenMenuId("payment_terms")}
                        onMenuClose={() => setOpenMenuId(null)}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "payment_terms" ? "chevron-rotate" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className={`input-form-group ${headerErrors.due_date ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.due_date ? "input-label-message" : ""}`} htmlFor="due_date">Due Date</label>
                    <div className="form-wrapper">
                      <DatePicker
                        selected={invoiceDetails.due_date}
                        onChange={(date) => handleDetailChange("due_date", date)}
                        className={`form-input ${headerErrors.due_date ? "input-error" : ""}`}
                        dateFormat="yyyy-MM-dd"
                        wrapperClassName="input-date-picker"
                        id="due_date"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        disabled={invoiceDetails.payment_terms_days !== null}
                      />
                      <span className={`chevron-input-icon fas fa-calendar ${headerErrors.due_date ? "input-icon-error" : ""}`} />
                    </div>
                  </div>
                  {headerErrors.due_date && <div className="input-error-message">{headerErrors.due_date}</div>}
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className={`input-form-group ${headerErrors.currency ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.currency ? "input-label-message" : ""}`} htmlFor="currency">Currency</label>
                    <div className="form-wrapper">
                      <Select
                        options={CURRENCY_OPTIONS}
                        onChange={(option) => {
                          hasUserChangedDateOrCurrency.current = true;
                          handleDetailChange("currency", option?.value || "");
                        }}
                        value={CURRENCY_OPTIONS.find((option) => option.value === invoiceDetails.currency) || null}
                        placeholder="Select currency"
                        className={`form-input-select ${headerErrors.currency ? "input-error" : ""}`}
                        classNamePrefix="form-input-select"
                        inputId="currency"
                        onMenuOpen={() => setOpenMenuId("currency")}
                        onMenuClose={() => setOpenMenuId(null)}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "currency" ? "chevron-rotate" : "", headerErrors.currency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.currency && <div className="input-error-message">{headerErrors.currency}</div>}
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="inv-form-flex invoice-builder__inline-field">
                  <div className="input-form-wrapper inv-form-flex-wrap">
                    <div className={`input-form-group ${headerErrors.rate_date ? "input-form-error" : ""}`}>
                      <label className={`input-form-label ${headerErrors.rate_date ? "input-label-message" : ""}`} htmlFor="rate_date">Rate Date</label>
                      <div className="form-wrapper">
                        <Select
                          options={rateOptions}
                          onChange={(option) => handleDetailChange("rate_date", option ? option.value : "")}
                          value={rateOptions.find((option) => option.value === invoiceDetails.rate_date) || null}
                          placeholder="Select rate..."
                          className={`form-input-select ${headerErrors.rate_date ? "input-error" : ""}`}
                          classNamePrefix="form-input-select"
                          isClearable
                          inputId="rate_date"
                          onMenuOpen={() => setOpenMenuId("rate_date")}
                          onMenuClose={() => setOpenMenuId(null)}
                          noOptionsMessage={() => rates.length === 0 ? "Loading rates..." : `No rates for ${invoiceDetails.currency}`}
                          isLoading={ratesLoading}
                        />
                        <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "rate_date" ? "chevron-rotate" : "", headerErrors.rate_date ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                      </div>
                    </div>
                    {headerErrors.rate_date && <div className="input-error-message">{headerErrors.rate_date}</div>}
                  </div>
                  <button type="button" className="inv-form-flex-btn invoice-builder__quick-add" onClick={() => setShowCreateRateModal(true)} title="Add a new exchange rate" aria-label="Add a new exchange rate">
                    <span className="fas fa-plus" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="invoice-builder__section">
            <div className="invoice-builder__section-heading">
              <div className="invoice-builder__section-icon">
                <span className="fas fa-building" aria-hidden="true" />
              </div>
              <div className="invoice-builder__section-copy">
                <span className="invoice-builder__section-index">02</span>
                <h3 className="invoice-builder__section-title">Client and billing</h3>
                <p className="invoice-builder__section-text">Update the client, related project and receiving bank account.</p>
              </div>
            </div>

            <div className="invoice-builder__field-grid invoice-builder__field-grid--two">
              <div className="invoice-builder__field">
                <div className="inv-form-flex invoice-builder__inline-field">
                  <div className="input-form-wrapper inv-form-flex-wrap">
                    <div className={`input-form-group ${headerErrors.clients_name ? "input-form-error" : ""}`}>
                      <label className={`input-form-label ${headerErrors.clients_name ? "input-label-message" : ""}`} htmlFor="clients_name">Client Name</label>
                      <div className="form-wrapper">
                        <Select
                          options={clientOptions}
                          onInputChange={(value) => { if (value.length > 1) searchClients(value); }}
                          onMenuOpen={() => setOpenMenuId("clients_name")}
                          onMenuClose={() => { setOpenMenuId(null); searchClients(""); }}
                          onChange={handleClientSelection}
                          value={invoiceDetails.clients_name ? { value: invoiceDetails.clients_name, label: invoiceDetails.clients_name } : null}
                          placeholder="Search client..."
                          className={`form-input-select ${headerErrors.clients_name ? "input-error" : ""}`}
                          classNamePrefix="form-input-select"
                          isClearable
                          inputId="clients_name"
                          isLoading={clientsLoading}
                        />
                        <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "clients_name" ? "chevron-rotate" : "", headerErrors.clients_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                      </div>
                    </div>
                    {headerErrors.clients_name && <div className="input-error-message">{headerErrors.clients_name}</div>}
                  </div>
                  <button type="button" className="inv-form-flex-btn invoice-builder__quick-add" onClick={() => setShowCreateClientModal(true)} title="Add a new client" aria-label="Add a new client">
                    <span className="fas fa-plus" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className="input-form-group">
                    <label className="input-form-label" htmlFor="clients_id">Client ID</label>
                    <div className="form-wrapper">
                      <input type="text" id="clients_id" className="form-input form-input-no-padding invoice-builder__readonly-field" value={invoiceDetails.clients_id} disabled readOnly placeholder="Auto-filled after client selection" />
                      <span className="chevron-input-icon fas fa-lock" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="inv-form-flex invoice-builder__inline-field">
                  <div className="input-form-wrapper inv-form-flex-wrap">
                    <div className="input-form-group">
                      <label className="input-form-label" htmlFor="project">Project <span className="invoice-builder__optional">Optional</span></label>
                      <div className="form-wrapper">
                        <Select
                          options={projectOptions}
                          onInputChange={(value) => { if (value.length > 1) searchProjects(value); }}
                          onMenuOpen={() => setOpenMenuId("project")}
                          onMenuClose={() => { setOpenMenuId(null); searchProjects(""); }}
                          onChange={(option) => handleDetailChange("project", option ? option.value : "")}
                          value={invoiceDetails.project ? { value: invoiceDetails.project, label: invoiceDetails.project } : null}
                          placeholder="Search project..."
                          className="form-input-select"
                          classNamePrefix="form-input-select"
                          isClearable
                          inputId="project"
                          isLoading={projectsLoading}
                        />
                        <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "project" ? "chevron-rotate" : ""].filter(Boolean).join(" ")} />
                      </div>
                    </div>
                  </div>
                  <button type="button" className="inv-form-flex-btn invoice-builder__quick-add" onClick={() => setShowCreateProjectModal(true)} title="Add a new project" aria-label="Add a new project">
                    <span className="fas fa-plus" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="inv-form-flex invoice-builder__inline-field">
                  <div className="input-form-wrapper inv-form-flex-wrap">
                    <div className={`input-form-group ${headerErrors.bank_name ? "input-form-error" : ""}`}>
                      <label className={`input-form-label ${headerErrors.bank_name ? "input-label-message" : ""}`} htmlFor="bank_account">Bank Account <span className="invoice-builder__optional">Optional</span></label>
                      <div className="form-wrapper">
                        <Select
                          options={bankOptions}
                          onInputChange={(value) => { if (value.length > 1) searchBanks(value); }}
                          onMenuOpen={() => setOpenMenuId("bank_account")}
                          onMenuClose={() => { setOpenMenuId(null); searchBanks(""); }}
                          onChange={(option) => {
                            if (option) {
                              handleDetailChange("bank_id", option.bank.id || option.value || null);
                              handleDetailChange("bank_name", option.bank.bank_name);
                              handleDetailChange("account_name", option.bank.account_name);
                              handleDetailChange("account_number", option.bank.account_number);
                              handleDetailChange("account_currency", option.bank.account_currency);
                            } else {
                              handleDetailChange("bank_id", null);
                              handleDetailChange("bank_name", "");
                              handleDetailChange("account_name", "");
                              handleDetailChange("account_number", "");
                              handleDetailChange("account_currency", "");
                            }
                          }}
                          value={invoiceDetails.bank_name ? { value: invoiceDetails.bank_name, label: `${invoiceDetails.bank_name} - ${invoiceDetails.account_number}` } : null}
                          placeholder="Search bank account..."
                          className={`form-input-select ${headerErrors.bank_name ? "input-error" : ""}`}
                          classNamePrefix="form-input-select"
                          isClearable
                          inputId="bank_account"
                          isLoading={banksLoading}
                        />
                        <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "bank_account" ? "chevron-rotate" : "", headerErrors.bank_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                      </div>
                    </div>
                    {headerErrors.bank_name && <div className="input-error-message">{headerErrors.bank_name}</div>}
                  </div>
                  <button type="button" className="inv-form-flex-btn invoice-builder__quick-add" onClick={() => setShowCreateBankModal(true)} title="Add a new bank account" aria-label="Add a new bank account">
                    <span className="fas fa-plus" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {invoiceDetails.clients_id ? (
              <div className={`invoice-client-defaults ${clientPreferences ? "invoice-client-defaults--active" : ""}`}>
                <div className="invoice-client-defaults__icon">
                  <span className={clientPreferencesLoading ? "fas fa-spinner fa-spin" : clientPreferences ? "fas fa-wand-magic-sparkles" : "fas fa-sliders"} aria-hidden="true" />
                </div>
                <div className="invoice-client-defaults__copy">
                  <strong>{clientPreferencesLoading ? "Loading client defaults..." : clientPreferences ? "Client defaults available" : "No saved invoice defaults yet"}</strong>
                  <p>{clientPreferences ? "The saved defaults are available for this client. Changes made here can replace them when you save the invoice." : "Save this invoice setup as the preferred starting point for future invoices to this client."}</p>
                </div>
                <label className="invoice-client-defaults__toggle">
                  <input type="checkbox" checked={saveClientPreferences} onChange={(event) => setSaveClientPreferences(event.target.checked)} />
                  <span className="invoice-client-defaults__switch" aria-hidden="true" />
                  <span>Save current setup as client default</span>
                </label>
              </div>
            ) : null}
          </section>

          <section className="invoice-builder__section">
            <div className="invoice-builder__section-heading">
              <div className="invoice-builder__section-icon">
                <span className="fas fa-chart-line" aria-hidden="true" />
              </div>
              <div className="invoice-builder__section-copy">
                <span className="invoice-builder__section-index">03</span>
                <h3 className="invoice-builder__section-title">Invoice controls</h3>
                <p className="invoice-builder__section-text">Manage invoice display settings while payment totals remain protected by the payment register.</p>
              </div>
            </div>

            <div className="invoice-builder__field-grid invoice-builder__field-grid--two">
              <div className="invoice-builder__field">
                <div className="input-form-wrapper">
                  <div className={`input-form-group ${headerErrors.tin_number ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.tin_number ? "input-label-message" : ""}`} htmlFor="tin_number">Display TIN Number?</label>
                    <div className="form-wrapper">
                      <Select
                        options={TIN_OPTIONS}
                        onChange={(option) => handleDetailChange("tin_number", option?.value || "")}
                        value={TIN_OPTIONS.find((option) => option.value === invoiceDetails.tin_number) || null}
                        placeholder="Select"
                        className={`form-input-select ${headerErrors.tin_number ? "input-error" : ""}`}
                        classNamePrefix="form-input-select"
                        inputId="tin_number"
                        onMenuOpen={() => setOpenMenuId("tin_number")}
                        onMenuClose={() => setOpenMenuId(null)}
                      />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "tin_number" ? "chevron-rotate" : "", headerErrors.tin_number ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.tin_number && <div className="input-error-message">{headerErrors.tin_number}</div>}
                </div>
              </div>

              <div className="invoice-builder__field">
                <div className="invoice-builder__payment-readonly">
                  <span className="invoice-builder__payment-readonly-icon fas fa-lock" aria-hidden="true" />
                  <div>
                    <span>Payments received</span>
                    <strong>{invoiceDetails.currency} {formatNumber(invoiceDetails.paid)}</strong>
                    <small>Use Record Payment on the invoice page to add or reverse receipts.</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-builder__notice">
              <span className="invoice-builder__notice-icon fas fa-circle-info" aria-hidden="true" />
              <p>Editing the invoice will not change recorded payments. The balance due is recalculated against the protected payment register.</p>
            </div>
          </section>

          <section className="invoice-builder__section invoice-builder__section--items">
            <div className="invoice-builder__items-toolbar">
              <div className="invoice-builder__section-heading invoice-builder__section-heading--compact">
                <div className="invoice-builder__section-icon">
                  <span className="fas fa-receipt" aria-hidden="true" />
                </div>
                <div className="invoice-builder__section-copy">
                  <span className="invoice-builder__section-index">04</span>
                  <h3 className="invoice-builder__section-title">Services and charges</h3>
                  <p className="invoice-builder__section-text">Edit existing lines or add new services with their applicable taxes.</p>
                </div>
              </div>
              <span className="invoice-builder__count-badge">{invoiceItems.length} {invoiceItems.length === 1 ? "line" : "lines"}</span>
            </div>

            <InvoiceLineEditor
              items={invoiceItems}
              currency={invoiceDetails.currency}
              errorsById={itemErrorMap}
              services={services}
              servicesLoading={servicesLoading}
              onSearchServices={handleServiceSearch}
              onApplyService={handleApplyService}
              onSaveAsService={(line) => setServiceModal({ open: true, line })}
              onChange={handleItemChange}
              onRemove={requestRemoveItem}
            />

            <div className="invoice-builder__items-footer">
              <div className="invoice-builder__add-area">
                <button type="button" onClick={addItem} className="invoice-add-btn invoice-builder__add-service">
                  <span className="fas fa-plus" aria-hidden="true" />
                  Add another service
                </button>
                <p>Saved lines are removed through the existing confirmation flow; new lines are removed immediately after confirmation.</p>
              </div>

              <aside className="invoice-builder__summary-card" aria-label="Invoice totals">
                <div className="invoice-builder__summary-header">
                  <div>
                    <span className="invoice-builder__summary-kicker">Live calculation</span>
                    <h4>Invoice summary</h4>
                  </div>
                  <span className="invoice-builder__currency-chip">{invoiceDetails.currency || "—"}</span>
                </div>
                <div className="invoice-builder__summary-list">
                  <div className="invoice-builder__summary-row">
                    <span>Gross service value</span>
                    <strong>{formatNumber(grossAmount)}</strong>
                  </div>
                  <div className="invoice-builder__summary-row">
                    <span>Total discount</span>
                    <strong>- {formatNumber(totals.totalDiscount)}</strong>
                  </div>
                  <div className="invoice-builder__summary-row">
                    <span>Total VAT</span>
                    <strong>+ {formatNumber(totals.totalVat)}</strong>
                  </div>
                  <div className="invoice-builder__summary-row invoice-builder__summary-row--muted">
                    <span>WHT (reference)</span>
                    <strong>{formatNumber(totals.totalWht)}</strong>
                  </div>
                  <div className="invoice-builder__summary-row">
                    <span>Paid amount</span>
                    <strong>- {formatNumber(invoiceDetails.paid)}</strong>
                  </div>
                  <div className="invoice-builder__summary-row invoice-builder__summary-row--balance">
                    <span>Balance due</span>
                    <strong>{formatNumber(balanceDue)}</strong>
                  </div>
                </div>
                <div className="invoice-builder__grand-total">
                  <span>Grand total</span>
                  <strong><small>{invoiceDetails.currency}</small>{formatNumber(totals.grandTotal)}</strong>
                </div>
              </aside>
            </div>
          </section>

          <InvoiceDraftBar
            saveState={saveState}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
            isRestoring={isRestoring}
            onSave={handleManualDraftSave}
            disabled={isLoading}
          />

          <footer className="invoice-builder__footer">
            <div className="invoice-builder__footer-copy">
              <span className="fas fa-shield-alt" aria-hidden="true" />
              <div>
                <strong>Ready to save changes?</strong>
                <p>Review the updated details and totals before saving this invoice.</p>
              </div>
            </div>
            <button type="submit" disabled={isLoading || isRestoring} className="invoice-submit-btn invoice-builder__submit-button">
              {isLoading ? (
                <div className="invoice-loader" />
              ) : (
                <>
                  <span>Update Invoice</span>
                  <span className="fas fa-arrow-right" aria-hidden="true" />
                </>
              )}
            </button>
          </footer>
        </form>
      </motion.div>

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
          <CreateRateModal isOpen={showCreateRateModal} onClose={() => setShowCreateRateModal(false)} onRateCreated={handleRateCreated} />
        )}
        {showCreateClientModal && (
          <CreateClientsModal isOpen={showCreateClientModal} onClose={() => setShowCreateClientModal(false)} onClientCreated={handleClientCreated} />
        )}
        {showCreateProjectModal && (
          <CreateProjectModal isOpen={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} onProjectCreated={handleProjectCreated} />
        )}
        {showCreateBankModal && (
          <CreateBankModal isOpen={showCreateBankModal} onClose={() => setShowCreateBankModal(false)} onBankCreated={handleBankCreated} />
        )}
        {serviceModal.open && (
          <CreateInvoiceServiceModal
            isOpen={serviceModal.open}
            currency={invoiceDetails.currency}
            initialLine={serviceModal.line}
            onClose={() => setServiceModal({ open: false, line: null })}
            onCreated={handleServiceCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EditInvoiceForm;
