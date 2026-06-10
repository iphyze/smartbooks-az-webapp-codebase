import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useLedgerSearchStore from "../../stores/useLedgerSearchStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import useClientSearchStore from "../../stores/useClientSearchStore";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import CreateClientsModal from "../../components/modals/CreateClientsModal";
import CreateLedgerModal from "../../components/modals/CreateLedgerModal";
import CreateRateModal from "../../components/modals/CreateRateModal";
import { useNavigate } from "react-router-dom";
import { findEffectiveRateId } from "../../utils/helper";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;

function parseDateValue(value, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "string" && value.trim()) {
    const clean = value.trim().slice(0, 10);
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return fallback instanceof Date && !Number.isNaN(fallback.getTime()) ? fallback : new Date();
}

function formatDateForApi(value) {
  const date = parseDateValue(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sameDateKey(a, b) {
  return formatDateForApi(a) === formatDateForApi(b);
}

function createEmptyItem(defaultDescription = "", journalDate = new Date()) {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    ledger_name: "",
    ledger_number: "",
    ledger_class: "",
    ledger_class_code: "",
    ledger_sub_class: "",
    ledger_type: "",
    journal_description: defaultDescription,
    journal_date: parseDateValue(journalDate),
    journal_date_touched: false,
    sides: "",
    jcurrency: "NGN",
    jrate: "",
    currencyRate: "",
    amount: "",
    rate_date: "",
    ngn_rate: "",
    usd_rate: "",
    eur_rate: "",
    gbp_rate: "",
  };
}

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EPSILON = 0.001;

const DATE_PICKER_PORTAL_PROPS = {
  portalId: "smartbooks-datepicker-portal",
  popperClassName: "smartbooks-datepicker-popper",
  calendarClassName: "smartbooks-datepicker-calendar",
  popperPlacement: "bottom-start",
};

/* ─────────────────────────────────────────────
   Static Option Arrays
───────────────────────────────────────────── */
const JOURNAL_TYPE_OPTIONS = [
  { value: "Payment", label: "Payment" },
  { value: "Receipt", label: "Receipt" },
  { value: "Expenses", label: "Expenses" },
  { value: "Sales", label: "Sales" },
  { value: "General", label: "General" },
  { value: "Journal", label: "Journal" },
];
const TRANSACTION_TYPE_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Not Applicable", label: "Not Applicable" },
];
const SIDE_OPTIONS = [
  { value: "Debit", label: "Debit" },
  { value: "Credit", label: "Credit" },
];
const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "EUR", label: "EUR" },
];

