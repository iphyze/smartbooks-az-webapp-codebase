/**
 * FXRevaluation.jsx — Updated
 *
 * Frontend fixes applied (matching the PHP backend changes):
 *  1. Post button blocked if period is locked (reads period_status from GET response)
 *  2. Post button blocked + warning shown if already posted (duplicate guard)
 *  3. PendingJournals preview shows the correct contra account per line
 *     (Exchange Gain 72000002 OR Exchange Loss 65000003 — not always Gain)
 *  4. Post modal warning reflects the actual contra accounts to be used
 *  5. Success banner shows gain_posted_to / loss_posted_to from POST response
 *  6. CAT_CONFIG extended to include PettyCash and OutsourcingAgent
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useFXRevaluationStore from "../../stores/useFXRevaluationStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import "./FXRevaluation.css";
import { fmt, fmtDate, fmtDatetime, toLocalISO } from "../../utils/helper";
import useReportPagePersistence, { parseReportDate } from "../../hooks/useReportPagePersistence";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

/**
 * CAT_CONFIG — must match $revaluableCategories in both PHP files exactly.
 *
 * CHANGES:
 *  + PettyCash      — "Head Office (USD)" 52000002 is a monetary FCY asset
 *  + OutsourcingAgent — FCY payables to foreign outsourcing agents
 */
const CAT_CONFIG = {
  BankAccounts:         { label: "Bank Accounts",                   icon: "fa-building-columns", isAsset: true  },
  OffshoreBankAccounts: { label: "Offshore Bank Accounts",          icon: "fa-earth-africa",     isAsset: true  },
  PettyCash:            { label: "Petty Cash (FCY)",                icon: "fa-coins",            isAsset: true  },
  ServiceCustomers:     { label: "Service Customers (Receivables)", icon: "fa-users",            isAsset: true  },
  StrategicPartners:    { label: "Strategic Partners",              icon: "fa-handshake",        isAsset: true  },
  Agents:               { label: "Agents",                         icon: "fa-id-badge",         isAsset: true  },
  LoansAndSimilarDebts: { label: "Loans and Similar Debts",         icon: "fa-file-contract",    isAsset: false },
  SuppliersCreditors:   { label: "Suppliers / Creditors",           icon: "fa-truck",            isAsset: false },
  OutsourcingAgent:     { label: "Outsourcing Agents",              icon: "fa-people-arrows",    isAsset: false },
};

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
  currency, setCurrency, rateDate, setRateDate,
  onFetch, loading, errors, rateOptions, ratesLoading,
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  return (
    <div className="fx-filter-bar">
      <div className="fx-filter-grid">

        <div className="fx-filter-field">
          <label className={`fx-filter-label ${errors?.dateFrom ? "fx-filter-label--err" : ""}`}>
            Date From <span className="fx-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker selected={dateFrom} onChange={setDateFrom}
              className={`form-input ${errors?.dateFrom ? "input-error" : ""}`}
              wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd"
              placeholderText="Start date" showMonthDropdown showYearDropdown dropdownMode="select" />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateFrom ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateFrom && <span className="fx-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>

        <div className="fx-filter-field">
          <label className={`fx-filter-label ${errors?.dateTo ? "fx-filter-label--err" : ""}`}>
            Date To <span className="fx-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker selected={dateTo} onChange={setDateTo}
              className={`form-input ${errors?.dateTo ? "input-error" : ""}`}
              wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd"
              placeholderText="End date" showMonthDropdown showYearDropdown dropdownMode="select" minDate={dateFrom} />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateTo ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateTo && <span className="fx-filter-err"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>

        <div className="fx-filter-field">
          <label className={`fx-filter-label ${errors?.currency ? "fx-filter-label--err" : ""}`}>
            Foreign Currency <span className="fx-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select options={CURRENCY_OPTIONS} onChange={setCurrency}
              value={CURRENCY_OPTIONS.find(o => o.value === currency?.value) || currency}
              placeholder="Select currency..."
              className={`form-input-select ${errors?.currency ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("currency")}
              onMenuClose={() => setOpenMenuId(null)} />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""}`} />
          </div>
          {errors?.currency && <span className="fx-filter-err"><i className="fas fa-circle-exclamation" /> {errors.currency}</span>}
        </div>

        <div className="fx-filter-field">
          <label className="fx-filter-label">Closing Rate Date</label>
          <div className="form-wrapper">
            <Select
              options={rateOptions}
              onChange={(opt) => setRateDate(opt ? opt.value : null)}
              value={rateOptions.find((o) => o.value === rateDate) || null}
              placeholder="Select rate date..."
              className="form-input-select"
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("rate_date")}
              onMenuClose={() => setOpenMenuId(null)}
              isLoading={ratesLoading}
              noOptionsMessage={() => !currency ? "Select currency first" : ratesLoading ? "Loading rates..." : "No rates found"} />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "rate_date" ? "chevron-rotate" : ""}`} />
          </div>
        </div>

        <div className="fx-filter-field fx-filter-btn-cell">
          <label className="fx-filter-label">&nbsp;</label>
          <button className="fx-preview-btn" onClick={onFetch} disabled={loading}>
            {loading
              ? <><div className="fx-btn-loader" /> Calculating...</>
              : <><i className="fas fa-calculator" /> Preview Revaluation</>}
          </button>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PERIOD STATUS BANNERS
───────────────────────────────────────────── */
const PeriodLockedBanner = ({ reason }) => (
  <motion.div className="fx-period-banner fx-period-banner--locked" variants={fadeUp} initial="hidden" animate="show">
    <i className="fas fa-lock" />
    <div>
      <strong>Accounting period is locked.</strong>
      <span> Previewing is allowed but posting is disabled. {reason ? `Reason: ${reason}` : ""}</span>
    </div>
  </motion.div>
);

const AlreadyPostedBanner = () => (
  <motion.div className="fx-period-banner fx-period-banner--warn" variants={fadeUp} initial="hidden" animate="show">
    <i className="fas fa-triangle-exclamation" />
    <div>
      <strong>Revaluation already posted for this period.</strong>
      <span> A previous FX Revaluation journal exists for the selected date range. Reverse those entries before re-posting.</span>
    </div>
  </motion.div>
);

/* ─────────────────────────────────────────────
   EMPTY PROMPT
───────────────────────────────────────────── */
const EmptyPrompt = () => (
  <motion.div className="fx-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="fx-empty-icon"><i className="fas fa-arrows-rotate" /></div>
    <h3 className="fx-empty-title">No revaluation calculated yet</h3>
    <p className="fx-empty-sub">
      Select a period, foreign currency and closing rate above, then click{" "}
      <strong>Preview Revaluation</strong> to see the FX gain/loss before posting.
    </p>
  </motion.div>
);

/* ─────────────────────────────────────────────
   CLOSING RATE CARD
───────────────────────────────────────────── */
const RateCard = ({ info }) => {
  if (!info) return null;
  return (
    <div className="fx-rate-card">
      <div className="fx-rate-card-left">
        <i className="fas fa-coins fx-rate-icon" />
        <div>
          <span className="fx-rate-label">Closing Rate Used</span>
          <span className="fx-rate-sub">As at {fmtDatetime(info.rate_record_date)}</span>
        </div>
      </div>
      <div className="fx-rate-value">
        <span className="fx-rate-currency">{info.currency}</span>
        <span className="fx-rate-number">1 {info.currency} = {fmt(info.closing_rate)} NGN</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SUMMARY STRIP
───────────────────────────────────────────── */
const SummaryStrip = ({ summary }) => {
  if (!summary) return null;
  const isGain = Number(summary.grand_total_net || 0) >= 0;
  return (
    <div className="fx-summary-strip">
      <div className="fx-summary-block">
        <span className="fx-summary-label">Total FX Gain</span>
        <span className="fx-summary-value fx-gain-val">{fmt(summary.grand_total_gain)}</span>
        <span className="fx-summary-contra">→ CR Exchange Gain (72000002)</span>
      </div>
      <div className="fx-summary-divider" />
      <div className="fx-summary-block">
        <span className="fx-summary-label">Total FX Loss</span>
        <span className="fx-summary-value fx-loss-val">{fmt(summary.grand_total_loss)}</span>
        <span className="fx-summary-contra">→ DR Exchange Loss (65000003)</span>
      </div>
      <div className="fx-summary-divider" />
      <div className={`fx-summary-block fx-summary-net-block ${isGain ? "" : "fx-summary-net-block--loss"}`}>
        <span className="fx-summary-label">{summary.net_label || "Net Exchange"}</span>
        <span className={`fx-summary-value ${isGain ? "fx-net-gain-val" : "fx-net-loss-val"}`}>
          {fmt(Math.abs(summary.grand_total_net))}
        </span>
      </div>
      <div className={`fx-summary-pill ${isGain ? "fx-summary-pill--gain" : "fx-summary-pill--loss"}`}>
        <i className={`fas ${isGain ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} />
        {isGain ? "Net Gain" : "Net Loss"}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   CATEGORY TABLE
───────────────────────────────────────────── */
const CategoryTable = ({ catKey, group }) => {
  const cfg = CAT_CONFIG[catKey] || { label: catKey, icon: "fa-file", isAsset: true };
  if (!group || !group.records || group.records.length === 0) return null;
  const netIsGain = Number(group.subtotal_net || 0) >= 0;

  return (
    <div className="fx-cat-section">
      <div className="fx-cat-header">
        <div className="fx-cat-header-left">
          <div className={`fx-cat-icon ${cfg.isAsset ? "fx-cat-icon--asset" : "fx-cat-icon--liability"}`}>
            <i className={`fas ${cfg.icon}`} />
          </div>
          <div>
            <span className="fx-cat-name">{cfg.label}</span>
            <span className={`fx-cat-type-badge ${cfg.isAsset ? "fx-badge--asset" : "fx-badge--liability"}`}>
              {cfg.isAsset ? "Asset" : "Liability"}
            </span>
          </div>
        </div>
        <div className="fx-cat-subtotals">
          <div className="fx-cat-sub-item">
            <span className="fx-cat-sub-label">Gain</span>
            <span className="fx-cat-sub-val fx-gain-val">{fmt(group.subtotal_gain)}</span>
          </div>
          <div className="fx-cat-sub-divider" />
          <div className="fx-cat-sub-item">
            <span className="fx-cat-sub-label">Loss</span>
            <span className="fx-cat-sub-val fx-loss-val">{fmt(group.subtotal_loss)}</span>
          </div>
          <div className="fx-cat-sub-divider" />
          <div className="fx-cat-sub-item">
            <span className="fx-cat-sub-label">Net</span>
            <span className={`fx-cat-sub-val ${netIsGain ? "fx-gain-val" : "fx-loss-val"}`}>
              {fmt(group.subtotal_net)}
            </span>
          </div>
        </div>
      </div>

      <div className="fx-table-wrap">
        <table className="fx-table">
          <thead>
            <tr>
              <th>Ledger No.</th>
              <th className="fx-th-wide">Ledger Name</th>
              <th className="fx-th-num">FCY Balance</th>
              <th className="fx-th-num">Book Rate</th>
              <th className="fx-th-num">NGN Book Value</th>
              <th className="fx-th-num">Closing Rate</th>
              <th className="fx-th-num">NGN Closing Value</th>
              <th className="fx-th-num">FX Difference</th>
              <th className="fx-th-num">Gain</th>
              <th className="fx-th-num">Loss</th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((row, i) => {
              const diff = Number(row.fx_difference || 0);
              return (
                <tr key={row.ledger_number || i}>
                  <td className="fx-mono">{row.ledger_number}</td>
                  <td className="fx-ledger-name">{row.ledger_name}</td>
                  <td className="fx-td-num">{fmt(row.fcy_net_balance)}</td>
                  <td className="fx-td-num fx-rate-cell">{fmt(row.avg_book_rate)}</td>
                  <td className="fx-td-num">{fmt(row.ngn_book_value)}</td>
                  <td className="fx-td-num fx-rate-cell">{fmt(row.closing_rate)}</td>
                  <td className="fx-td-num">{fmt(row.ngn_closing_value)}</td>
                  <td className={`fx-td-num fx-diff-cell ${diff > 0 ? "fx-gain-val" : diff < 0 ? "fx-loss-val" : ""}`}>
                    {fmt(diff)}
                  </td>
                  <td className="fx-td-num fx-gain-val">{Number(row.fx_gain) > 0 ? fmt(row.fx_gain) : "—"}</td>
                  <td className="fx-td-num fx-loss-val">{Number(row.fx_loss) > 0 ? fmt(row.fx_loss) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="fx-tfoot-row">
              <td colSpan={8} className="fx-tfoot-label">Subtotal — {cfg.label}</td>
              <td className="fx-td-num fx-tfoot-val fx-gain-val">{fmt(group.subtotal_gain)}</td>
              <td className="fx-td-num fx-tfoot-val fx-loss-val">{fmt(group.subtotal_loss)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PENDING JOURNALS PREVIEW
───────────────────────────────────────────── */
const PendingJournals = ({ journals }) => {
  if (!journals || journals.length === 0) return (
    <div className="fx-no-journals">
      <i className="fas fa-check-circle" /> No FX differences detected — no journal entries needed.
    </div>
  );
  return (
    <div className="fx-pending-wrap">
      <div className="fx-pending-header">
        <i className="fas fa-file-pen" />
        <span>
          {journals.length} ledger{journals.length !== 1 ? "s" : ""} with FX differences —{" "}
          {journals.length * 2} journal lines will be posted
        </span>
        <span className="fx-pending-note">
          Each line generates a matching contra entry to Exchange Gain (72000002) or Exchange Loss (65000003)
        </span>
      </div>
      <div className="fx-table-wrap">
        <table className="fx-table fx-pending-table">
          <thead>
            <tr>
              <th>Ledger No.</th>
              <th className="fx-th-wide">Ledger Name</th>
              <th>Type</th>
              <th className="fx-th-num">FCY Net</th>
              <th className="fx-th-num">FX Net (NGN)</th>
              <th className="fx-th-num">Raw Difference</th>
              <th>Contra Account</th>
            </tr>
          </thead>
          <tbody>
            {journals.map((j, i) => {
              const isGain = Number(j.fx_net) >= 0;
              return (
                <tr key={i}>
                  <td className="fx-mono">{j.ledger_number}</td>
                  <td className="fx-ledger-name">{j.ledger_name}</td>
                  <td>
                    <span className={`fx-type-badge ${j.is_asset ? "fx-badge--asset" : "fx-badge--liability"}`}>
                      {j.is_asset ? "Asset" : "Liability"}
                    </span>
                  </td>
                  <td className="fx-td-num">{fmt(j.fcy_net)}</td>
                  <td className={`fx-td-num ${isGain ? "fx-gain-val" : "fx-loss-val"}`}>{fmt(j.fx_net)}</td>
                  <td className={`fx-td-num ${Number(j.fx_difference) >= 0 ? "fx-gain-val" : "fx-loss-val"}`}>
                    {fmt(j.fx_difference)}
                  </td>
                  {/* FIX: shows Exchange Gain OR Exchange Loss, not always Gain */}
                  <td>
                    <span className={`fx-contra-badge ${isGain ? "fx-contra-badge--gain" : "fx-contra-badge--loss"}`}>
                      <i className={`fas ${isGain ? "fa-arrow-up-right" : "fa-arrow-down-right"}`} />
                      {j.contra_ledger_number} — {j.contra_ledger_name}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   POST MODAL
───────────────────────────────────────────── */
const PostModal = ({ open, onClose, onPost, meta, posting, currency, summary, method = "standard" }) => {
  const zeroEntryMethod = method === "zero-entry";
  const [journalDate,   setJournalDate]   = useState(null);
  const [description,   setDescription]   = useState("");
  const [costCenter,    setCostCenter]    = useState("");
  const [descErr,       setDescErr]       = useState("");
  const [dateErr,       setDateErr]       = useState("");

  const hasGain = summary && Number(summary.grand_total_gain) > 0;
  const hasLoss = summary && Number(summary.grand_total_loss) > 0;

  useEffect(() => {
    if (open) {
      setJournalDate(null);
      setDescription(
        `FX Revaluation ${currency} - ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`
      );
      setCostCenter("");
      setDescErr("");
      setDateErr("");
    }
  }, [open, currency]);

  const handlePost = () => {
    let valid = true;
    if (!journalDate)        { setDateErr("Journal date is required"); valid = false; }
    if (!description.trim()) { setDescErr("Description is required");  valid = false; }
    if (!valid) return;
    onPost({
      datefrom:            meta?.datefrom,
      dateto:              meta?.dateto,
      currency,
      journal_date:        toLocalISO(journalDate),
      journal_description: description.trim(),
      cost_center:         costCenter.trim(),
    });
  };

  if (!open) return null;

  return (
    <div className="fx-modal-overlay" onClick={onClose}>
      <motion.div
        className="fx-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={   { opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fx-modal-header">
          <div className="fx-modal-title-wrap">
            <div className="fx-modal-icon"><i className={`fas ${zeroEntryMethod ? "fa-note-sticky" : "fa-file-pen"}`} /></div>
            <div>
              <h3 className="fx-modal-title">{zeroEntryMethod ? "Post Zero-Entry Audit Journal" : "Post FX Revaluation Journal"}</h3>
              <p className="fx-modal-sub">{zeroEntryMethod ? "Creates memo lines for affected ledgers and recognises only the net FX effect." : "This will create journal entries in the system. This action cannot be undone."}</p>
            </div>
          </div>
          <button className="fx-modal-close" onClick={onClose}><i className="fas fa-xmark" /></button>
        </div>

        <div className="fx-modal-body">
          <div className="fx-modal-field">
            <label className="fx-modal-label">Journal Date <span className="fx-req">*</span></label>
            <div className="form-wrapper">
              <DatePicker
                selected={journalDate} onChange={setJournalDate}
                className={`form-input ${dateErr ? "input-error" : ""}`}
                wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd"
                placeholderText="Select posting date" showMonthDropdown showYearDropdown dropdownMode="select" />
              <span className={`chevron-input-icon fas fa-calendar ${dateErr ? "input-icon-error" : ""}`} />
            </div>
            {dateErr && <span className="fx-modal-err"><i className="fas fa-circle-exclamation" /> {dateErr}</span>}
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">Journal Description <span className="fx-req">*</span></label>
            <input
              className={`fx-modal-input ${descErr ? "input-error" : ""}`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescErr(""); }}
              placeholder="e.g. FX Revaluation USD - December 2025" />
            {descErr && <span className="fx-modal-err"><i className="fas fa-circle-exclamation" /> {descErr}</span>}
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">Cost Centre <span className="fx-optional">(optional)</span></label>
            <input
              className="fx-modal-input"
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              placeholder="Cost centre code" />
          </div>

          <div className="fx-modal-warning">
            <i className="fas fa-triangle-exclamation" />
            <div>
              {zeroEntryMethod ? (
                <>
                  <span>Zero-entry method posts visible memo lines with zero NGN value to affected ledgers, while the net FX result is recognised in Exchange Gain.</span>
                  <ul className="fx-modal-contra-list"><li><strong>Exchange Gain — 72000002</strong> receives the net recognised amount.</li></ul>
                </>
              ) : (
                <>
                  <span>Journal entries will be posted to the revalued ledgers and the following contra accounts:</span>
                  <ul className="fx-modal-contra-list">
                    {hasGain && <li><strong>Exchange Gain — 72000002</strong> receives a <strong>Credit</strong> for all FX gains.</li>}
                    {hasLoss && <li><strong>Exchange Loss — 65000003</strong> receives a <strong>Debit</strong> for all FX losses.</li>}
                  </ul>
                </>
              )}
              <span>Ensure the accounting period is not locked before posting.</span>
            </div>
          </div>
        </div>

        <div className="fx-modal-footer">
          <button className="fx-modal-cancel" onClick={onClose} disabled={posting}>Cancel</button>
          <button className="fx-modal-post" onClick={handlePost} disabled={posting}>
            {posting
              ? <><div className="fx-btn-loader fx-btn-loader--sm" /> Posting...</>
              : <><i className="fas fa-check" /> {zeroEntryMethod ? "Post Zero-Entry" : "Confirm & Post"}</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


const ReverseModal = ({ open, onClose, onReverse, reversing, originalJournalId }) => {
  const [reversalDate, setReversalDate]   = useState(null);
  const [description,  setDescription]   = useState("");
  const [dateErr,      setDateErr]        = useState("");
  const [descErr,      setDescErr]        = useState("");
 
  useEffect(() => {
    if (open) {
      setReversalDate(null);
      setDescription(`Reversal of FX Revaluation — JV-${originalJournalId}`);
      setDateErr("");
      setDescErr("");
    }
  }, [open, originalJournalId]);
 
  const handleReverse = () => {
    let valid = true;
    if (!reversalDate)       { setDateErr("Reversal date is required"); valid = false; }
    if (!description.trim()) { setDescErr("Description is required");   valid = false; }
    if (!valid) return;
 
    onReverse({
      journal_id:           originalJournalId,
      reversal_date:        toLocalISO(reversalDate),
      reversal_description: description.trim(),
    });
  };
 
  if (!open) return null;
 
  return (
    <div className="fx-modal-overlay" onClick={onClose}>
      <motion.div
        className="fx-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={   { opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fx-modal-header">
          <div className="fx-modal-title-wrap">
            <div className="fx-modal-icon" style={{ background: "rgba(244,124,124,0.1)", color: "#f47c7c" }}>
              <i className="fas fa-rotate-left" />
            </div>
            <div>
              <h3 className="fx-modal-title">Reverse FX Revaluation Journal</h3>
              <p className="fx-modal-sub">
                This will post mirror-image entries that net JV-{originalJournalId} to zero.
                You can then post a corrected revaluation for the same period.
              </p>
            </div>
          </div>
          <button className="fx-modal-close" onClick={onClose}><i className="fas fa-xmark" /></button>
        </div>
 
        <div className="fx-modal-body">
          <div className="fx-modal-field">
            <label className="fx-modal-label">Reversal Date <span className="fx-req">*</span></label>
            <div className="form-wrapper">
              <DatePicker
                selected={reversalDate}
                onChange={setReversalDate}
                className={`form-input ${dateErr ? "input-error" : ""}`}
                wrapperClassName="input-date-picker"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select reversal date"
                showMonthDropdown showYearDropdown dropdownMode="select"
              />
              <span className={`chevron-input-icon fas fa-calendar ${dateErr ? "input-icon-error" : ""}`} />
            </div>
            {dateErr && <span className="fx-modal-err"><i className="fas fa-circle-exclamation" /> {dateErr}</span>}
          </div>
 
          <div className="fx-modal-field">
            <label className="fx-modal-label">Reversal Description <span className="fx-req">*</span></label>
            <input
              className={`fx-modal-input ${descErr ? "input-error" : ""}`}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescErr(""); }}
              placeholder={`e.g. Reversal of FX Revaluation — JV-${originalJournalId}`}
            />
            {descErr && <span className="fx-modal-err"><i className="fas fa-circle-exclamation" /> {descErr}</span>}
          </div>
 
          {/* Warning */}
          <div className="fx-modal-warning" style={{ background: "rgba(244,124,124,0.06)", borderColor: "rgba(244,124,124,0.22)" }}>
            <i className="fas fa-triangle-exclamation" style={{ color: "#f47c7c" }} />
            <div>
              <span>
                This will create <strong>equal and opposite</strong> journal lines under a new journal ID.
                All ledger balances affected by JV-{originalJournalId} will return to their pre-revaluation values.
                The reversal cannot be undone.
              </span>
            </div>
          </div>
        </div>
 
        <div className="fx-modal-footer">
          <button className="fx-modal-cancel" onClick={onClose} disabled={reversing}>
            Cancel
          </button>
          <button
            className="fx-modal-post"
            onClick={handleReverse}
            disabled={reversing}
            style={{ background: "#f47c7c", boxShadow: "0 3px 10px rgba(244,124,124,0.28)" }}
          >
            {reversing
              ? <><div className="fx-btn-loader fx-btn-loader--sm" /> Reversing...</>
              : <><i className="fas fa-rotate-left" /> Confirm Reversal</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


/* ─────────────────────────────────────────────
   SUCCESS BANNER
───────────────────────────────────────────── */
const SuccessBanner = ({ result, onDismiss }) => {
  if (!result) return null;
  const s = result.summary || {};
  return (
    <motion.div className="fx-success-banner" variants={fadeUp} initial="hidden" animate="show">
      <i className="fas fa-check-circle fx-success-icon" />
      <div className="fx-success-body">
        <span className="fx-success-title">Journal Posted Successfully</span>
        <span className="fx-success-detail">
          Journal ID: <strong>{result.journal_id}</strong> · {result.posted} line{result.posted !== 1 ? "s" : ""} posted
          {s.gain_posted_to && <> · Gain → <strong>{s.gain_posted_to}</strong></>}
          {s.loss_posted_to && <> · Loss → <strong>{s.loss_posted_to}</strong></>}
          {" · "}{s.net_label}: <strong>{fmt(Math.abs(s.net_fx_ngn || 0))}</strong> NGN
        </span>
      </div>
      <button className="fx-success-dismiss" onClick={onDismiss}><i className="fas fa-xmark" /></button>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const FXRevaluation = () => {
  const [nav,           setNav]           = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [showZeroModal, setShowZeroModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [errors,        setErrors]        = useState({});
  const [rateDate,      setRateDate]      = useState(null);

  const [dateFrom,  setDateFrom]  = useState(null);
  const [dateTo,    setDateTo]    = useState(null);
  const [currency,  setCurrency]  = useState(null);

  const { theme } = useThemeStore();
  const { preview, posting, postingZero, reversing, fetchRevaluation, postRevaluation, postZeroRevaluation, reverseRevaluation } = useFXRevaluationStore();
  const { rates, searchRates, isLoading: ratesLoading } = useRateSearchStore();
  const previousCurrencyRef = useRef(null);

  const restoreReportState = useCallback((saved = {}) => {
    const restoredDateFrom = parseReportDate(saved.dateFrom);
    const restoredDateTo = parseReportDate(saved.dateTo);
    const restoredCurrency = saved.currency || null;
    const restoredRateDate = saved.rateDate || null;

    setDateFrom(restoredDateFrom);
    setDateTo(restoredDateTo);
    setCurrency(restoredCurrency);
    setRateDate(restoredRateDate);

    if (saved.hasCalculated && restoredDateFrom && restoredDateTo && restoredCurrency?.value) {
      return fetchRevaluation({
        datefrom: toLocalISO(restoredDateFrom),
        dateto: toLocalISO(restoredDateTo),
        currency: restoredCurrency.value,
        rate_date: restoredRateDate,
      }).then((result) => {
        if (result) setHasCalculated(true);
      });
    }
  }, [fetchRevaluation]);

  useReportPagePersistence(
    "smartbooks:report:fx-revaluation",
    {
      dateFrom: toLocalISO(dateFrom),
      dateTo: toLocalISO(dateTo),
      currency,
      rateDate,
      hasCalculated,
    },
    restoreReportState
  );

  useEffect(() => { document.title = "Smartbooks | FX Gain / Loss"; }, []);

  useEffect(() => {
    const currentCurrency = currency?.value || null;

    if (
      currentCurrency &&
      previousCurrencyRef.current &&
      previousCurrencyRef.current !== currentCurrency
    ) {
      setRateDate(null);
    }

    if (currentCurrency) searchRates("");
    previousCurrencyRef.current = currentCurrency;
  }, [currency?.value, searchRates]);

  const rateOptions = useMemo(() => {
    const curr = currency?.value?.toLowerCase();
    if (!curr) return [];
    return rates
      .filter((r) => r[`${curr}_rate`] != null)
      .map((r) => ({
        value: r.created_at,
        label: `${r.created_at} | ${currency.value} @ ${r[`${curr}_rate`]}`,
        rate: r,
      }));
  }, [rates, currency]);

  const links = [
    { label: "Home",           to: "/",                       active: true  },
    // { label: "Reports",        to: "/reports/ledger",         active: true  },
    { label: "FX Gain / Loss", to: "/reports/fx-revaluation", active: false },
  ];

  const validate = () => {
    const e = {};
    if (!dateFrom) e.dateFrom = "Required";
    if (!dateTo)   e.dateTo   = "Required";
    if (!currency) e.currency = "Required";
    return e;
  };

  const handleFetch = useCallback(async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const result = await fetchRevaluation({
      datefrom:  toLocalISO(dateFrom),
      dateto:    toLocalISO(dateTo),
      currency:  currency.value,
      rate_date: rateDate,
    });
    if (result) setHasCalculated(true);
  }, [dateFrom, dateTo, currency, fetchRevaluation, rateDate]);

  const handlePost = useCallback(async (body) => {
    const result = await postRevaluation({ ...body, rate_date: rateDate });
    if (result) {
      setShowModal(false);
      await fetchRevaluation({
        datefrom:  toLocalISO(dateFrom),
        dateto:    toLocalISO(dateTo),
        currency:  currency.value,
        rate_date: rateDate,
      });
    }
  }, [postRevaluation, fetchRevaluation, dateFrom, dateTo, currency, rateDate]);

  const handleZeroPost = useCallback(async (body) => {
    const result = await postZeroRevaluation({ ...body, rate_date: rateDate });
    if (result) {
      setShowZeroModal(false);
      await fetchRevaluation({
        datefrom: toLocalISO(dateFrom),
        dateto: toLocalISO(dateTo),
        currency: currency.value,
        rate_date: rateDate,
      });
    }
  }, [postZeroRevaluation, fetchRevaluation, dateFrom, dateTo, currency, rateDate]);

  const handleReverse = useCallback(async (body) => {
    const result = await reverseRevaluation(body);
    if (result) {
      setShowReverseModal(false);
      // Re-fetch so the UI updates: alreadyPosted becomes false,
      // the Post button re-enables, and the "Already Posted" banner disappears.
      await fetchRevaluation({
        datefrom:  toLocalISO(dateFrom),
        dateto:    toLocalISO(dateTo),
        currency:  currency.value,
        rate_date: rateDate,
      });
    }
  }, [reverseRevaluation, fetchRevaluation, dateFrom, dateTo, currency, rateDate]);

  // FIX: derive blocking conditions from the GET response period_status
  const periodStatus   = preview.periodStatus || {};
  const periodIsLocked = !!periodStatus.is_locked;
  const alreadyPosted  = !!periodStatus.already_posted;
  const hasPending     = (preview.pendingJournals || []).length > 0;
  const canPost        = hasPending && !periodIsLocked && !alreadyPosted && !posting.loading;

  let postBtnTitle = "";
  if (!hasPending)       postBtnTitle = "No FX differences to post";
  else if (periodIsLocked) postBtnTitle = "Accounting period is locked";
  else if (alreadyPosted)  postBtnTitle = "Revaluation already posted for this period";

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar  setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`fx-root theme-${theme}`}>
          <div className="fx-page">
            <PageNav pageTitle="FX Gain / Loss" links={links} />

            <FilterBar
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo}     setDateTo={setDateTo}
              currency={currency} setCurrency={setCurrency}
              rateDate={rateDate} setRateDate={setRateDate}
              onFetch={handleFetch}
              loading={preview.loading}
              errors={errors}
              rateOptions={rateOptions}
              ratesLoading={ratesLoading}
            />

            <AnimatePresence mode="wait">
              {!hasCalculated ? (
                <motion.div key="empty" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                  <EmptyPrompt />
                </motion.div>
              ) : (
                <motion.div key="results" variants={fadeUp} initial="hidden" animate="show" exit="exit">

                  <AnimatePresence>
                    {posting.result && (
                      <SuccessBanner
                        result={posting.result}
                        onDismiss={() =>
                          useFXRevaluationStore.setState(s => ({ posting: { ...s.posting, result: null } }))
                        }
                      />
                    )}
                  </AnimatePresence>

                  {/* FIX: period lock and duplicate warnings */}
                  <AnimatePresence>
                    {periodIsLocked && <PeriodLockedBanner key="lock" reason={periodStatus.lock_reason} />}
                    {alreadyPosted  && <AlreadyPostedBanner key="dup" />}
                  </AnimatePresence>

                  <div className="fx-action-bar">
                    <div className="fx-action-left">
                      <div className="fx-results-badge">
                        <i className="fas fa-arrows-rotate" /> FX Revaluation
                      </div>
                      <div className="fx-period-badge">
                        <i className="fas fa-calendar-days" />
                        {fmtDate(preview.meta?.datefrom)} — {fmtDate(preview.meta?.dateto)}
                      </div>
                      <div className="fx-currency-badge">
                        <i className="fas fa-coins" />{preview.meta?.currency}
                      </div>
                    </div>
                    <div className="fx-action-right">
                      {alreadyPosted ? (
                        <>
                          <button
                            className="fx-post-btn"
                            onClick={() => setShowReverseModal(true)}
                            disabled={reversing.loading}
                            style={{ background: "#f47c7c", boxShadow: "0 3px 10px rgba(244,124,124,0.28)" }}
                            title="Reverse the existing revaluation before re-posting"
                          >
                            <i className="fas fa-rotate-left" /> Reverse Journal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="fx-post-btn fx-post-btn--secondary"
                            onClick={() => setShowZeroModal(true)}
                            disabled={!canPost || postingZero.loading}
                            title={postBtnTitle || "Post memo-line audit journal"}
                          >
                            <i className="fas fa-note-sticky" /> Zero-Entry Method
                          </button>
                          <button
                            className="fx-post-btn"
                            onClick={() => setShowModal(true)}
                            disabled={!canPost}
                            title={postBtnTitle}
                          >
                            {periodIsLocked
                              ? <><i className="fas fa-lock" /> Period Locked</>
                              : <><i className="fas fa-file-pen" /> Post Journal</>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <RateCard info={preview.closingRateInfo} />
                  <SummaryStrip summary={preview.summary} />

                  <div className="fx-report-paper">
                    <div className="fx-report-paper-header">
                      <div className="fx-report-title-block">
                        <h2 className="fx-report-title">Foreign Exchange Gain / Loss</h2>
                        <p className="fx-report-sub">
                          Revaluation of FCY-denominated balances at closing rate ·
                          Period: {fmtDate(preview.meta?.datefrom)} to {fmtDate(preview.meta?.dateto)} ·
                          FY {preview.meta?.period_year}
                        </p>
                      </div>
                    </div>
                    <div className="fx-sections">
                      {Object.keys(CAT_CONFIG).map((key) =>
                        preview.data[key] ? (
                          <CategoryTable key={key} catKey={key} group={preview.data[key]} />
                        ) : null
                      )}
                    </div>
                  </div>

                  <div className="fx-pending-section">
                    <div className="fx-section-heading">
                      <i className="fas fa-list-check" />
                      <span>Journal Entries Preview</span>
                      <span className="fx-section-heading-sub">Review before posting</span>
                    </div>
                    <PendingJournals journals={preview.pendingJournals} />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <PostModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onPost={handlePost}
            meta={preview.meta}
            posting={posting.loading}
            currency={currency?.value}
            summary={preview.summary}
          />
        )}

        {showZeroModal && (
          <PostModal
            open={showZeroModal}
            onClose={() => setShowZeroModal(false)}
            onPost={handleZeroPost}
            meta={preview.meta}
            posting={postingZero.loading}
            currency={currency?.value}
            summary={preview.summary}
            method="zero-entry"
          />
        )}

        {showReverseModal && (
        <ReverseModal
            open={showReverseModal}
            onClose={() => setShowReverseModal(false)}
            onReverse={handleReverse}
            reversing={reversing.loading}
            originalJournalId={preview.periodStatus?.posted_journal_id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FXRevaluation;