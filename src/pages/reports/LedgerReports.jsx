import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import { preloadRoute } from "../../utils/routePreloader";
import "./LedgerReports.css";

const REPORT_GROUPS = [
  {
    key: "financial",
    title: "Financial statements",
    shortLabel: "Financial",
    icon: "fa-chart-pie",
    copy: "Review position, performance and ledger movements with period, currency and zero-balance controls.",
    reports: [
      {
        key: "ledger-statement", path: "/reports/ledger/ledger-statement", icon: "fa-book-open", label: "Ledger Statement",
        description: "Running balances and detailed movements for a selected ledger.", tags: ["Per ledger", "Transactions"], accentClass: "lr-card--teal",
      },
      {
        key: "general-ledger", path: "/reports/ledger/general-ledger", icon: "fa-table-list", label: "General Ledger",
        description: "Aggregated debit, credit and balance positions across ledger accounts.", tags: ["All accounts", "Multi-currency"], accentClass: "lr-card--blue",
      },
      {
        key: "trial-balance", path: "/reports/ledger/trial-balance", icon: "fa-scale-balanced", label: "Trial Balance",
        description: "Validate debit and credit equality by class and reporting period.", tags: ["Debit vs credit", "By class"], accentClass: "lr-card--violet",
      },
      {
        key: "profit-and-loss", path: "/reports/ledger/profit-and-loss", icon: "fa-chart-line", label: "Profit & Loss",
        description: "Analyse revenue, expenses and profitability over the selected period.", tags: ["Revenue", "Expenses"], accentClass: "lr-card--amber",
      },
      {
        key: "balance-sheet", path: "/reports/ledger/balance-sheet", icon: "fa-building-columns", label: "Balance Sheet",
        description: "Review assets, liabilities and equity as at a selected reporting date.", tags: ["Position", "Cumulative"], accentClass: "lr-card--emerald",
      },
    ],
  },
  {
    key: "operations",
    title: "Controls & operations",
    shortLabel: "Controls",
    icon: "fa-sliders",
    copy: "Monitor receivables, exchange exposure, reconciliation progress and staff time activity.",
    reports: [
      {
        key: "invoice-aging", path: "/reports/invoice-aging", icon: "fa-clock-rotate-left", label: "Invoice Aging",
        description: "Understand overdue receivables and collection exposure by aging bucket.", tags: ["Receivables", "Overdue"], accentClass: "lr-card--blue",
      },
      {
        key: "fx", path: "/reports/fx-revaluation", icon: "fa-arrow-trend-up", label: "FX Gain / Loss",
        description: "Review unrealised exchange movement and post controlled revaluation entries.", tags: ["Revaluation", "Controls"], accentClass: "lr-card--amber",
      },
      {
        key: "reconciliation", path: "/reports/bank-recon", icon: "fa-scale-unbalanced-flip", label: "Bank Reconciliation",
        description: "Match bank and ledger lines, classify differences and export results.", tags: ["Matching", "Exceptions"], accentClass: "lr-card--teal",
      },
      {
        key: "timesheets", path: "/reports/timesheet", icon: "fa-business-time", label: "Timesheet Analysis",
        description: "Analyse recorded staff time across clients, projects and reporting periods.", tags: ["Hours", "People"], accentClass: "lr-card--violet",
      },
    ],
  },
];

const LedgerReports = () => {
  const [nav, setNav] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const totalReports = REPORT_GROUPS.reduce((count, group) => count + group.reports.length, 0);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => REPORT_GROUPS
    .filter((group) => activeGroup === "all" || group.key === activeGroup)
    .map((group) => ({
      ...group,
      reports: group.reports.filter((report) => {
        if (!normalizedQuery) return true;
        return [report.label, report.description, ...report.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    }))
    .filter((group) => group.reports.length > 0), [activeGroup, normalizedQuery]);

  const visibleCount = visibleGroups.reduce((count, group) => count + group.reports.length, 0);
  const links = [
    { label: "Home", to: "/", active: true },
    { label: "Report Library", to: "/reports/ledger", active: false },
  ];

  const openReport = (path) => navigate(path);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`lr-root theme-${theme}`}>
          <div className="lr-page">
            <PageNav pageTitle="Report Library" links={links} />

            <section className="lr-hero" aria-label="Reporting centre summary">
              <div className="lr-hero-text">
                <span className="lr-eyebrow"><i className="fas fa-chart-simple" /> Reporting centre</span>
                <h1 className="lr-hero-title">Every report, organised in one intelligence workspace</h1>
                <p className="lr-hero-sub">Open financial statements, control reports and operational analysis without searching across separate menu groups.</p>
              </div>
              <div className="lr-hero-metrics">
                <span><strong>{totalReports}</strong><small>Available reports</small></span>
                <span><strong>{REPORT_GROUPS.length}</strong><small>Report families</small></span>
                <span><strong>{visibleCount}</strong><small>Currently visible</small></span>
              </div>
            </section>

            <section className="lr-discovery" aria-label="Find a report">
              <div className="lr-search">
                <i className="fas fa-magnifying-glass" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search reports by name, purpose or keyword"
                  aria-label="Search reports"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear report search">
                    <i className="fas fa-xmark" />
                  </button>
                )}
              </div>

              <div className="lr-tabs" role="tablist" aria-label="Report categories">
                <button type="button" className={activeGroup === "all" ? "active" : ""} onClick={() => setActiveGroup("all")}>
                  <i className="fas fa-table-cells-large" /> All reports <span>{totalReports}</span>
                </button>
                {REPORT_GROUPS.map((group) => (
                  <button key={group.key} type="button" className={activeGroup === group.key ? "active" : ""} onClick={() => setActiveGroup(group.key)}>
                    <i className={`fas ${group.icon}`} /> {group.shortLabel} <span>{group.reports.length}</span>
                  </button>
                ))}
              </div>
            </section>

            {visibleGroups.map((group) => (
              <section key={group.key} className="lr-section" aria-label={group.title}>
                <div className="lr-section__head">
                  <div className="lr-section__identity">
                    <span className="lr-section__icon"><i className={`fas ${group.icon}`} /></span>
                    <div><h2>{group.title}</h2><p>{group.copy}</p></div>
                  </div>
                  <span className="lr-section__count">{group.reports.length} report{group.reports.length === 1 ? "" : "s"}</span>
                </div>
                <div className="lr-grid">
                  {group.reports.map((report) => (
                    <button
                      key={report.key}
                      className={`lr-card ${report.accentClass}`}
                      onClick={() => openReport(report.path)}
                      onMouseEnter={() => preloadRoute(report.path)}
                      onFocus={() => preloadRoute(report.path)}
                      onTouchStart={() => preloadRoute(report.path)}
                    >
                      <div className="lr-card__head">
                        <span className="lr-card__icon-wrap"><i className={`fas ${report.icon}`} /></span>
                        <span className="lr-card__arrow"><i className="fas fa-arrow-right" /></span>
                      </div>
                      <h3 className="lr-card__title">{report.label}</h3>
                      <p className="lr-card__desc">{report.description}</p>
                      <div className="lr-card__tags">
                        {report.tags.map((tag) => <span className="lr-card__tag" key={tag}>{tag}</span>)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {visibleGroups.length === 0 && (
              <section className="lr-empty">
                <span><i className="fas fa-chart-column" /></span>
                <h2>No matching reports</h2>
                <p>Try another report name, purpose or category.</p>
                <button type="button" onClick={() => { setQuery(""); setActiveGroup("all"); }}>Show all reports</button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerReports;
