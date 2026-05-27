import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import "./LedgerReports.css";

const REPORT_GROUPS = [
  {
    key: "financial",
    title: "Financial statements",
    copy: "Review position, performance and ledger movements with period and currency filtering.",
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
    key: "controls",
    title: "Controls & operations",
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
        key: "timesheets", path: "/reports/timesheet", icon: "fa-business-time", label: "Timesheet Report",
        description: "Analyse recorded staff time across projects and reporting periods.", tags: ["Hours", "Projects"], accentClass: "lr-card--violet",
      },
    ],
  },
];

const LedgerReports = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const totalReports = REPORT_GROUPS.reduce((count, group) => count + group.reports.length, 0);
  const links = [{ label: "Home", to: "/", active: true }, { label: "Reports & Analytics", to: "/reports/ledger", active: false }];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`lr-root theme-${theme}`}>
          <div className="lr-page">
            <PageNav pageTitle="Reports & Analytics" links={links} />
            <section className="lr-hero" aria-label="Reports summary">
              <div className="lr-hero-text">
                <span className="lr-eyebrow">Insights centre</span>
                <h1 className="lr-hero-title">Financial intelligence at a glance</h1>
                <p className="lr-hero-sub">Select a report to analyse balances, cash movements, exposure, reconciliation activity and operational performance.</p>
              </div>
              <div className="lr-hero-metrics">
                <span><strong>{totalReports}</strong><small>Available reports</small></span>
                <span><strong>2</strong><small>Report categories</small></span>
              </div>
            </section>

            {REPORT_GROUPS.map((group) => (
              <section key={group.key} className="lr-section" aria-label={group.title}>
                <div className="lr-section__head">
                  <div><h2>{group.title}</h2><p>{group.copy}</p></div>
                  <span className="lr-section__count">{group.reports.length} reports</span>
                </div>
                <div className="lr-grid">
                  {group.reports.map((report) => (
                    <button key={report.key} className={`lr-card ${report.accentClass}`} onClick={() => navigate(report.path)}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerReports;
