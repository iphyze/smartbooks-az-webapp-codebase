import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Skel = ({ w = "100%", h = 16 }) => (
  <span className="db-skel" style={{ width: w, height: h, display: "block", borderRadius: 5 }} />
);

const fmt = (val, currency = "NGN") => {
  const num = parseFloat(val) || 0;
  if (Math.abs(num) >= 1_000_000) return `${currency} ${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${currency} ${(num / 1_000).toFixed(1)}K`;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/* ══════════════════════════════════════
   Receivables Card
══════════════════════════════════════ */
export const ReceivablesCard = ({ data, currency, loading, delay = 0 }) => {
  const total   = parseFloat(data?.total_receivables)   || 0;
  const current = parseFloat(data?.current_receivables) || 0;
  const overdue = parseFloat(data?.overdue_receivables) || 0;
  const overdueRatio = total > 0 ? (overdue / total) * 100 : 0;

  return (
    <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
      <div className="db-card__head">
        <span className="db-card__title">
          <i className="fas fa-hand-holding-dollar" /> Receivables
        </span>
        <Link to="/invoice/home" className="db-card__link">
          View <i className="fas fa-arrow-right" />
        </Link>
      </div>
      <div className="db-card__body">
        {loading ? (
          <div className="db-skel-stack">
            <Skel h={10} w="50%" /><Skel h={28} w="65%" />
            <Skel h={12} w="100%" /><Skel h={40} w="100%" />
          </div>
        ) : (
          <>
            <div className="db-recv__total-label">Total Unpaid</div>
            <div className="db-recv__total-val">{fmt(total, currency)}</div>

            {/* Progress bar */}
            <div className="db-recv__progress-wrap">
              <div className="db-recv__progress-bar">
                <div className="db-recv__progress-fill" style={{ width: `${100 - overdueRatio}%` }} />
                <div className="db-recv__progress-fill db-recv__progress-fill--over" style={{ width: `${overdueRatio}%` }} />
              </div>
            </div>

            <div className="db-recv__split">
              <div className="db-recv__col">
                <span className="db-recv__col-dot db-recv__col-dot--cur" />
                <div>
                  <span className="db-recv__col-label">Current</span>
                  <span className="db-recv__col-val">{fmt(current, currency)}</span>
                </div>
              </div>
              <div className="db-recv__divider" />
              <div className="db-recv__col">
                <span className="db-recv__col-dot db-recv__col-dot--over" />
                <div>
                  <span className="db-recv__col-label">Overdue</span>
                  <span className="db-recv__col-val db-recv__col-val--over">{fmt(overdue, currency)}</span>
                </div>
              </div>
            </div>

            <div className="db-recv__chips">
              {[
                { key: "paid_count",    label: "Paid",    cls: "paid" },
                { key: "unpaid_count",  label: "Unpaid",  cls: "unpaid" },
                { key: "partial_count", label: "Partial", cls: "partial" },
              ].map(({ key, label, cls }) => (
                <div key={key} className={`db-recv__chip db-recv__chip--${cls}`}>
                  <span className="db-recv__chip-num">{data?.[key] || 0}</span>
                  <span className="db-recv__chip-lbl">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   Revenue & Expenses Card
══════════════════════════════════════ */
export const RevenueExpensesCard = ({ data, currency, loading, delay = 0 }) => {
  const revenue  = parseFloat(data?.total_revenue)  || 0;
  const expenses = parseFloat(data?.total_expenses) || 0;
  const net      = revenue - expenses;
  const ratio    = (revenue + expenses) > 0 ? (revenue / (revenue + expenses)) * 100 : 50;

  return (
    <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
      <div className="db-card__head">
        <span className="db-card__title">
          <i className="fas fa-chart-line" /> Revenue & Expenses
        </span>
        <Link to="/journal/home" className="db-card__link">
          View <i className="fas fa-arrow-right" />
        </Link>
      </div>
      <div className="db-card__body">
        {loading ? (
          <div className="db-skel-stack">
            <Skel h={16} w="80%" /><Skel h={22} w="70%" />
            <Skel h={16} w="80%" /><Skel h={22} w="70%" />
            <Skel h={36} w="100%" />
          </div>
        ) : (
          <>
            {/* Stacked bar */}
            <div className="db-revex__bar-wrap">
              <div className="db-revex__bar">
                <div className="db-revex__bar-rev" style={{ width: `${ratio}%` }} title={`Revenue: ${ratio.toFixed(0)}%`} />
                <div className="db-revex__bar-exp" style={{ width: `${100 - ratio}%` }} title={`Expenses: ${(100-ratio).toFixed(0)}%`} />
              </div>
            </div>

            <div className="db-revex__rows">
              <div className="db-revex__row">
                <div className="db-revex__row-icon db-revex__row-icon--rev">
                  <i className="fas fa-arrow-trend-up" />
                </div>
                <div className="db-revex__row-body">
                  <span className="db-revex__row-label">Total Revenue</span>
                  <span className="db-revex__row-val db-val-pos">{fmt(revenue, currency)}</span>
                </div>
              </div>
              <div className="db-revex__row">
                <div className="db-revex__row-icon db-revex__row-icon--exp">
                  <i className="fas fa-arrow-trend-down" />
                </div>
                <div className="db-revex__row-body">
                  <span className="db-revex__row-label">Total Expenses</span>
                  <span className="db-revex__row-val db-val-neg">{fmt(expenses, currency)}</span>
                </div>
              </div>
            </div>

            <div className={`db-revex__net ${net >= 0 ? "db-revex__net--pos" : "db-revex__net--neg"}`}>
              <i className={`fas ${net >= 0 ? "fa-circle-check" : "fa-circle-exclamation"}`} />
              <span>
                Net Position: <strong>{fmt(Math.abs(net), currency)}</strong>
                {net < 0 ? " deficit" : " surplus"}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════
   Exchange Rates Card
══════════════════════════════════════ */
export const ExchangeRatesCard = ({ rates, loading, delay = 0 }) => (
  <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16,1,0.3,1] }}>
    <div className="db-card__head">
      <span className="db-card__title">
        <i className="fas fa-money-bill-transfer" /> Exchange Rates
      </span>
      <Link to="/rate/home" className="db-card__link">
        View <i className="fas fa-arrow-right" />
      </Link>
    </div>
    <div className="db-card__body">
      {loading ? (
        <div className="db-skel-stack">
          <Skel h={36} /><Skel h={36} /><Skel h={36} />
        </div>
      ) : rates ? (
        <div className="db-rates">
          {[
            { pair: "USD / NGN", rate: rates.usd_rate, icon: "fa-dollar-sign",  cls: "usd" },
            { pair: "GBP / NGN", rate: rates.gbp_rate, icon: "fa-sterling-sign",cls: "gbp" },
            { pair: "EUR / NGN", rate: rates.eur_rate, icon: "fa-euro-sign",    cls: "eur" },
          ].map(({ pair, rate, icon, cls }) => (
            <div key={pair} className={`db-rate-row db-rate-row--${cls}`}>
              <div className="db-rate-icon-wrap">
                <i className={`fas ${icon}`} />
              </div>
              <span className="db-rate-pair">{pair}</span>
              <span className="db-rate-val">
                {parseFloat(rate)?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}
              </span>
            </div>
          ))}
          <div className="db-rates__updated">
            <i className="fas fa-clock" />
            Updated: {rates.created_at?.split(" ")[0] ?? "—"}
          </div>
        </div>
      ) : (
        <div className="db-empty">
          <i className="fas fa-money-bill-transfer" />
          <p>No rate data available</p>
        </div>
      )}
    </div>
  </motion.div>
);
