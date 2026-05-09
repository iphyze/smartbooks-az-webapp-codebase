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
import DownloadBalanceSheet from "./DownloadBalanceSheet";
import "./BalanceSheet.css";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────
   CATEGORY TABLE  (reusable across all sections)
───────────────────────────────────────────── */
const CategoryTable = ({ title, group, isLess = false }) => {
  if (!group || !group.records || group.records.length === 0) return null;

  return (
    <div className="bs-cat-block">
      <div className={`bs-cat-title ${isLess ? "bs-cat-title--less" : ""}`}>{title}</div>
      <table className="bs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Ledger No.</th>
            <th className="bs-th-wide">Ledger Name</th>
            <th className="bs-th-num">Balance</th>
          </tr>
        </thead>
        <tbody>
          {group.records.map((row, i) => {
            const isNeg = Number(row.section_value || 0) < 0;
            return (
              <tr key={row.ledger_number || i}>
                <td className="bs-td-sn">{i + 1}</td>
                <td>
                  <button
                    className="bs-ledger-link"
                    onClick={() => window.open(`/ledger/view/${row.ledger_number}`, "_blank")}
                  >
                    {row.ledger_number}
                  </button>
                </td>
                <td className="bs-ledger-name">{row.ledger_name}</td>
                <td className={`bs-td-num bs-bal-cell ${isNeg ? "bs-neg" : ""}`}>
                  {fmt(row.section_value)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bs-tfoot-row">
            <td colSpan={3} className="bs-tfoot-label">Total {title}</td>
            <td className={`bs-td-num bs-tfoot-val ${Number(group.total) < 0 ? "bs-neg" : ""}`}>
              {fmt(group.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SUMMARY ROW  (Total Assets / Equity / etc.)
───────────────────────────────────────────── */
const SummaryRow = ({ label, value, isGrand = false }) => (
  <div className={`bs-summary-row ${isGrand ? "bs-summary-row--grand" : ""}`}>
    <span className="bs-summary-label">{label}</span>
    <span className={`bs-summary-val ${Number(value) < 0 ? "bs-neg" : ""}`}>{fmt(value)}</span>
  </div>
);

/* ─────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────── */
const FilterBar = ({ dateFrom, setDateFrom, dateTo, setDateTo, currency, setCurrency, zerobal, setZerobal, onSearch, loading, errors }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  return (
    <div className="bs-filter-bar">
      <div className="bs-filter-grid">

        <div className="bs-filter-field">
          <label className={`bs-filter-label ${errors?.dateFrom ? "bs-filter-label--err" : ""}`}>Date From <span className="bs-req">*</span></label>
          <div className="form-wrapper">
            <DatePicker selected={dateFrom} onChange={setDateFrom} className={`form-input ${errors?.dateFrom ? "input-error" : ""}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" placeholderText="Start date" showMonthDropdown showYearDropdown dropdownMode="select" />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateFrom ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateFrom && <span className="bs-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        <div className="bs-filter-field">
          <label className={`bs-filter-label ${errors?.dateTo ? "bs-filter-label--err" : ""}`}>Date To <span className="bs-req">*</span></label>
          <div className="form-wrapper">
            <DatePicker selected={dateTo} onChange={setDateTo} className={`form-input ${errors?.dateTo ? "input-error" : ""}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" placeholderText="End date" showMonthDropdown showYearDropdown dropdownMode="select" minDate={dateFrom} />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateTo ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateTo && <span className="bs-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        <div className="bs-filter-field">
          <label className={`bs-filter-label ${errors?.currency ? "bs-filter-label--err" : ""}`}>Reporting Currency <span className="bs-req">*</span></label>
          <div className="form-wrapper">
            <Select options={CURRENCY_OPTIONS} onChange={setCurrency} value={CURRENCY_OPTIONS.find(o => o.value === currency?.value) || currency} placeholder="Select currency..." className={`form-input-select ${errors?.currency ? "input-error" : ""}`} classNamePrefix="form-input-select" onMenuOpen={() => setOpenMenuId("currency")} onMenuClose={() => setOpenMenuId(null)} />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""}`} />
          </div>
          {errors?.currency && <span className="bs-filter-err"><i className="fas fa-circle-exclamation" /> {errors.currency}</span>}
        </div>

        <div className="bs-filter-field">
          <label className="bs-filter-label">Show Zero Balances?</label>
          <div className="form-wrapper">
            <Select options={ZEROBAL_OPTIONS} onChange={setZerobal} value={ZEROBAL_OPTIONS.find(o => o.value === zerobal?.value) || zerobal} placeholder="Select..." className="form-input-select" classNamePrefix="form-input-select" onMenuOpen={() => setOpenMenuId("zerobal")} onMenuClose={() => setOpenMenuId(null)} />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "zerobal" ? "chevron-rotate" : ""}`} />
          </div>
        </div>

        <div className="bs-filter-field bs-filter-btn-cell">
          <label className="bs-filter-label">&nbsp;</label>
          <button className="bs-search-btn" onClick={onSearch} disabled={loading}>
            {loading ? <><div className="bs-btn-loader" /> Generating...</> : <><i className="fas fa-magnifying-glass" /> Generate Report</>}
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
  <motion.div className="bs-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="bs-empty-icon"><i className="fas fa-building-columns" /></div>
    <h3 className="bs-empty-title">No report generated yet</h3>
    <p className="bs-empty-sub">Select a date range, currency and zero balance preference, then click <strong>Generate Report</strong>.</p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   BALANCE CHECK STRIP
───────────────────────────────────────────── */
const BalanceStrip = ({ summary }) => {
  if (!summary) return null;
  const diff = Math.abs((summary.total_assets || 0) - (summary.total_equity_liabilities || 0));
  const isBalanced = diff < 0.01;
  return (
    <div className={`bs-balance-strip ${isBalanced ? "" : "bs-balance-strip--off"}`}>
      <div className="bs-balance-strip-left">
        <i className={`fas ${isBalanced ? "fa-check-circle" : "fa-triangle-exclamation"} bs-balance-icon`} />
        <div>
          <span className="bs-balance-label">{isBalanced ? "Balance Sheet Balanced" : "Balance Sheet Unbalanced"}</span>
          <span className="bs-balance-sub">Total Assets = Total Equity & Liabilities</span>
        </div>
      </div>
      <div className="bs-balance-strip-right">
        <span className="bs-balance-assets">Assets: {fmt(summary.total_assets)}</span>
        <span className="bs-balance-eq">Equity & Liabilities: {fmt(summary.total_equity_liabilities)}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   RESULTS VIEW
───────────────────────────────────────────── */
const ResultsView = ({ data, summary, meta, onExcel, excelLoading }) => {
  const pdfDocument = useMemo(() => (
    <DownloadBalanceSheet data={data} summary={summary} meta={meta} />
  ), [data, summary, meta]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">

      {/* Action bar */}
      <div className="bs-action-bar">
        <div className="bs-action-left">
          <div className="bs-results-badge"><i className="fas fa-building-columns" /> Balance Sheet</div>
          <div className="bs-period-badge"><i className="fas fa-calendar-days" />{fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}</div>
          {meta?.period && <div className="bs-period-badge"><i className="fas fa-clock" />FY {meta.period}</div>}
        </div>
        <div className="bs-action-right">
          <button className="bs-excel-btn" onClick={onExcel} disabled={excelLoading}>
            {excelLoading ? <><div className="bs-btn-loader bs-btn-loader--sm" /> Downloading...</> : <><i className="fas fa-file-excel" /> Export Excel</>}
          </button>
          <PDFDownloadLink document={pdfDocument} fileName={`Balance_Sheet_${meta?.currency}_${meta?.datefrom}_to_${meta?.dateto}.pdf`}>
            {({ loading: pdfLoading }) => (
              <button className="bs-pdf-btn" disabled={pdfLoading}>
                {pdfLoading ? <><div className="bs-btn-loader bs-btn-loader--sm" /> Building PDF...</> : <><i className="fas fa-file-pdf" /> Export PDF</>}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Balance check */}
      <BalanceStrip summary={summary} />

      {/* Report paper */}
      <div className="bs-report-paper">
        <div className="bs-report-paper-header">
          <div className="bs-report-title-block">
            <h2 className="bs-report-title">Balance Sheet</h2>
            <p className="bs-report-sub">
              Period: {fmtDate(meta?.datefrom)} to {fmtDate(meta?.dateto)} &nbsp;·&nbsp;
              FY {meta?.period} &nbsp;·&nbsp; Currency: {meta?.currency} &nbsp;·&nbsp;
              Zero balances: {meta?.zerobal === "Yes" ? "Included" : "Excluded"}
            </p>
          </div>
          <img src={CompanyLogo} alt="Logo" className="bs-company-logo" />
        </div>

        <div className="bs-body">

          {/* ── ASSETS ── */}
          <div className="bs-section-heading bs-section-heading--assets">
            <i className="fas fa-landmark" /> Assets
          </div>

          <div className="bs-subsection-heading">Non-Current Assets</div>
          <CategoryTable title="Intangible Assets"                    group={data.IntangibleAssets} />
          <CategoryTable title="Tangible Assets"                      group={data.TangibleAssets} />
          <CategoryTable title="Less: Depreciation & Amortization"    group={data.DepreciationAsset} isLess />
          <CategoryTable title="Capital Work in Progress (CWIP)"      group={data.CWIP} />
          <SummaryRow label="Total Non-Current Assets" value={summary?.total_non_current_assets} />

          <div className="bs-subsection-heading bs-subsection-heading--mt">Current Assets</div>
          <CategoryTable title="Service Customers"                    group={data.ServiceCustomers} />
          <CategoryTable title="Less: Allowance for Doubtful Debts"   group={data.AllowanceDoubtfulDebts} isLess />
          <SummaryRow    label="Service Customers (Net)"              value={summary?.net_service_customers} />
          <CategoryTable title="Strategic Partners"                   group={data.StrategicPartners} />
          <CategoryTable title="Agents"                               group={data.Agents} />
          <div className="bs-treasury-heading">Treasury Accounts</div>
          <CategoryTable title="Short Term Investments"               group={data.ShortTermInvestments} />
          <CategoryTable title="Bank Accounts"                        group={data.BankAccounts} />
          <CategoryTable title="Petty Cash"                           group={data.PettyCash} />
          <CategoryTable title="Offshore Bank Accounts"               group={data.OffshoreBankAccounts} />
          <SummaryRow label="Total Current Assets"                    value={summary?.total_current_assets} />

          <SummaryRow label="Total Assets" value={summary?.total_assets} isGrand />

          <div className="bs-section-divider" />

          {/* ── EQUITY ── */}
          <div className="bs-section-heading bs-section-heading--equity">
            <i className="fas fa-scale-balanced" /> Equity
          </div>
          <CategoryTable title="Capital"           group={data.Capital} />
          <CategoryTable title="Retained Earnings" group={data.RetainedEarnings} />
          {/* Current Year Earnings injected from P&L */}
          <div className="bs-current-earnings">
            <span className="bs-current-earnings-label">Current Year Earnings</span>
            <span className={`bs-current-earnings-val ${Number(summary?.current_year_earnings) < 0 ? "bs-neg" : ""}`}>
              {fmt(summary?.current_year_earnings)}
            </span>
          </div>
          <SummaryRow label="Total Equity" value={summary?.total_equity} isGrand />

          <div className="bs-section-divider" />

          {/* ── LIABILITIES ── */}
          <div className="bs-section-heading bs-section-heading--liabilities">
            <i className="fas fa-file-invoice" /> Liabilities
          </div>

          <div className="bs-subsection-heading">Non-Current Liabilities</div>
          <CategoryTable title="Deferred Tax Payable"    group={data.DeferredTaxPayable} />
          <CategoryTable title="Loans and Similar Debts" group={data.LoansAndSimilarDebts} />
          <SummaryRow label="Total Non-Current Liabilities" value={summary?.total_non_current_liability} />

          <div className="bs-subsection-heading bs-subsection-heading--mt">Current Liabilities</div>
          <CategoryTable title="Suppliers / Creditors"        group={data.SuppliersCreditors} />
          <CategoryTable title="Payroll and Similar Accounts" group={data.PayrollSimilarAccounts} />
          <CategoryTable title="Outsourcing Agents"           group={data.OutsourcingAgents} />
          <CategoryTable title="Govt Agencies Payable / Receivable" group={data.GovernmentTax} />
          <SummaryRow label="Total Current Liabilities"       value={summary?.total_current_liabilities} />

          <SummaryRow label="Total Liabilities"               value={summary?.total_liabilities} isGrand />

          <div className="bs-section-divider" />

          <SummaryRow label="Total Equity & Liabilities"      value={summary?.total_equity_liabilities} isGrand />

        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const BalanceSheet = () => {
  const [nav,          setNav]          = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [dateFrom,     setDateFrom]     = useState(null);
  const [dateTo,       setDateTo]       = useState(null);
  const [currency,     setCurrency]     = useState(null);
  const [zerobal,      setZerobal]      = useState(ZEROBAL_OPTIONS[1]);

  const { theme } = useThemeStore();
  const { balanceSheet, fetchBalanceSheet, downloadBalanceSheetExcel } = useLedgerReportStore();

  useEffect(() => { document.title = "Smartbooks | Balance Sheet"; }, []);

  const links = [
    { label: "Home",          to: "/", active: true },
    { label: "Reports",       to: "/reports/ledger", active: true },
    { label: "Balance Sheet", to: "/reports/ledger/balance-sheet", active: false },
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
    const result = await fetchBalanceSheet({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    if (result) setHasSearched(true);
  }, [dateFrom, dateTo, currency, zerobal, fetchBalanceSheet]);

  const handleExcel = useCallback(async () => {
    if (!dateFrom || !dateTo || !currency) return;
    setExcelLoading(true);
    await downloadBalanceSheetExcel({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
      zerobal:  zerobal?.value || "No",
    });
    setExcelLoading(false);
  }, [dateFrom, dateTo, currency, zerobal, downloadBalanceSheetExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`bs-root theme-${theme}`}>
          <div className="bs-page">
            <PageNav pageTitle="Balance Sheet" links={links} />
            <FilterBar
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo}     setDateTo={setDateTo}
              currency={currency} setCurrency={setCurrency}
              zerobal={zerobal}   setZerobal={setZerobal}
              onSearch={handleSearch}
              loading={balanceSheet.loading}
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
                    data={balanceSheet.data}
                    summary={balanceSheet.summary}
                    meta={balanceSheet.meta}
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

export default BalanceSheet;