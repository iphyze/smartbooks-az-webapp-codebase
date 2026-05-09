import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const Skel = ({ h = 200 }) => (
  <span className="db-skel" style={{ height: h, display: "block", borderRadius: 10 }} />
);

const fmtShort = (val) => {
  const n = parseFloat(val) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
};

const fmt = (val, currency = "") => {
  const n = parseFloat(val) || 0;
  const prefix = currency ? `${currency} ` : "";
  if (Math.abs(n) >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};

/* ── Custom tooltip ── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="db-tooltip__row">
          <span className="db-tooltip__dot" style={{ background: p.color }} />
          <span className="db-tooltip__val">{p.name}: {fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* Softer palette — refined, not garish */
const C_TEAL = "#00b196";
const C_TEAL2 = "#00856e";
const C_CORAL = "#e05c6a";   /* soft red, not alarm-red */
const C_SLATE = "#5b7fa6";   /* steel blue, not electric blue */
const C_AMBER = "#d97706";
const C_PURPLE = "#7c5cbf";
const C_SAGE = "#4d9e8c";
const C_WARM = "#c47a2e";

const STATUS_PALETTE = {
  Paid: C_TEAL,
  Pending: C_AMBER,
  Overdue: C_CORAL,
  Cancelled: "#94a3b8",
  Partial: C_PURPLE,
};

const CurrencyTabs = ({ options, active, onChange }) => (
  <div className="db-cur-tabs">
    {options.map(c => (
      <button key={c} className={`db-cur-btn ${active === c ? "active" : ""}`}
        onClick={() => onChange(c)}>{c}</button>
    ))}
  </div>
);

/* ══════════════════════════════════════
   TREND CHART — Area with gradient fill
══════════════════════════════════════ */
export const TrendChart = ({ data, currency, onCurrencyChange, loading, delay = 0 }) => (
  <motion.div className="db-card db-grid-full"
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}>
    <div className="db-card__head">
      <span className="db-card__title">
        <i className="fas fa-chart-area" /> Monthly Revenue & Expense Trend
      </span>
      <div className="db-card__action">
        <CurrencyTabs options={["NGN", "USD", "GBP", "EUR"]} active={currency} onChange={onCurrencyChange} />
      </div>
    </div>
    <div className="db-card__body">
      {loading ? <Skel h={240} /> : data.length > 0 ? (
        <div className="db-chart-scroll">
          <div style={{ minWidth: Math.max(data.length * 72, 420) }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_TEAL} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={C_TEAL} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_CORAL} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={C_CORAL} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--db-chart-grid)" vertical={false} />
                <XAxis dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--db-chart-text)", fontFamily: "DM Sans" }}
                  axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort}
                  tick={{ fontSize: 11, fill: "var(--db-chart-text)", fontFamily: "DM Sans" }}
                  axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="Revenue"
                  stroke={C_TEAL} strokeWidth={2.5} fill="url(#gRev)"
                  dot={{ r: 3, fill: C_TEAL, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: C_TEAL, stroke: "var(--db-surface)", strokeWidth: 2 }} />
                <Area type="monotone" dataKey="Expenses"
                  stroke={C_CORAL} strokeWidth={2.5} fill="url(#gExp)"
                  dot={{ r: 3, fill: C_CORAL, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: C_CORAL, stroke: "var(--db-surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="db-empty"><i className="fas fa-chart-area" /><p>No trend data for {currency}</p></div>
      )}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════
   INVOICE STATUS — Horizontal stacked
   progress bars instead of pie
