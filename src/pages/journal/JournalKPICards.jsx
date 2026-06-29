import React from "react";
import { motion } from "framer-motion";
import "../invoice/InvoiceKPICards.css";

const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const formatAmount = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000_000) return `₦${(amount / 1_000_000_000_000).toFixed(1)}T`;
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

const KPICard = ({ icon, label, count, amount, accent, sublabel }) => (
  <motion.div variants={cardVariants} className={`ikpi-card ikpi-card--${accent}`}>
    <div className="ikpi-card-top">
      <div className={`ikpi-icon-wrap ikpi-icon-wrap--${accent}`}>
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <div className="ikpi-meta">
        <span className="ikpi-label">{label}</span>
        <span className="ikpi-count">{formatCount(count)}</span>
      </div>
    </div>
    <div className="ikpi-card-bottom">
      <span className="ikpi-amount">{formatAmount(amount)}</span>
      <span className="ikpi-sublabel">{sublabel}</span>
    </div>
    <div className={`ikpi-accent-bar ikpi-accent-bar--${accent}`} />
  </motion.div>
);

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

const JournalKPICards = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="ikpi-grid">
        {Array.from({ length: 6 }, (_, index) => <KPISkeleton key={index} />)}
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <motion.div className="ikpi-grid" variants={containerVariants} initial="hidden" animate="show">
      <KPICard
        icon="fa-book-open"
        label="Total Journals"
        count={kpis.total?.count}
        amount={kpis.total?.amount_ngn}
        accent="brand"
        sublabel="posted value"
      />
      <KPICard
        icon="fa-calendar-check"
        label="This Month"
        count={kpis.this_month?.count}
        amount={kpis.this_month?.amount_ngn}
        accent="indigo"
        sublabel="NGN equiv."
      />
      <KPICard
        icon="fa-chart-line"
        label="Sales"
        count={kpis.sales?.count}
        amount={kpis.sales?.amount_ngn}
        accent="green"
        sublabel="sales entries"
      />
      <KPICard
        icon="fa-arrow-down"
        label="Receipts"
        count={kpis.receipts?.count}
        amount={kpis.receipts?.amount_ngn}
        accent="brand"
        sublabel="received value"
      />
      <KPICard
        icon="fa-arrow-up"
        label="Payments"
        count={kpis.payments?.count}
        amount={kpis.payments?.amount_ngn}
        accent="red"
        sublabel="payment value"
      />
      <KPICard
        icon="fa-layer-group"
        label="Other Entries"
        count={kpis.other?.count}
        amount={kpis.other?.amount_ngn}
        accent="amber"
        sublabel="expenses & general"
      />
    </motion.div>
  );
};

export default JournalKPICards;
