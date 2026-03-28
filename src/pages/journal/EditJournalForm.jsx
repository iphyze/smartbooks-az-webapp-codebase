import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import Select, { components } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useToastStore from "../../stores/useToastStore";
import useLedgerSearchStore from "../../stores/useLedgerSearchStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import useClientSearchStore from "../../stores/useClientSearchStore";
import "../inputs-styles/Inputs.css";
import DeleteLineItemModal from "../../components/modals/DeleteLineItemModal";
import { useNavigate } from "react-router-dom";

/* ─────────────────────────────────────────────
   Custom MenuList with optional "Add New" button
───────────────────────────────────────────── */
const CustomMenuList = (props) => (
  <components.MenuList {...props}>
    {props.children}
    {props.selectProps.onAddNew && (
      <div className="add-new-btn-container">
        <button
          type="button"
          className="add-new-select-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            props.selectProps.onAddNew();
          }}
        >
          {props.selectProps.addNewLabel || "+ Add New"}
        </button>
      </div>
    )}
  </components.MenuList>
);

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
let _itemCounter = 0;

function createEmptyItem(defaultDescription = "") {
  _itemCounter++;
  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    db_id: null,
    ledger_name: "",
    ledger_number: "",
    ledger_class: "",
    ledger_class_code: "",
    ledger_sub_class: "",
    ledger_type: "",
    journal_description: defaultDescription,
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
    _db_rate_date: null,
    _db_usd_rate: null,
    _db_ngn_rate: null,
    _db_eur_rate: null,
    _db_gbp_rate: null,
    _rate_resolved: true, // empty rows need no resolution
  };
}

/**
 * Seed an item from a DB row.
 */
function createItemFromDb(row) {
  _itemCounter++;
  const rawAmount = parseFloat(row.debit) > 0 ? row.debit : row.credit;

  return {
    id: `item_${Date.now()}_${_itemCounter}`,
    db_id: row.id ?? null,
    ledger_name: row.ledger_name || "",
    ledger_number: row.ledger_number || "",
    ledger_class: row.ledger_class || "",
    ledger_class_code: row.ledger_class_code || "",
    ledger_sub_class: row.ledger_sub_class || "",
    ledger_type: row.ledger_type || "",
    journal_description: row.journal_description || "",
    sides: parseFloat(row.debit) > 0 ? "Debit" : "Credit",
    jcurrency: row.journal_currency || "NGN",
    jrate: "",
    currencyRate: parseFloat(row.rate) || "",
    amount: String(parseFloat(rawAmount) || ""),
    rate_date: row.rate_date || "",
    ngn_rate: row.ngn_rate ?? "",
    usd_rate: row.usd_rate ?? "",
    eur_rate: row.eur_rate ?? "",
    gbp_rate: row.gbp_rate ?? "",
    _db_rate_date: row.rate_date || null,
    _db_usd_rate: row.usd_rate != null ? parseFloat(row.usd_rate) : null,
    _db_ngn_rate: row.ngn_rate != null ? parseFloat(row.ngn_rate) : null,
    _db_eur_rate: row.eur_rate != null ? parseFloat(row.eur_rate) : null,
    _db_gbp_rate: row.gbp_rate != null ? parseFloat(row.gbp_rate) : null,
    _rate_resolved: false,
  };
}

/**
 * Find the correct rate record from the rates store and stamp its id onto item.jrate.
 */
function resolveItemRate(item, rates) {
  if (item._rate_resolved) return item;
  if (!rates || rates.length === 0) return item;

  const dbDate = item._db_rate_date ? item._db_rate_date.slice(0, 10) : null;

  const subRatesMatch = (r) => {
    const usdOk =
      item._db_usd_rate === null ||
      Math.abs(parseFloat(r.usd_rate) - item._db_usd_rate) < 0.001;
    const ngnOk =
      item._db_ngn_rate === null ||
      Math.abs(parseFloat(r.ngn_rate) - item._db_ngn_rate) < 0.001;
    const eurOk =
      item._db_eur_rate === null ||
      Math.abs(parseFloat(r.eur_rate) - item._db_eur_rate) < 0.001;
    const gbpOk =
      item._db_gbp_rate === null ||
      Math.abs(parseFloat(r.gbp_rate) - item._db_gbp_rate) < 0.001;
    return usdOk && ngnOk && eurOk && gbpOk;
  };

  const dateMatches = (r) =>
    dbDate && r.created_at && r.created_at.slice(0, 10) === dbDate;

  // 1. Date + all sub-rates (most precise)
  let match = rates.find((r) => dateMatches(r) && subRatesMatch(r));

  // 2. Date alone
  if (!match) {
    match = rates.find((r) => dateMatches(r));
  }

  // 3. Sub-rates alone
  if (!match) {
    match = rates.find((r) => subRatesMatch(r));
  }

  if (!match) {
    return { ...item, _rate_resolved: true };
  }

  const curr = item.jcurrency.toLowerCase();
  return {
    ...item,
    jrate: String(match.id),
    currencyRate: parseFloat(match[`${curr}_rate`]) || item.currencyRate,
    rate_date: match.created_at ? match.created_at.slice(0, 10) : item.rate_date,
    ngn_rate: match.ngn_rate ?? item.ngn_rate,
    usd_rate: match.usd_rate ?? item.usd_rate,
    eur_rate: match.eur_rate ?? item.eur_rate,
    gbp_rate: match.gbp_rate ?? item.gbp_rate,
    _rate_resolved: true,
  };
}

