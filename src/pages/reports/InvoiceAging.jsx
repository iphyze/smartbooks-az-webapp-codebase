import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadInvoiceAging from "./DownloadInvoiceAging";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useInvoiceAgingReportStore from "../../stores/useInvoiceAgingReportStore";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import "./InvoiceAging.css";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (n) => {
  const num = Number(n || 0);
  if (num === 0) return "—";
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

// fmt but always shows 0.00 (for totals row)
const fmtTotal = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `(${abs})` : abs;
};

const pct = (n) => `${Number(n || 0).toFixed(2)}%`;
const count = (n) => Number(n || 0).toLocaleString("en-US");

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar"      },
  { value: "EUR", label: "EUR — Euro"            },
  { value: "GBP", label: "GBP — British Pound"  },
];

/* ─────────────────────────────────────────────
   FILTER BAR
───────────────────────────────────────────── */
const FilterBar = ({ currency, setCurrency, onSearch, loading, errors }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  return (
    <div className="ia-filter-bar">
      <div className="ia-filter-grid">

        <div className="ia-filter-field">
          <label className={`ia-filter-label ${errors?.currency ? "ia-filter-label--err" : ""}`}>
            Currency <span className="ia-req">*</span>
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
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""} ${errors?.currency ? "input-icon-error" : ""}`} />
          </div>
          {errors?.currency && (
            <span className="ia-filter-err">
              <i className="fas fa-circle-exclamation" /> {errors.currency}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div />

        <div className="ia-filter-field ia-filter-btn-cell">
          <label className="ia-filter-label">&nbsp;</label>
          <button className="ia-search-btn" onClick={onSearch} disabled={loading}>
            {loading
              ? <><div className="ia-btn-loader" /> Generating...</>
              : <><i className="fas fa-clock-rotate-left" /> Generate Report</>}
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
  <motion.div className="ia-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="ia-empty-icon"><i className="fas fa-clock-rotate-left" /></div>
    <h3 className="ia-empty-title">No report generated yet</h3>
    <p className="ia-empty-sub">
      Select a currency and click <strong>Generate Report</strong> to view outstanding
      invoice balances grouped by aging period.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   EXECUTIVE KPI STRIP
───────────────────────────────────────────── */
const ExecutiveKpis = ({ totals }) => {
  if (!totals) return null;

  return (
    <div className="ia-kpi-grid">
      <div className="ia-kpi-card ia-kpi-card--primary">
        <span className="ia-kpi-label">Total Receivables</span>
        <strong className="ia-kpi-value">{fmtTotal(totals.grand_total_outstanding)}</strong>
        <span className="ia-kpi-note">Open customer balances</span>
      </div>
      <div className="ia-kpi-card">
        <span className="ia-kpi-label">Clients Owing</span>
        <strong className="ia-kpi-value">{count(totals.client_count)}</strong>
        <span className="ia-kpi-note">Grouped receivables</span>
      </div>
      <div className="ia-kpi-card">
        <span className="ia-kpi-label">Open Invoices</span>
        <strong className="ia-kpi-value">{count(totals.invoice_count)}</strong>
        <span className="ia-kpi-note">Pending + partial + overdue</span>
      </div>
      <div className="ia-kpi-card ia-kpi-card--risk">
        <span className="ia-kpi-label">Overdue Exposure</span>
        <strong className="ia-kpi-value">{pct(totals.overdue_exposure_percent)}</strong>
        <span className="ia-kpi-note">31+ days outstanding</span>
      </div>
      <div className="ia-kpi-card ia-kpi-card--danger">
        <span className="ia-kpi-label">High Risk</span>
        <strong className="ia-kpi-value">{pct(totals.high_risk_exposure_percent)}</strong>
        <span className="ia-kpi-note">91+ days outstanding</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SUMMARY STRIP
───────────────────────────────────────────── */
const SummaryStrip = ({ totals }) => {
  if (!totals) return null;
  return (
    <div className="ia-summary-strip">
      <div className="ia-summary-cell">
        <span className="ia-summary-cell-label">0 – 30 Days</span>
        <span className="ia-summary-cell-value">{fmtTotal(totals.total_bucket_0_30)}</span>
        <span className="ia-summary-cell-pill ia-pill--fresh">
          <i className="fas fa-circle-check" style={{ fontSize: 9 }} /> Current
        </span>
      </div>
      <div className="ia-summary-cell">
        <span className="ia-summary-cell-label">31 – 60 Days</span>
        <span className="ia-summary-cell-value">{fmtTotal(totals.total_bucket_31_60)}</span>
        <span className="ia-summary-cell-pill ia-pill--watch">
          <i className="fas fa-eye" style={{ fontSize: 9 }} /> Watch
        </span>
      </div>
      <div className="ia-summary-cell">
        <span className="ia-summary-cell-label">61 – 90 Days</span>
        <span className="ia-summary-cell-value">{fmtTotal(totals.total_bucket_61_90)}</span>
        <span className="ia-summary-cell-pill ia-pill--concern">
          <i className="fas fa-triangle-exclamation" style={{ fontSize: 9 }} /> Concern
        </span>
      </div>
      <div className="ia-summary-cell">
        <span className="ia-summary-cell-label">91+ Days</span>
        <span className="ia-summary-cell-value" style={{ color: Number(totals.total_bucket_91_plus) > 0 ? "#f47c7c" : undefined }}>
          {fmtTotal(totals.total_bucket_91_plus)}
        </span>
        <span className="ia-summary-cell-pill ia-pill--overdue">
          <i className="fas fa-circle-exclamation" style={{ fontSize: 9 }} /> Overdue
        </span>
      </div>
      <div className="ia-summary-cell ia-summary-cell--total">
        <span className="ia-summary-cell-label">Total Outstanding</span>
        <span className="ia-summary-cell-value">{fmtTotal(totals.grand_total_outstanding)}</span>
        <span className="ia-summary-cell-pill ia-pill--total">
          <i className="fas fa-sigma" style={{ fontSize: 9 }} /> All Pending
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   RESULTS VIEW
───────────────────────────────────────────── */
const ResultsView = ({ data, totals, meta, onExcel, excelLoading }) => {
  const pdfDocument = useMemo(() => (
    <DownloadInvoiceAging data={data} totals={totals} meta={meta || {}} />
  ), [data, totals, meta]);

  return (
  <motion.div variants={fadeUp} initial="hidden" animate="show">

    {/* Action bar */}
    <div className="ia-action-bar">
      <div className="ia-action-left">
        <div className="ia-results-badge">
          <i className="fas fa-clock-rotate-left" /> Invoice Aging
        </div>
        <div className="ia-currency-badge">
          <i className="fas fa-coins" /> {meta?.currency}
        </div>
        <div className="ia-currency-badge">
          <i className="fas fa-file-invoice-dollar" /> {data.length} client{data.length !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="ia-action-right">
        <button className="ia-excel-btn" onClick={onExcel} disabled={excelLoading}>
          {excelLoading
            ? <><div className="ia-btn-loader ia-btn-loader--sm" /> Downloading...</>
            : <><i className="fas fa-file-excel" /> Export Excel</>}
        </button>
        <PDFDownloadLink
          document={pdfDocument}
          fileName={`Invoice_Aging_Report_${meta?.currency}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <button className="ia-pdf-btn" disabled={pdfLoading}>
              {pdfLoading
                ? <><div className="ia-btn-loader ia-btn-loader--sm" /> Building PDF...</>
                : <><i className="fas fa-file-pdf" /> Export PDF</>}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>

    {/* Executive KPIs */}
    <ExecutiveKpis totals={totals} />

    {/* Summary strip */}
    <SummaryStrip totals={totals} />

    {/* Report paper */}
    <div className="ia-report-paper">
      <div className="ia-report-paper-header">
        <div className="ia-report-title-block">
          <h2 className="ia-report-title">Invoice Aging Report</h2>
          <p className="ia-report-sub">
            Open receivables grouped by days outstanding &nbsp;·&nbsp;
            Currency: {meta?.currency} &nbsp;·&nbsp;
            As at {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
        <img src={CompanyLogo} alt="Logo" className="ia-company-logo" />
      </div>

      <div className="ia-table-wrap">
        <table className="ia-table">
          <thead>
            <tr>
              <th className="ia-td-sn">#</th>
              <th className="ia-th-wide">Client Name</th>
              <th className="ia-th-num ia-th-fresh">0 – 30 Days</th>
              <th className="ia-th-num ia-th-watch">31 – 60 Days</th>
              <th className="ia-th-num ia-th-concern">61 – 90 Days</th>
              <th className="ia-th-num ia-th-overdue">91+ Days</th>
              <th className="ia-th-num">Total Outstanding</th>
              <th className="ia-th-num">Invoices</th>
              <th className="ia-th-num">Oldest Age</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "var(--sb-text-3, #7aada6)", fontStyle: "italic" }}>
                  No pending invoices found for {meta?.currency}.
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const b0   = Number(row.bucket_0_30)       || 0;
                const b31  = Number(row.bucket_31_60)      || 0;
                const b61  = Number(row.bucket_61_90)      || 0;
                const b91  = Number(row.bucket_91_plus)    || 0;
                const tot  = Number(row.total_outstanding) || 0;

                return (
                  <tr key={row.clients_id || i}>
                    <td className="ia-td-sn">{i + 1}</td>
                    <td className="ia-client-name">{row.clients_name}</td>
                    <td className={`ia-td-num ${b0 === 0 ? "ia-zero" : ""}`}>{fmt(b0)}</td>
                    <td className={`ia-td-num ${b31 === 0 ? "ia-zero" : "ia-td-watch"}`}>{fmt(b31)}</td>
                    <td className={`ia-td-num ${b61 === 0 ? "ia-zero" : "ia-td-concern"}`}>{fmt(b61)}</td>
                    <td className={`ia-td-num ${b91 === 0 ? "ia-zero" : "ia-td-overdue"}`}>{fmt(b91)}</td>
                    <td className="ia-td-num ia-td-total">{fmtTotal(tot)}</td>
                    <td className="ia-td-num">{count(row.invoice_count)}</td>
                    <td className={`ia-td-num ${Number(row.oldest_age_days) > 90 ? "ia-td-overdue" : ""}`}>{count(row.oldest_age_days)} days</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {data.length > 0 && totals && (
            <tfoot>
              <tr className="ia-tfoot-row">
                <td />
                <td className="ia-tfoot-label">Grand Total</td>
                <td className="ia-tfoot-val">{fmtTotal(totals.total_bucket_0_30)}</td>
                <td className="ia-tfoot-val ia-td-watch">{fmtTotal(totals.total_bucket_31_60)}</td>
                <td className="ia-tfoot-val ia-td-concern">{fmtTotal(totals.total_bucket_61_90)}</td>
                <td className={`ia-tfoot-val ${Number(totals.total_bucket_91_plus) > 0 ? "ia-tfoot-val--overdue" : ""}`}>
                  {fmtTotal(totals.total_bucket_91_plus)}
                </td>
                <td className="ia-tfoot-val">{fmtTotal(totals.grand_total_outstanding)}</td>
                <td className="ia-tfoot-val">{count(totals.invoice_count)}</td>
                <td className="ia-tfoot-val">—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const InvoiceAging = () => {
  const [nav,          setNav]          = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [currency,     setCurrency]     = useState(null);

  const { theme } = useThemeStore();
  const { agingReport, fetchAgingReport, downloadAgingExcel } = useInvoiceAgingReportStore();

  useEffect(() => { document.title = "Smartbooks | Invoice Aging Report"; }, []);

  const links = [
    { label: "Home",            to: "/",                    active: true  },
    { label: "Reports & Analytics", to: "/reports/ledger",      active: true  },
    { label: "Invoice Aging",   to: "/reports/invoice-aging", active: false },
  ];

  const validate = () => {
    const e = {};
    if (!currency) e.currency = "Required";
    return e;
  };

  const handleSearch = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const result = await fetchAgingReport({ currency: currency.value });
    if (result) setHasSearched(true);
  }, [currency, fetchAgingReport]);

  const handleExcel = useCallback(async () => {
    if (!currency) return;
    setExcelLoading(true);
    await downloadAgingExcel({ currency: currency.value });
    setExcelLoading(false);
  }, [currency, downloadAgingExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`ia-root theme-${theme}`}>
          <div className="ia-page">
            <PageNav pageTitle="Invoice Aging Report" links={links} />

            <FilterBar
              currency={currency}
              setCurrency={setCurrency}
              onSearch={handleSearch}
              loading={agingReport.loading}
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
                    data={agingReport.data}
                    totals={agingReport.totals}
                    meta={agingReport.meta}
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

export default InvoiceAging;