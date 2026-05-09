import React from "react";
import { motion } from "framer-motion";

const Skel = ({ w = "100%", h = 20 }) => (
  <span className="db-skel" style={{ width: w, height: h, display: "block" }} />
);

const StatCard = ({ icon, label, value, sub, accent, loading, delay = 0 }) => (
  <motion.div
    className="db-stat"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    style={{ "--stat-accent": accent }}
  >
    <div className="db-stat__icon-wrap">
      <i className={`fas ${icon}`} />
    </div>
    <div className="db-stat__body">
      <span className="db-stat__label">{label}</span>
      {loading
        ? <Skel w={80} h={26} />
        : <span className="db-stat__value">{value ?? "—"}</span>
      }
      {sub && <span className="db-stat__sub">{sub}</span>}
    </div>
    <div className="db-stat__bar" />
  </motion.div>
);

const StatCards = ({ overview, loading }) => {
  const cards = [
    { icon: "fa-users",                label: "Total Clients",   key: "total_clients",  sub: "Active on record",     accent: "var(--db-brand)" },
    { icon: "fa-file-invoice-dollar",  label: "Total Invoices",  key: "total_invoices", sub: "Across all currencies", accent: "var(--db-blue)" },
    { icon: "fa-book",                 label: "Journal Entries", key: "total_journals", sub: "All ledger postings",   accent: "var(--db-purple)" },
    { icon: "fa-user-shield",          label: "System Users",    key: "total_users",    sub: "Active accounts",       accent: "var(--db-amber)" },
  ];

  return (
    <div className="db-grid-4 db-stat-grid">
      {cards.map((c, i) => (
        <StatCard
          key={c.key}
          icon={c.icon}
          label={c.label}
          value={overview[c.key]}
          sub={c.sub}
          accent={c.accent}
          loading={loading}
          delay={i * 0.07}
        />
      ))}
    </div>
  );
};

export default StatCards;
