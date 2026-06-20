import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useToastStore from "../../stores/useToastStore";
import useLedgerSearchStore from "../../stores/useLedgerSearchStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import "../inputs-styles/Inputs.css";
import "./JournalForm.css";
import JournalFormView from "./JournalFormView";
import useClientSearchStore from "../../stores/useClientSearchStore";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import CreateClientsModal from "../../components/modals/CreateClientsModal";
import CreateLedgerModal from "../../components/modals/CreateLedgerModal";
import CreateRateModal from "../../components/modals/CreateRateModal";
import { useNavigate } from "react-router-dom";
import { findEffectiveRateId } from "../../utils/helper";
import JournalImportModal from "../../components/journal/JournalImportModal";

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


const EPSILON = 0.001;
const JOURNAL_FAVOURITE_LEDGERS_KEY = "smartbooks_journal_favourite_ledgers";

function readFavouriteLedgers() {
  try {
    const stored = JSON.parse(localStorage.getItem(JOURNAL_FAVOURITE_LEDGERS_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter(Boolean) : [];
  } catch {
    return [];
  }
}



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
  const [showImportModal, setShowImportModal] = useState(false);
  const [ledgerSuggestions, setLedgerSuggestions] = useState([]);
  const [favoriteLedgerNames, setFavoriteLedgerNames] = useState(readFavouriteLedgers);

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
  useEffect(() => {
    searchRates("");
    searchLedgers("");
    searchClients("");

    const loadLedgerSuggestions = async () => {
      try {
        const token = useAuthStore.getState().token;
        const response = await api.get("/journal/ledger-suggestions?limit=8", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLedgerSuggestions(response.data?.data || []);
      } catch {
        setLedgerSuggestions([]);
      }
    };

    loadLedgerSuggestions();
  }, []);

  /* ── Cost center options ── */
  const costCenterOptions = useMemo(() => {
    const clientOpts = clients.map((c) => ({ value: c.clients_name, label: c.clients_name }));
    return [{ value: "Overhead", label: "Overhead" }, ...clientOpts];
  }, [clients]);

  const quickLedgers = useMemo(() => {
    const byName = new Map();
    [...ledgerSuggestions, ...ledgers].forEach((ledger) => {
      if (ledger?.ledger_name && !byName.has(ledger.ledger_name)) byName.set(ledger.ledger_name, ledger);
    });

    const favourites = favoriteLedgerNames.map((name) => byName.get(name)).filter(Boolean);
    const recent = ledgerSuggestions.filter((ledger) => !favoriteLedgerNames.includes(ledger.ledger_name));
    return [...favourites, ...recent].slice(0, 8);
  }, [ledgerSuggestions, ledgers, favoriteLedgerNames]);

  const toggleFavoriteLedger = (ledgerName) => {
    if (!ledgerName) return;
    setFavoriteLedgerNames((current) => {
      const next = current.includes(ledgerName)
        ? current.filter((name) => name !== ledgerName)
        : [ledgerName, ...current].slice(0, 12);
      localStorage.setItem(JOURNAL_FAVOURITE_LEDGERS_KEY, JSON.stringify(next));
      return next;
    });
  };

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
          const found = [...ledgers, ...ledgerSuggestions].find((l) => l.ledger_name === value);
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

  const buildPreparedItem = (source = null) => {
    const shell = createEmptyItem(
      source?.journal_description ?? journalDetails.main_journal_description,
      source?.journal_date ?? journalDetails.journal_date
    );
    const item = source
      ? { ...source, id: shell.id, journal_date: parseDateValue(source.journal_date, journalDetails.journal_date) }
      : shell;

    if (!source) {
      const found = masterRateId ? rates.find((rate) => String(rate.id) === masterRateId) : null;
      if (found) {
        const currency = item.jcurrency.toLowerCase();
        item.jrate = masterRateId;
        item.currencyRate = parseFloat(found[`${currency}_rate`]) || 0;
        item.rate_date = found.created_at;
        item.ngn_rate = found.ngn_rate;
        item.usd_rate = found.usd_rate;
        item.eur_rate = found.eur_rate;
        item.gbp_rate = found.gbp_rate;
      }
    }

    return item;
  };

  const insertItem = (itemId, position = "below") => {
    setJournalItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);
      if (index < 0) return current;
      const targetIndex = position === "above" ? index : index + 1;
      const next = [...current];
      next.splice(targetIndex, 0, buildPreparedItem());
      return next;
    });
  };

  const duplicateItem = (itemId) => {
    setJournalItems((current) => {
      const index = current.findIndex((item) => item.id === itemId);
      if (index < 0) return current;
      const next = [...current];
      next.splice(index + 1, 0, buildPreparedItem(current[index]));
      return next;
    });
  };

  const addBalancingItem = () => {
    if (Math.abs(totals.grand_total) < EPSILON) return;

    const currency = journalDetails.journal_currency || "NGN";
    const found = masterRateId ? rates.find((rate) => String(rate.id) === masterRateId) : null;
    const rate = currency === "NGN" ? 1 : parseFloat(found?.[`${currency.toLowerCase()}_rate`]) || 0;
    if (rate <= 0) {
      showToast(`A valid ${currency} rate is required before adding a balancing line.`, "error");
      return;
    }

    const item = buildPreparedItem();
    item.sides = totals.grand_total > 0 ? "Credit" : "Debit";
    item.jcurrency = currency;
    item.amount = String(Number((Math.abs(totals.grand_total) / rate).toFixed(6)));
    item.journal_description = journalDetails.main_journal_description || "Balancing entry";
    if (found) {
      item.jrate = masterRateId;
      item.currencyRate = rate;
      item.rate_date = found.created_at;
      item.ngn_rate = found.ngn_rate;
      item.usd_rate = found.usd_rate;
      item.eur_rate = found.eur_rate;
      item.gbp_rate = found.gbp_rate;
    }

    setJournalItems((current) => [...current, item]);
    showToast("Balancing line added. Select the ledger before submitting.", "success");
  };

  const handleLineKeyDown = (itemId, event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      addItem();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateItem(itemId);
    }
  };

  const handleImportApply = (importResult) => {
    const importedHeader = importResult?.header || {};
    const importedDate = parseDateValue(importedHeader.journal_date, new Date());
    const importedItems = (importResult?.items || []).map((row) => ({
      ...createEmptyItem(row.journal_description || importedHeader.main_journal_description, row.journal_date || importedDate),
      ...row,
      journal_date: parseDateValue(row.journal_date, importedDate),
      journal_date_touched: !sameDateKey(row.journal_date || importedDate, importedDate),
    }));

    setJournalDetails({
      journal_date: importedDate,
      journal_type: importedHeader.journal_type || "",
      journal_currency: importedHeader.journal_currency || "NGN",
      transaction_type: importedHeader.transaction_type || "",
      main_journal_description: importedHeader.main_journal_description || "",
      cost_center: importedHeader.cost_center || "Overhead",
    });
    setMasterRateId(importedHeader.master_rate_id || importedItems[0]?.jrate || "");
    setJournalItems(importedItems.length ? importedItems : [buildPreparedItem()]);
    setSubmitted(false);
    setShowImportModal(false);
    showToast(
      importResult?.summary?.is_balanced
        ? `${importedItems.length} journal lines imported successfully.`
        : `${importedItems.length} lines imported. Review the balance before submitting.`,
      importResult?.summary?.is_balanced ? "success" : "warning"
    );
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
        className={`invoice-form-box journal-builder theme-${theme}`}
      >
        <form className="invoice-form-f-container journal-builder__form" onSubmit={handleSubmit} noValidate>
          <JournalFormView
            mode="create"
            journalDetails={journalDetails}
            headerErrors={headerErrors}
            handleDetailChange={handleDetailChange}
            costCenterOptions={costCenterOptions}
            journalItems={journalItems}
            itemErrorMap={itemErrorMap}
            ledgers={ledgers}
            searchLedgers={searchLedgers}
            rates={rates}
            masterRateOptions={masterRateOptions}
            handleItemChange={handleItemChange}
            setOpenMenuId={setOpenMenuId}
            openMenuId={openMenuId}
            setShowCreateClientModal={setShowCreateClientModal}
            setShowCreateLedgerModal={setShowCreateLedgerModal}
            setShowCreateRateModal={setShowCreateRateModal}
            setActiveRowId={setActiveRowId}
            setMasterRateId={setMasterRateId}
            onRemoveItem={(item) => requestRemoveItem(item.id)}
            addItem={addItem}
            onDuplicateItem={duplicateItem}
            onInsertItem={insertItem}
            onAddBalancingLine={addBalancingItem}
            onOpenImport={() => setShowImportModal(true)}
            quickLedgers={quickLedgers}
            favoriteLedgerNames={favoriteLedgerNames}
            onQuickLedgerSelect={(itemId, ledgerName) => handleItemChange(itemId, "ledger_name", ledgerName)}
            onToggleFavoriteLedger={toggleFavoriteLedger}
            onLineKeyDown={handleLineKeyDown}
            totals={totals}
            isBalanced={isBalanced}
            isLoading={isLoading}
            onCancel={() => navigate("/journal/home")}
          />
        </form>
      </motion.div>

      <AnimatePresence>
        {deleteModal.open && (
          <DeleteLineItemModal
            isOpen={deleteModal.open}
            onClose={() => setDeleteModal({ open: false, itemId: null })}
            onConfirm={confirmRemoveItem}
            isNew={true}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateClientModal && (
          <CreateClientsModal
            isOpen={showCreateClientModal}
            onClose={() => setShowCreateClientModal(false)}
            onClientCreated={handleClientCreated}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateLedgerModal && (
          <CreateLedgerModal
            isOpen={showCreateLedgerModal}
            onClose={() => setShowCreateLedgerModal(false)}
            onLedgerCreated={handleLedgerCreated}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateRateModal && (
          <CreateRateModal
            isOpen={showCreateRateModal}
            onClose={() => setShowCreateRateModal(false)}
            onRateCreated={handleRateCreated}
          />
        )}
      </AnimatePresence>

      <JournalImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onApply={handleImportApply}
      />
    </>
  );
};

export default CreateJournalForm;
