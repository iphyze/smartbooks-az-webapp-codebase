import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { PDFDownloadLink } from "@react-pdf/renderer";
import "react-datepicker/dist/react-datepicker.css";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useLedgerReportStore from "../../stores/useLedgerReportStore";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import DownloadTrialBalance from "./DownloadTrialBalance";
import "./TrialBalance.css";

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
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const NEG = "#f47c7c";

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar"      },
  { value: "EUR", label: "EUR — Euro"            },
  { value: "GBP", label: "GBP — British Pound"  },
];

const ZEROBAL_OPTIONS = [
  { value: "Yes", label: "Yes — Include zero balances" },
  { value: "No",  label: "No — Active ledgers only"    },
];

// Class display order + accent colours
const CLASS_CONFIG = {
  Asset:     { label: "Assets",      icon: "fa-landmark",         color: "#2563eb" },
  Equity:    { label: "Equity",      icon: "fa-scale-balanced",   color: "#7c3aed" },
  Revenue:   { label: "Revenue",     icon: "fa-arrow-trend-up",   color: "#00b196" },
  Liability: { label: "Liabilities", icon: "fa-file-invoice",     color: "#d97706" },
  Expense:   { label: "Expenses",    icon: "fa-money-bill-wave",  color: "#f47c7c" },
};

