import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useLedgerReportStore from "../../stores/useLedgerReportStore";
import useLedgerSearchStore from "../../stores/useLedgerSearchStore";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import "./LedgerStatement.css";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadLedgerStatement from "./DownloadLedgerStatement";


/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

const toLocalISO = (d) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const FUNCTIONAL_OPTIONS = [
  { value: "Yes", label: "Yes — Functional Currency (NGN)" },
  { value: "No", label: "No — Transaction Currency" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────
   INDEPENDENT LEDGER SEARCH HOOK
   Each instance maintains its own search state
   so From and To don't share results.
───────────────────────────────────────────── */
const useLedgerSearch = () => {
  const { ledgers: storeLedgers, searchLedgers } = useLedgerSearchStore();
  const [localLedgers, setLocalLedgers] = useState([]);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load initial list once
  useEffect(() => {
    if (!initialLoaded) {
      searchLedgers("").then ? null : null;
      setInitialLoaded(true);
    }
  }, []);

  // Sync from store when no local search is active
  useEffect(() => {
    setLocalLedgers(storeLedgers || []);
  }, [storeLedgers]);

  const search = useCallback((val) => {
    searchLedgers(val);
  }, [searchLedgers]);

  return { ledgers: localLedgers, search };
};

/* ─────────────────────────────────────────────
   FILTER BAR  (always visible at top)
───────────────────────────────────────────── */
const FilterBar = ({
  fromLedger, setFromLedger,
  toLedger, setToLedger,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  functionalCurrency, setFunctionalCurrency,
  onSearch, loading, hasResults, errors,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Independent search instances for From and To
  const { ledgers: fromLedgers, search: searchFrom } = useLedgerSearch();
  const { ledgers: toLedgers, search: searchTo } = useLedgerSearch();

  // Pre-load both on mount
  useEffect(() => {
    searchFrom("");
    searchTo("");
  }, []);

  const fromOptions = fromLedgers.map((l) => ({
    value: l.ledger_number,
    label: `${l.ledger_number} — ${l.ledger_name}`,
    name: l.ledger_name,
  }));

  const toOptions = toLedgers.map((l) => ({
    value: l.ledger_number,
    label: `${l.ledger_number} — ${l.ledger_name}`,
    name: l.ledger_name,
  }));

  const funcOpt = FUNCTIONAL_OPTIONS.find((o) => o.value === functionalCurrency?.value) || functionalCurrency || null;

  return (
    <div className="ls-filter-bar">
      {/* Row 1: From Ledger Number | To Ledger Number | Date From */}
      <div className="ls-filter-grid">

        {/* From Ledger Number */}
        <div className="ls-filter-field">
          <label className={`ls-filter-label ${errors?.fromLedger ? "ls-filter-label--err" : ""}`}>
            From Ledger Number <span className="ls-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={fromOptions}
              onInputChange={(v) => searchFrom(v.length > 1 ? v : "")}
              onChange={(opt) => setFromLedger(opt || null)}
              value={fromLedger}
              placeholder="Search ledger..."
              className={`form-input-select ${errors?.fromLedger ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              isClearable
              menuPortalTarget={document.body}
              styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              onMenuOpen={() => setOpenMenuId("from")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "from" ? "chevron-rotate" : ""} ${errors?.fromLedger ? "input-icon-error" : ""}`} />
          </div>
          {errors?.fromLedger && <span className="ls-filter-err"><i className="fas fa-circle-exclamation" /> {errors.fromLedger}</span>}
        </div>

        {/* From Ledger Name — read only */}
        <div className="ls-filter-field">
          <label className="ls-filter-label">From Ledger Name</label>
          <div className="form-wrapper">
            <input
              className="form-input ls-readonly-input"
              value={fromLedger?.name || ""}
              readOnly
              placeholder="Auto-filled"
            />
            <span className="input-icon fas fa-lock" />
          </div>
        </div>

        {/* Date From */}
        <div className="ls-filter-field">
          <label className={`ls-filter-label ${errors?.dateFrom ? "ls-filter-label--err" : ""}`}>
            Date From <span className="ls-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker
              selected={dateFrom}
              onChange={setDateFrom}
              className={`form-input ${errors?.dateFrom ? "input-error" : ""}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="Start date"
              showMonthDropdown showYearDropdown dropdownMode="select"
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateFrom ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateFrom && <span className="ls-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        {/* To Ledger Number */}
        <div className="ls-filter-field">
          <label className={`ls-filter-label ${errors?.toLedger ? "ls-filter-label--err" : ""}`}>
            To Ledger Number <span className="ls-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={toOptions}
              onInputChange={(v) => searchTo(v.length > 1 ? v : "")}
              onChange={(opt) => setToLedger(opt || null)}
              value={toLedger}
              placeholder="Search ledger..."
              className={`form-input-select ${errors?.toLedger ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              isClearable
              menuPortalTarget={document.body}
              styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }}
              onMenuOpen={() => setOpenMenuId("to")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "to" ? "chevron-rotate" : ""} ${errors?.toLedger ? "input-icon-error" : ""}`} />
          </div>
          {errors?.toLedger && <span className="ls-filter-err"><i className="fas fa-circle-exclamation" /> {errors.toLedger}</span>}
        </div>

        {/* To Ledger Name — read only */}
        <div className="ls-filter-field">
          <label className="ls-filter-label">To Ledger Name</label>
          <div className="form-wrapper">
            <input
              className="form-input ls-readonly-input"
              value={toLedger?.name || ""}
              readOnly
              placeholder="Auto-filled"
            />
            <span className="input-icon fas fa-lock" />
          </div>
        </div>

        {/* Date To */}
        <div className="ls-filter-field">
          <label className={`ls-filter-label ${errors?.dateTo ? "ls-filter-label--err" : ""}`}>
            Date To <span className="ls-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker
              selected={dateTo}
              onChange={setDateTo}
              className={`form-input ${errors?.dateTo ? "input-error" : ""}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="End date"
              showMonthDropdown showYearDropdown dropdownMode="select"
              minDate={dateFrom}
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateTo ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateTo && <span className="ls-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        {/* Functional Currency */}
        <div className="ls-filter-field">
          <label className={`ls-filter-label ${errors?.functionalCurrency ? "ls-filter-label--err" : ""}`}>
            Functional Currency <span className="ls-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={FUNCTIONAL_OPTIONS}
              onChange={setFunctionalCurrency}
              value={funcOpt}
              placeholder="Select..."
              className={`form-input-select ${errors?.functionalCurrency ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("func")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "func" ? "chevron-rotate" : ""} ${errors?.functionalCurrency ? "input-icon-error" : ""}`} />
          </div>
          {errors?.functionalCurrency && <span className="ls-filter-err"><i className="fas fa-circle-exclamation" /> {errors.functionalCurrency}</span>}
        </div>

        {/* Search button — spans remaining cols to fill row */}
        <div className="ls-filter-field ls-filter-search-cell">
          <label className="ls-filter-label">&nbsp;</label>
          <button className="ls-search-btn" onClick={onSearch} disabled={loading}>
            {loading
              ? <><div className="ls-btn-loader" /> Searching...</>
              : <><i className="fas fa-magnifying-glass" /> Search Ledger</>}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   REPORT META CARD
───────────────────────────────────────────── */
const ReportMeta = ({ meta, title }) => (
  <div className="ls-meta-card">
    <div className="ls-meta-title">{title}</div>
    <div className="ls-meta-grid">
      <div className="ls-meta-section">
        <div className="ls-meta-section-label">
          <i className="fas fa-calendar-range" /> Transaction Period
        </div>
        <div className="ls-meta-row">
          <span className="ls-meta-key">From</span>
          <span className="ls-meta-val">{fmtDate(meta?.datefrom)}</span>
        </div>
        <div className="ls-meta-row">
          <span className="ls-meta-key">To</span>
          <span className="ls-meta-val">{fmtDate(meta?.dateto)}</span>
        </div>
      </div>
      <div className="ls-meta-section">
        <div className="ls-meta-section-label">
          <i className="fas fa-book-bookmark" /> Transaction Ledger(s)
        </div>
        <div className="ls-meta-row">
          <span className="ls-meta-key">From</span>
          <span className="ls-meta-val">{meta?.fromledger}</span>
        </div>
        <div className="ls-meta-row">
          <span className="ls-meta-key">To</span>
          <span className="ls-meta-val">{meta?.toledger}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   SINGLE LEDGER BLOCK
───────────────────────────────────────────── */
const LedgerBlock = ({ ledger, index }) => {
  const navigate = useNavigate();
  const { summary, transactions, ledger_number, ledger_name, ledger_currency } = ledger;

  return (
    <motion.div
      className="ls-ledger-block"
      variants={fadeUp}
      initial="hidden"
      animate="show"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Header strip */}
      <div className="ls-ledger-header">
        <div className="ls-ledger-info-group">
          <div className="ls-ledger-info-item">
            <span className="ls-ledger-info-label">Ledger Number</span>
            <span className="ls-ledger-info-val ls-mono">{ledger_number}</span>
          </div>
          <div className="ls-ledger-info-item">
            <span className="ls-ledger-info-label">Ledger Name</span>
            <span className="ls-ledger-info-val">{ledger_name}</span>
          </div>
          <div className="ls-ledger-info-item">
            <span className="ls-ledger-info-label">Currency</span>
            <span className="ls-ledger-info-val">
              <span className="ls-currency-pill">{ledger_currency}</span>
            </span>
          </div>
          <div className="ls-ledger-info-item">
            <span className="ls-ledger-info-label">Previous Balance</span>
            <span className={`ls-ledger-info-val ls-mono ${Number(summary.previous_balance) < 0 ? "ls-neg" : "ls-pos"}`}>
              {fmt(summary.previous_balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Ref</th>
              <th className="ls-th-wide">Description</th>
              <th className="ls-th-num">Debit</th>
              <th className="ls-th-num">Credit</th>
              <th className="ls-th-num">Balance</th>
            </tr>
          </thead>
          <tbody>

            {/* ── Always-first row: Opening Balance ── */}
            <tr className="ls-opening-row">
              <td className="ls-mono ls-date-cell ls-opening-cell" colSpan={3}>
                <span className="ls-opening-tag">
                  <i className="fas fa-flag" /> Opening Balance
                </span>
              </td>
              <td className="ls-desc-cell ls-opening-cell">
                Balance brought forward from previous period
              </td>
              <td className="ls-num-cell ls-opening-cell">—</td>
              <td className="ls-num-cell ls-opening-cell">—</td>
              <td className={`ls-num-cell ls-bal-cell ls-opening-cell ${Number(summary.previous_balance) < 0 ? "ls-neg" : "ls-pos"}`}>
                {fmt(summary.previous_balance)}
              </td>
            </tr>

            {/* ── Transactions or empty notice ── */}
            {!transactions || transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="ls-empty-row">
                  <div className="ls-empty-inner">
                    <i className="fas fa-calendar-xmark" />
                    <span>No transactions recorded for this period</span>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t, i) => (
                <tr key={i}>
                  <td className="ls-mono ls-date-cell">{t.date}</td>
                  <td>
                    <span className={`ls-type-badge ls-type-${(t.type || "").toLowerCase()}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="ls-ref-link"
                      onClick={() => window.open(`/ledger/view/${t.ref}`, '_blank')}
                    >
                      {t.ref}
                    </button>
                  </td>
                  <td className="ls-desc-cell">{t.description}</td>
                  <td className={`ls-num-cell ${Number(t.debit) < 0 ? "ls-neg" : ""}`}>
                    {Number(t.debit) !== 0 ? fmt(t.debit) : "—"}
                  </td>
                  <td className={`ls-num-cell ${Number(t.credit) < 0 ? "ls-neg" : ""}`}>
                    {Number(t.credit) !== 0 ? fmt(t.credit) : "—"}
                  </td>
                  <td className={`ls-num-cell ls-bal-cell ${Number(t.balance) < 0 ? "ls-neg" : ""}`}>
                    {fmt(t.balance)}
                  </td>
                </tr>
              ))
            )}

          </tbody>
        </table>
      </div>

      {/* Totals footer — Total Period | Closing Balance */}
      <div className="ls-totals-row">
        <div className="ls-totals-inner">

          {/* Total Period (Dr / Cr / Net movement during the period) */}
          <div className="ls-total-item ls-total-period">
            <span className="ls-total-label">Total Period</span>
            <div className="ls-total-vals">
              <span className="ls-total-sub">Dr: {fmt(summary.period_total_debit)}</span>
              <span className="ls-total-divider">|</span>
              <span className="ls-total-sub">Cr: {fmt(summary.period_total_credit)}</span>
              <span className="ls-total-divider">|</span>
              <span className={`ls-total-net ${Number(summary.period_net_movement) < 0 ? "ls-neg" : ""}`}>
                Net: {fmt(summary.period_net_movement)}
              </span>
            </div>
          </div>

          {/* Connector arrow */}
          <div className="ls-totals-arrow">
            <i className="fas fa-arrow-right" />
          </div>

          {/* Closing Balance (= opening + net movement) */}
          <div className={`ls-total-item ls-total-closing ${Number(summary.closing_balance) < 0 ? "ls-total-closing--neg" : ""}`}>
            <span className="ls-total-label">Closing Balance</span>
            <span className="ls-total-closing-val">{fmt(summary.closing_balance)}</span>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   EMPTY PROMPT (before first search)
───────────────────────────────────────────── */
const EmptyPrompt = () => (
  <motion.div
    className="ls-empty-prompt"
    variants={fadeUp}
    initial="hidden"
    animate="show"
  >
    <div className="ls-empty-prompt-icon">
      <i className="fas fa-magnifying-glass-chart" />
    </div>
    <h3 className="ls-empty-prompt-title">No results yet</h3>
    <p className="ls-empty-prompt-sub">
      Select your ledger range, date period and currency above, then click <strong>Search Ledger</strong> to generate the statement.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   RESULTS SECTION
───────────────────────────────────────────── */
const ResultsSection = ({ data, title, meta, onExcel, excelLoading }) => {

  // ADD this memoized doc inside the component, before the return
  const pdfDocument = useMemo(() => (
    <DownloadLedgerStatement data={data} title={title} meta={meta} />
  ), [data, title, meta]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      {/* Count + Excel */}
      <div className="ls-results-topbar">
        <div className="ls-results-count">
          <i className="fas fa-layer-group" />
          {data.length} ledger{data.length !== 1 ? "s" : ""}
        </div>
        <button className="ls-excel-btn" onClick={onExcel} disabled={excelLoading}>
          {excelLoading
            ? <><div className="ls-btn-loader ls-btn-loader--sm" /> Downloading...</>
            : <><i className="fas fa-file-excel" /> Export Excel</>}
        </button>

        <PDFDownloadLink
          document={pdfDocument}
          fileName={`Ledger_Statement_${meta?.datefrom}_to_${meta?.dateto}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <button className="ls-pdf-btn" disabled={pdfLoading}>
              {pdfLoading
                ? <><div className="ls-btn-loader ls-btn-loader--sm" /> Building PDF...</>
                : <><i className="fas fa-file-pdf" /> Export PDF</>}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Report paper */}
      <div className="ls-report-paper">
        <img src={CompanyLogo} alt="Company Logo" className="ls-company-logo" />
        <ReportMeta meta={meta} title={title} />

        {data.length === 0 ? (
          <div className="ls-page-empty">
            <i className="fas fa-folder-open" />
            <p>No entries found for the selected period and ledger range.</p>
          </div>
        ) : (
          <div className="ls-ledger-list">
            {data.map((ledger, i) => (
              <LedgerBlock
                key={`${ledger.ledger_number}-${ledger.ledger_currency}-${i}`}
                ledger={ledger}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )

};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const LedgerStatement = () => {
  const [nav, setNav] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Filter state — lives here so FilterBar is always in sync
  const [fromLedger, setFromLedger] = useState(null);
  const [toLedger, setToLedger] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [functionalCurrency, setFunctionalCurrency] = useState(null);

  const { theme } = useThemeStore();
  const { ledgerStatement, fetchLedgerStatement, downloadLedgerStatementExcel } = useLedgerReportStore();

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Reports & Analytics", to: "/reports/ledger", active: true },
    { label: "Ledger Statement", to: "/reports/ledger/ledger-statement", active: false },
  ];

  const validate = () => {
    const e = {};
    if (!fromLedger) e.fromLedger = "Required";
    if (!toLedger) e.toLedger = "Required";
    if (!dateFrom) e.dateFrom = "Required";
    if (!dateTo) e.dateTo = "Required";
    if (!functionalCurrency) e.functionalCurrency = "Required";
    return e;
  };

  const handleSearch = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const params = {
      fromledger: fromLedger.value,
      fromledgerName: fromLedger.name,
      toledger: toLedger.value,
      toledgerName: toLedger.name,
      datefrom: toLocalISO(dateFrom),
      dateto: toLocalISO(dateTo),
      functionalCurrency: functionalCurrency.value,
    };

    const result = await fetchLedgerStatement(params);
    if (result) setHasSearched(true);
  }, [fromLedger, toLedger, dateFrom, dateTo, functionalCurrency, fetchLedgerStatement]);

  const handleExcel = useCallback(async () => {
    if (!fromLedger || !toLedger || !dateFrom || !dateTo || !functionalCurrency) return;
    setExcelLoading(true);
    await downloadLedgerStatementExcel({
      fromledger: fromLedger.value,
      toledger: toLedger.value,
      datefrom: toLocalISO(dateFrom),
      dateto: toLocalISO(dateTo),
      functionalCurrency: functionalCurrency.value,
    });
    setExcelLoading(false);
  }, [fromLedger, toLedger, dateFrom, dateTo, functionalCurrency, downloadLedgerStatementExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`ls-root theme-${theme}`}>
          <div className="ls-page">
            <PageNav pageTitle="Ledger Statement" links={links} />

            {/* Always-visible filter bar */}
            <FilterBar
              fromLedger={fromLedger} setFromLedger={setFromLedger}
              toLedger={toLedger} setToLedger={setToLedger}
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo} setDateTo={setDateTo}
              functionalCurrency={functionalCurrency}
              setFunctionalCurrency={setFunctionalCurrency}
              onSearch={handleSearch}
              loading={ledgerStatement.loading}
              hasResults={hasSearched}
              errors={errors}
            />

            {/* Results area */}
            <AnimatePresence mode="wait">
              {!hasSearched ? (
                <motion.div key="prompt" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <EmptyPrompt />
                </motion.div>
              ) : (
                <motion.div key="results" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <ResultsSection
                    data={ledgerStatement.data}
                    title={ledgerStatement.title}
                    meta={ledgerStatement.meta}
                    onExcel={handleExcel}
                    excelLoading={excelLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerStatement;