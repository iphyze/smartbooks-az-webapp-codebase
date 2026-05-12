import React from "react";
import { motion } from "framer-motion";
import "./InvoiceKPICards.css";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmtCount = (n) => Number(n || 0).toLocaleString("en-US");

const fmtAmount = (n) => {
  const num = Number(n || 0);
  if (num >= 1_000_000_000) return "₦" + (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000)     return "₦" + (num / 1_000_000).toFixed(1)     + "M";
  if (num >= 1_000)         return "₦" + (num / 1_000).toFixed(1)         + "K";
  return "₦" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* ─────────────────────────────────────────────
   Individual KPI card
───────────────────────────────────────────── */
const KPICard = ({ icon, label, count, amount, accent, sublabel }) => (
  <motion.div variants={cardVariants} className={`ikpi-card ikpi-card--${accent}`}>
    <div className="ikpi-card-top">
      <div className={`ikpi-icon-wrap ikpi-icon-wrap--${accent}`}>
        <i className={`fas ${icon}`} />
      </div>
      <div className="ikpi-meta">
        <span className="ikpi-label">{label}</span>
        <span className="ikpi-count">{fmtCount(count)}</span>
      </div>
    </div>
    {amount !== undefined && (
      <div className="ikpi-card-bottom">
        <span className="ikpi-amount">{fmtAmount(amount)}</span>
        <span className="ikpi-sublabel">{sublabel || "NGN equiv."}</span>
      </div>
    )}
    {amount === undefined && (
      <div className="ikpi-card-bottom ikpi-card-bottom--noamt">
        <span className="ikpi-sublabel-solo">{sublabel || "invoices"}</span>
      </div>
    )}
    {/* Decorative accent bar */}
    <div className={`ikpi-accent-bar ikpi-accent-bar--${accent}`} />
  </motion.div>
);

/* ─────────────────────────────────────────────
   Skeleton card (loading state)
───────────────────────────────────────────── */
const KPISkeleton = () => (
  <div className="ikpi-card ikpi-card--skeleton">
    <div className="ikpi-skeleton-top">
      <div className="ikpi-skeleton-icon" />
      <div className="ikpi-skeleton-meta">
        <div className="ikpi-skeleton-line ikpi-skeleton-line--short" />
        <div className="ikpi-skeleton-line ikpi-skeleton-line--long" />
      </div>
    </div>
    <div className="ikpi-skeleton-bottom">
      <div className="ikpi-skeleton-line ikpi-skeleton-line--medium" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main exported component
───────────────────────────────────────────── */
const InvoiceKPICards = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="ikpi-grid">
        {[...Array(6)].map((_, i) => <KPISkeleton key={i} />)}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <motion.div
      className="ikpi-grid"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Total */}
      <KPICard
        icon="fa-file-invoice"
        label="Total Invoices"
        count={kpis.total?.count}
        accent="brand"
        sublabel="all time"
      />

      {/* This Month */}
      <KPICard
        icon="fa-calendar-check"
        label="This Month"
        count={kpis.this_month?.count}
        amount={kpis.this_month?.amount_ngn}
        accent="indigo"
        sublabel="NGN equiv."
      />

      {/* Paid */}
      <KPICard
        icon="fa-circle-check"
        label="Paid"
        count={kpis.paid?.count}
        amount={kpis.paid?.amount_ngn}
        accent="green"
        sublabel="collected"
      />

      {/* Pending */}
      <KPICard
        icon="fa-clock"
        label="Pending"
        count={kpis.pending?.count}
        amount={kpis.pending?.amount_ngn}
        accent="amber"
        sublabel="awaiting payment"
      />

      {/* Overdue */}
      <KPICard
        icon="fa-triangle-exclamation"
        label="Overdue"
        count={kpis.overdue?.count}
        amount={kpis.overdue?.amount_ngn}
        accent="red"
        sublabel="past due date"
      />

      {/* Cancelled */}
      <KPICard
        icon="fa-ban"
        label="Cancelled"
        count={kpis.cancelled?.count}
        accent="neutral"
        sublabel="invoices"
      />
    </motion.div>
  );
};

export default InvoiceKPICards;