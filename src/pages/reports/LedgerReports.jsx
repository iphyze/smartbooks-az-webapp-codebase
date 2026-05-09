import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../NavBar";
import Header from "../Header";
import PageNav from "../../components/PageNav";
import useThemeStore from "../../stores/useThemeStore";
import "./LedgerReports.css";

const REPORTS = [
  {
    key: "ledger-statement",
    path: "/reports/ledger/ledger-statement",
    icon: "fa-book-open",
    label: "Ledger Statement",
    description:
      "View a detailed account statement for any ledger — including opening balance, period transactions with running balances, and closing position.",
    tags: ["Per Ledger", "Running Balance", "Transactions"],
    accentClass: "lr-card--teal",
  },
  {
    key: "general-ledger",
    path: "/reports/ledger/general-ledger",
    icon: "fa-table-list",
    label: "General Ledger",
    description:
      "A full listing of all ledger accounts with aggregated debits, credits and net balances for any selected date range and currency.",
    tags: ["All Accounts", "Multi-Currency", "Paginated"],
    accentClass: "lr-card--blue",
  },
  {
    key: "trial-balance",
    path: "/reports/ledger/trial-balance",
    icon: "fa-scale-balanced",
    label: "Trial Balance",
    description:
      "Verify the equality of debits and credits across all ledger classes — Assets, Liabilities, Equity, Revenue and Expenses.",
    tags: ["Debit vs Credit", "By Class", "Zero Balance"],
    accentClass: "lr-card--violet",
  },
  {
    key: "profit-and-loss",
    path: "/reports/ledger/profit-and-loss",
    icon: "fa-chart-line",
    label: "Profit & Loss",
    description:
      "Analyse revenue, cost of services, operating expenses and net profit from EBITDA down to profit after tax for any period.",
    tags: ["EBITDA", "PAT", "Expense Breakdown"],
    accentClass: "lr-card--amber",
  },
  {
    key: "balance-sheet",
    path: "/reports/ledger/balance-sheet",
    icon: "fa-building-columns",
    label: "Balance Sheet",
    description:
      "A snapshot of the company's financial position — non-current and current assets, equity, and liabilities as at any reporting date.",
    tags: ["Assets", "Equity & Liabilities", "Cumulative"],
    accentClass: "lr-card--emerald",
  },
];

const LedgerReports = () => {
  const [nav, setNav] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const links = [
    { label: "Home", to: "/" },
    { label: "Reports", to: "/reports/ledger", active: true },
  ];

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <div className={`content-container theme-${theme}`}>
        <div className={`lr-root theme-${theme}`}>
          <div className="lr-page">
            <PageNav pageTitle="Ledger Reports" links={links} />

            {/* ── Hero intro ── */}
            <div className="lr-hero">
              <div className="lr-hero-text">
                <h1 className="lr-hero-title">Financial Reports</h1>
                <p className="lr-hero-sub">
                  Select a report type below to analyse your financial data — filter by date, currency and ledger range.
                </p>
              </div>
              <div className="lr-hero-badge">
                <i className="fas fa-chart-pie" />
                <span>{REPORTS.length} Reports</span>
              </div>
            </div>

            {/* ── Report cards grid ── */}
            <div className="lr-grid">
              {REPORTS.map((report, i) => (
                <button
                  key={report.key}
                  className={`lr-card ${report.accentClass}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                  onClick={() => navigate(report.path)}
                >
                  {/* Left accent bar */}
                  <span className="lr-card__bar" />

                  {/* Icon */}
                  <div className="lr-card__icon-wrap">
                    <i className={`fas ${report.icon} lr-card__icon`} />
                  </div>

                  {/* Body */}
                  <div className="lr-card__body">
                    <div className="lr-card__top">
                      <h2 className="lr-card__title">{report.label}</h2>
                      <i className="fas fa-arrow-right lr-card__arrow" />
                    </div>
                    <p className="lr-card__desc">{report.description}</p>
                    <div className="lr-card__tags">
                      {report.tags.map((tag) => (
                        <span key={tag} className="lr-card__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerReports;