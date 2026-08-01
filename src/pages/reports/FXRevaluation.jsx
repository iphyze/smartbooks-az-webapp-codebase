import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import Header from "../Header";
import NavBar from "../NavBar";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import useFXRevaluationStore from "../../stores/useFXRevaluationStore";
import useRateSearchStore from "../../stores/useRateSearchStore";
import { fmt, fmtDate, fmtDatetime, toLocalISO } from "../../utils/helper";
import useReportPagePersistence, {
  parseReportDate,
} from "../../hooks/useReportPagePersistence";
import "./FXRevaluation.css";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

const CAT_CONFIG = {
  BankAccounts: {
    label: "Bank Accounts",
    icon: "fa-building-columns",
    isAsset: true,
  },
  OffshoreBankAccounts: {
    label: "Offshore Bank Accounts",
    icon: "fa-earth-africa",
    isAsset: true,
  },
  PettyCash: { label: "Petty Cash (FCY)", icon: "fa-coins", isAsset: true },
  ServiceCustomers: {
    label: "Service Customers (Receivables)",
    icon: "fa-users",
    isAsset: true,
  },
  StrategicPartners: {
    label: "Strategic Partners",
    icon: "fa-handshake",
    isAsset: true,
  },
  Agents: { label: "Agents", icon: "fa-id-badge", isAsset: true },
  LoansAndSimilarDebts: {
    label: "Loans and Similar Debts",
    icon: "fa-file-contract",
    isAsset: false,
  },
  SuppliersCreditors: {
    label: "Suppliers / Creditors",
    icon: "fa-truck",
    isAsset: false,
  },
  OutsourcingAgent: {
    label: "Outsourcing Agents",
    icon: "fa-people-arrows",
    isAsset: false,
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const FilterBar = ({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  currency,
  setCurrency,
  rateDate,
  setRateDate,
  onFetch,
  loading,
  errors,
  rateOptions,
  ratesLoading,
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
            <DatePicker
              selected={dateFrom}
              onChange={setDateFrom}
              className={`form-input ${errors?.dateFrom ? "input-error" : ""}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="Start date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateFrom ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateFrom ? (
            <span className="fx-filter-err">
              <i className="fas fa-circle-exclamation" /> {errors.dateFrom}
            </span>
          ) : null}
        </div>

        <div className="fx-filter-field">
          <label className={`fx-filter-label ${errors?.dateTo ? "fx-filter-label--err" : ""}`}>
            Closing Date <span className="fx-req">*</span>
          </label>
          <div className="form-wrapper">
            <DatePicker
              selected={dateTo}
              onChange={setDateTo}
              className={`form-input ${errors?.dateTo ? "input-error" : ""}`}
              wrapperClassName="input-date-picker"
              dateFormat="yyyy-MM-dd"
              placeholderText="Closing date"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              minDate={dateFrom}
            />
            <span className={`chevron-input-icon fas fa-calendar ${errors?.dateTo ? "input-icon-error" : ""}`} />
          </div>
          {errors?.dateTo ? (
            <span className="fx-filter-err">
              <i className="fas fa-circle-exclamation" /> {errors.dateTo}
            </span>
          ) : null}
        </div>

        <div className="fx-filter-field">
          <label className={`fx-filter-label ${errors?.currency ? "fx-filter-label--err" : ""}`}>
            Foreign Currency <span className="fx-req">*</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
              value={CURRENCY_OPTIONS.find((option) => option.value === currency?.value) || currency}
              placeholder="Select currency..."
              className={`form-input-select ${errors?.currency ? "input-error" : ""}`}
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("currency")}
              onMenuClose={() => setOpenMenuId(null)}
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "currency" ? "chevron-rotate" : ""}`} />
          </div>
          {errors?.currency ? (
            <span className="fx-filter-err">
              <i className="fas fa-circle-exclamation" /> {errors.currency}
            </span>
          ) : null}
        </div>

        <div className="fx-filter-field">
          <label className="fx-filter-label">
            Closing Rate Record <span className="fx-rate-hint">optional</span>
          </label>
          <div className="form-wrapper">
            <Select
              options={rateOptions}
              onChange={(option) => setRateDate(option?.value || null)}
              value={rateOptions.find((option) => option.value === rateDate) || null}
              placeholder="Latest effective rate on/before close"
              className="form-input-select"
              classNamePrefix="form-input-select"
              onMenuOpen={() => setOpenMenuId("rate_record")}
              onMenuClose={() => setOpenMenuId(null)}
              isLoading={ratesLoading}
              isClearable
              noOptionsMessage={() =>
                !currency
                  ? "Select currency first"
                  : ratesLoading
                    ? "Loading rates..."
                    : "No rate available by the closing date"
              }
            />
            <span className={`chevron-input-icon fas fa-chevron-down ${openMenuId === "rate_record" ? "chevron-rotate" : ""}`} />
          </div>
        </div>

        <div className="fx-filter-field fx-filter-btn-cell">
          <label className="fx-filter-label">&nbsp;</label>
          <button className="fx-preview-btn" onClick={onFetch} disabled={loading}>
            {loading ? (
              <>
                <div className="fx-btn-loader" /> Calculating...
              </>
            ) : (
              <>
                <i className="fas fa-calculator" /> Preview FX Gain / Loss
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusBanner = ({ type = "info", icon = "fa-circle-info", title, children }) => (
  <motion.div
    className={`fx-period-banner fx-period-banner--${type}`}
    variants={fadeUp}
    initial="hidden"
    animate="show"
  >
    <i className={`fas ${icon}`} />
    <div>
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  </motion.div>
);

const EmptyPrompt = () => (
  <motion.div className="fx-empty-prompt" variants={fadeUp} initial="hidden" animate="show">
    <div className="fx-empty-icon">
      <i className="fas fa-arrows-rotate" />
    </div>
    <h3 className="fx-empty-title">No FX review calculated yet</h3>
    <p className="fx-empty-sub">
      Select a period and foreign currency, then click <strong>Preview FX Gain / Loss</strong>. Realized FX already posted and the postable unrealized revaluation will be shown separately.
    </p>
  </motion.div>
);

const RateCard = ({ info }) => {
  if (!info) return null;
  const effectiveDate = info.effective_date || info.rate_record_date;
  return (
    <div className="fx-rate-card">
      <div className="fx-rate-card-left">
        <i className="fas fa-coins fx-rate-icon" />
        <div>
          <span className="fx-rate-label">Closing Rate Used</span>
          <span className="fx-rate-sub">
            Effective {fmtDate(effectiveDate)} · {info.rate_source || "Manual entry"}
            {info.recorded_at ? ` · Recorded ${fmtDatetime(info.recorded_at)}` : " · Legacy record"}
          </span>
          {info.entered_after_effective_date ? (
            <span className="fx-rate-history-note">
              <i className="fas fa-clock-rotate-left" /> Historical rate entered after its effective date; valid for this closing date.
            </span>
          ) : null}
          {info.is_exact_closing_date === false ? (
            <span className="fx-rate-history-note">
              <i className="fas fa-triangle-exclamation" /> Effective before the selected closing date; confirm this is the approved closing rate.
            </span>
          ) : null}
          {info.source_reference ? <span className="fx-rate-reference">Reference: {info.source_reference}</span> : null}
        </div>
      </div>
      <div className="fx-rate-value">
        <span className="fx-rate-currency">{info.currency}</span>
        <span className="fx-rate-number">
          1 {info.currency} = {fmt(info.closing_rate)} NGN
        </span>
      </div>
    </div>
  );
};

const SummaryStrip = ({ summary }) => {
  if (!summary) return null;
  const netAmount = Number(summary.grand_total_net || 0);
  const isZero = Math.abs(netAmount) < 0.01;
  const isGain = netAmount > 0;

  return (
    <div className="fx-summary-strip">
      <div className="fx-summary-block">
        <span className="fx-summary-label">Unrealized FX Gain</span>
        <span className="fx-summary-value fx-gain-val">{fmt(summary.grand_total_gain)}</span>
        <span className="fx-summary-contra">CR {summary.contra_gain_ledger || "Exchange Gain"}</span>
      </div>
      <div className="fx-summary-divider" />
      <div className="fx-summary-block">
        <span className="fx-summary-label">Unrealized FX Loss</span>
        <span className="fx-summary-value fx-loss-val">{fmt(summary.grand_total_loss)}</span>
        <span className="fx-summary-contra">DR {summary.contra_loss_ledger || "Exchange Loss"}</span>
      </div>
      <div className="fx-summary-divider" />
      <div className={`fx-summary-block fx-summary-net-block ${!isZero && !isGain ? "fx-summary-net-block--loss" : ""}`}>
        <span className="fx-summary-label">{summary.net_label || "Net Exchange"}</span>
        <span className={`fx-summary-value ${isZero ? "fx-neutral-val" : isGain ? "fx-net-gain-val" : "fx-net-loss-val"}`}>
          {fmt(Math.abs(netAmount))}
        </span>
        <span className="fx-summary-contra">NGN-only revaluation adjustment</span>
      </div>
      <div className={`fx-summary-pill ${isZero ? "fx-summary-pill--neutral" : isGain ? "fx-summary-pill--gain" : "fx-summary-pill--loss"}`}>
        <i className={`fas ${isZero ? "fa-minus" : isGain ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} />
        {isZero ? "No Net FX" : isGain ? "Net Gain" : "Net Loss"}
      </div>
    </div>
  );
};


const fxNetDetails = (value, gainLabel, lossLabel, zeroLabel) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) < 0.01) {
    return { amount: 0, label: zeroLabel, className: "fx-neutral-val", icon: "fa-minus" };
  }
  return amount > 0
    ? { amount, label: gainLabel, className: "fx-gain-val", icon: "fa-arrow-trend-up" }
    : { amount: Math.abs(amount), label: lossLabel, className: "fx-loss-val", icon: "fa-arrow-trend-down" };
};

const buildCombinedSummary = (realizedSummary, unrealizedSummary) => {
  if (!realizedSummary && !unrealizedSummary) return null;

  const realizedGain = Number(realizedSummary?.grand_total_gain || 0);
  const realizedLoss = Number(realizedSummary?.grand_total_loss || 0);
  const realizedNet = Number(
    realizedSummary?.grand_total_net ?? realizedGain - realizedLoss
  );
  const unrealizedGain = Number(unrealizedSummary?.grand_total_gain || 0);
  const unrealizedLoss = Number(unrealizedSummary?.grand_total_loss || 0);
  const unrealizedNet = Number(
    unrealizedSummary?.grand_total_net ?? unrealizedGain - unrealizedLoss
  );

  return {
    realized_gain_ngn: realizedGain,
    realized_loss_ngn: realizedLoss,
    realized_net_ngn: realizedNet,
    unrealized_gain_ngn: unrealizedGain,
    unrealized_loss_ngn: unrealizedLoss,
    unrealized_net_ngn: unrealizedNet,
    grand_total_gain: realizedGain + unrealizedGain,
    grand_total_loss: realizedLoss + unrealizedLoss,
    grand_total_net: realizedNet + unrealizedNet,
  };
};

const CombinedFxSummary = ({ summary }) => {
  if (!summary) return null;

  const realized = fxNetDetails(
    summary.realized_net_ngn,
    "Net Realized Gain",
    "Net Realized Loss",
    "No Net Realized FX"
  );
  const unrealized = fxNetDetails(
    summary.unrealized_net_ngn,
    "Net Unrealized Gain",
    "Net Unrealized Loss",
    "No Net Unrealized FX"
  );
  const combined = fxNetDetails(
    summary.grand_total_net ?? summary.total_fx_impact_ngn,
    "Total Net FX Gain",
    "Total Net FX Loss",
    "No Net FX Impact"
  );

  const items = [
    {
      key: "realized",
      title: "Realized FX — Posted",
      detail: realized,
      gain: summary.realized_gain_ngn,
      loss: summary.realized_loss_ngn,
      note: "Read-only settlement journals",
    },
    {
      key: "unrealized",
      title: "Unrealized FX — Preview",
      detail: unrealized,
      gain: summary.unrealized_gain_ngn,
      loss: summary.unrealized_loss_ngn,
      note: "Open balances at closing date",
    },
    {
      key: "combined",
      title: "Combined FX Position",
      detail: combined,
      gain: summary.grand_total_gain,
      loss: summary.grand_total_loss,
      note: "Reporting total; not a posting amount",
    },
  ];

  return (
    <div className="fx-combined-summary">
      {items.map((item) => (
        <div
          className={`fx-combined-card fx-combined-card--${item.key}`}
          key={item.key}
        >
          <div className="fx-combined-card-head">
            <span>{item.title}</span>
            <i className={`fas ${item.detail.icon} ${item.detail.className}`} />
          </div>
          <strong className={`fx-combined-net ${item.detail.className}`}>
            ₦{fmt(item.detail.amount)}
          </strong>
          <span className="fx-combined-label">{item.detail.label}</span>
          <div className="fx-combined-gross">
            <span>Gain ₦{fmt(item.gain)}</span>
            <span>Loss ₦{fmt(item.loss)}</span>
          </div>
          <small>{item.note}</small>
        </div>
      ))}
    </div>
  );
};

const FxRecognitionGuide = () => (
  <div className="fx-recognition-guide">
    <div className="fx-recognition-item">
      <i className="fas fa-circle-check" />
      <div>
        <strong>Realized FX</strong>
        <span>
          Arises when a foreign-currency balance is settled. It is already posted through an automatic payment journal or a validated linked manual journal.
        </span>
      </div>
    </div>
    <div className="fx-recognition-divider" />
    <div className="fx-recognition-item">
      <i className="fas fa-clock-rotate-left" />
      <div>
        <strong>Unrealized FX</strong>
        <span>
          Arises from open foreign-currency balances revalued at the closing rate. Only this preview can be posted from this page.
        </span>
      </div>
    </div>
  </div>
);

const RealizedSummaryStrip = ({ summary }) => {
  if (!summary) return null;
  const net = fxNetDetails(
    summary.grand_total_net,
    "Net Realized Exchange Gain",
    "Net Realized Exchange Loss",
    "No Net Realized Exchange Gain or Loss"
  );

  return (
    <div className="fx-summary-strip fx-summary-strip--realized">
      <div className="fx-summary-block">
        <span className="fx-summary-label">Realized FX Gain</span>
        <span className="fx-summary-value fx-gain-val">{fmt(summary.grand_total_gain)}</span>
        <span className="fx-summary-contra">Posted and validated</span>
      </div>
      <div className="fx-summary-divider" />
      <div className="fx-summary-block">
        <span className="fx-summary-label">Realized FX Loss</span>
        <span className="fx-summary-value fx-loss-val">{fmt(summary.grand_total_loss)}</span>
        <span className="fx-summary-contra">Posted and validated</span>
      </div>
      <div className="fx-summary-divider" />
      <div className={`fx-summary-block fx-summary-net-block ${net.className === "fx-loss-val" ? "fx-summary-net-block--loss" : ""}`}>
        <span className="fx-summary-label">{net.label}</span>
        <span className={`fx-summary-value ${net.className}`}>{fmt(net.amount)}</span>
        <span className="fx-summary-contra">
          {Number(summary.automatic_settlement_count || 0)} automatic · {Number(summary.manual_settlement_count || 0)} manual
        </span>
      </div>
      <div className="fx-summary-pill fx-summary-pill--readonly">
        <i className="fas fa-lock" /> Read-only
      </div>
    </div>
  );
};

const RealizedFxTable = ({ records }) => {
  if (!records?.length) {
    return (
      <div className="fx-realized-empty">
        <i className="fas fa-receipt" />
        <div>
          <strong>No posted realized FX for this period.</strong>
          <span>Validated settlement journals will appear here.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-table-wrap">
      <table className="fx-table fx-realized-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Payment / Invoice</th>
            <th>Journal</th>
            <th>Source</th>
            <th className="fx-th-num">Invoice Settled</th>
            <th className="fx-th-num">Payment Received</th>
            <th className="fx-th-num">Carrying Value NGN</th>
            <th className="fx-th-num">Realized FX NGN</th>
            <th>Effect</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const signedFx = Number(record.signed_fx_ngn || 0);
            const isReversal = record.event_type === "Reversal";
            const valueClass = signedFx > 0 ? "fx-gain-val" : signedFx < 0 ? "fx-loss-val" : "fx-neutral-val";
            return (
              <tr key={`${record.event_type || "event"}-${record.journal_id || index}-${record.payment_id || index}`}>
                <td>{fmtDate(record.journal_date || record.payment_date)}</td>
                <td>
                  <span className="fx-primary-cell">{record.payment_code || `Payment ${record.payment_id}`}</span>
                  <span className="fx-secondary-cell">{record.invoice_number || "—"}</span>
                </td>
                <td>
                  <span className="fx-mono">{record.journal_id || "—"}</span>
                  {isReversal ? <span className="fx-event-badge fx-event-badge--reversal">Reversal</span> : null}
                </td>
                <td>
                  <span className={`fx-origin-badge fx-origin-badge--${String(record.journal_origin || "unknown").toLowerCase()}`}>
                    {record.journal_origin || "—"}
                  </span>
                  <span className="fx-secondary-cell">{record.journal_validation_status || "—"}</span>
                </td>
                <td className="fx-td-num">
                  {fmt(record.invoice_amount_settled)} {record.invoice_currency}
                </td>
                <td className="fx-td-num">
                  {fmt(record.payment_amount_received)} {record.payment_currency}
                </td>
                <td className="fx-td-num">{fmt(record.carrying_value_settled_ngn)}</td>
                <td className={`fx-td-num fx-diff-cell ${valueClass}`}>
                  {signedFx === 0 ? "—" : fmt(Math.abs(signedFx))}
                </td>
                <td>
                  <span className={`fx-effect-badge ${isReversal ? "fx-effect-badge--reversal" : signedFx >= 0 ? "fx-effect-badge--gain" : "fx-effect-badge--loss"}`}>
                    {record.fx_effect || "No Realized FX"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PendingManualFxSection = ({ records, summary }) => {
  if (!records?.length) return null;
  const net = Number(summary?.expected_net_ngn || 0);

  return (
    <div className="fx-pending-manual-section">
      <div className="fx-section-heading fx-section-heading--warning">
        <i className="fas fa-link-slash" />
        <span>Expected Realized FX — Journal Pending</span>
        <span className="fx-section-heading-sub">
          Excluded from realized totals until a manual journal is linked and validated
        </span>
        <span className={`fx-pending-manual-net ${net >= 0 ? "fx-gain-val" : "fx-loss-val"}`}>
          Net ₦{fmt(Math.abs(net))}
        </span>
      </div>
      <div className="fx-table-wrap">
        <table className="fx-table fx-pending-manual-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Payment</th>
              <th>Invoice</th>
              <th className="fx-th-num">Invoice Settled</th>
              <th className="fx-th-num">Payment Received</th>
              <th className="fx-th-num">Expected Gain</th>
              <th className="fx-th-num">Expected Loss</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.payment_id || index}>
                <td>{fmtDate(record.payment_date)}</td>
                <td className="fx-primary-cell">{record.payment_code}</td>
                <td>{record.invoice_number}</td>
                <td className="fx-td-num">{fmt(record.invoice_amount_settled)} {record.invoice_currency}</td>
                <td className="fx-td-num">{fmt(record.payment_amount_received)} {record.payment_currency}</td>
                <td className="fx-td-num fx-gain-val">
                  {Number(record.expected_realized_fx_gain_ngn || 0) > 0 ? fmt(record.expected_realized_fx_gain_ngn) : "—"}
                </td>
                <td className="fx-td-num fx-loss-val">
                  {Number(record.expected_realized_fx_loss_ngn || 0) > 0 ? fmt(record.expected_realized_fx_loss_ngn) : "—"}
                </td>
                <td>
                  <span className="fx-event-badge fx-event-badge--pending">
                    {record.journal_validation_status || "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryTable = ({ catKey, group }) => {
  const config = CAT_CONFIG[catKey] || { label: catKey, icon: "fa-file", isAsset: true };
  if (!group?.records?.length) return null;
  const netIsGain = Number(group.subtotal_net || 0) >= 0;

  return (
    <div className="fx-cat-section">
      <div className="fx-cat-header">
        <div className="fx-cat-header-left">
          <div className={`fx-cat-icon ${config.isAsset ? "fx-cat-icon--asset" : "fx-cat-icon--liability"}`}>
            <i className={`fas ${config.icon}`} />
          </div>
          <div>
            <span className="fx-cat-name">{config.label}</span>
            <span className={`fx-cat-type-badge ${config.isAsset ? "fx-badge--asset" : "fx-badge--liability"}`}>
              {config.isAsset ? "Asset" : "Liability"}
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
        <table className="fx-table fx-revaluation-table">
          <thead>
            <tr>
              <th>Ledger No.</th>
              <th className="fx-th-wide">Ledger Name</th>
              <th className="fx-th-num">FCY Balance</th>
              <th className="fx-th-num">Base Book NGN</th>
              <th className="fx-th-num">Prior Revaluation</th>
              <th className="fx-th-num">Current Carrying NGN</th>
              <th className="fx-th-num">Carrying Rate</th>
              <th className="fx-th-num">Closing Rate</th>
              <th className="fx-th-num">Closing Value NGN</th>
              <th className="fx-th-num">Adjustment</th>
              <th className="fx-th-num">Gain</th>
              <th className="fx-th-num">Loss</th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((row, index) => {
              const difference = Number(row.fx_difference || 0);
              return (
                <tr key={row.ledger_number || index}>
                  <td className="fx-mono">{row.ledger_number}</td>
                  <td className="fx-ledger-name">{row.ledger_name}</td>
                  <td className="fx-td-num">{fmt(row.fcy_net_balance)}</td>
                  <td className="fx-td-num">{fmt(row.base_book_value_ngn)}</td>
                  <td className="fx-td-num">{fmt(row.prior_revaluation_adjustment_ngn)}</td>
                  <td className="fx-td-num">{fmt(row.ngn_book_value)}</td>
                  <td className="fx-td-num fx-rate-cell">{fmt(row.avg_book_rate)}</td>
                  <td className="fx-td-num fx-rate-cell">{fmt(row.closing_rate)}</td>
                  <td className="fx-td-num">{fmt(row.ngn_closing_value)}</td>
                  <td className={`fx-td-num fx-diff-cell ${difference > 0 ? "fx-gain-val" : difference < 0 ? "fx-loss-val" : ""}`}>
                    {fmt(difference)}
                  </td>
                  <td className="fx-td-num fx-gain-val">
                    {Number(row.fx_gain) > 0 ? fmt(row.fx_gain) : "—"}
                  </td>
                  <td className="fx-td-num fx-loss-val">
                    {Number(row.fx_loss) > 0 ? fmt(row.fx_loss) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="fx-tfoot-row">
              <td colSpan={10} className="fx-tfoot-label">
                Subtotal — {config.label}
              </td>
              <td className="fx-td-num fx-tfoot-val fx-gain-val">{fmt(group.subtotal_gain)}</td>
              <td className="fx-td-num fx-tfoot-val fx-loss-val">{fmt(group.subtotal_loss)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const PendingJournals = ({ journals }) => {
  if (!journals?.length) {
    return (
      <div className="fx-no-journals">
        <i className="fas fa-check-circle" /> No FX differences detected — no journal is required.
      </div>
    );
  }

  const lines = journals.flatMap((journal, index) => [
    {
      key: `${index}-ledger`,
      ledgerNumber: journal.ledger_number,
      ledgerName: journal.ledger_name,
      purpose: "Revalue monetary ledger",
      debit: Number(journal.ledger_debit_ngn || 0),
      credit: Number(journal.ledger_credit_ngn || 0),
      type: journal.is_asset ? "Asset" : "Liability",
    },
    {
      key: `${index}-contra`,
      ledgerNumber: journal.contra_ledger_number,
      ledgerName: journal.contra_ledger_name,
      purpose: Number(journal.fx_difference || 0) >= 0 ? "Unrealized FX gain" : "Unrealized FX loss",
      debit: Number(journal.contra_debit_ngn || 0),
      credit: Number(journal.contra_credit_ngn || 0),
      type: journal.contra_ledger_class,
    },
  ]);

  const totalDebit = lines.reduce((total, line) => total + line.debit, 0);
  const totalCredit = lines.reduce((total, line) => total + line.credit, 0);

  return (
    <div className="fx-pending-wrap">
      <div className="fx-pending-header">
        <i className="fas fa-scale-balanced" />
        <span>
          {journals.length} ledger{journals.length === 1 ? "" : "s"} · {lines.length} balanced journal lines
        </span>
        <span className="fx-pending-note">
          NGN-only entries adjust carrying values without changing the foreign-currency balance.
        </span>
      </div>
      <div className="fx-table-wrap">
        <table className="fx-table fx-pending-table">
          <thead>
            <tr>
              <th>Ledger No.</th>
              <th className="fx-th-wide">Ledger Name</th>
              <th>Journal Purpose</th>
              <th>Class</th>
              <th className="fx-th-num">Debit NGN</th>
              <th className="fx-th-num">Credit NGN</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key}>
                <td className="fx-mono">{line.ledgerNumber}</td>
                <td className="fx-ledger-name">{line.ledgerName}</td>
                <td>{line.purpose}</td>
                <td>
                  <span className="fx-type-badge">{line.type}</span>
                </td>
                <td className="fx-td-num fx-gain-val">{line.debit > 0 ? fmt(line.debit) : "—"}</td>
                <td className="fx-td-num fx-loss-val">{line.credit > 0 ? fmt(line.credit) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="fx-tfoot-row">
              <td colSpan={4} className="fx-tfoot-label">Balanced journal totals</td>
              <td className="fx-td-num fx-tfoot-val">{fmt(totalDebit)}</td>
              <td className="fx-td-num fx-tfoot-val">{fmt(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const PostModal = ({ open, onClose, onPost, meta, posting, currency, summary, rateInfo, previewToken }) => {
  const [journalDate, setJournalDate] = useState(null);
  const [description, setDescription] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  useEffect(() => {
    if (!open) return;
    const postingDate = parseReportDate(meta?.posting_date || meta?.dateto);
    setJournalDate(postingDate);
    setDescription(`Unrealized FX Revaluation ${currency} — ${meta?.dateto || ""}`);
    setCostCenter("");
    setDescriptionError("");
  }, [currency, meta?.dateto, meta?.posting_date, open]);

  if (!open) return null;

  const handlePost = () => {
    if (!description.trim()) {
      setDescriptionError("Description is required");
      return;
    }

    onPost({
      datefrom: meta?.datefrom,
      dateto: meta?.dateto,
      currency,
      journal_date: toLocalISO(journalDate),
      journal_description: description.trim(),
      cost_center: costCenter.trim(),
      preview_token: previewToken,
    });
  };

  return (
    <div className="fx-modal-overlay" onClick={posting ? undefined : onClose}>
      <motion.div
        className="fx-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fx-modal-header">
          <div className="fx-modal-title-wrap">
            <div className="fx-modal-icon">
              <i className="fas fa-file-pen" />
            </div>
            <div>
              <h3 className="fx-modal-title">Post Unrealized FX Revaluation</h3>
              <p className="fx-modal-sub">
                Confirm the exact preview shown on the page. The backend will reject posting if balances or rates changed.
              </p>
            </div>
          </div>
          <button className="fx-modal-close" onClick={onClose} disabled={posting}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="fx-modal-body">
          <div className="fx-modal-rate-banner">
            <i className="fas fa-coins" />
            <span>
              <strong>1 {rateInfo?.currency} = {fmt(rateInfo?.closing_rate)} NGN</strong>
              <span className="fx-modal-rate-date"> · Effective {rateInfo?.effective_date || rateInfo?.rate_record_date || "—"}</span>
            </span>
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">Journal Date</label>
            <div className="form-wrapper">
              <DatePicker
                selected={journalDate}
                className="form-input"
                wrapperClassName="input-date-picker"
                dateFormat="yyyy-MM-dd"
                disabled
              />
              <span className="chevron-input-icon fas fa-lock" />
            </div>
            <span className="fx-modal-help">The journal date is fixed to the selected closing date.</span>
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">
              Journal Description <span className="fx-req">*</span>
            </label>
            <input
              className={`fx-modal-input ${descriptionError ? "input-error" : ""}`}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setDescriptionError("");
              }}
              maxLength={1000}
              placeholder="FX revaluation description"
            />
            {descriptionError ? (
              <span className="fx-modal-err">
                <i className="fas fa-circle-exclamation" /> {descriptionError}
              </span>
            ) : null}
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">
              Cost Centre <span className="fx-optional">(optional)</span>
            </label>
            <input
              className="fx-modal-input"
              value={costCenter}
              onChange={(event) => setCostCenter(event.target.value)}
              maxLength={255}
              placeholder="Cost centre code"
            />
          </div>

          <div className="fx-modal-warning">
            <i className="fas fa-scale-balanced" />
            <div>
              <span>This action posts the balanced NGN-only journal displayed in the preview.</span>
              <ul className="fx-modal-contra-list">
                {Number(summary?.grand_total_gain || 0) > 0 ? (
                  <li><strong>{summary?.contra_gain_ledger}</strong> will be credited.</li>
                ) : null}
                {Number(summary?.grand_total_loss || 0) > 0 ? (
                  <li><strong>{summary?.contra_loss_ledger}</strong> will be debited.</li>
                ) : null}
              </ul>
              <span>The foreign-currency quantity remains unchanged.</span>
            </div>
          </div>
        </div>

        <div className="fx-modal-footer">
          <button className="fx-modal-cancel" onClick={onClose} disabled={posting}>Cancel</button>
          <button className="fx-modal-post" onClick={handlePost} disabled={posting || !previewToken}>
            {posting ? (
              <><div className="fx-btn-loader fx-btn-loader--sm" /> Posting...</>
            ) : (
              <><i className="fas fa-check" /> Confirm &amp; Post</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ReverseModal = ({ open, onClose, onReverse, reversing, originalJournalId, originalDate }) => {
  const [reversalDate, setReversalDate] = useState(null);
  const [description, setDescription] = useState("");
  const [dateError, setDateError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReversalDate(parseReportDate(originalDate));
    setDescription(`Reversal of FX Revaluation — JV-${originalJournalId}`);
    setDateError("");
    setDescriptionError("");
  }, [open, originalDate, originalJournalId]);

  if (!open) return null;

  const handleReverse = () => {
    let valid = true;
    if (!reversalDate) {
      setDateError("Reversal date is required");
      valid = false;
    }
    if (!description.trim()) {
      setDescriptionError("Description is required");
      valid = false;
    }
    if (!valid) return;

    onReverse({
      journal_id: originalJournalId,
      reversal_date: toLocalISO(reversalDate),
      reversal_description: description.trim(),
    });
  };

  return (
    <div className="fx-modal-overlay" onClick={reversing ? undefined : onClose}>
      <motion.div
        className="fx-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="fx-modal-header">
          <div className="fx-modal-title-wrap">
            <div className="fx-modal-icon fx-modal-icon--danger">
              <i className="fas fa-rotate-left" />
            </div>
            <div>
              <h3 className="fx-modal-title">Reverse FX Revaluation Journal</h3>
              <p className="fx-modal-sub">
                The backend will copy the original stored lines and swap debit and credit values exactly.
              </p>
            </div>
          </div>
          <button className="fx-modal-close" onClick={onClose} disabled={reversing}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="fx-modal-body">
          <div className="fx-modal-field">
            <label className="fx-modal-label">
              Reversal Date <span className="fx-req">*</span>
            </label>
            <div className="form-wrapper">
              <DatePicker
                selected={reversalDate}
                onChange={(date) => {
                  setReversalDate(date);
                  setDateError("");
                }}
                className={`form-input ${dateError ? "input-error" : ""}`}
                wrapperClassName="input-date-picker"
                dateFormat="yyyy-MM-dd"
                minDate={parseReportDate(originalDate)}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
              <span className="chevron-input-icon fas fa-calendar" />
            </div>
            {dateError ? <span className="fx-modal-err">{dateError}</span> : null}
          </div>

          <div className="fx-modal-field">
            <label className="fx-modal-label">
              Reversal Description <span className="fx-req">*</span>
            </label>
            <input
              className={`fx-modal-input ${descriptionError ? "input-error" : ""}`}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setDescriptionError("");
              }}
              maxLength={1000}
            />
            {descriptionError ? <span className="fx-modal-err">{descriptionError}</span> : null}
          </div>

          <div className="fx-modal-warning fx-modal-warning--danger">
            <i className="fas fa-triangle-exclamation" />
            <div>
              <span>
                Later dependent revaluations or foreign-currency movements may prevent a full reversal. In that case,
                post a new closing revaluation instead.
              </span>
            </div>
          </div>
        </div>

        <div className="fx-modal-footer">
          <button className="fx-modal-cancel" onClick={onClose} disabled={reversing}>Cancel</button>
          <button className="fx-modal-post fx-modal-post--danger" onClick={handleReverse} disabled={reversing}>
            {reversing ? (
              <><div className="fx-btn-loader fx-btn-loader--sm" /> Reversing...</>
            ) : (
              <><i className="fas fa-rotate-left" /> Confirm Reversal</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SuccessBanner = ({ result, onDismiss }) => {
  if (!result) return null;
  const summary = result.summary || {};

  return (
    <motion.div className="fx-success-banner" variants={fadeUp} initial="hidden" animate="show">
      <i className="fas fa-check-circle fx-success-icon" />
      <div className="fx-success-body">
        <span className="fx-success-title">
          {result.journal_id ? "Revaluation Journal Posted" : "No Journal Required"}
        </span>
        <span className="fx-success-detail">
          {result.journal_id ? (
            <>
              Journal <strong>{result.journal_id}</strong> · Batch <strong>{result.batch_code}</strong> · {result.posted} lines · {summary.net_label}: <strong>{fmt(Math.abs(Number(summary.net_fx_ngn || 0)))}</strong> NGN
            </>
          ) : (
            result.message
          )}
        </span>
      </div>
      <button className="fx-success-dismiss" onClick={onDismiss}>
        <i className="fas fa-xmark" />
      </button>
    </motion.div>
  );
};

const FXRevaluation = () => {
  const [nav, setNav] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [rateDate, setRateDate] = useState(null);
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [currency, setCurrency] = useState(null);
  const previousCurrencyRef = useRef(null);

  const { theme } = useThemeStore();
  const {
    preview,
    posting,
    reversing,
    fetchRevaluation,
    postRevaluation,
    reverseRevaluation,
    clearPostingResult,
  } = useFXRevaluationStore();
  const { rates, searchRates, loading: ratesLoading } = useRateSearchStore();

  const restoreReportState = useCallback(
    (saved = {}) => {
      const restoredDateFrom = parseReportDate(saved.dateFrom);
      const restoredDateTo = parseReportDate(saved.dateTo);
      const restoredCurrency = saved.currency || null;
      const savedRateId = saved.rateId ?? saved.rateDate ?? null;
      const restoredRateDate = /^\d+$/.test(String(savedRateId || "")) ? String(savedRateId) : null;

      setDateFrom(restoredDateFrom);
      setDateTo(restoredDateTo);
      setCurrency(restoredCurrency);
      setRateDate(restoredRateDate);

      if (saved.hasCalculated && restoredDateFrom && restoredDateTo && restoredCurrency?.value) {
        return fetchRevaluation({
          datefrom: toLocalISO(restoredDateFrom),
          dateto: toLocalISO(restoredDateTo),
          currency: restoredCurrency.value,
          rate_id: restoredRateDate,
        }).then((result) => {
          if (result) setHasCalculated(true);
        });
      }
      return undefined;
    },
    [fetchRevaluation]
  );

  useReportPagePersistence(
    "smartbooks:report:fx-revaluation",
    {
      dateFrom: toLocalISO(dateFrom),
      dateTo: toLocalISO(dateTo),
      currency,
      rateId: rateDate,
      hasCalculated,
    },
    restoreReportState
  );

  useEffect(() => {
    document.title = "Smartbooks | FX Gain / Loss";
  }, []);

  useEffect(() => {
    const currentCurrency = currency?.value || null;
    if (currentCurrency && previousCurrencyRef.current && previousCurrencyRef.current !== currentCurrency) {
      setRateDate(null);
    }
    if (currentCurrency) searchRates("");
    previousCurrencyRef.current = currentCurrency;
  }, [currency?.value, searchRates]);

  const rateOptions = useMemo(() => {
    const rateKey = currency?.value?.toLowerCase();
    const closingDate = toLocalISO(dateTo);
    if (!rateKey) return [];

    return rates
      .filter((rate) => rate[`${rateKey}_rate`] != null)
      .filter((rate) => {
        const effectiveDate = String(rate.effective_date || rate.created_at || "").slice(0, 10);
        return effectiveDate && (!closingDate || effectiveDate <= closingDate);
      })
      .map((rate) => {
        const effectiveDate = String(rate.effective_date || rate.created_at || "").slice(0, 10);
        const recordedLabel = rate.recorded_at
          ? `recorded ${String(rate.recorded_at).slice(0, 10)}`
          : "legacy record";
        return {
          value: String(rate.id),
          label: `${effectiveDate} | ${currency.value} @ ${rate[`${rateKey}_rate`]} · ${recordedLabel}`,
          rate,
        };
      });
  }, [currency, dateTo, rates]);

  useEffect(() => {
    if (rateDate && !rateOptions.some((option) => option.value === rateDate)) {
      setRateDate(null);
    }
  }, [rateDate, rateOptions]);

  const validate = () => {
    const nextErrors = {};
    if (!dateFrom) nextErrors.dateFrom = "Required";
    if (!dateTo) nextErrors.dateTo = "Required";
    if (dateFrom && dateTo && dateFrom > dateTo) nextErrors.dateTo = "Must be on or after Date From";
    if (!currency) nextErrors.currency = "Required";
    return nextErrors;
  };

  const handleFetch = useCallback(async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const result = await fetchRevaluation({
      datefrom: toLocalISO(dateFrom),
      dateto: toLocalISO(dateTo),
      currency: currency.value,
      rate_id: rateDate,
    });
    if (result) setHasCalculated(true);
  }, [currency, dateFrom, dateTo, fetchRevaluation, rateDate]);

  const handlePost = useCallback(
    async (body) => {
      const result = await postRevaluation({ ...body, rate_id: rateDate });
      if (!result) return;
      setShowPostModal(false);
      await fetchRevaluation({
        datefrom: toLocalISO(dateFrom),
        dateto: toLocalISO(dateTo),
        currency: currency.value,
        rate_id: rateDate,
      });
    },
    [currency, dateFrom, dateTo, fetchRevaluation, postRevaluation, rateDate]
  );

  const handleReverse = useCallback(
    async (body) => {
      const result = await reverseRevaluation(body);
      if (!result) return;
      setShowReverseModal(false);
      await fetchRevaluation({
        datefrom: toLocalISO(dateFrom),
        dateto: toLocalISO(dateTo),
        currency: currency.value,
        rate_id: rateDate,
      });
    },
    [currency, dateFrom, dateTo, fetchRevaluation, rateDate, reverseRevaluation]
  );

  const periodStatus = preview.periodStatus || {};
  const periodIsLocked = Boolean(periodStatus.is_locked);
  const alreadyPosted = Boolean(periodStatus.already_posted);
  const canReverse = Boolean(periodStatus.can_reverse);
  const schemaReady = preview.meta?.schema_ready !== false;
  const realizedSchemaReady =
    preview.meta?.realized_reporting_schema_ready !== false;
  const hasPending = preview.pendingJournals.length > 0;
  const combinedSummary =
    preview.combinedSummary ||
    buildCombinedSummary(preview.realizedSummary, preview.summary);

  const previewMatchesFilters =
    preview.meta?.datefrom === toLocalISO(dateFrom) &&
    preview.meta?.dateto === toLocalISO(dateTo) &&
    preview.meta?.currency === currency?.value &&
    (!rateDate || String(preview.meta?.rate_id || "") === String(rateDate));

  const canPost =
    hasPending &&
    schemaReady &&
    !periodIsLocked &&
    !alreadyPosted &&
    previewMatchesFilters &&
    Boolean(preview.previewToken) &&
    !posting.loading;

  let postButtonTitle = "Post the journal shown in the preview";
  if (!hasPending) postButtonTitle = "No FX difference to post";
  else if (!schemaReady) postButtonTitle = "Apply the FX database migration first";
  else if (periodIsLocked) postButtonTitle = "The closing date is in a locked period";
  else if (alreadyPosted) postButtonTitle = "A revaluation already exists for this closing date";
  else if (!previewMatchesFilters) postButtonTitle = "Refresh the preview after changing filters";

  const links = [
    { label: "Home", to: "/", active: true },
    { label: "FX Gain / Loss", to: "/reports/fx-revaluation", active: false },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`fx-root theme-${theme}`}>
          <div className="fx-page">
            <PageNav pageTitle="FX Gain / Loss" links={links} />

            <FilterBar
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              currency={currency}
              setCurrency={setCurrency}
              rateDate={rateDate}
              setRateDate={setRateDate}
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
                    {posting.result ? (
                      <SuccessBanner result={posting.result} onDismiss={clearPostingResult} />
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {!schemaReady ? (
                      <StatusBanner
                        key="schema"
                        type="locked"
                        icon="fa-database"
                        title="FX migration is not installed."
                      >
                        Preview is available, but posting and tracked reversals are disabled until the backend migration is applied.
                      </StatusBanner>
                    ) : null}
                    {periodIsLocked ? (
                      <StatusBanner key="locked" type="locked" icon="fa-lock" title="Accounting period is locked.">
                        Previewing is allowed, but posting is disabled. {periodStatus.lock_reason ? `Reason: ${periodStatus.lock_reason}` : ""}
                      </StatusBanner>
                    ) : null}
                    {alreadyPosted ? (
                      <StatusBanner key="posted" type="warn" icon="fa-triangle-exclamation" title="Revaluation already exists for this closing date.">
                        Journal {periodStatus.posted_journal_id}{periodStatus.batch_code ? ` · Batch ${periodStatus.batch_code}` : ""}.
                        {canReverse
                          ? " Reverse the active journal before posting a same-date replacement."
                          : ` It was reversed on ${periodStatus.reversal_date || "a later date"} and remains part of the historical closing-date balance.`}
                      </StatusBanner>
                    ) : null}
                    {!previewMatchesFilters ? (
                      <StatusBanner key="stale" type="info" icon="fa-rotate" title="The displayed preview is out of date.">
                        One or more filters changed after calculation. Generate a new preview before posting.
                      </StatusBanner>
                    ) : null}
                    {!realizedSchemaReady ? (
                      <StatusBanner
                        key="realized-schema"
                        type="warn"
                        icon="fa-chart-line"
                        title="Realized FX reporting is unavailable."
                      >
                        Apply the mixed-currency payment and manual journal-linking migrations to include posted realized FX.
                      </StatusBanner>
                    ) : null}
                    {preview.warnings.map((warning, index) => (
                      <StatusBanner key={`warning-${index}`} type="warn" icon="fa-circle-info" title="FX review note">
                        {typeof warning === "string"
                          ? warning
                          : warning?.message || "Review the FX result before posting."}
                      </StatusBanner>
                    ))}
                  </AnimatePresence>

                  <div className="fx-action-bar">
                    <div className="fx-action-left">
                      <div className="fx-results-badge">
                        <i className="fas fa-chart-line" /> FX Gain / Loss Review
                      </div>
                      <div className="fx-period-badge">
                        <i className="fas fa-calendar-days" />
                        {fmtDate(preview.meta?.datefrom)} — {fmtDate(preview.meta?.dateto)}
                      </div>
                      <div className="fx-currency-badge">
                        <i className="fas fa-coins" /> {preview.meta?.currency}
                      </div>
                    </div>
                  </div>

                  <CombinedFxSummary summary={combinedSummary} />
                  <FxRecognitionGuide />

                  <div className="fx-report-paper fx-report-paper--realized">
                    <div className="fx-report-paper-header">
                      <div className="fx-report-title-block">
                        <div className="fx-title-with-badge">
                          <h2 className="fx-report-title">Realized Exchange Gain / Loss</h2>
                          <span className="fx-readonly-badge">
                            <i className="fas fa-lock" /> Read-only
                          </span>
                        </div>
                        <p className="fx-report-sub">
                          Posted settlement FX from automatic journals and linked, validated manual journals within the selected period.
                        </p>
                      </div>
                    </div>
                    <RealizedSummaryStrip summary={preview.realizedSummary} />
                    <RealizedFxTable records={preview.realizedData} />
                  </div>

                  <PendingManualFxSection
                    records={preview.pendingManualJournals}
                    summary={preview.pendingManualSummary}
                  />

                  <div className="fx-unrealized-heading">
                    <div>
                      <span className="fx-workspace-kicker">Postable preview</span>
                      <h2>Unrealized Exchange Gain / Loss</h2>
                      <p>
                        Open foreign-currency balances revalued at the closing rate. The action below applies only to this unrealized journal.
                      </p>
                    </div>
                    <div className="fx-action-right">
                      {alreadyPosted ? (
                        <button
                          className="fx-post-btn fx-post-btn--danger"
                          onClick={() => setShowReverseModal(true)}
                          disabled={!canReverse || reversing.loading || !schemaReady}
                          title={canReverse ? "Reverse the active revaluation" : "This historical journal cannot be reversed from this closing-date preview"}
                        >
                          <i className="fas fa-rotate-left" /> {canReverse ? "Reverse Journal" : "Historical Journal"}
                        </button>
                      ) : (
                        <button
                          className="fx-post-btn"
                          onClick={() => setShowPostModal(true)}
                          disabled={!canPost}
                          title={postButtonTitle}
                        >
                          {periodIsLocked ? (
                            <><i className="fas fa-lock" /> Period Locked</>
                          ) : (
                            <><i className="fas fa-file-pen" /> Post Previewed Journal</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <RateCard info={preview.closingRateInfo} />
                  <SummaryStrip summary={preview.summary} />

                  <div className="fx-report-paper">
                    <div className="fx-report-paper-header">
                      <div className="fx-report-title-block">
                        <h2 className="fx-report-title">Open Balance Revaluation</h2>
                        <p className="fx-report-sub">
                          Incremental unrealized adjustment as at {fmtDate(preview.meta?.dateto)}. Previous active revaluation adjustments are included in the current carrying value.
                        </p>
                      </div>
                    </div>
                    <div className="fx-sections">
                      {Object.keys(CAT_CONFIG).map((key) =>
                        preview.data[key] ? <CategoryTable key={key} catKey={key} group={preview.data[key]} /> : null
                      )}
                    </div>
                  </div>

                  <div className="fx-pending-section">
                    <div className="fx-section-heading">
                      <i className="fas fa-list-check" />
                      <span>Exact Unrealized Journal Preview</span>
                      <span className="fx-section-heading-sub">Review debit and credit lines before posting</span>
                    </div>
                    <PendingJournals journals={preview.pendingJournals} />
                    <div className="fx-journal-scope-note">
                      <i className="fas fa-circle-info" />
                      <span>
                        <strong>Recognition:</strong> Realized FX is already posted when a balance is settled. Unrealized FX remains on open balances and is the only amount posted by this button.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPostModal ? (
          <PostModal
            open={showPostModal}
            onClose={() => setShowPostModal(false)}
            onPost={handlePost}
            meta={preview.meta}
            posting={posting.loading}
            currency={currency?.value}
            summary={preview.summary}
            rateInfo={preview.closingRateInfo}
            previewToken={preview.previewToken}
          />
        ) : null}

        {showReverseModal ? (
          <ReverseModal
            open={showReverseModal}
            onClose={() => setShowReverseModal(false)}
            onReverse={handleReverse}
            reversing={reversing.loading}
            originalJournalId={periodStatus.posted_journal_id}
            originalDate={preview.meta?.dateto}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default FXRevaluation;