══════════════════════════════════════ */
export const InvoiceStatusPie = ({ data, loading, delay = 0 }) => {
  const total = data.reduce((s, d) => s + (parseFloat(d.value) || 0), 0);
  const totalCount = data.reduce((s, d) => s + (parseInt(d.count) || 0), 0);

  return (
    <motion.div className="db-card"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}>
      <div className="db-card__head">
        <span className="db-card__title"><i className="fas fa-chart-pie" /> Invoice Status</span>
        <span className="db-status-total-badge">{totalCount} total</span>
      </div>
      <div className="db-card__body">
        {loading ? <Skel h={220} /> : data.length > 0 ? (
          <div className="db-status-breakdown">
            {/* Segmented bar */}
            <div className="db-seg-bar">
              {data.map((entry, i) => {
                const pct = total > 0 ? (parseFloat(entry.value) / total) * 100 : 0;
                const color = STATUS_PALETTE[entry.name] || C_SAGE;
                return (
                  <div key={i} className="db-seg-bar__fill"
                    style={{ width: `${pct}%`, background: color }}
                    title={`${entry.name}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Rows */}
            <div className="db-status-rows">
              {data.map((entry, i) => {
                const color = STATUS_PALETTE[entry.name] || C_SAGE;
                const pct = total > 0 ? ((parseFloat(entry.value) / total) * 100).toFixed(1) : "0.0";
                const barW = total > 0 ? (parseFloat(entry.value) / total) * 100 : 0;
                return (
                  <div key={i} className="db-status-row">
                    <div className="db-status-row__left">
                      <span className="db-status-dot" style={{ background: color }} />
                      <span className="db-status-name">{entry.name}</span>
                    </div>
                    <div className="db-status-row__bar-wrap">
                      <div className="db-status-row__bar">
                        <div className="db-status-row__fill"
                          style={{ width: `${barW}%`, background: color }} />
                      </div>
                    </div>
                    <div className="db-status-row__right">
                      <span className="db-status-count">{entry.count}</span>
                      <span className="db-status-val">{fmtShort(entry.value)}</span>
                      <span className="db-status-pct">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="db-status-footer">
              <span className="db-status-footer__label">Total invoiced</span>
              <span className="db-status-footer__val">{fmt(total)}</span>
            </div>
          </div>
        ) : (
          <div className="db-empty"><i className="fas fa-chart-pie" /><p>No invoice data</p></div>
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   TOP CLIENTS — Horizontal bar chart
   (cleaner, name labels on the left)
══════════════════════════════════════ */
export const TopClientsChart = ({ data, loading, delay = 0 }) => {
  const [metric, setMetric] = useState("both"); // "billed" | "outstanding" | "both"

  /* Recharts layout="vertical" for horizontal bars */
  return (
    <motion.div className="db-card db-grid-full"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}>
      <div className="db-card__head">
        <span className="db-card__title"><i className="fas fa-ranking-star" /> Top Clients by Billing</span>
        <div className="db-card__action" style={{ gap: 6 }}>
          {[
            { v: "both", label: "Both" },
            { v: "billed", label: "Billed" },
            { v: "outstanding", label: "Outstanding" },
          ].map(m => (
            <button key={m.v}
              className={`db-metric-btn ${metric === m.v ? "active" : ""}`}
              onClick={() => setMetric(m.v)}>
              {m.label}
            </button>
          ))}
          <Link to="/client/home" className="db-card__link">View all <i className="fas fa-arrow-right" /></Link>
        </div>
      </div>
      <div className="db-card__body">
        {loading ? <Skel h={240} /> : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 200)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 80, left: 4, bottom: 4 }}
              barGap={3}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="4 4" stroke="var(--db-chart-grid)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmtShort}
                tick={{ fontSize: 11, fill: "var(--db-chart-text)", fontFamily: "DM Sans" }}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120}
                tick={{ fontSize: 12, fill: "var(--db-text-2)", fontFamily: "DM Sans", fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {(metric === "both" || metric === "billed") && (
                <Bar dataKey="Billed" fill={C_SLATE} radius={[0, 5, 5, 0]} maxBarSize={16}
                  label={{
                    position: "right", formatter: fmtShort, fontSize: 10,
                    fill: "var(--db-text-3)", fontFamily: "DM Sans"
                  }} />
              )}
              {(metric === "both" || metric === "outstanding") && (
                <Bar dataKey="Outstanding" fill={C_CORAL} radius={[0, 5, 5, 0]} maxBarSize={16}
                  opacity={0.85}
                  label={{
                    position: "right", formatter: fmtShort, fontSize: 10,
                    fill: "var(--db-text-3)", fontFamily: "DM Sans"
                  }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="db-empty"><i className="fas fa-users" /><p>No client data</p></div>
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   TRANSACTION ACTIVITY
   Grouped vertical bars — cleaner read
══════════════════════════════════════ */
export const TransactionActivity = ({ data, loading, delay = 0 }) => {
  const hasData = data.some(j => j.Debit > 0 || j.Credit > 0);
  return (
    <motion.div className="db-card"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}>
      <div className="db-card__head">
        <span className="db-card__title"><i className="fas fa-book-open" /> Transaction Activity</span>
        <Link to="/journal/home" className="db-card__link"><i className="fas fa-arrow-right" /></Link>
      </div>
      <div className="db-card__body">
        {loading ? <Skel h={200} /> : hasData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="4 4" stroke="var(--db-chart-grid)" vertical={false} />
              <XAxis dataKey="name"
                tick={{ fontSize: 11, fill: "var(--db-chart-text)", fontFamily: "DM Sans" }}
                axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort}
                tick={{ fontSize: 10, fill: "var(--db-chart-text)", fontFamily: "DM Sans" }}
                axisLine={false} tickLine={false} width={46} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <Bar dataKey="Debit" fill={C_CORAL} radius={[4, 4, 0, 0]} maxBarSize={28} opacity={0.85} />
              <Bar dataKey="Credit" fill={C_TEAL} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="db-empty"><i className="fas fa-book-open" /><p>No journal data</p></div>
        )}
      </div>
    </motion.div>
  );
};