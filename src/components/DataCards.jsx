import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Skel = ({ w = "100%", h = 16, mb = 0 }) => (
  <span className="db-skel" style={{ width: w, height: h, display: "block", borderRadius: 5, marginBottom: mb }} />
);

const fmt = (val, currency = "NGN") => {
  const num = parseFloat(val) || 0;
  if (Math.abs(num) >= 1_000_000) return `${currency} ${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${currency} ${(num / 1_000).toFixed(1)}K`;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtShort = (val) => {
  const n = parseFloat(val) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n/1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STATUS_COLOR = {
  Paid:      { bg: "var(--db-green-dim)",  cl: "var(--db-green)" },
  Pending:   { bg: "var(--db-amber-dim)",  cl: "var(--db-amber)" },
  Overdue:   { bg: "var(--db-red-dim)",    cl: "var(--db-red)" },
  Cancelled: { bg: "var(--db-surface-3)",  cl: "var(--db-text-3)" },
  Partial:   { bg: "var(--db-purple-dim)", cl: "var(--db-purple)" },
};

/* ══════════════════════════════════════
   Bank Balances
══════════════════════════════════════ */
export const BankBalancesCard = ({ accounts, totals, loading, delay = 0 }) => (
  <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
    <div className="db-card__head">
      <span className="db-card__title"><i className="fas fa-building-columns" /> Bank Balances</span>
      <Link to="/banks/home" className="db-card__link"><i className="fas fa-arrow-right" /></Link>
    </div>
    <div className="db-card__body">
      {loading ? (
        <div className="db-skel-stack">{[1,2,3,4].map(i => <Skel key={i} h={40} mb={6} />)}</div>
      ) : (
        <>
          <div className="db-bank-list">
            {(accounts || []).slice(0, 6).map((acct, i) => {
              const bal = parseFloat(acct.balance_ngn) || 0;
              const neg = bal < 0;
              return (
                <div key={i} className="db-bank-row">
                  <div className="db-bank-avatar">{(acct.ledger_name?.[0] || "A").toUpperCase()}</div>
                  <div className="db-bank-info">
                    <span className="db-bank-name">{acct.ledger_name || "Account"}</span>
                    <span className="db-bank-num">{acct.ledger_number}</span>
                  </div>
                  <span className={`db-bank-bal ${neg ? "db-bank-bal--neg" : ""}`}>
                    {neg ? "(" : ""}
                    {Math.abs(bal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {neg ? ")" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          {totals && (
            <div className="db-bank-totals">
              {[
                { label: "NGN", val: totals.ngn, cur: "NGN" },
                { label: "USD", val: totals.usd, cur: "USD" },
                { label: "GBP", val: totals.gbp, cur: "GBP" },
                { label: "EUR", val: totals.eur, cur: "EUR" },
              ].filter(x => x.val !== 0).map(({ label, val, cur }) => (
                <div key={cur} className="db-bank-total-row">
                  <span className="db-bank-total-cur">{label}</span>
                  <span className="db-bank-total-val">{fmt(val, cur)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════
   Recent Invoices
══════════════════════════════════════ */
export const RecentInvoices = ({ invoices, loading, delay = 0 }) => (
  <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
    <div className="db-card__head">
      <span className="db-card__title"><i className="fas fa-file-invoice" /> Recent Invoices</span>
      <Link to="/invoice/home" className="db-card__link">View all <i className="fas fa-arrow-right" /></Link>
    </div>
    <div className="db-card__body">
      {loading ? (
        <div className="db-skel-stack">{[1,2,3,4,5].map(i => <Skel key={i} h={52} mb={6} />)}</div>
      ) : (invoices || []).length > 0 ? (
        <div className="db-inv-list">
          {invoices.map((inv, i) => {
            const sc = STATUS_COLOR[inv.status] || STATUS_COLOR.Pending;
            return (
              <motion.div key={inv.invoice_number} className="db-inv-row"
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + i * 0.05 }}>
                <div className="db-inv-icon"><i className="fas fa-file-invoice-dollar" /></div>
                <div className="db-inv-info">
                  <span className="db-inv-num">#{inv.invoice_number}</span>
                  <span className="db-inv-client">{inv.clients_name}</span>
                </div>
                <div className="db-inv-right">
                  <span className="db-inv-amount">{fmt(inv.invoice_amount, inv.currency)}</span>
                  <span className="db-badge" style={{ "--bc": sc.cl, background: sc.bg, color: sc.cl, border: `1px solid ${sc.cl}22` }}>
                    <span className="db-badge__dot" />
                    {inv.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="db-empty"><i className="fas fa-file-invoice" /><p>No recent invoices</p></div>
      )}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════
   Client Summary Table
══════════════════════════════════════ */
export const ClientSummaryTable = ({ clients, loading, delay = 0 }) => (
  <motion.div className="db-card db-grid-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
    <div className="db-card__head">
      <span className="db-card__title"><i className="fas fa-table-list" /> Client Outstanding Summary</span>
      <Link to="/client/home" className="db-card__link">Manage <i className="fas fa-arrow-right" /></Link>
    </div>
    <div className="db-card__body db-card__body--no-pad">
      {loading ? (
        <div className="db-skel-stack" style={{ padding: "18px 20px" }}>
          {[1,2,3,4].map(i => <Skel key={i} h={40} mb={4} />)}
        </div>
      ) : (clients || []).length > 0 ? (
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Currency</th>
                <th>Invoices</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Outstanding</th>
                <th>Collection</th>
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 8).map((c, i) => {
                const billed = parseFloat(c.total_billed) || 0;
                const paid   = parseFloat(c.total_paid)   || 0;
                const pct    = billed > 0 ? Math.round((paid / billed) * 100) : 0;
                const owed   = parseFloat(c.total_outstanding) || 0;
                return (
                  <tr key={i}>
                    <td className="db-td-name">
                      <div className="db-td-avatar">{c.clients_name?.[0]?.toUpperCase() || "?"}</div>
                      {c.clients_name}
                    </td>
                    <td><span className="db-cur-chip">{c.currency}</span></td>
                    <td>{c.invoice_count}</td>
                    <td>{fmt(billed, c.currency)}</td>
                    <td className="db-td-paid">{fmt(paid, c.currency)}</td>
                    <td className={owed > 0 ? "db-td-owed" : ""}>{fmt(owed, c.currency)}</td>
                    <td>
                      <div className="db-pct-wrap">
                        <div className="db-pct-track">
                          <div className="db-pct-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="db-pct-label">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="db-empty"><i className="fas fa-users" /><p>No client data</p></div>
      )}
    </div>
  </motion.div>
);

/* ══════════════════════════════════════
   Quick Actions
══════════════════════════════════════ */
export const QuickActions = ({ delay = 0 }) => {
  const actions = [
    { label: "New Invoice",    icon: "fa-file-invoice-dollar", to: "/invoice/create",  color: "var(--db-brand)" },
    { label: "New Journal",    icon: "fa-book",                to: "/journal/create",  color: "var(--db-blue)" },
    { label: "Add Client",     icon: "fa-user-plus",           to: "/client/create",   color: "var(--db-purple)" },
    { label: "Add Bank",       icon: "fa-building-columns",    to: "/banks/create",    color: "var(--db-amber)" },
    { label: "Exchange Rates", icon: "fa-arrow-right-arrow-left", to: "/rate/home",    color: "var(--db-green)" },
  ];

  return (
    <motion.div className="db-quick-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}>
      <span className="db-qa__label"><i className="fas fa-bolt" /> Quick Actions</span>
      <div className="db-qa__grid">
        {actions.map(({ label, icon, to, color }) => (
          <Link key={label} to={to} className="db-qa__btn" style={{ "--qa-color": color }}>
            <div className="db-qa__icon"><i className={`fas ${icon}`} /></div>
            <span className="db-qa__label-text">{label}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};