const CLASS_ORDER = ["Asset", "Equity", "Revenue", "Liability", "Expense"];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────── */
const FilterBar = ({
  dateFrom, setDateFrom, dateTo, setDateTo,
  currency, setCurrency, zerobal, setZerobal,
  onSearch, loading, errors,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="tb-filter-bar">
      <div className="tb-filter-grid">

        <div className="tb-filter-field">
          <label className={`tb-filter-label ${errors?.dateFrom ? "tb-filter-label--err" : ""}`}>
            Date From <span className="tb-req">*</span>
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
          {errors?.dateFrom && <span className="tb-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        <div className="tb-filter-field">
          <label className={`tb-filter-label ${errors?.dateTo ? "tb-filter-label--err" : ""}`}>
            Date To <span className="tb-req">*</span>
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
          {errors?.dateTo && <span className="tb-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        <div className="tb-filter-field">
          <label className={`tb-filter-label ${errors?.currency ? "tb-filter-label--err" : ""}`}>
            Reporting Currency <span className="tb-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
              value={CURRENCY_OPTIONS.find(o => o.value === currency?.value) || currency}
              placeholder="Select currency..."
              className={`form-input-select ${errors?.currency ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("currency")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""}`} />
          </div>
          {errors?.currency && <span className="tb-filter-err"><i className="fas fa-circle-exclamation" /> {errors.currency}</span>}
        </div>

        <div className="tb-filter-field">
          <label className="tb-filter-label">Show Zero Balances?</label>
          <div className="form-wrapper">
            <Select
              options={ZEROBAL_OPTIONS}
              onChange={setZerobal}
              value={ZEROBAL_OPTIONS.find(o => o.value === zerobal?.value) || zerobal}
              placeholder="Select..."
              className="form-input-select"
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("zerobal")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "zerobal" ? "chevron-rotate" : ""}`} />
          </div>
        </div>

        <div className="tb-filter-field tb-filter-btn-cell">
          <label className="tb-filter-label">&nbsp;</label>
          <button className="tb-search-btn" onClick={onSearch} disabled={loading}>
            {loading
              ? <><div className="tb-btn-loader" /> Generating...</>
              : <><i className="fas fa-magnifying-glass" /> Generate Report</>}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   EMPTY PROMPT
───────────────────────────────────────────── */
const EmptyPrompt = () => (
  <motion.div className="tb-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="tb-empty-icon">
      <i className="fas fa-scale-balanced" />
    </div>
    <h3 className="tb-empty-title">No report generated yet</h3>
    <p className="tb-empty-sub">
      Select a date range, currency and zero balance preference above, then click <strong>Generate Report</strong>.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   GRAND TOTALS STRIP
───────────────────────────────────────────── */
const TotalsStrip = ({ totals, currency }) => {
  if (!totals) return null;

  const phases = [
    {
      key: "opening",
      label: "Opening balance",
      icon: "fa-door-open",
      debit: totals.grand_total_opening_debit,
      credit: totals.grand_total_opening_credit,
    },
    {
      key: "movement",
      label: "Period movement",
      icon: "fa-arrow-right-arrow-left",
      debit: totals.grand_total_movement_debit,
      credit: totals.grand_total_movement_credit,
    },
    {
      key: "closing",
      label: "Closing balance",
      icon: "fa-lock",
      debit: totals.grand_total_closing_debit,
      credit: totals.grand_total_closing_credit,
    },
  ];

  const difference = Number(totals.grand_closing_difference ?? totals.grand_total_balance ?? 0);
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="tb-totals-strip">
      {phases.map((phase) => (
        <div className={`tb-phase-card tb-phase-card--${phase.key}`} key={phase.key}>
          <div className="tb-phase-heading">
            <span className="tb-phase-icon"><i className={`fas ${phase.icon}`} /></span>
            <span>{phase.label}</span>
          </div>
          <div className="tb-phase-values">
            <div className="tb-phase-value">
              <span className="tb-phase-side">Dr</span>
              <strong className="tb-debit-val">{fmt(phase.debit)}</strong>
            </div>
            <div className="tb-phase-value">
              <span className="tb-phase-side">Cr</span>
              <strong className="tb-credit-val">{fmt(phase.credit)}</strong>
            </div>
          </div>
        </div>
      ))}

      <div className={`tb-balance-card ${isBalanced ? "tb-balance-card--ok" : "tb-balance-card--warn"}`}>
        <div className="tb-balance-icon">
          <i className={`fas ${isBalanced ? "fa-check" : "fa-triangle-exclamation"}`} />
        </div>
        <div>
          <span className="tb-balance-label">{isBalanced ? "Closing balance agrees" : "Closing difference"}</span>
          <strong className="tb-balance-value">{isBalanced ? "0.00" : fmt(difference)}</strong>
        </div>
        <span className="tb-total-currency-pill">{currency}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CLASS SECTION
───────────────────────────────────────────── */
const ClassSection = ({ className, group, search }) => {
  const config = CLASS_CONFIG[className] || { label: className, icon: "fa-folder", color: "#7aada6" };
  const records = group?.records || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((record) =>
      record.ledger_name?.toLowerCase().includes(q) ||
      String(record.ledger_number)?.toLowerCase().includes(q)
    );
  }, [records, search]);

  if (filtered.length === 0 && search) return null;

  const sum = (field) => filtered.reduce((total, record) => total + (Number(record[field]) || 0), 0);
  const subtotals = {
    openingDebit: sum("opening_debit"),
    openingCredit: sum("opening_credit"),
    movementDebit: sum("movement_debit"),
    movementCredit: sum("movement_credit"),
    closingDebit: sum("closing_debit"),
    closingCredit: sum("closing_credit"),
  };

  return (
    <div className="tb-class-section">
      <div className="tb-class-header" style={{ borderLeftColor: config.color }}>
        <div className="tb-class-header-left">
          <div className="tb-class-icon-wrap" style={{ background: `${config.color}15`, color: config.color }}>
            <i className={`fas ${config.icon}`} />
          </div>
          <div>
            <span className="tb-class-name">{config.label}</span>
            <span className="tb-class-count">
              {filtered.length} ledger{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="tb-class-header-right">
          <span className="tb-class-summary-title">Closing</span>
          <div className="tb-class-subtotal">
            <span className="tb-class-subtotal-label">Dr</span>
            <span className="tb-class-subtotal-val tb-debit-val">{fmt(subtotals.closingDebit)}</span>
          </div>
          <div className="tb-class-subtotal-div" />
          <div className="tb-class-subtotal">
            <span className="tb-class-subtotal-label">Cr</span>
            <span className="tb-class-subtotal-val tb-credit-val">{fmt(subtotals.closingCredit)}</span>
          </div>
        </div>
      </div>

      <div className="tb-table-wrap">
        <table className="tb-table tb-table--expanded">
          <thead>
            <tr className="tb-table-group-head">
              <th rowSpan={2}>#</th>
              <th rowSpan={2}>Ledger No.</th>
              <th rowSpan={2} className="tb-th-wide">Ledger Name</th>
              <th colSpan={2} className="tb-head-opening">Opening Balance</th>
              <th colSpan={2} className="tb-head-movement">Period Movement</th>
              <th colSpan={2} className="tb-head-closing">Closing Balance</th>
            </tr>
            <tr className="tb-table-sub-head">
              <th className="tb-th-num">Debit</th>
              <th className="tb-th-num">Credit</th>
              <th className="tb-th-num">Debit</th>
              <th className="tb-th-num">Credit</th>
              <th className="tb-th-num">Debit</th>
              <th className="tb-th-num">Credit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => {
              const isActive = [
                row.opening_debit,
                row.opening_credit,
                row.movement_debit,
                row.movement_credit,
                row.closing_debit,
                row.closing_credit,
              ].some((value) => Math.abs(Number(value) || 0) >= 0.005);

              return (
                <tr key={row.ledger_number} className={!isActive ? "tb-row-zero" : ""}>
                  <td className="tb-td-sn">{index + 1}</td>
                  <td className="tb-mono">
                    <button
                      type="button"
                      className="tb-ledger-link"
                      onClick={() => window.open(`/ledger/view/${row.ledger_number}`, "_blank", "noopener,noreferrer")}
                      aria-label={`Open ledger ${row.ledger_number}`}
                    >
                      {row.ledger_number}
                      <i className="fas fa-arrow-up-right-from-square" />
                    </button>
                  </td>
                  <td>
                    <div className="tb-name-cell">
                      <span className="tb-ledger-name">{row.ledger_name}</span>
                      {isActive && <span className="tb-active-dot" style={{ background: config.color }} />}
                    </div>
                  </td>
                  <td className="tb-td-num tb-cell-opening">{fmt(row.opening_debit)}</td>
                  <td className="tb-td-num tb-cell-opening">{fmt(row.opening_credit)}</td>
                  <td className="tb-td-num tb-cell-movement">{fmt(row.movement_debit)}</td>
                  <td className="tb-td-num tb-cell-movement">{fmt(row.movement_credit)}</td>
                  <td className="tb-td-num tb-cell-closing">{fmt(row.closing_debit)}</td>
                  <td className="tb-td-num tb-cell-closing">{fmt(row.closing_credit)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="tb-tfoot-row" style={{ "--class-color": config.color }}>
              <td colSpan={3} className="tb-tfoot-label" style={{ color: config.color }}>
                Total {config.label}
              </td>
              <td className="tb-td-num tb-tfoot-val">{fmt(subtotals.openingDebit)}</td>
              <td className="tb-td-num tb-tfoot-val">{fmt(subtotals.openingCredit)}</td>
              <td className="tb-td-num tb-tfoot-val">{fmt(subtotals.movementDebit)}</td>
              <td className="tb-td-num tb-tfoot-val">{fmt(subtotals.movementCredit)}</td>
              <td className="tb-td-num tb-tfoot-val tb-tfoot-closing">{fmt(subtotals.closingDebit)}</td>
              <td className="tb-td-num tb-tfoot-val tb-tfoot-closing">{fmt(subtotals.closingCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   RESULTS VIEW
───────────────────────────────────────────── */
const ResultsView = ({ data, totals, meta, onExcel, excelLoading }) => {
  const [search, setSearch] = useState("");

  const totalLedgers = Object.values(data || {}).reduce((s, g) => s + (g?.records?.length || 0), 0);

  const pdfDocument = useMemo(() => (
    <DownloadTrialBalance data={data} totals={totals} meta={meta} />
  ), [data, totals, meta]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">

      {/* Action bar */}
      <div className="tb-action-bar">
        <div className="tb-action-left">
          <div className="tb-results-count">
            <i className="fas fa-scale-balanced" />
            {totalLedgers} ledger{totalLedgers !== 1 ? "s" : ""}
          </div>
          <div className="tb-period-badge">
            <i className="fas fa-calendar-days" />
            {fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}
          </div>
        </div>

        <div className="tb-action-right">
          {/* Client-side filter */}
          <div className="tb-search-box">
            <i className="fas fa-magnifying-glass tb-search-icon" />
            <input
              className="tb-search-input"
              placeholder="Filter ledgers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="tb-search-clear" onClick={() => setSearch("")}>
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>

          <button className="tb-excel-btn" onClick={onExcel} disabled={excelLoading}>
            {excelLoading
              ? <><div className="tb-btn-loader tb-btn-loader--sm" /> Downloading...</>
              : <><i className="fas fa-file-excel" /> Export Excel</>}
          </button>

          <PDFDownloadLink
            document={pdfDocument}
            fileName={`Trial_Balance_${meta?.currency}_${meta?.datefrom}_to_${meta?.dateto}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button className="tb-pdf-btn" disabled={pdfLoading}>
                {pdfLoading
                  ? <><div className="tb-btn-loader tb-btn-loader--sm" /> Building PDF...</>
                  : <><i className="fas fa-file-pdf" /> Export PDF</>}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Grand totals strip */}
      <TotalsStrip totals={totals} currency={meta?.currency} />

      {/* Report paper */}
      <div className="tb-report-paper">
        <div className="tb-report-paper-header">
          <div className="tb-report-title-block">
            <h2 className="tb-report-title">Trial Balance</h2>
            <p className="tb-report-sub">
              Period: {fmtDate(meta?.datefrom)} to {fmtDate(meta?.dateto)}
              &nbsp;·&nbsp; Currency: {meta?.currency}
              &nbsp;·&nbsp; Zero balances: {meta?.zerobal === "Yes" ? "Included" : "Excluded"}
            </p>
          </div>
          <img src={CompanyLogo} alt="Company Logo" className="tb-company-logo" />
        </div>

        {/* Class sections */}
        <div className="tb-sections">
          {CLASS_ORDER.map((cls) =>
            data[cls] ? (
              <ClassSection
                key={cls}
                className={cls}
                group={data[cls]}
                search={search}
              />
            ) : null
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const TrialBalance = () => {
  const [nav,          setNav]          = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors,       setErrors]       = useState({});

  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo,   setDateTo]   = useState(null);
  const [currency, setCurrency] = useState(null);
  const [zerobal,  setZerobal]  = useState(ZEROBAL_OPTIONS[1]); // default: No

  const { theme } = useThemeStore();
  const { trialBalance, fetchTrialBalance, downloadTrialBalanceExcel } = useLedgerReportStore();

  useEffect(() => { document.title = "Smartbooks | Trial Balance"; }, []);

  const links = [
    { label: "Home",          to: "/", active: true },
    { label: "Reports & Analytics", to: "/reports/ledger", active: true },
    { label: "Trial Balance", to: "/reports/ledger/trial-balance", active: false },
  ];

  const validate = () => {
    const e = {};
    if (!dateFrom) e.dateFrom = "Required";
    if (!dateTo)   e.dateTo   = "Required";
    if (!currency) e.currency = "Required";
    return e;
  };

  const handleSearch = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const result = await fetchTrialBalance({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    if (result) setHasSearched(true);
  }, [dateFrom, dateTo, currency, zerobal, fetchTrialBalance]);

  const handleExcel = useCallback(async () => {
    if (!dateFrom || !dateTo || !currency) return;
    setExcelLoading(true);
    await downloadTrialBalanceExcel({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    setExcelLoading(false);
  }, [dateFrom, dateTo, currency, zerobal, downloadTrialBalanceExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`tb-root theme-${theme}`}>
          <div className="tb-page">
            <PageNav pageTitle="Trial Balance" links={links} />

            <FilterBar
              dateFrom={dateFrom}   setDateFrom={setDateFrom}
              dateTo={dateTo}       setDateTo={setDateTo}
              currency={currency}   setCurrency={setCurrency}
              zerobal={zerobal}     setZerobal={setZerobal}
              onSearch={handleSearch}
              loading={trialBalance.loading}
              errors={errors}
            />

            <AnimatePresence mode="wait">
              {!hasSearched ? (
                <motion.div key="prompt" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <EmptyPrompt />
                </motion.div>
              ) : (
                <motion.div key="results" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <ResultsView
                    data={trialBalance.data}
                    totals={trialBalance.totals}
                    meta={trialBalance.meta}
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

export default TrialBalance;