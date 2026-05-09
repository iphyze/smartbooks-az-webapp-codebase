import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useLedgerReportStore from "../../stores/useLedgerReportStore";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import "./GeneralLedger.css";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadGeneralLedger from "./DownloadGeneralLedger";
import { fmt, fmtDate, toLocalISO } from "../../utils/helper";


const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira"    },
  { value: "USD", label: "USD — US Dollar"          },
  { value: "EUR", label: "EUR — Euro"               },
  { value: "GBP", label: "GBP — British Pound"      },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─────────────────────────────────────────────
   FILTER BAR — always visible
───────────────────────────────────────────── */
const FilterBar = ({
  dateFrom, setDateFrom,
  dateTo,   setDateTo,
  currency, setCurrency,
  onSearch, loading, errors,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const currOpt = CURRENCY_OPTIONS.find((o) => o.value === currency?.value) || currency || null;

  return (
    <div className="gl-filter-bar">
      <div className="gl-filter-grid">

        {/* Date From */}
        <div className="gl-filter-field">
          <label className={`gl-filter-label ${errors?.dateFrom ? "gl-filter-label--err" : ""}`}>
            Date From <span className="gl-req">*</span>
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
          {errors?.dateFrom && <span className="gl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        {/* Date To */}
        <div className="gl-filter-field">
          <label className={`gl-filter-label ${errors?.dateTo ? "gl-filter-label--err" : ""}`}>
            Date To <span className="gl-req">*</span>
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
          {errors?.dateTo && <span className="gl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        {/* Currency */}
        <div className="gl-filter-field">
          <label className={`gl-filter-label ${errors?.currency ? "gl-filter-label--err" : ""}`}>
            Reporting Currency <span className="gl-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
              value={currOpt}
              placeholder="Select currency..."
              className={`form-input-select ${errors?.currency ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("currency")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""} ${errors?.currency ? "input-icon-error" : ""}`} />
          </div>
          {errors?.currency && <span className="gl-filter-err"><i className="fas fa-circle-exclamation" /> {errors.currency}</span>}
        </div>

        {/* Search button */}
        <div className="gl-filter-field gl-filter-btn-cell">
          <label className="gl-filter-label">&nbsp;</label>
          <button className="gl-search-btn" onClick={onSearch} disabled={loading}>
            {loading
              ? <><div className="gl-btn-loader" /> Generating...</>
              : <><i className="fas fa-magnifying-glass" /> Generate Report</>}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   EMPTY PROMPT (before first search)
───────────────────────────────────────────── */
const EmptyPrompt = () => (
  <motion.div className="gl-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="gl-empty-icon">
      <i className="fas fa-table-list" />
    </div>
    <h3 className="gl-empty-title">No report generated yet</h3>
    <p className="gl-empty-sub">
      Select a date range and reporting currency above, then click <strong>Generate Report</strong>.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   GRAND TOTALS STRIP
───────────────────────────────────────────── */
const TotalsStrip = ({ totals, currency }) => {
  if (!totals) return null;
  const bal = Number(totals.grand_total_balance || 0);
  return (
    <div className="gl-totals-strip">
      <div className="gl-total-block">
        <span className="gl-total-label">Total Debit</span>
        <span className="gl-total-value gl-debit-val">{fmt(totals.grand_total_debit)}</span>
      </div>
      <div className="gl-total-divider-v" />
      <div className="gl-total-block">
        <span className="gl-total-label">Total Credit</span>
        <span className="gl-total-value gl-credit-val">{fmt(totals.grand_total_credit)}</span>
      </div>
      <div className="gl-total-divider-v" />
      <div className={`gl-total-block gl-total-block--balance ${bal < 0 ? "gl-neg" : ""}`}>
        <span className="gl-total-label">Net Balance</span>
        <span className={`gl-total-value gl-balance-val ${bal < 0 ? "gl-neg-val" : ""}`}>
          {fmt(bal)}
        </span>
      </div>
      <div className="gl-total-currency-pill">
        {currency}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   RESULTS TABLE
───────────────────────────────────────────── */
const ResultsTable = ({ data, totals, meta, onExcel, excelLoading, search, setSearch }) => {
  const [sortCol, setSortCol]   = useState("ledger_name");
  const [sortDir, setSortDir]   = useState("asc");
  const navigate = useNavigate();

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <i className="fas fa-sort gl-sort-icon" />;
    return <i className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"} gl-sort-icon gl-sort-icon--active`} />;
  };

  // Client-side search filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.ledger_name?.toLowerCase().includes(q) ||
        String(r.ledger_number)?.toLowerCase().includes(q) // FIXED: Cast to String to avoid TypeError
    );
  }, [data, search]);

  // Client-side sort
  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortCol === "ledger_name" || sortCol === "ledger_number") {
        return dir * String(a[sortCol]).localeCompare(String(b[sortCol]));
      }
      return dir * ((parseFloat(a[sortCol]) || 0) - (parseFloat(b[sortCol]) || 0));
    });
  }, [filtered, sortCol, sortDir]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">

      {/* Action bar */}
      <div className="gl-action-bar">
        <div className="gl-action-left">
          <div className="gl-results-count">
            <i className="fas fa-table-list" />
            {filtered.length} of {data.length} ledger{data.length !== 1 ? "s" : ""}
          </div>
          <div className="gl-period-badge">
            <i className="fas fa-calendar-days" />
            {fmtDate(meta?.datefrom)} — {fmtDate(meta?.dateto)}
          </div>
        </div>
        <div className="gl-action-right">
          {/* Client-side search */}
          <div className="gl-search-box">
            <i className="fas fa-magnifying-glass gl-search-icon" />
            <input
              className="gl-search-input"
              placeholder="Filter ledgers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="gl-search-clear" onClick={() => setSearch("")}>
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>
          <button className="gl-excel-btn" onClick={onExcel} disabled={excelLoading}>
            {excelLoading
              ? <><div className="gl-btn-loader gl-btn-loader--sm" /> Downloading...</>
              : <><i className="fas fa-file-excel" /> Export Excel</>}
          </button>

          <PDFDownloadLink
            document={
              <DownloadGeneralLedger
                data={data}
                totals={totals}
                meta={meta}
              />
            }
            fileName={`General_Ledger_${meta?.currency}_${meta?.datefrom}_to_${meta?.dateto}.pdf`}
            className="gl-pdf-btn"
          >
            {({ loading: pdfLoading }) =>
              pdfLoading
                ? <><div className="gl-btn-loader gl-btn-loader--sm" /> Building PDF...</>
                : <><i className="fas fa-file-pdf" /> Export PDF</>
            }
          </PDFDownloadLink>
        </div>
      </div>

      {/* Grand totals strip */}
      <TotalsStrip totals={totals} currency={meta?.currency} />

      {/* Report paper */}
      <div className="gl-report-paper">
        <div className="gl-report-paper-header">
          <div className="gl-report-title-block">
            <h2 className="gl-report-title">General Ledger</h2>
            <p className="gl-report-sub">
              Period: {fmtDate(meta?.datefrom)} to {fmtDate(meta?.dateto)} &nbsp;·&nbsp; Currency: {meta?.currency}
            </p>
          </div>
          <img src={CompanyLogo} alt="Company Logo" className="gl-company-logo" />
        </div>

        {/* Table */}
        <div className="gl-table-wrap">
          <table className="gl-table">
            <thead>
              <tr>
                <th className="gl-th-num">#</th>
                <th className="sortable" onClick={() => handleSort("ledger_number")}>
                  Ledger No. <SortIcon col="ledger_number" />
                </th>
                <th className="sortable gl-th-wide" onClick={() => handleSort("ledger_name")}>
                  Ledger Name <SortIcon col="ledger_name" />
                </th>
                <th className="gl-th-num sortable" onClick={() => handleSort("total_debit")}>
                  Debit <SortIcon col="total_debit" />
                </th>
                <th className="gl-th-num sortable" onClick={() => handleSort("total_credit")}>
                  Credit <SortIcon col="total_credit" />
                </th>
                <th className="gl-th-num sortable" onClick={() => handleSort("balance")}>
                  Balance <SortIcon col="balance" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="gl-empty-row">
                    <div className="gl-empty-inner">
                      <i className="fas fa-inbox" />
                      <span>{search ? "No ledgers match your filter" : "No data for this period"}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((row, i) => {
                  const bal = Number(row.balance || 0);
                  const isActive = Number(row.total_debit) !== 0 || Number(row.total_credit) !== 0;
                  return (
                    <tr key={row.ledger_number} className={isActive ? "" : "gl-row-zero"}>
                      <td className="gl-td-num gl-row-num">{i + 1}</td>
                      <td className="gl-mono">
                        <button 
                          className="ls-ref-link"
                          onClick={() => window.open(`/ledger/view/${row.ledger_number}`, '_blank')}
                        >
                          {row.ledger_number}
                        </button>
                      </td>
                      <td className="gl-td-name">
                        <span className="gl-ledger-name">{row.ledger_name}</span>
                        {isActive && (
                          <span className="gl-active-dot" title="Has transactions this period" />
                        )}
                      </td>
                      <td className="gl-td-num">{fmt(row.total_debit)}</td>
                      <td className="gl-td-num">{fmt(row.total_credit)}</td>
                      <td className={`gl-td-num gl-bal-cell ${bal < 0 ? "gl-neg" : bal > 0 ? "gl-pos" : "gl-zero"}`}>
                        {fmt(bal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Sticky footer totals */}
            {sorted.length > 0 && (
              <tfoot>
                <tr className="gl-tfoot-row">
                  <td colSpan={3} className="gl-tfoot-label">Grand Total</td>
                  <td className="gl-td-num gl-tfoot-val">
                    {fmt(sorted.reduce((s, r) => s + (parseFloat(r.total_debit) || 0), 0))}
                  </td>
                  <td className="gl-td-num gl-tfoot-val">
                    {fmt(sorted.reduce((s, r) => s + (parseFloat(r.total_credit) || 0), 0))}
                  </td>
                  <td className={`gl-td-num gl-tfoot-val ${sorted.reduce((s, r) => s + (parseFloat(r.balance) || 0), 0) < 0 ? "gl-neg" : ""}`}>
                    {fmt(sorted.reduce((s, r) => s + (parseFloat(r.balance) || 0), 0))}
                  </td>
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
const GeneralLedger = () => {
  const [nav,          setNav]          = useState(false);
  const [hasSearched,  setHasSearched]  = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errors,       setErrors]       = useState({});
  const [search,       setSearch]       = useState("");

  // Filter state
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo,   setDateTo]   = useState(null);
  const [currency, setCurrency] = useState(null);

  const { theme } = useThemeStore();
  const { generalLedger, fetchGeneralLedger, downloadGeneralLedgerExcel } = useLedgerReportStore();

  useEffect(() => {
    document.title = "Smartbooks | General Ledger";
  }, []);

  const links = [
    { label: "Home",            to: "/", active: true },
    { label: "Reports",         to: "/reports/ledger", active: true },
    { label: "General Ledger",  to: "/reports/ledger/general-ledger", active: false },
  ];

  const validate = () => {
    const e = {};
    if (!dateFrom)  e.dateFrom  = "Required";
    if (!dateTo)    e.dateTo    = "Required";
    if (!currency)  e.currency  = "Required";
    return e;
  };

  const handleSearch = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSearch(""); // reset local filter on new search
    const result = await fetchGeneralLedger({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
    });
    if (result) setHasSearched(true);
  }, [dateFrom, dateTo, currency, fetchGeneralLedger]);

  const handleExcel = useCallback(async () => {
    if (!dateFrom || !dateTo || !currency) return;
    setExcelLoading(true);
    await downloadGeneralLedgerExcel({
      datefrom: toLocalISO(dateFrom),
      dateto:   toLocalISO(dateTo),
      currency: currency.value,
    });
    setExcelLoading(false);
  }, [dateFrom, dateTo, currency, downloadGeneralLedgerExcel]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`gl-root theme-${theme}`}>
          <div className="gl-page">
            <PageNav pageTitle="General Ledger" links={links} />

            {/* Always-visible filter bar */}
            <FilterBar
              dateFrom={dateFrom}   setDateFrom={setDateFrom}
              dateTo={dateTo}       setDateTo={setDateTo}
              currency={currency}   setCurrency={setCurrency}
              onSearch={handleSearch}
              loading={generalLedger.loading}
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
                  <ResultsTable
                    data={generalLedger.data}
                    totals={generalLedger.totals}
                    meta={generalLedger.meta}
                    onExcel={handleExcel}
                    excelLoading={excelLoading}
                    search={search}
                    setSearch={setSearch}
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

export default GeneralLedger;