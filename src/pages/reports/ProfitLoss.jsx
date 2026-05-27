import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import DownloadProfitLoss from "./DownloadProfitLoss";
import "./ProfitLoss.css";

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

// Category display config — order matters for rendering
const CATEGORIES = [
  { key: "Revenue",        label: "Revenue",                        icon: "fa-arrow-trend-up",  color: "#00b196" },
  { key: "CostOfServices", label: "Cost of Services",               icon: "fa-screwdriver-wrench", color: "#2563eb" },
  { key: "Administrative", label: "Administrative Expenses",        icon: "fa-building",         color: "#7c3aed" },
  { key: "Selling",        label: "Selling Expenses",               icon: "fa-tags",             color: "#d97706" },
  { key: "OtherIncome",    label: "Other Income",                   icon: "fa-plus-circle",      color: "#0891b2" },
  { key: "Depreciation",   label: "Depreciation & Amortization",    icon: "fa-chart-line-down",  color: "#6b7280" },
  { key: "FinanceCost",    label: "Finance Cost",                   icon: "fa-percent",          color: "#dc2626" },
  { key: "Taxation",       label: "Income & Other Taxes",           icon: "fa-receipt",          color: "#9333ea" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────
   MILESTONE ROW  (EBITDA / Op Profit / PBT / PAT)
───────────────────────────────────────────── */
const MilestoneRow = ({ label, value, isPAT }) => {
  const isNeg = Number(value || 0) < 0;
  return (
    <div className={`pl-milestone ${isPAT ? "pl-milestone--pat" : ""} ${isNeg ? "pl-milestone--neg" : ""}`}>
      <span className="pl-milestone-label">{label}</span>
      <span className={`pl-milestone-val ${isNeg ? "pl-neg-val" : ""}`}>{fmt(value)}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CATEGORY SECTION
───────────────────────────────────────────── */
const CategorySection = ({ config, group, currency }) => {
  const navigate = useNavigate();
  const records = group?.records || [];
  const total   = group?.total   || 0;

  return (
    <div className="pl-cat-section">
      {/* Category header */}
      <div className="pl-cat-header" style={{ borderLeftColor: config.color }}>
        <div className="pl-cat-header-left">
          <div className="pl-cat-icon" style={{ background: `${config.color}15`, color: config.color }}>
            <i className={`fas ${config.icon}`} />
          </div>
          <div>
            <span className="pl-cat-name">{config.label}</span>
            <span className="pl-cat-count">{records.length} ledger{records.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className={`pl-cat-total ${Number(total) < 0 ? "pl-neg-val" : ""}`}>
          {fmt(total)}
          <span className="pl-cat-currency">{currency}</span>
        </div>
      </div>

      {/* Records table */}
      {records.length > 0 && (
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ledger No.</th>
                <th className="pl-th-wide">Ledger Name</th>
                <th className="pl-th-num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => {
                const isNeg = Number(row.balance || 0) < 0;
                return (
                  <tr key={row.ledger_number || i}>
                    <td className="pl-td-sn">{i + 1}</td>
                    <td>
                      <button
                        className="pl-ledger-link"
                        onClick={() => window.open(`/ledger/view/${row.ledger_number}`, '_blank')}
                        title={`View ledger ${row.ledger_number}`}
                      >
                        {row.ledger_number}
                      </button>
                    </td>
                    <td className="pl-ledger-name">{row.ledger_name}</td>
                    <td className={`pl-td-num pl-bal-cell ${isNeg ? "pl-neg-val" : ""}`}>
                      {fmt(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="pl-tfoot-row" style={{ "--cat-color": config.color }}>
                <td colSpan={3} className="pl-tfoot-label" style={{ color: config.color }}>
                  Total {config.label}
                </td>
                <td className={`pl-td-num pl-tfoot-val ${Number(total) < 0 ? "pl-neg-val" : ""}`}>
                  {fmt(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
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
    <div className="pl-filter-bar">
      <div className="pl-filter-grid">

        <div className="pl-filter-field">
          <label className={`pl-filter-label ${errors?.dateFrom ? "pl-filter-label--err" : ""}`}>
            Date From <span className="pl-req">*</span>
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
          {errors?.dateFrom && <span className="pl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        <div className="pl-filter-field">
          <label className={`pl-filter-label ${errors?.dateTo ? "pl-filter-label--err" : ""}`}>
            Date To <span className="pl-req">*</span>
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
          {errors?.dateTo && <span className="pl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        <div className="pl-filter-field">
          <label className={`pl-filter-label ${errors?.currency ? "pl-filter-label--err" : ""}`}>
            Reporting Currency <span className="pl-req">*</span>
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
          {errors?.currency && <span className="pl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.currency}</span>}
        </div>

        <div className="pl-filter-field">
          <label className="pl-filter-label">Show Zero Balances?</label>
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

        <div className="pl-filter-field pl-filter-btn-cell">
          <label className="pl-filter-label">&nbsp;</label>
          <button className="pl-search-btn" onClick={onSearch} disabled={loading}>
            {loading
              ? <><div className="pl-btn-loader" /> Generating...</>
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
  <motion.div className="pl-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="pl-empty-icon">
      <i className="fas fa-chart-line" />
    </div>
    <h3 className="pl-empty-title">No report generated yet</h3>
    <p className="pl-empty-sub">
      Select a date range, currency and zero balance preference above, then click <strong>Generate Report</strong>.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   PAT SUMMARY STRIP
───────────────────────────────────────────── */
const PATStrip = ({ summary, currency }) => {
  if (!summary) return null;
  const pat = Number(summary.profit_after_tax || 0);
  const isNeg = pat < 0;
  return (
    <div className={`pl-pat-strip ${isNeg ? "pl-pat-strip--neg" : ""}`}>
      <div className="pl-pat-strip-left">
        <i className={`fas ${isNeg ? "fa-arrow-trend-down" : "fa-arrow-trend-up"} pl-pat-icon`} />
        <div>
          <span className="pl-pat-label">Profit After Tax</span>
          <span className="pl-pat-period">{currency}</span>
        </div>
      </div>
      <span className={`pl-pat-value ${isNeg ? "pl-neg-val" : ""}`}>{fmt(pat)}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   RESULTS VIEW
───────────────────────────────────────────── */
const ResultsView = ({ data, summary, meta, onExcel, excelLoading }) => {

  const pdfDocument = useMemo(() => (
    <DownloadProfitLoss data={data} summary={summary} meta={meta} />
  ), [data, summary, meta]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">

      {/* Action bar */}
      <div className="pl-action-bar">
        <div className="pl-action-left">
          <div className="pl-results-badge">
            <i className="fas fa-chart-line" />
            Profit & Loss
          </div>
          <div className="pl-period-badge">
            <i className="fas fa-calendar-days" />
            {fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}
          </div>
        </div>
        <div className="pl-action-right">
          <button className="pl-excel-btn" onClick={onExcel} disabled={excelLoading}>
            {excelLoading
              ? <><div className="pl-btn-loader pl-btn-loader--sm" /> Downloading...</>
              : <><i className="fas fa-file-excel" /> Export Excel</>}
          </button>
          <PDFDownloadLink
            document={pdfDocument}
            fileName={`Profit_Loss_${meta?.currency}_${meta?.datefrom}_to_${meta?.dateto}.pdf`}
          >
            {({ loading: pdfLoading }) => (
              <button className="pl-pdf-btn" disabled={pdfLoading}>
                {pdfLoading
                  ? <><div className="pl-btn-loader pl-btn-loader--sm" /> Building PDF...</>
                  : <><i className="fas fa-file-pdf" /> Export PDF</>}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* PAT headline strip */}
      <PATStrip summary={summary} currency={meta?.currency} />

      {/* Report paper */}
      <div className="pl-report-paper">
        <div className="pl-report-paper-header">
          <div className="pl-report-title-block">
            <h2 className="pl-report-title">Profit & Loss</h2>
            <p className="pl-report-sub">
              Period: {fmtDate(meta?.datefrom)} to {fmtDate(meta?.dateto)}
              &nbsp;·&nbsp; Currency: {meta?.currency}
              &nbsp;·&nbsp; Zero balances: {meta?.zerobal === "Yes" ? "Included" : "Excluded"}
            </p>
          </div>
          <img src={CompanyLogo} alt="Company Logo" className="pl-company-logo" />
        </div>

        <div className="pl-sections">
          {CATEGORIES.map((config, idx) => {
            const group = data[config.key];
            return (
              <React.Fragment key={config.key}>
                <CategorySection
                  config={config}
                  group={group}
                  currency={meta?.currency}
                />

                {/* Milestone rows inserted after specific categories */}
                {config.key === "OtherIncome" && (
                  <MilestoneRow label="EBITDA" value={summary?.ebitda} />
                )}
                {config.key === "Depreciation" && (
                  <MilestoneRow label="Operating Profit" value={summary?.operating_profit} />
                )}
                {config.key === "FinanceCost" && (
                  <MilestoneRow label="Profit Before Tax" value={summary?.profit_before_tax} />
                )}
                {config.key === "Taxation" && (
                  <MilestoneRow label="Profit After Tax (PAT)" value={summary?.profit_after_tax} isPAT />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const ProfitLoss = () => {
  const [nav,          setNav]          = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors,       setErrors]       = useState({});

  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo,   setDateTo]   = useState(null);
  const [currency, setCurrency] = useState(null);
  const [zerobal,  setZerobal]  = useState(ZEROBAL_OPTIONS[1]);

  const { theme } = useThemeStore();
  const { profitLoss, fetchProfitLoss, downloadProfitLossExcel } = useLedgerReportStore();

  useEffect(() => { document.title = "Smartbooks | Profit & Loss"; }, []);

  const links = [
    { label: "Home",       to: "/",active: true },
    { label: "Reports & Analytics", to: "/reports/ledger", active: true },
    { label: "Profit & Loss", to: "/reports/ledger/profit-and-loss", active: false },
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

    const result = await fetchProfitLoss({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    if (result) setHasSearched(true);
  }, [dateFrom, dateTo, currency, zerobal, fetchProfitLoss]);

  const handleExcel = useCallback(async () => {
    if (!dateFrom || !dateTo || !currency) return;
    setExcelLoading(true);
    await downloadProfitLossExcel({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    setExcelLoading(false);
  }, [dateFrom, dateTo, currency, zerobal, downloadProfitLossExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`pl-root theme-${theme}`}>
          <div className="pl-page">
            <PageNav pageTitle="Profit & Loss" links={links} />

            <FilterBar
              dateFrom={dateFrom}   setDateFrom={setDateFrom}
              dateTo={dateTo}       setDateTo={setDateTo}
              currency={currency}   setCurrency={setCurrency}
              zerobal={zerobal}     setZerobal={setZerobal}
              onSearch={handleSearch}
              loading={profitLoss.loading}
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
                    data={profitLoss.data}
                    summary={profitLoss.summary}
                    meta={profitLoss.meta}
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

export default ProfitLoss;