/* ─────────────────────────────────────────────
   calculateTotals — identical to original
───────────────────────────────────────────── */
function calculateTotals(items) {
  let totalDebit = 0, totalCredit = 0, totalNGNDebit = 0;
  let totalUSDAmount = 0, totalUSDCount = 0, totalUSDDebit = 0, totalUSDCredit = 0;

  items.forEach((item) => {
    const amount = parseFloat(item.amount) || 0;
    const currencyRate = parseFloat(item.currencyRate) || 0;
    const side = item.sides;
    const currency = item.jcurrency;
    let currencyConversion = 0;

    if (currency === "NGN") {
      currencyConversion = amount;
      totalNGNDebit += amount;
    } else {
      currencyConversion = amount * currencyRate;
      if (side === "Debit") totalUSDDebit += amount;
      if (side === "Credit") totalUSDCredit += amount;
      totalUSDAmount += amount;
      totalUSDCount++;
    }

    if (side === "Debit") totalDebit += currencyConversion;
    if (side === "Credit") totalCredit += currencyConversion;
  });

  let totalDebitUSD = 0, totalCreditUSD = 0;
  if (totalUSDCount > 0) {
    if (totalNGNDebit > 0) {
      const debitAverageRate = totalUSDAmount > 0 ? totalDebit / totalUSDAmount : 0;
      const creditAverageRate = totalUSDAmount > 0 ? totalCredit / totalUSDAmount : 0;
      totalDebitUSD = debitAverageRate > 0 ? totalNGNDebit / debitAverageRate : 0;
      totalCreditUSD = creditAverageRate > 0 ? totalNGNDebit / creditAverageRate : 0;
    } else {
      totalDebitUSD = totalUSDDebit;
      totalCreditUSD = totalUSDCredit;
    }
  }

  return {
    total_debit_ngn: totalDebit,
    total_credit_ngn: totalCredit,
    total_debit_usd: totalDebitUSD,
    total_credit_usd: totalCreditUSD,
    grand_total_ngn: totalDebit - totalCredit,
    grand_total_usd: totalCreditUSD - totalDebitUSD,
    grand_total: totalDebit - totalCredit,
  };
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const CreateJournalForm = () => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { ledgers, searchLedgers } = useLedgerSearchStore();
  const { rates, searchRates } = useRateSearchStore();
  const { clients, searchClients } = useClientSearchStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [deleteModal, setDeleteModal] = useState({ open: false, itemId: null });

  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
  const [showCreateRateModal, setShowCreateRateModal] = useState(false);
  const [activeRowId, setActiveRowId] = useState(null);

  /* ── Header state ── */
  const [journalDetails, setJournalDetails] = useState({
    journal_date: new Date(),
    journal_type: "",
    journal_currency: "NGN",
    transaction_type: "",
    main_journal_description: "",
    cost_center: "Overhead",
  });

  /* ── Master rate id — drives all rows ── */
  const [masterRateId, setMasterRateId] = useState("");

  /* ── Row state ── */
  const [journalItems, setJournalItems] = useState(() => {
    const item = createEmptyItem("", journalDetails.journal_date);
    const effectiveId = findEffectiveRateId(rates, item.jcurrency, journalDetails.journal_date);
    const found = effectiveId ? rates.find((r) => String(r.id) === effectiveId) : null;
    if (found) {
      item.jrate = effectiveId;
      item.currencyRate = parseFloat(found[`${item.jcurrency.toLowerCase()}_rate`]) || 0;
      item.rate_date = found.created_at;
      item.ngn_rate = found.ngn_rate;
      item.usd_rate = found.usd_rate;
      item.eur_rate = found.eur_rate;
      item.gbp_rate = found.gbp_rate;
    }
    return [item];
  });
  const prevJournalItemsRef = useRef(journalItems);

  /* ── On mount ── */
  useEffect(() => { searchRates(""); searchLedgers(""); searchClients(""); }, []);

  /* ── Cost center options ── */
  const costCenterOptions = useMemo(() => {
    const clientOpts = clients.map((c) => ({ value: c.clients_name, label: c.clients_name }));
    return [{ value: "Overhead", label: "Overhead" }, ...clientOpts];
  }, [clients]);

  /* ── Master rate options — all rates, all currencies visible ── */
  const masterRateOptions = useMemo(() =>
    rates.map((r) => ({
      value: String(r.id),
      label: r.created_at?.slice(0, 10) || "",
      rate: r,
    })),
    [rates]);

  /* ── Auto-set master rate from journal_date when rates load ── */
  useEffect(() => {
    if (!journalDetails.journal_date || !rates.length) return;

    const effectiveId = findEffectiveRateId(
      rates,
      "NGN",
      journalDetails.journal_date
    );

    setMasterRateId(effectiveId || "");
  }, [journalDetails.journal_date, rates]);

  /* ── When masterRateId changes, push rate to ALL rows ── */
  useEffect(() => {
    if (!masterRateId) return;
    const found = rates.find((r) => String(r.id) === masterRateId);
    if (!found) return;
    setJournalItems((prev) =>
      prev.map((item) => {
        const curr = item.jcurrency.toLowerCase();
        return {
          ...item,
          jrate: masterRateId,
          currencyRate: parseFloat(found[`${curr}_rate`]) || 0,
          rate_date: found.created_at,
          ngn_rate: found.ngn_rate,
          usd_rate: found.usd_rate,
          eur_rate: found.eur_rate,
          gbp_rate: found.gbp_rate,
        };
      })
    );
  }, [masterRateId, rates]);

  useEffect(() => { prevJournalItemsRef.current = journalItems; }, [journalItems]);

  /* ── Sync row descriptions when main description changes ── */
  const prevMainDesc = useRef(journalDetails.main_journal_description);
  useEffect(() => {
    const prev = prevMainDesc.current;
    const next = journalDetails.main_journal_description;
    prevMainDesc.current = next;
    setJournalItems((items) =>
      items.map((item) =>
        item.journal_description === prev ? { ...item, journal_description: next } : item
      )
    );
  }, [journalDetails.main_journal_description]);

  /* ── Totals ── */
  const totals = useMemo(() => calculateTotals(journalItems), [journalItems]);
  const isBalanced = Math.abs(totals.grand_total) < EPSILON;

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateHeader = useCallback(() => {
    const e = {};
    if (!journalDetails.journal_date) e.journal_date = "Journal date is required";
    if (!journalDetails.journal_type) e.journal_type = "Journal type is required";
    if (!journalDetails.journal_currency) e.journal_currency = "Currency is required";
    if (!journalDetails.transaction_type) e.transaction_type = "Transaction type is required";
    if (!journalDetails.main_journal_description?.trim()) e.main_journal_description = "Description is required";
    if (!journalDetails.cost_center) e.cost_center = "Cost center is required";
    if (!masterRateId) e.master_rate = "Exchange rate is required";
    return e;
  }, [journalDetails, masterRateId]);

  const validateItems = useCallback(() =>
    journalItems.map((item) => {
      const e = {};
      if (!item.ledger_name) e.ledger_name = "Ledger required";
      if (!item.journal_date) e.journal_date = "Date required";
      if (!item.journal_description?.trim()) e.journal_description = "Description required";
      if (!item.sides) e.sides = "Dr/Cr required";
      if (!item.jcurrency) e.jcurrency = "Currency required";
      if (!item.jrate) e.jrate = "Rate required";
      if (item.amount === "" || item.amount === null) e.amount = "Amount required";
      else if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0) e.amount = "Invalid amount";
      return e;
    }),
    [journalItems]);

  const headerErrors = useMemo(() => submitted ? validateHeader() : {}, [submitted, validateHeader]);
  const itemErrorMap = useMemo(() => {
    if (!submitted) return {};
    const errs = validateItems();
    const prevItems = prevJournalItemsRef.current;
    return Object.fromEntries(
      journalItems.map((item, i) => {
        const isNew = !prevItems.some((p) => p.id === item.id);
        return [item.id, isNew ? {} : (errs[i] || {})];
      })
    );
  }, [submitted, validateItems, journalItems]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    if (field === "journal_date") {
      const nextDate = parseDateValue(value, journalDetails.journal_date);
      const previousHeaderDate = journalDetails.journal_date;

      setJournalItems((items) =>
        items.map((item) => {
          const shouldInheritHeaderDate =
            !item.journal_date_touched || sameDateKey(item.journal_date, previousHeaderDate);

          return shouldInheritHeaderDate
            ? { ...item, journal_date: nextDate, journal_date_touched: false }
            : item;
        })
      );

      setJournalDetails((prev) => ({ ...prev, journal_date: nextDate }));
      return;
    }

    setJournalDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setJournalItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === "journal_date") {
          updated.journal_date = parseDateValue(value, journalDetails.journal_date);
          updated.journal_date_touched = !sameDateKey(updated.journal_date, journalDetails.journal_date);
          return updated;
        }

        if (field === "ledger_name") {
          const found = ledgers.find((l) => l.ledger_name === value);
          if (found) {
            updated.ledger_number = found.ledger_number || "";
            updated.ledger_class = found.ledger_class || "";
            updated.ledger_class_code = found.ledger_class_code || "";
            updated.ledger_sub_class = found.ledger_sub_class || "";
            updated.ledger_type = found.ledger_type || "";
          }
        }

        /* When row currency changes, re-apply master rate at the new currency's column */
        if (field === "jcurrency") {
          const found = masterRateId ? rates.find((r) => String(r.id) === masterRateId) : null;
          if (found) {
            const curr = value.toLowerCase();
            updated.jrate = masterRateId;
            updated.currencyRate = parseFloat(found[`${curr}_rate`]) || 0;
            updated.rate_date = found.created_at;
            updated.ngn_rate = found.ngn_rate;
            updated.usd_rate = found.usd_rate;
            updated.eur_rate = found.eur_rate;
            updated.gbp_rate = found.gbp_rate;
          } else {
            updated.jrate = ""; updated.currencyRate = ""; updated.rate_date = "";
            updated.ngn_rate = ""; updated.usd_rate = ""; updated.eur_rate = ""; updated.gbp_rate = "";
          }
          updated.amount = "";
        }

        return updated;
      })
    );
  };

  /* ── Add row — inherit master rate at NGN (default) ── */
  const addItem = () => {
    setJournalItems((prev) => {
      const newItem = createEmptyItem(journalDetails.main_journal_description, journalDetails.journal_date);
      const found = masterRateId ? rates.find((r) => String(r.id) === masterRateId) : null;
      if (found) {
        const curr = newItem.jcurrency.toLowerCase();
        newItem.jrate = masterRateId;
        newItem.currencyRate = parseFloat(found[`${curr}_rate`]) || 0;
        newItem.rate_date = found.created_at;
        newItem.ngn_rate = found.ngn_rate;
        newItem.usd_rate = found.usd_rate;
        newItem.eur_rate = found.eur_rate;
        newItem.gbp_rate = found.gbp_rate;
      }
      return [...prev, newItem];
    });
  };

  const requestRemoveItem = (itemId) => {
    if (journalItems.length === 1) return;
    setDeleteModal({ open: true, itemId });
  };

  const confirmRemoveItem = () => {
    setJournalItems((prev) => prev.filter((i) => i.id !== deleteModal.itemId));
    setDeleteModal({ open: false, itemId: null });
  };

  const handleClientCreated = (newClient) => {
    setShowCreateClientModal(false); searchClients("");
    if (newClient) handleDetailChange("cost_center", newClient.clients_name);
  };

  const handleLedgerCreated = (newLedger) => {
    setShowCreateLedgerModal(false); searchLedgers("");
    if (newLedger && activeRowId)
      setTimeout(() => handleItemChange(activeRowId, "ledger_name", newLedger.ledger_name), 500);
  };

  const handleRateCreated = () => { setShowCreateRateModal(false); searchRates(""); };

  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const hErr = validateHeader();
    const iErr = validateItems();
    if (Object.keys(hErr).length || iErr.some((r) => Object.keys(r).length)) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    if (!isBalanced) {
      showToast("Grand total must be equal to zero. Please ensure that your total debit equals your total credit!", "error");
      return;
    }

    setIsLoading(true);
    const token = useAuthStore.getState().token;

    const payload = {
      ...journalDetails,
      journal_date: formatDateForApi(journalDetails.journal_date),
      journal_line_date: journalItems.map((i) => formatDateForApi(i.journal_date || journalDetails.journal_date)),
      total_debit_ngn: totals.total_debit_ngn,
      total_credit_ngn: totals.total_credit_ngn,
      total_debit_usd: totals.total_debit_usd,
      total_credit_usd: totals.total_credit_usd,
      grand_total_ngn: totals.grand_total_ngn,
      grand_total_usd: totals.grand_total_usd,
      grand_total: totals.grand_total,
      ledger_name: journalItems.map((i) => i.ledger_name),
      ledger_number: journalItems.map((i) => i.ledger_number),
      ledger_class: journalItems.map((i) => i.ledger_class),
      ledger_class_code: journalItems.map((i) => i.ledger_class_code),
      ledger_sub_class: journalItems.map((i) => i.ledger_sub_class),
      ledger_type: journalItems.map((i) => i.ledger_type),
      amount: journalItems.map((i) => i.amount),
      sides: journalItems.map((i) => i.sides),
      jrate: journalItems.map((i) => i.jrate),
      jcurrency: journalItems.map((i) => i.jcurrency),
      currency_rate: journalItems.map((i) => i.currencyRate),
      journal_description: journalItems.map((i) => i.journal_description),
      rate_date: journalItems.map((i) => i.rate_date),
      ngn_rate: journalItems.map((i) => i.ngn_rate),
      usd_rate: journalItems.map((i) => i.usd_rate),
      eur_rate: journalItems.map((i) => i.eur_rate),
      gbp_rate: journalItems.map((i) => i.gbp_rate),
    };

    try {
      const response = await api.post("/journal/create-journal", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response?.data?.status === "Success") {
        const journal_id = response?.data?.data?.journal_id;
        showToast(response?.data?.message || "Journal created successfully!", "success");
        setSubmitted(false);
        setJournalDetails({
          journal_date: new Date(), journal_type: "", journal_currency: "NGN",
          transaction_type: "", main_journal_description: "", cost_center: "Overhead",
        });
        setMasterRateId("");

        const resetItem = createEmptyItem("", new Date());
        const effectiveId = findEffectiveRateId(rates, resetItem.jcurrency, new Date());
        const found = effectiveId ? rates.find((r) => String(r.id) === effectiveId) : null;
        if (found) {
          resetItem.jrate = effectiveId;
          resetItem.currencyRate = parseFloat(found[`${resetItem.jcurrency.toLowerCase()}_rate`]) || 0;
          resetItem.rate_date = found.created_at;
          resetItem.ngn_rate = found.ngn_rate;
          resetItem.usd_rate = found.usd_rate;
          resetItem.eur_rate = found.eur_rate;
          resetItem.gbp_rate = found.gbp_rate;
        }
        setJournalItems([resetItem]);
        navigate(`/journal/view/${journal_id}`);
      } else {
        showToast(response?.data?.message || "Failed to create journal", "error");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to create journal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMasterRateOpt = masterRateOptions.find((o) => o.value === masterRateId) || null;

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
      <motion.div variants={fadeInUp} initial="hidden" animate="show"
        transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
        className={`invoice-form-box theme-${theme}`}>
        <form className="invoice-form-f-container" onSubmit={handleSubmit} noValidate>

          <div className="invoice-form-header">
            <div className="invoice-form-htxt">Create Journal</div>
            <div className="invoice-form-sub-htxt">Fill the form below to create a new journal</div>
          </div>

          <div className="invoice-form-flex-box">

            {/* Journal Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.journal_date ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.journal_date ? "input-label-message" : ""}`} htmlFor="journal_date">Journal Date</label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={journalDetails.journal_date}
                      onChange={(date) => {
                        handleDetailChange("journal_date", date);
                      }}
                      className={`form-input ${headerErrors.journal_date ? "input-error" : ""}`}
                      dateFormat="yyyy-MM-dd"
                      wrapperClassName="input-date-picker"
                      {...DATE_PICKER_PORTAL_PROPS}
                      id="journal_date"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <span className={`chevron-input-icon fas fa-calendar ${headerErrors.journal_date ? "input-icon-error" : ""}`} />
                  </div>
                </div>
                {headerErrors.journal_date && <div className="input-error-message">{headerErrors.journal_date}</div>}
              </div>
            </div>

            {/* Journal Type */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.journal_type ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.journal_type ? "input-label-message" : ""}`} htmlFor="journal_type">Journal Type</label>
                  <div className="form-wrapper">
                    <Select options={JOURNAL_TYPE_OPTIONS} onChange={(opt) => handleDetailChange("journal_type", opt?.value || "")} value={JOURNAL_TYPE_OPTIONS.find((o) => o.value === journalDetails.journal_type) || null} placeholder="Select type" className={`form-input-select ${headerErrors.journal_type ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="journal_type" onMenuOpen={() => setOpenMenuId("journal_type")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "journal_type" ? "chevron-rotate" : "", headerErrors.journal_type ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.journal_type && <div className="input-error-message">{headerErrors.journal_type}</div>}
              </div>
            </div>

            {/* Journal Currency */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.journal_currency ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.journal_currency ? "input-label-message" : ""}`} htmlFor="journal_currency">Journal Currency</label>
                  <div className="form-wrapper">
                    <Select options={CURRENCY_OPTIONS} onChange={(opt) => handleDetailChange("journal_currency", opt?.value || "")} value={CURRENCY_OPTIONS.find((o) => o.value === journalDetails.journal_currency) || null} placeholder="Select currency" className={`form-input-select ${headerErrors.journal_currency ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId="journal_currency" onMenuOpen={() => setOpenMenuId("journal_currency")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "journal_currency" ? "chevron-rotate" : "", headerErrors.journal_currency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.journal_currency && <div className="input-error-message">{headerErrors.journal_currency}</div>}
              </div>
            </div>



            {/* Transaction Type */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.transaction_type ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.transaction_type ? "input-label-message" : ""}`} htmlFor="transaction_type">Transaction Type</label>
                  <div className="form-wrapper">
                    <Select options={TRANSACTION_TYPE_OPTIONS} onChange={(opt) => handleDetailChange("transaction_type", opt?.value || "")} value={TRANSACTION_TYPE_OPTIONS.find((o) => o.value === journalDetails.transaction_type) || null} placeholder="Select type" className={`form-input-select ${headerErrors.transaction_type ? "input-error" : ""}`} classNamePrefix="form-input-select" isClearable inputId="transaction_type" onMenuOpen={() => setOpenMenuId("transaction_type")} onMenuClose={() => setOpenMenuId(null)} />
                    <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "transaction_type" ? "chevron-rotate" : "", headerErrors.transaction_type ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                  </div>
                </div>
                {headerErrors.transaction_type && <div className="input-error-message">{headerErrors.transaction_type}</div>}
              </div>
            </div>

            {/* Cost Center */}
            <div className="invoice-form invoice-form-three">
              <div className="inv-form-flex">
                <div className="input-form-wrapper inv-form-flex-wrap">
                  <div className={`input-form-group ${headerErrors.cost_center ? "input-form-error" : ""}`}>
                    <label className={`input-form-label ${headerErrors.cost_center ? "input-label-message" : ""}`} htmlFor="cost_center">Cost Center</label>
                    <div className="form-wrapper">
                      <Select options={costCenterOptions} onChange={(opt) => handleDetailChange("cost_center", opt?.value || "")} value={costCenterOptions.find((o) => o.value === journalDetails.cost_center) || null} placeholder="Select cost center" className={`form-input-select ${headerErrors.cost_center ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId="cost_center" onMenuOpen={() => setOpenMenuId("cost_center")} onMenuClose={() => setOpenMenuId(null)} />
                      <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === "cost_center" ? "chevron-rotate" : "", headerErrors.cost_center ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                    </div>
                  </div>
                  {headerErrors.cost_center && <div className="input-error-message">{headerErrors.cost_center}</div>}
                </div>
                <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateClientModal(true)} title="Add New Client">
                  <span className="fas fa-plus" />
                </button>
              </div>
            </div>

            {/* Journal Description — last */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div className={`input-form-group ${headerErrors.main_journal_description ? "input-form-error" : ""}`}>
                  <label className={`input-form-label ${headerErrors.main_journal_description ? "input-label-message" : ""}`} htmlFor="main_journal_description">Journal Description</label>
                  <div className="form-wrapper">
                    <textarea className={`form-input-select form-input-textarea ${headerErrors.main_journal_description ? "input-error" : ""}`} rows="2" placeholder="Enter description" value={journalDetails.main_journal_description} onChange={(e) => handleDetailChange("main_journal_description", e.target.value)} id="main_journal_description" />
                  </div>
                </div>
                {headerErrors.main_journal_description && <div className="input-error-message">{headerErrors.main_journal_description}</div>}
              </div>
            </div>

          </div>

          {/* ── JOURNAL ITEMS TABLE — no Rate column ── */}
          <div className="invoice-form-full">
            <div className="invoice-items-table journal-items-table">
              <div className="invoice-table-header journal-table-header">
                <div className="invoice-table-cell journal-cell-ledger">Ledger Name</div>
                <div className="invoice-table-cell journal-cell-description">Description</div>
                <div className="invoice-table-cell journal-cell-date">Journal Date</div>
                <div className="invoice-table-cell cell-small journal-cell-side">DR / CR</div>
                <div className="invoice-table-cell cell-small journal-cell-currency">Currency</div>
                <div className="invoice-table-cell journal-cell-rate">Rate Date</div>
                <div className="invoice-table-cell journal-cell-amount">Amount</div>
                <div className="invoice-table-cell cell-action">Action</div>
              </div>

              {journalItems.map((item) => {
                const rowErr = itemErrorMap[item.id] || {};
                const ledgerId = `ledger_${item.id}`;
                const sideId = `side_${item.id}`;
                const currId = `curr_${item.id}`;

                return (
                  <div key={item.id} className="invoice-table-row">

                    {/* Ledger */}
                    <div className="invoice-table-cell journal-cell-ledger">
                      <div className="inv-form-flex">
                        <div className="input-form-wrapper inv-form-flex-wrap">
                          <div className={`input-form-group ${rowErr.ledger_name ? "input-form-error" : ""}`}>
                            <label className={`input-form-label ${rowErr.ledger_name ? "input-label-message" : ""}`} htmlFor={ledgerId}>Ledger</label>
                            <div className="form-wrapper">
                              <Select
                                options={ledgers.map((l) => ({ value: l.ledger_name, label: l.ledger_name }))}
                                onInputChange={(val) => { if (val.length > 1) searchLedgers(val); }}
                                onMenuOpen={() => setOpenMenuId(`ledger_${item.id}`)}
                                onMenuClose={() => { setOpenMenuId(null); searchLedgers(""); }}
                                onChange={(opt) => handleItemChange(item.id, "ledger_name", opt ? opt.value : "")}
                                value={item.ledger_name ? { value: item.ledger_name, label: item.ledger_name } : null}
                                placeholder="Search ledger..." isClearable inputId={ledgerId}
                                className={`form-input-select ${rowErr.ledger_name ? "input-error" : ""}`}
                                classNamePrefix="form-input-select"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                              />
                              <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `ledger_${item.id}` ? "chevron-rotate" : "", rowErr.ledger_name ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                            </div>
                          </div>
                          {rowErr.ledger_name && <div className="input-error-message">{rowErr.ledger_name}</div>}
                        </div>
                        <button type="button" className="inv-form-flex-btn" onClick={() => { setActiveRowId(item.id); setShowCreateLedgerModal(true); }} title="Add New Ledger">
                          <span className="fas fa-plus" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="invoice-table-cell journal-cell-description">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.journal_description ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <input type="text" className={`form-input-select form-input-textarea-row ${rowErr.journal_description ? "input-error" : ""}`} value={item.journal_description} onChange={(e) => handleItemChange(item.id, "journal_description", e.target.value)} placeholder="Description" />
                          </div>
                        </div>
                        {rowErr.journal_description && <div className="input-error-message">{rowErr.journal_description}</div>}
                      </div>
                    </div>


                    {/* Journal Date */}
                    <div className="invoice-table-cell journal-cell-date">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.journal_date ? "input-form-error" : ""}`}>
                          <label className={`input-form-label ${rowErr.journal_date ? "input-label-message" : ""}`} htmlFor={`line_date_${item.id}`}>Date</label>
                          <div className="form-wrapper">
                            <DatePicker
                              selected={parseDateValue(item.journal_date, journalDetails.journal_date)}
                              onChange={(date) => handleItemChange(item.id, "journal_date", date)}
                              className={`form-input ${rowErr.journal_date ? "input-error" : ""}`}
                              dateFormat="yyyy-MM-dd"
                              wrapperClassName="input-date-picker"
                              {...DATE_PICKER_PORTAL_PROPS}
                              id={`line_date_${item.id}`}
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                            />
                            <span className={`chevron-input-icon fas fa-calendar ${rowErr.journal_date ? "input-icon-error" : ""}`} />
                          </div>
                        </div>
                        {rowErr.journal_date && <div className="input-error-message">{rowErr.journal_date}</div>}
                      </div>
                    </div>

                    {/* DR / CR */}
                    <div className="invoice-table-cell cell-small journal-cell-side">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.sides ? "input-form-error" : ""}`}>
                          <label className={`input-form-label ${rowErr.sides ? "input-label-message" : ""}`} htmlFor={sideId}>Side</label>
                          <div className="form-wrapper">
                            <Select options={SIDE_OPTIONS} onChange={(opt) => handleItemChange(item.id, "sides", opt ? opt.value : "")} value={SIDE_OPTIONS.find((o) => o.value === item.sides) || null} placeholder="Select" className={`form-input-select ${rowErr.sides ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId={sideId} onMenuOpen={() => setOpenMenuId(`sides_${item.id}`)} onMenuClose={() => setOpenMenuId(null)} menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
                            <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `sides_${item.id}` ? "chevron-rotate" : "", rowErr.sides ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                          </div>
                        </div>
                        {rowErr.sides && <div className="input-error-message">{rowErr.sides}</div>}
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="invoice-table-cell cell-small journal-cell-currency">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.jcurrency ? "input-form-error" : ""}`}>
                          <label className={`input-form-label ${rowErr.jcurrency ? "input-label-message" : ""}`} htmlFor={currId}>Currency</label>
                          <div className="form-wrapper">
                            <Select options={CURRENCY_OPTIONS} onChange={(opt) => handleItemChange(item.id, "jcurrency", opt ? opt.value : "NGN")} value={CURRENCY_OPTIONS.find((o) => o.value === item.jcurrency) || null} className={`form-input-select ${rowErr.jcurrency ? "input-error" : ""}`} classNamePrefix="form-input-select" inputId={currId} onMenuOpen={() => setOpenMenuId(`currency_${item.id}`)} onMenuClose={() => setOpenMenuId(null)} menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
                            <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `currency_${item.id}` ? "chevron-rotate" : "", rowErr.jcurrency ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                          </div>
                        </div>
                        {rowErr.jcurrency && <div className="input-error-message">{rowErr.jcurrency}</div>}
                      </div>
                    </div>

                    {/* Rate Date — Select using masterRateOptions, auto-filled & styled consistently */}
                    <div className="invoice-table-cell journal-cell-rate">
                      <div className="inv-form-flex">
                        <div className="input-form-wrapper inv-form-flex-wrap" style={{ margin: 0 }}>
                          <div className={`input-form-group ${rowErr.jrate ? "input-form-error" : ""}`}>
                            <label className={`input-form-label ${rowErr.jrate ? "input-label-message" : ""}`} htmlFor={`rate_${item.id}`}>Rate Date</label>
                            <div className="form-wrapper">
                              <Select
                                options={masterRateOptions.map((o) => ({
                                  ...o,
                                  label: o.rate
                                    ? `${o.rate.created_at?.slice(0, 10)} | ${item.jcurrency} @ ${o.rate[`${item.jcurrency.toLowerCase()}_rate`]}`
                                    : o.label,
                                }))}
                                onChange={(opt) => setMasterRateId(opt ? opt.value : "")}
                                value={item.jrate ? {
                                  value: item.jrate,
                                  label: item.rate_date
                                    ? `${String(item.rate_date).slice(0, 10)} | ${item.jcurrency} @ ${item.currencyRate}`
                                    : "",
                                } : null}
                                placeholder={rates.length === 0 ? "Loading..." : "Select rate..."}
                                className={`form-input-select ${rowErr.jrate ? "input-error" : ""}`}
                                classNamePrefix="form-input-select"
                                isClearable
                                inputId={`rate_${item.id}`}
                                onMenuOpen={() => setOpenMenuId(`rate_${item.id}`)}
                                onMenuClose={() => setOpenMenuId(null)}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
                                noOptionsMessage={() => rates.length === 0 ? "Loading rates..." : "No rates found"}
                              />
                              <span className={["chevron-input-icon fas fa-chevron-down", openMenuId === `rate_${item.id}` ? "chevron-rotate" : "", rowErr.jrate ? "input-icon-error" : ""].filter(Boolean).join(" ")} />
                            </div>
                          </div>
                          {rowErr.jrate && <div className="input-error-message">{rowErr.jrate}</div>}
                        </div>
                        <button type="button" className="inv-form-flex-btn" onClick={() => setShowCreateRateModal(true)} title="Add New Rate">
                          <span className="fas fa-plus" />
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="invoice-table-cell journal-cell-amount">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div className={`input-form-group ${rowErr.amount ? "input-form-error" : ""}`}>
                          <div className="form-wrapper">
                            <input type="number" className={`form-input form-input-number ${rowErr.amount ? "input-error" : ""}`} value={item.amount} onChange={(e) => handleItemChange(item.id, "amount", e.target.value)} onWheel={(e) => e.target.blur()} step="any" min="0" placeholder="0.00" />
                          </div>
                        </div>
                        {rowErr.amount && <div className="input-error-message">{rowErr.amount}</div>}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="invoice-table-cell cell-action">
                      <button type="button" onClick={() => requestRemoveItem(item.id)} className="invoice-remove-btn" disabled={journalItems.length === 1} title="Remove row">
                        <span className="fas fa-trash" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SUMMARY ── */}
          <div className="invoice-form-summary">
            <button type="button" onClick={addItem} className="invoice-add-btn">
              <span className="fas fa-plus-circle" /> Add Row
            </button>
            <div className="invoice-totals journal-summary-grid">
              <div className="journal-summary-col">
                <div className="invoice-total-row-header">NGN</div>
                <div className="invoice-total-row"><div className="invoice-total-label">Debit</div><div className="invoice-total-value">{formatNumber(totals.total_debit_ngn)}</div></div>
                <div className="invoice-total-row"><div className="invoice-total-label">Credit</div><div className="invoice-total-value">{formatNumber(totals.total_credit_ngn)}</div></div>
                <div className="invoice-total-row"><div className="invoice-total-label inv-bold">Balance</div><div className="invoice-total-value inv-bold">{formatNumber(totals.grand_total_ngn)}</div></div>
              </div>
              <div className="journal-summary-col">
                <div className="invoice-total-row-header">FCY</div>
                <div className="invoice-total-row"><div className="invoice-total-label">Debit</div><div className="invoice-total-value">{formatNumber(totals.total_debit_usd)}</div></div>
                <div className="invoice-total-row"><div className="invoice-total-label">Credit</div><div className="invoice-total-value">{formatNumber(totals.total_credit_usd)}</div></div>
                <div className="invoice-total-row"><div className="invoice-total-label inv-bold">Balance</div><div className="invoice-total-value inv-bold">{formatNumber(totals.grand_total_usd)}</div></div>
              </div>
              <div className="journal-summary-col jsc-summary">
                <div className={`invoice-total-row invoice-grand-total ${!isBalanced ? "error-total" : "balanced-total"}`}>
                  <div className="invoice-total-label invoice-diff-text">
                    Difference
                    {!isBalanced && <span style={{ fontSize: "10px", marginLeft: "5px", color: "#f8d9d9" }}>(must be 0.00)</span>}
                  </div>
                  <div className="invoice-total-value invoice-diff-text">{formatNumber(totals.grand_total)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button type="submit" disabled={isLoading} className="invoice-submit-btn">
                {isLoading ? <div className="invoice-loader" /> : <span className="invoice-submit-btn-text">Submit Journal</span>}
              </button>
            </div>
          </div>

        </form>
      </motion.div>

      <AnimatePresence>
        {deleteModal.open && <DeleteLineItemModal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, itemId: null })} onConfirm={confirmRemoveItem} isNew={true} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateClientModal && <CreateClientsModal isOpen={showCreateClientModal} onClose={() => setShowCreateClientModal(false)} onClientCreated={handleClientCreated} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateLedgerModal && <CreateLedgerModal isOpen={showCreateLedgerModal} onClose={() => setShowCreateLedgerModal(false)} onLedgerCreated={handleLedgerCreated} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateRateModal && <CreateRateModal isOpen={showCreateRateModal} onClose={() => setShowCreateRateModal(false)} onRateCreated={handleRateCreated} />}
      </AnimatePresence>
    </>
  );
};

export default CreateJournalForm;