const formatNumber = (num) =>
  Number(num || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EPSILON = 0.001;

/* ─────────────────────────────────────────────
   Static Option Arrays
───────────────────────────────────────────── */
const JOURNAL_TYPE_OPTIONS = [
  { value: "Payment", label: "Payment" },
  { value: "Receipt", label: "Receipt" },
  { value: "Expenses", label: "Expenses" },
  { value: "Sales", label: "Sales" },
  { value: "General", label: "General" },
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
   calculateTotals
───────────────────────────────────────────── */
function calculateTotals(items) {
  let totalDebit = 0;
  let totalCredit = 0;
  let totalNGNDebit = 0;
  let totalUSDAmount = 0;
  let totalUSDCount = 0;
  let totalUSDDebit = 0;
  let totalUSDCredit = 0;

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

  let totalDebitUSD = 0;
  let totalCreditUSD = 0;

  if (totalUSDCount > 0) {
    if (totalNGNDebit > 0) {
      const debitAverageRate =
        totalUSDAmount > 0 ? totalDebit / totalUSDAmount : 0;
      const creditAverageRate =
        totalUSDAmount > 0 ? totalCredit / totalUSDAmount : 0;
      totalDebitUSD =
        debitAverageRate > 0 ? totalNGNDebit / debitAverageRate : 0;
      totalCreditUSD =
        creditAverageRate > 0 ? totalNGNDebit / creditAverageRate : 0;
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
const EditJournalForm = ({ journalId, journal, onSaveSuccess }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const { ledgers, searchLedgers } = useLedgerSearchStore();
  const { rates, searchRates } = useRateSearchStore();
  const { clients, searchClients } = useClientSearchStore();

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();

  /* ── Delete-line-item modal state ── */
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    itemId: null,
    db_id: null,
    isNew: true,
    isDeleting: false,
  });

  /* ── Header State ── */
  const [journalDetails, setJournalDetails] = useState({
    journal_date: new Date(),
    journal_type: "",
    journal_currency: "NGN",
    transaction_type: "",
    main_journal_description: "",
    cost_center: "Overhead",
  });

  /* ── Row State ── */
  const [journalItems, setJournalItems] = useState([createEmptyItem()]);
  const prevJournalItemsRef = useRef(journalItems);

  /* ── On mount: load dependencies (rates/ledgers) ── */
  useEffect(() => {
    searchRates("");
    searchLedgers("");
    searchClients("");
  }, []);

  /* ── KEY FIX: Populate form when `journal` prop arrives ── */
  useEffect(() => {
    if (!journal) return;

    setJournalDetails({
      journal_date: journal.journal_date
        ? new Date(journal.journal_date)
        : new Date(),
      journal_type: journal.journal_type || "",
      journal_currency: journal.journal_currency || "NGN",
      transaction_type: journal.transaction_type || "",
      main_journal_description: journal.journal_description || "",
      cost_center: journal.cost_center || "Overhead",
    });

    if (journal.items && journal.items.length > 0) {
      const seeded = journal.items.map(createItemFromDb);
      // If rates are already loaded, resolve immediately.
      // Otherwise, the useEffect on `rates` will handle it.
      setJournalItems(
        rates && rates.length > 0
          ? seeded.map((item) => resolveItemRate(item, rates))
          : seeded
      );
    }
  }, [journal]); // Depend only on journal prop

  /* ── Resolve rates when they finish loading ── */
  useEffect(() => {
    if (!rates || rates.length === 0) return;

    setJournalItems((prev) => {
      const needsResolution = prev.some((item) => !item._rate_resolved);
      if (!needsResolution) return prev; // nothing to do

      return prev.map((item) => resolveItemRate(item, rates));
    });
  }, [rates]);

  /* ── Cost Center Options ── */
  const costCenterOptions = useMemo(() => {
    const clientOpts = clients.map((c) => ({
      value: c.clients_name,
      label: c.clients_name,
    }));
    return [{ value: "Overhead", label: "Overhead" }, ...clientOpts];
  }, [clients]);

  useEffect(() => {
    prevJournalItemsRef.current = journalItems;
  }, [journalItems]);

  /* ── Sync row descriptions when main description changes ── */
  const prevMainDesc = useRef(journalDetails.main_journal_description);
  useEffect(() => {
    const prev = prevMainDesc.current;
    const next = journalDetails.main_journal_description;
    prevMainDesc.current = next;
    setJournalItems((items) =>
      items.map((item) =>
        item.journal_description === prev
          ? { ...item, journal_description: next }
          : item
      )
    );
  }, [journalDetails.main_journal_description]);

  /* ── Totals ── */
  const totals = useMemo(() => calculateTotals(journalItems), [journalItems]);
  const isBalanced = Math.abs(totals.grand_total) < EPSILON;

  /* ── Rate options per row ── */
  const buildRateOptions = useCallback(
    (item) => {
      const curr = item.jcurrency.toLowerCase();
      return rates
        .filter((r) => r[`${curr}_rate`] != null)
        .map((r) => ({
          value: String(r.id),
          label: `${r.created_at?.slice(0, 10)} | ${item.jcurrency} @ ${
            r[`${curr}_rate`]
          }`,
        }));
    },
    [rates]
  );

  /* ─────────────────────────────────────────────
     Validation
  ───────────────────────────────────────────── */
  const validateHeader = useCallback(() => {
    const e = {};
    if (!journalDetails.journal_date) e.journal_date = "Journal date is required";
    if (!journalDetails.journal_type) e.journal_type = "Journal type is required";
    if (!journalDetails.journal_currency)
      e.journal_currency = "Currency is required";
    if (!journalDetails.transaction_type)
      e.transaction_type = "Transaction type is required";
    if (!journalDetails.main_journal_description?.trim())
      e.main_journal_description = "Description is required";
    if (!journalDetails.cost_center) e.cost_center = "Cost center is required";
    return e;
  }, [journalDetails]);

  const validateItems = useCallback(() => {
    return journalItems.map((item) => {
      const e = {};
      if (!item.ledger_name) e.ledger_name = "Ledger required";
      if (!item.journal_description?.trim())
        e.journal_description = "Description required";
      if (!item.sides) e.sides = "Dr/Cr required";
      if (!item.jcurrency) e.jcurrency = "Currency required";
      if (!item.jrate) e.jrate = "Rate required";
      if (item.amount === "" || item.amount === null)
        e.amount = "Amount required";
      else if (isNaN(parseFloat(item.amount)) || parseFloat(item.amount) <= 0)
        e.amount = "Invalid amount";
      return e;
    });
  }, [journalItems]);

  const headerErrors = useMemo(
    () => (submitted ? validateHeader() : {}),
    [submitted, validateHeader]
  );

  const itemErrorMap = useMemo(() => {
    if (!submitted) return {};
    const errs = validateItems();
    const prevItems = prevJournalItemsRef.current;
    return Object.fromEntries(
      journalItems.map((item, i) => {
        const isNew = !prevItems.some((p) => p.id === item.id);
        if (isNew) return [item.id, {}];
        return [item.id, errs[i] || {}];
      })
    );
  }, [submitted, validateItems, journalItems]);

  /* ─────────────────────────────────────────────
     Handlers
  ───────────────────────────────────────────── */
  const handleDetailChange = (field, value) => {
    setJournalDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setJournalItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

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

        if (field === "jrate") {
          const found = rates.find((r) => String(r.id) === String(value));
          if (found) {
            const curr = item.jcurrency.toLowerCase();
            updated.currencyRate = parseFloat(found[`${curr}_rate`]) || 0;
            updated.rate_date = found.created_at
              ? found.created_at.slice(0, 10)
              : "";
            updated.ngn_rate = found.ngn_rate ?? "";
            updated.usd_rate = found.usd_rate ?? "";
            updated.eur_rate = found.eur_rate ?? "";
            updated.gbp_rate = found.gbp_rate ?? "";
          } else {
            updated.currencyRate = "";
            updated.rate_date = "";
            updated.ngn_rate = "";
            updated.usd_rate = "";
            updated.eur_rate = "";
            updated.gbp_rate = "";
          }
          updated._rate_resolved = true;
        }

        if (field === "jcurrency") {
          updated.jrate = "";
          updated.currencyRate = "";
          updated.rate_date = "";
          updated.ngn_rate = "";
          updated.usd_rate = "";
          updated.eur_rate = "";
          updated.gbp_rate = "";
          updated._rate_resolved = true;
        }

        return updated;
      })
    );
  };

  const addItem = () => {
    setJournalItems((prev) => [
      ...prev,
      createEmptyItem(journalDetails.main_journal_description),
    ]);
  };

  /* ── Request remove ── */
  const requestRemoveItem = (item) => {
    if (journalItems.length === 1) return;
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
        await api.delete("/journal/delete-single-line", {
          headers: { Authorization: `Bearer ${token}` },
          data: { line_item_id: db_id },
        });
        showToast("Line item deleted successfully", "success");
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to delete line item",
          "error"
        );
        setDeleteModal({
          open: false,
          itemId: null,
          db_id: null,
          isNew: true,
          isDeleting: false,
        });
        return;
      }
    }

    setJournalItems((prev) => prev.filter((i) => i.id !== itemId));
    setDeleteModal({
      open: false,
      itemId: null,
      db_id: null,
      isNew: true,
      isDeleting: false,
    });
  };

  /* ─────────────────────────────────────────────
     Submit
  ───────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    const hErr = validateHeader();
    const iErr = validateItems();
    if (
      Object.keys(hErr).length > 0 ||
      iErr.some((rowE) => Object.keys(rowE).length > 0)
    ) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!isBalanced) {
      showToast(
        "Grand total must be equal to zero. Please ensure that your total debit equals your total credit!",
        "error"
      );
      return;
    }

    setIsLoading(true);
    const token = useAuthStore.getState().token;

    const payload = {
      journal_id: journalId,
      ...journalDetails,
      journal_date: journalDetails.journal_date.toISOString().split("T")[0],
      total_debit_ngn: totals.total_debit_ngn,
      total_credit_ngn: totals.total_credit_ngn,
      total_debit_usd: totals.total_debit_usd,
      total_credit_usd: totals.total_credit_usd,
      grand_total_ngn: totals.grand_total_ngn,
      grand_total_usd: totals.grand_total_usd,
      grand_total: totals.grand_total,
      db_id: journalItems.map((i) => i.db_id ?? 0),
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
      const response = await api.put("/journal/edit-journal", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if(response.status === 200 || response?.data?.status === "Success"){

        const journal_id = response?.data?.data?.journal_id;

        if(journal_id){

          showToast(response?.data?.message || "Journal updated successfully!", "success");
          setSubmitted(false);
          if (onSaveSuccess) onSaveSuccess();
          navigate(`/journal/view/${journal_id}`);

        }

        

      }



    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update journal",
        "error"
      );
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
        <form
          className="invoice-form-f-container"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* ── HEADER ── */}
          <div className="invoice-form-header">
            <div className="invoice-form-htxt">Edit Journal</div>
            <div className="invoice-form-sub-htxt">
              Update the details below to edit Journal #{journalId}
            </div>
          </div>

          <div className="invoice-form-flex-box">
            {/* Journal Date */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.journal_date ? "input-form-error" : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.journal_date ? "input-label-message" : ""
                    }`}
                    htmlFor="journal_date"
                  >
                    Journal Date
                  </label>
                  <div className="form-wrapper">
                    <DatePicker
                      selected={journalDetails.journal_date}
                      onChange={(date) =>
                        handleDetailChange("journal_date", date)
                      }
                      className={`form-input ${
                        headerErrors.journal_date ? "input-error" : ""
                      }`}
                      dateFormat="yyyy-MM-dd"
                      wrapperClassName="input-date-picker"
                      id="journal_date"
                    />
                    <span
                      className={`chevron-input-icon fas fa-calendar ${
                        headerErrors.journal_date ? "input-icon-error" : ""
                      }`}
                    />
                  </div>
                </div>
                {headerErrors.journal_date && (
                  <div className="input-error-message">
                    {headerErrors.journal_date}
                  </div>
                )}
              </div>
            </div>

            {/* Journal Type */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.journal_type ? "input-form-error" : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.journal_type ? "input-label-message" : ""
                    }`}
                    htmlFor="journal_type"
                  >
                    Journal Type
                  </label>
                  <div className="form-wrapper">
                    <Select
                      options={JOURNAL_TYPE_OPTIONS}
                      onChange={(opt) =>
                        handleDetailChange("journal_type", opt?.value || "")
                      }
                      value={
                        JOURNAL_TYPE_OPTIONS.find(
                          (o) => o.value === journalDetails.journal_type
                        ) || null
                      }
                      placeholder="Select type"
                      className={`form-input-select ${
                        headerErrors.journal_type ? "input-error" : ""
                      }`}
                      classNamePrefix="form-input-select"
                      isClearable
                      inputId="journal_type"
                      onMenuOpen={() => setOpenMenuId("journal_type")}
                      onMenuClose={() => setOpenMenuId(null)}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span
                      className={[
                        "chevron-input-icon fas fa-chevron-down",
                        openMenuId === "journal_type" ? "chevron-rotate" : "",
                        headerErrors.journal_type ? "input-icon-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </div>
                </div>
                {headerErrors.journal_type && (
                  <div className="input-error-message">
                    {headerErrors.journal_type}
                  </div>
                )}
              </div>
            </div>

            {/* Journal Currency */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.journal_currency ? "input-form-error" : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.journal_currency
                        ? "input-label-message"
                        : ""
                    }`}
                    htmlFor="journal_currency"
                  >
                    Journal Currency
                  </label>
                  <div className="form-wrapper">
                    <Select
                      options={CURRENCY_OPTIONS}
                      onChange={(opt) =>
                        handleDetailChange(
                          "journal_currency",
                          opt?.value || ""
                        )
                      }
                      value={
                        CURRENCY_OPTIONS.find(
                          (o) => o.value === journalDetails.journal_currency
                        ) || null
                      }
                      placeholder="Select currency"
                      className={`form-input-select ${
                        headerErrors.journal_currency ? "input-error" : ""
                      }`}
                      classNamePrefix="form-input-select"
                      inputId="journal_currency"
                      onMenuOpen={() => setOpenMenuId("journal_currency")}
                      onMenuClose={() => setOpenMenuId(null)}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span
                      className={[
                        "chevron-input-icon fas fa-chevron-down",
                        openMenuId === "journal_currency"
                          ? "chevron-rotate"
                          : "",
                        headerErrors.journal_currency ? "input-icon-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </div>
                </div>
                {headerErrors.journal_currency && (
                  <div className="input-error-message">
                    {headerErrors.journal_currency}
                  </div>
                )}
              </div>
            </div>

            {/* Journal Description */}
            <div className="invoice-form">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.main_journal_description
                      ? "input-form-error"
                      : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.main_journal_description
                        ? "input-label-message"
                        : ""
                    }`}
                    htmlFor="main_journal_description"
                  >
                    Journal Description
                  </label>
                  <div className="form-wrapper">
                    <textarea
                      className={`form-input-select form-input-textarea ${
                        headerErrors.main_journal_description
                          ? "input-error"
                          : ""
                      }`}
                      rows="2"
                      placeholder="Enter description"
                      value={journalDetails.main_journal_description}
                      onChange={(e) =>
                        handleDetailChange(
                          "main_journal_description",
                          e.target.value
                        )
                      }
                      id="main_journal_description"
                    />
                  </div>
                </div>
                {headerErrors.main_journal_description && (
                  <div className="input-error-message">
                    {headerErrors.main_journal_description}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Type */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.transaction_type ? "input-form-error" : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.transaction_type
                        ? "input-label-message"
                        : ""
                    }`}
                    htmlFor="transaction_type"
                  >
                    Transaction Type
                  </label>
                  <div className="form-wrapper">
                    <Select
                      options={TRANSACTION_TYPE_OPTIONS}
                      onChange={(opt) =>
                        handleDetailChange(
                          "transaction_type",
                          opt?.value || ""
                        )
                      }
                      value={
                        TRANSACTION_TYPE_OPTIONS.find(
                          (o) => o.value === journalDetails.transaction_type
                        ) || null
                      }
                      placeholder="Select type"
                      className={`form-input-select ${
                        headerErrors.transaction_type ? "input-error" : ""
                      }`}
                      classNamePrefix="form-input-select"
                      isClearable
                      inputId="transaction_type"
                      onMenuOpen={() => setOpenMenuId("transaction_type")}
                      onMenuClose={() => setOpenMenuId(null)}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span
                      className={[
                        "chevron-input-icon fas fa-chevron-down",
                        openMenuId === "transaction_type"
                          ? "chevron-rotate"
                          : "",
                        headerErrors.transaction_type ? "input-icon-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </div>
                </div>
                {headerErrors.transaction_type && (
                  <div className="input-error-message">
                    {headerErrors.transaction_type}
                  </div>
                )}
              </div>
            </div>

            {/* Cost Center */}
            <div className="invoice-form invoice-form-three">
              <div className="input-form-wrapper">
                <div
                  className={`input-form-group ${
                    headerErrors.cost_center ? "input-form-error" : ""
                  }`}
                >
                  <label
                    className={`input-form-label ${
                      headerErrors.cost_center ? "input-label-message" : ""
                    }`}
                    htmlFor="cost_center"
                  >
                    Cost Center
                  </label>
                  <div className="form-wrapper">
                    <Select
                      options={costCenterOptions}
                      onChange={(opt) =>
                        handleDetailChange("cost_center", opt?.value || "")
                      }
                      value={
                        costCenterOptions.find(
                          (o) => o.value === journalDetails.cost_center
                        ) || null
                      }
                      placeholder="Select cost center"
                      className={`form-input-select ${
                        headerErrors.cost_center ? "input-error" : ""
                      }`}
                      classNamePrefix="form-input-select"
                      inputId="cost_center"
                      onMenuOpen={() => setOpenMenuId("cost_center")}
                      onMenuClose={() => setOpenMenuId(null)}
                      components={{ MenuList: CustomMenuList }}
                    />
                    <span
                      className={[
                        "chevron-input-icon fas fa-chevron-down",
                        openMenuId === "cost_center" ? "chevron-rotate" : "",
                        headerErrors.cost_center ? "input-icon-error" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  </div>
                </div>
                {headerErrors.cost_center && (
                  <div className="input-error-message">
                    {headerErrors.cost_center}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── JOURNAL ITEMS TABLE ── */}
          <div className="invoice-form-full">
            <div className="invoice-items-table">
              <div className="invoice-table-header journal-table-header">
                <div className="invoice-table-cell">Ledger Name</div>
                <div className="invoice-table-cell">Description</div>
                <div className="invoice-table-cell cell-small">DR / CR</div>
                <div className="invoice-table-cell cell-small">Currency</div>
                <div className="invoice-table-cell cell-small">Rate</div>
                <div className="invoice-table-cell">Amount</div>
                <div className="invoice-table-cell cell-action">Action</div>
              </div>

              {journalItems.map((item) => {
                const rowErr = itemErrorMap[item.id] || {};
                const rateOptions = buildRateOptions(item);
                const selectedRateOpt = item.jrate
                  ? rateOptions.find((o) => o.value === String(item.jrate)) ?? null
                  : null;

                const ledgerId = `ledger_${item.id}`;
                const sideId = `side_${item.id}`;
                const currId = `curr_${item.id}`;
                const rateId = `rate_${item.id}`;

                return (
                  <div key={item.id} className="invoice-table-row">
                    {/* Ledger Name */}
                    <div className="invoice-table-cell">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.ledger_name ? "input-form-error" : ""
                          }`}
                        >
                          <label
                            className={`input-form-label ${
                              rowErr.ledger_name ? "input-label-message" : ""
                            }`}
                            htmlFor={ledgerId}
                          >
                            Ledger
                          </label>
                          <div className="form-wrapper">
                            <Select
                              options={ledgers.map((l) => ({
                                value: l.ledger_name,
                                label: l.ledger_name,
                              }))}
                              onInputChange={(val) => {
                                if (val.length > 1) searchLedgers(val);
                              }}
                              onMenuOpen={() =>
                                setOpenMenuId(`ledger_${item.id}`)
                              }
                              onMenuClose={() => {
                                setOpenMenuId(null);
                                searchLedgers("");
                              }}
                              onChange={(opt) =>
                                handleItemChange(
                                  item.id,
                                  "ledger_name",
                                  opt ? opt.value : ""
                                )
                              }
                              value={
                                item.ledger_name
                                  ? {
                                      value: item.ledger_name,
                                      label: item.ledger_name,
                                    }
                                  : null
                              }
                              placeholder="Search ledger..."
                              className={`form-input-select ${
                                rowErr.ledger_name ? "input-error" : ""
                              }`}
                              classNamePrefix="form-input-select"
                              isClearable
                              inputId={ledgerId}
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              components={{ MenuList: CustomMenuList }}
                              addNewLabel="+ Add New Ledger"
                              onAddNew={() => alert("Open Create Ledger Modal")}
                            />
                            <span
                              className={[
                                "chevron-input-icon fas fa-chevron-down",
                                openMenuId === `ledger_${item.id}`
                                  ? "chevron-rotate"
                                  : "",
                                rowErr.ledger_name ? "input-icon-error" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            />
                          </div>
                        </div>
                        {rowErr.ledger_name && (
                          <div className="input-error-message">
                            {rowErr.ledger_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="invoice-table-cell">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.journal_description ? "input-form-error" : ""
                          }`}
                        >
                          <div className="form-wrapper">
                            <input
                              type="text"
                              className={`form-input-select form-input-textarea-row ${
                                rowErr.journal_description ? "input-error" : ""
                              }`}
                              value={item.journal_description}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "journal_description",
                                  e.target.value
                                )
                              }
                              placeholder="Description"
                            />
                          </div>
                        </div>
                        {rowErr.journal_description && (
                          <div className="input-error-message">
                            {rowErr.journal_description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DR / CR */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.sides ? "input-form-error" : ""
                          }`}
                        >
                          <label
                            className={`input-form-label ${
                              rowErr.sides ? "input-label-message" : ""
                            }`}
                            htmlFor={sideId}
                          >
                            Side
                          </label>
                          <div className="form-wrapper">
                            <Select
                              options={SIDE_OPTIONS}
                              onChange={(opt) =>
                                handleItemChange(
                                  item.id,
                                  "sides",
                                  opt ? opt.value : ""
                                )
                              }
                              value={
                                SIDE_OPTIONS.find(
                                  (o) => o.value === item.sides
                                ) || null
                              }
                              placeholder="Select"
                              className={`form-input-select ${
                                rowErr.sides ? "input-error" : ""
                              }`}
                              classNamePrefix="form-input-select"
                              inputId={sideId}
                              onMenuOpen={() =>
                                setOpenMenuId(`sides_${item.id}`)
                              }
                              onMenuClose={() => setOpenMenuId(null)}
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              components={{ MenuList: CustomMenuList }}
                            />
                            <span
                              className={[
                                "chevron-input-icon fas fa-chevron-down",
                                openMenuId === `sides_${item.id}`
                                  ? "chevron-rotate"
                                  : "",
                                rowErr.sides ? "input-icon-error" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            />
                          </div>
                        </div>
                        {rowErr.sides && (
                          <div className="input-error-message">
                            {rowErr.sides}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.jcurrency ? "input-form-error" : ""
                          }`}
                        >
                          <label
                            className={`input-form-label ${
                              rowErr.jcurrency ? "input-label-message" : ""
                            }`}
                            htmlFor={currId}
                          >
                            Currency
                          </label>
                          <div className="form-wrapper">
                            <Select
                              options={CURRENCY_OPTIONS}
                              onChange={(opt) =>
                                handleItemChange(
                                  item.id,
                                  "jcurrency",
                                  opt ? opt.value : "NGN"
                                )
                              }
                              value={
                                CURRENCY_OPTIONS.find(
                                  (o) => o.value === item.jcurrency
                                ) || null
                              }
                              className={`form-input-select ${
                                rowErr.jcurrency ? "input-error" : ""
                              }`}
                              classNamePrefix="form-input-select"
                              inputId={currId}
                              onMenuOpen={() =>
                                setOpenMenuId(`currency_${item.id}`)
                              }
                              onMenuClose={() => setOpenMenuId(null)}
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              components={{ MenuList: CustomMenuList }}
                            />
                            <span
                              className={[
                                "chevron-input-icon fas fa-chevron-down",
                                openMenuId === `currency_${item.id}`
                                  ? "chevron-rotate"
                                  : "",
                                rowErr.jcurrency ? "input-icon-error" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            />
                          </div>
                        </div>
                        {rowErr.jcurrency && (
                          <div className="input-error-message">
                            {rowErr.jcurrency}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="invoice-table-cell">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.jrate ? "input-form-error" : ""
                          }`}
                        >
                          <label
                            className={`input-form-label ${
                              rowErr.jrate ? "input-label-message" : ""
                            }`}
                            htmlFor={rateId}
                          >
                            Rate
                          </label>
                          <div className="form-wrapper">
                            <Select
                              options={rateOptions}
                              onChange={(opt) =>
                                handleItemChange(
                                  item.id,
                                  "jrate",
                                  opt ? opt.value : ""
                                )
                              }
                              value={selectedRateOpt}
                              placeholder={
                                !item._rate_resolved
                                  ? "Loading..."
                                  : "Select rate"
                              }
                              className={`form-input-select ${
                                rowErr.jrate ? "input-error" : ""
                              }`}
                              classNamePrefix="form-input-select"
                              isClearable
                              inputId={rateId}
                              onMenuOpen={() =>
                                setOpenMenuId(`rate_${item.id}`)
                              }
                              onMenuClose={() => setOpenMenuId(null)}
                              noOptionsMessage={() =>
                                rates.length === 0
                                  ? "Loading rates..."
                                  : `No rates for ${item.jcurrency}`
                              }
                              components={{ MenuList: CustomMenuList }}
                              menuPortalTarget={document.body}
                              styles={{
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              addNewLabel="+ Add New Rate"
                              onAddNew={() => alert("Open Create Rate Modal")}
                            />
                            <span
                              className={[
                                "chevron-input-icon fas fa-chevron-down",
                                openMenuId === `rate_${item.id}`
                                  ? "chevron-rotate"
                                  : "",
                                rowErr.jrate ? "input-icon-error" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            />
                          </div>
                        </div>
                        {rowErr.jrate && (
                          <div className="input-error-message">
                            {rowErr.jrate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="invoice-table-cell cell-small">
                      <div className="input-form-wrapper" style={{ margin: 0 }}>
                        <div
                          className={`input-form-group ${
                            rowErr.amount ? "input-form-error" : ""
                          }`}
                        >
                          <div className="form-wrapper">
                            <input
                              type="number"
                              className={`form-input form-input-number ${
                                rowErr.amount ? "input-error" : ""
                              }`}
                              value={item.amount}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "amount",
                                  e.target.value
                                )
                              }
                              onWheel={(e) => e.target.blur()}
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        {rowErr.amount && (
                          <div className="input-error-message">
                            {rowErr.amount}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remove Row */}
                    <div className="invoice-table-cell cell-action">
                      <button
                        type="button"
                        onClick={() => requestRemoveItem(item)}
                        className="invoice-remove-btn"
                        disabled={journalItems.length === 1}
                        title="Remove row"
                      >
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
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Debit</div>
                  <div className="invoice-total-value">
                    {formatNumber(totals.total_debit_ngn)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Credit</div>
                  <div className="invoice-total-value">
                    {formatNumber(totals.total_credit_ngn)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label inv-bold">Balance</div>
                  <div className="invoice-total-value inv-bold">
                    {formatNumber(totals.grand_total_ngn)}
                  </div>
                </div>
              </div>

              <div className="journal-summary-col">
                <div className="invoice-total-row-header">FCY</div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Debit</div>
                  <div className="invoice-total-value">
                    {formatNumber(totals.total_debit_usd)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Credit</div>
                  <div className="invoice-total-value">
                    {formatNumber(totals.total_credit_usd)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label inv-bold">Balance</div>
                  <div className="invoice-total-value inv-bold">
                    {formatNumber(totals.grand_total_usd)}
                  </div>
                </div>
              </div>

              <div className="journal-summary-col jsc-summary">
                <div
                  className={`invoice-total-row invoice-grand-total ${
                    !isBalanced ? "error-total" : "balanced-total"
                  }`}
                >
                  <div className="invoice-total-label invoice-diff-text">
                    Difference
                    {!isBalanced && (
                      <span
                        style={{
                          fontSize: "10px",
                          marginLeft: "5px",
                          color: "#f8d9d9",
                        }}
                      >
                        (must be 0.00)
                      </span>
                    )}
                  </div>
                  <div className="invoice-total-value invoice-diff-text">
                    {formatNumber(totals.grand_total)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SUBMIT ── */}
          <div className="invoice-action-btn">
            <div className="invoice-action-btn-wrapper">
              <button
                type="submit"
                disabled={isLoading}
                className="invoice-submit-btn"
              >
                {isLoading ? (
                  <div className="invoice-loader" />
                ) : (
                  <span className="invoice-submit-btn-text">Update Journal</span>
                )}
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
            onClose={() =>
              setDeleteModal({
                open: false,
                itemId: null,
                db_id: null,
                isNew: true,
                isDeleting: false,
              })
            }
            onConfirm={confirmRemoveItem}
            isNew={deleteModal.isNew}
            isDeleting={deleteModal.isDeleting}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default EditJournalForm;