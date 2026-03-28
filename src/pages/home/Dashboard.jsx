import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../NavBar";
import Header from "../Header";
import useThemeStore from "../../stores/useThemeStore";
import useDashboardStore from "../../stores/useDashboardStore";
import PageNav from "../../components/PageNav";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import "./Dashboard.css";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const fmt = (val, currency = "NGN") => {
  const num = parseFloat(val) || 0;
  if (Math.abs(num) >= 1_000_000) return `${currency} ${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${currency} ${(num / 1_000).toFixed(1)}K`;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtShort = (val) => {
  const num = parseFloat(val) || 0;
  if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
};

const TEAL   = "#00b196";
const BLUE   = "#004AAD";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";
const SLATE  = "#64748b";

const STATUS_COLOR = { Paid: TEAL, Pending: AMBER, Overdue: RED, Cancelled: SLATE, Partial: PURPLE };
const PIE_COLORS   = [TEAL, BLUE, AMBER, RED, PURPLE, "#10b981", "#f97316"];

/* ─────────────────────────────────────────
   Skeleton loader
───────────────────────────────────────── */
const Skeleton = ({ h = 20, w = "100%", radius = 6 }) => (
  <div className="db-skeleton" style={{ height: h, width: w, borderRadius: radius }} />
);

/* ─────────────────────────────────────────
   Stat card
───────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, accent, loading, delay = 0 }) => (
  <motion.div
    className="db-stat-card"
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    style={{ "--accent": accent || TEAL }}
  >
    <div className="db-stat-icon-wrap">
      <i className={`fas ${icon}`} />
    </div>
    <div className="db-stat-body">
      <span className="db-stat-label">{label}</span>
      {loading
        ? <Skeleton h={28} w={120} radius={5} />
        : <span className="db-stat-value">{value}</span>
      }
      {sub && <span className="db-stat-sub">{sub}</span>}
    </div>
    <div className="db-stat-stripe" />
  </motion.div>
);

/* ─────────────────────────────────────────
   Section card wrapper
───────────────────────────────────────── */
const SectionCard = ({ title, icon, children, action, className = "", delay = 0 }) => (
  <motion.div
    className={`db-section-card ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
  >
    <div className="db-section-head">
      <span className="db-section-title">
        {icon && <i className={`fas ${icon}`} />}
        {title}
      </span>
      {action && <div className="db-section-action">{action}</div>}
    </div>
    <div className="db-section-body">{children}</div>
  </motion.div>
);

/* ─────────────────────────────────────────
   Custom chart tooltip
───────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-chart-tip">
      <p className="db-chart-tip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="db-chart-tip-val">
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   Currency tab
───────────────────────────────────────── */
const CurrencyTabs = ({ options, active, onChange }) => (
  <div className="db-cur-tabs">
    {options.map(c => (
      <button
        key={c}
        className={`db-cur-btn ${active === c ? "active" : ""}`}
        onClick={() => onChange(c)}
      >{c}</button>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   Badge
───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const color = STATUS_COLOR[status] || SLATE;
  return (
    <span className="db-badge" style={{ "--bc": color }}>
      <span className="db-badge-dot" />
      {status}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [nav, setNav]           = useState(false);
  const [activeCur, setActiveCur] = useState("NGN");
  const [trendCur, setTrendCur]   = useState("NGN");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  const { theme }                                = useThemeStore();
  const { data, loading, fetchDashboardData, setDateFilter } = useDashboardStore();

  const links = [{ label: "Home", to: "/", active: true }];

  useEffect(() => {
    document.title = "Smartbooks | Dashboard";
    fetchDashboardData();
  }, []);

  /* ── Derived values ── */
  const overview  = data?.data?.overview  || {};
  const rates     = data?.data?.latest_rates || null;
  const bankData  = data?.data?.bank_balances || {};
  const topClients = data?.data?.top_clients || [];
  const recentInv  = data?.data?.recent_invoices || [];
  const revEx      = data?.data?.revenue_expenses || [];
  const monthly    = data?.data?.monthly_trend || [];
  const invStatus  = data?.data?.invoice_status || {};
  const receivables = data?.data?.receivables || [];
  const jSummary   = data?.data?.journal_summary || [];

  /* Receivables for active currency */
  const activeReceiv = useMemo(() =>
    receivables.find(r => r.currency === activeCur) || {},
    [receivables, activeCur]
  );

  /* Revenue/expense for active currency */
  const activeRevEx = useMemo(() =>
    revEx.find(r => r.currency === activeCur) || {},
    [revEx, activeCur]
  );

  /* Monthly trend data formatted for chart */
  const trendData = useMemo(() => {
    const filtered = monthly.filter(m => m.currency === trendCur);
    return filtered.map(m => ({
      month: m.month,
      Revenue: parseFloat(m.revenue) || 0,
      Expenses: parseFloat(m.expenses) || 0,
    }));
  }, [monthly, trendCur]);

  /* Invoice status pie data */
  const statusPie = useMemo(() => {
    const rows = invStatus[activeCur] || [];
    return rows.map(r => ({ name: r.status, value: parseFloat(r.total_amount) || 0, count: r.count }));
  }, [invStatus, activeCur]);

  /* Top clients bar data */
  const clientBar = useMemo(() =>
    topClients
      .filter(c => c.currency === activeCur)
      .slice(0, 7)
      .map(c => ({
        name: c.clients_name.split(" ").slice(0, 2).join(" "),
        Billed: parseFloat(c.total_billed) || 0,
        Outstanding: parseFloat(c.total_outstanding) || 0,
      })),
    [topClients, activeCur]
  );

  /* Journal type summary */
  const journalBars = useMemo(() =>
    jSummary
      .filter(j => j.currency === activeCur)
      .slice(0, 8)
      .map(j => ({
        name: `${j.journal_type}`.slice(0, 10),
        Debit: parseFloat(j.total_debit) || 0,
        Credit: parseFloat(j.total_credit) || 0,
      })),
    [jSummary, activeCur]
  );

  /* Bank NGN accounts */
  const bankAccounts = bankData.accounts || [];
  const totalBankNGN = parseFloat(bankData.total_ngn) || 0;
  const totalBankUSD = parseFloat(bankData.total_usd) || 0;

  /* Net position */
  const netPosition = (parseFloat(activeRevEx.total_revenue) || 0)
    - (parseFloat(activeRevEx.total_expenses) || 0);

  const handleDateFilter = () => {
    setDateFilter(dateFrom, dateTo);
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <PageNav pageTitle="Dashboard" links={links} />

        {/* ── Top controls bar ── */}
        <motion.div
          className="db-controls-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="db-date-filter">
            <div className="db-date-input-wrap">
              <i className="fas fa-calendar-alt" />
              <input
                type="date"
                className="db-date-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From"
              />
            </div>
            <span className="db-date-sep">—</span>
            <div className="db-date-input-wrap">
              <i className="fas fa-calendar-alt" />
              <input
                type="date"
                className="db-date-input"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
            <button className="db-filter-btn" onClick={handleDateFilter}>
              <i className="fas fa-filter" /> Apply
            </button>
            {(dateFrom || dateTo) && (
              <button className="db-filter-clear-btn" onClick={() => {
                setDateFrom(""); setDateTo("");
                setDateFilter("", "");
              }}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <CurrencyTabs
            options={["NGN", "USD", "GBP", "EUR"]}
            active={activeCur}
            onChange={setActiveCur}
          />
        </motion.div>

        {/* ── STAT CARDS ROW ── */}
        <div className="db-stats-grid">
          <StatCard icon="fa-users" label="Total Clients"
            value={overview.total_clients ?? "—"} sub="Active on record"
            accent={TEAL} loading={loading} delay={0.05} />
          <StatCard icon="fa-file-invoice-dollar" label="Total Invoices"
            value={overview.total_invoices ?? "—"} sub="Across all currencies"
            accent={BLUE} loading={loading} delay={0.10} />
          <StatCard icon="fa-book" label="Journal Entries"
            value={overview.total_journals ?? "—"} sub="All ledger postings"
            accent={PURPLE} loading={loading} delay={0.15} />
          <StatCard icon="fa-user-shield" label="System Users"
            value={overview.total_users ?? "—"} sub="Active accounts"
            accent={AMBER} loading={loading} delay={0.20} />
        </div>

        {/* ── RECEIVABLES + REVENUE ROW ── */}
        <div className="db-row db-row-thirds">

          {/* Receivables */}
          <SectionCard title="Receivables" icon="fa-hand-holding-usd" delay={0.25}
            action={
              <Link to="/invoice/home" className="db-section-link">
                <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              <><Skeleton h={22} w="70%" /><Skeleton h={18} w="50%" /></>
            ) : (
              <>
                <div className="db-receiv-total">
                  <span className="db-receiv-label">Total Unpaid</span>
                  <span className="db-receiv-amount">{fmt(
                    (parseFloat(activeReceiv.total_receivables) || 0), activeCur
                  )}</span>
                </div>
                <div className="db-receiv-split">
                  <div className="db-receiv-col current">
                    <span className="db-receiv-col-label">Current</span>
                    <span className="db-receiv-col-val">
                      {fmt(activeReceiv.current_receivables || 0, activeCur)}
                    </span>
                  </div>
                  <div className="db-receiv-col overdue">
                    <span className="db-receiv-col-label">Overdue</span>
                    <span className="db-receiv-col-val overdue-val">
                      {fmt(activeReceiv.overdue_receivables || 0, activeCur)}
                    </span>
                  </div>
                </div>
                <div className="db-receiv-counts">
                  {["paid_count","unpaid_count","partial_count"].map(k => (
                    <div key={k} className={`db-count-chip ${k.replace("_count","")}`}>
                      <span>{activeReceiv[k] || 0}</span>
                      <span className="db-count-lbl">{k.replace("_count","")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* Revenue / Expenses */}
          <SectionCard title="Revenue & Expenses" icon="fa-chart-line" delay={0.28}
            action={
              <Link to="/journal/home" className="db-section-link">
                <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              <><Skeleton h={22} w="70%" /><Skeleton h={18} w="50%" /></>
            ) : (
              <>
                <div className="db-revex-row">
                  <span className="db-revex-icon revenue"><i className="fas fa-arrow-trend-up" /></span>
                  <div>
                    <span className="db-revex-label">Total Revenue</span>
                    <span className="db-revex-val revenue-val">
                      {fmt(activeRevEx.total_revenue || 0, activeCur)}
                    </span>
                  </div>
                </div>
                <div className="db-revex-row">
                  <span className="db-revex-icon expense"><i className="fas fa-arrow-trend-down" /></span>
                  <div>
                    <span className="db-revex-label">Total Expenses</span>
                    <span className="db-revex-val expense-val">
                      {fmt(activeRevEx.total_expenses || 0, activeCur)}
                    </span>
                  </div>
                </div>
                <div className={`db-net-position ${netPosition >= 0 ? "positive" : "negative"}`}>
                  <i className={`fas ${netPosition >= 0 ? "fa-circle-check" : "fa-circle-exclamation"}`} />
                  <span>Net Position: <strong>{fmt(Math.abs(netPosition), activeCur)}</strong>
                    {netPosition < 0 ? " deficit" : " surplus"}
                  </span>
                </div>
              </>
            )}
          </SectionCard>

          {/* Exchange Rates */}
          <SectionCard title="Exchange Rates" icon="fa-money-bill-transfer" delay={0.31}
            action={
              <Link to="/currency/home" className="db-section-link">
                <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              <><Skeleton h={18} w="100%" /><Skeleton h={18} w="100%" /></>
            ) : rates ? (
              <div className="db-rates-grid">
                {[
                  { cur: "USD", rate: rates.usd_rate },
                  { cur: "GBP", rate: rates.gbp_rate },
                  { cur: "EUR", rate: rates.eur_rate },
                ].map(({ cur, rate }) => (
                  <div key={cur} className="db-rate-row">
                    <span className="db-rate-pair">{cur} / NGN</span>
                    <span className="db-rate-val">
                      {parseFloat(rate)?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}
                    </span>
                  </div>
                ))}
                <div className="db-rate-updated">
                  <i className="fas fa-clock" /> Updated: {rates.created_at?.split(" ")[0] ?? "—"}
                </div>
              </div>
            ) : (
              <p className="db-empty-text">No rate data available</p>
            )}
          </SectionCard>
        </div>

        {/* ── MONTHLY TREND CHART ── */}
        <SectionCard
          title="Monthly Revenue & Expense Trend"
          icon="fa-chart-area"
          delay={0.33}
          className="db-card-full"
          action={
            <CurrencyTabs
              options={["NGN", "USD"]}
              active={trendCur}
              onChange={setTrendCur}
            />
          }
        >
          {loading ? (
            <Skeleton h={260} />
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={TEAL}  stopOpacity={0.25} />
                    <stop offset="95%" stopColor={TEAL}  stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={RED}   stopOpacity={0.2} />
                    <stop offset="95%" stopColor={RED}   stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} width={60} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="Revenue" stroke={TEAL}
                  strokeWidth={2} fill="url(#gradRev)" dot={{ r: 3 }} />
                <Area type="monotone" dataKey="Expenses" stroke={RED}
                  strokeWidth={2} fill="url(#gradExp)" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-empty-chart">
              <i className="fas fa-chart-area" />
              <p>No trend data available for {trendCur}</p>
            </div>
          )}
        </SectionCard>

        {/* ── BANK BALANCES + INVOICE STATUS PIE ── */}
        <div className="db-row db-row-half">

          {/* Bank Balances */}
          <SectionCard title="Bank Balances" icon="fa-building-columns" delay={0.36}
            action={
              <Link to="/bank/home" className="db-section-link">
                <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              [1,2,3,4].map(i => <Skeleton key={i} h={18} w="100%" />)
            ) : (
              <>
                <div className="db-bank-list">
                  {bankAccounts.slice(0, 6).map((acct, i) => (
                    <div key={i} className="db-bank-row">
                      <div className="db-bank-info">
                        <span className="db-bank-name">{acct.ledger_name || "Account"}</span>
                        <span className="db-bank-num">{acct.ledger_number}</span>
                      </div>
                      <span className={`db-bank-bal ${parseFloat(acct.balance_ngn) < 0 ? "neg" : ""}`}>
                        {parseFloat(acct.balance_ngn) < 0 ? "(" : ""}
                        {Math.abs(parseFloat(acct.balance_ngn) || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2, maximumFractionDigits: 2
                        })}
                        {parseFloat(acct.balance_ngn) < 0 ? ")" : ""}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="db-bank-totals">
                  <div className="db-bank-total-row">
                    <span>Total NGN</span>
                    <span>{fmt(totalBankNGN, "NGN")}</span>
                  </div>
                  {totalBankUSD !== 0 && (
                    <div className="db-bank-total-row">
                      <span>Total USD</span>
                      <span>{fmt(totalBankUSD, "USD")}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </SectionCard>

          {/* Invoice Status Breakdown */}
          <SectionCard title="Invoice Status Breakdown" icon="fa-chart-pie" delay={0.39}>
            {loading ? (
              <Skeleton h={240} />
            ) : statusPie.length > 0 ? (
              <div className="db-pie-wrap">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLOR[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtShort(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-pie-legend">
                  {statusPie.map((entry, i) => (
                    <div key={i} className="db-pie-leg-row">
                      <span className="db-pie-dot"
                        style={{ background: STATUS_COLOR[entry.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="db-pie-name">{entry.name}</span>
                      <span className="db-pie-count">{entry.count} inv</span>
                      <span className="db-pie-val">{fmtShort(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="db-empty-chart">
                <i className="fas fa-chart-pie" />
                <p>No invoice data for {activeCur}</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── TOP CLIENTS BAR ── */}
        <SectionCard
          title="Top Clients by Billing"
          icon="fa-ranking-star"
          delay={0.41}
          className="db-card-full"
          action={
            <Link to="/clients/home" className="db-section-link">
              View all <i className="fas fa-arrow-right" />
            </Link>
          }
        >
          {loading ? (
            <Skeleton h={220} />
          ) : clientBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clientBar} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} width={55} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Billed" fill={BLUE} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outstanding" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="db-empty-chart">
              <i className="fas fa-users" />
              <p>No client data for {activeCur}</p>
            </div>
          )}
        </SectionCard>

        {/* ── JOURNAL SUMMARY + RECENT INVOICES ── */}
        <div className="db-row db-row-half">

          {/* Journal Summary */}
          <SectionCard title="Journal Summary" icon="fa-book-open" delay={0.44}
            action={
              <Link to="/journal/home" className="db-section-link">
                <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              <Skeleton h={220} />
            ) : journalBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={journalBars} layout="vertical"
                  margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Debit"  fill={RED}  radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Credit" fill={TEAL} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="db-empty-chart">
                <i className="fas fa-book-open" />
                <p>No journal data for {activeCur}</p>
              </div>
            )}
          </SectionCard>

          {/* Recent Invoices */}
          <SectionCard title="Recent Invoices" icon="fa-file-invoice" delay={0.47}
            action={
              <Link to="/invoice/home" className="db-section-link">
                View all <i className="fas fa-arrow-right" />
              </Link>
            }
          >
            {loading ? (
              [1,2,3,4,5].map(i => <Skeleton key={i} h={52} w="100%" radius={8} />)
            ) : recentInv.length > 0 ? (
              <div className="db-recent-list">
                {recentInv.map((inv, i) => (
                  <motion.div
                    key={inv.invoice_number}
                    className="db-recent-row"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.47 + i * 0.05 }}
                  >
                    <div className="db-recent-icon">
                      <i className="fas fa-file-invoice" />
                    </div>
                    <div className="db-recent-info">
                      <span className="db-recent-num">{inv.invoice_number}</span>
                      <span className="db-recent-client">{inv.clients_name}</span>
                    </div>
                    <div className="db-recent-right">
                      <span className="db-recent-amount">
                        {fmt(inv.invoice_amount, inv.currency)}
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="db-empty-chart">
                <i className="fas fa-file-invoice" />
                <p>No recent invoices</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── TOP CLIENTS TABLE ── */}
        <SectionCard
          title="Client Outstanding Summary"
          icon="fa-table-list"
          delay={0.50}
          className="db-card-full"
          action={
            <Link to="/clients/home" className="db-section-link">
              Manage clients <i className="fas fa-arrow-right" />
            </Link>
          }
        >
          {loading ? (
            <Skeleton h={200} />
          ) : topClients.length > 0 ? (
            <div className="db-table-wrap">
              <table className="db-mini-table">
                <thead>
                  <tr>
                    <th><i className="fas fa-user" /> Client</th>
                    <th>Currency</th>
                    <th>Invoices</th>
                    <th>Total Billed</th>
                    <th>Total Paid</th>
                    <th>Outstanding</th>
                    <th>Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.slice(0, 8).map((c, i) => {
                    const billed = parseFloat(c.total_billed) || 0;
                    const paid   = parseFloat(c.total_paid) || 0;
                    const pct    = billed > 0 ? Math.round((paid / billed) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td className="db-td-client">{c.clients_name}</td>
                        <td><span className="db-cur-chip">{c.currency}</span></td>
                        <td>{c.invoice_count}</td>
                        <td>{fmt(billed, c.currency)}</td>
                        <td className="db-td-paid">{fmt(paid, c.currency)}</td>
                        <td className={`db-td-owed ${parseFloat(c.total_outstanding) > 0 ? "has-owed" : ""}`}>
                          {fmt(c.total_outstanding || 0, c.currency)}
                        </td>
                        <td>
                          <div className="db-pct-bar-wrap">
                            <div className="db-pct-bar" style={{ width: `${pct}%` }} />
                            <span>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-chart">
              <i className="fas fa-users" />
              <p>No client data available</p>
            </div>
          )}
        </SectionCard>

        {/* ── QUICK ACTIONS ── */}
        <motion.div
          className="db-quick-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <span className="db-qa-label">
            <i className="fas fa-bolt" /> Quick Actions
          </span>
          {[
            { label: "New Invoice",    icon: "fa-file-invoice-dollar", to: "/invoice/create",  color: TEAL  },
            { label: "New Journal",    icon: "fa-book",                to: "/journal/create",  color: BLUE  },
            { label: "Add Client",     icon: "fa-user-plus",           to: "/clients/create",  color: PURPLE},
            { label: "Add Bank",       icon: "fa-building-columns",    to: "/bank/create",     color: AMBER },
            { label: "Exchange Rates", icon: "fa-money-bill-transfer", to: "/currency/home",   color: RED   },
          ].map(({ label, icon, to, color }) => (
            <Link key={label} to={to} className="db-qa-btn" style={{ "--qa-color": color }}>
              <i className={`fas ${icon}`} />
              <span>{label}</span>
            </Link>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;