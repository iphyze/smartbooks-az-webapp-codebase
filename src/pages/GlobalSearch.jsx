import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useInvoiceStore   from "../stores/useInvoiceStore";
import useJournalStore   from "../stores/useJournalStore";
import useClientStore    from "../stores/useClientStore";
import useLedgerStore    from "../stores/useLedgerStore";
import useProjectStore   from "../stores/useProjectStore";
import useAccountStore   from "../stores/useAccountStore";
import useAuthStore from "../stores/useAuthStore";
import { canManageUsers, hasAnyPermission, hasPermission, isTimesheetOnly } from "../utils/permissions";
import './GlobalSearch.css';

/* ─────────────────────────────────────────────
   Static page index (navigation shortcuts)
───────────────────────────────────────────── */
const PAGE_INDEX = [
  { label: "Dashboard",           path: "/",                            category: "Pages", icon: "fa-gauge-high" },
  { label: "Invoices",            path: "/invoice/home",                category: "Pages", icon: "fa-file-invoice-dollar", keywords: ["invoice","billing"] },
  { label: "Create Invoice",      path: "/invoice/create",              category: "Pages", icon: "fa-plus",                keywords: ["new invoice"] },
  { label: "Journal",             path: "/journal/home",                category: "Pages", icon: "fa-book",                keywords: ["journal","entries"] },
  { label: "Create Journal",      path: "/journal/create",              category: "Pages", icon: "fa-plus",                keywords: ["new journal"] },
  { label: "Accounts",            path: "/account/home",                category: "Pages", icon: "fa-wallet",              keywords: ["account","chart"] },
  { label: "Ledgers",             path: "/ledger/home",                 category: "Pages", icon: "fa-book-open",           keywords: ["ledger"] },
  { label: "Create Ledger",       path: "/ledger/create",               category: "Pages", icon: "fa-plus",                keywords: ["new ledger"] },
  { label: "Banks",               path: "/banks/home",                  category: "Pages", icon: "fa-building-columns",    keywords: ["bank"] },
  { label: "Exchange Rates",      path: "/rate/home",                   category: "Pages", icon: "fa-arrow-right-arrow-left", keywords: ["rate","forex","currency"] },
  { label: "FX Gain / Loss",      path: "/reports/fx-revaluation",      category: "Pages", icon: "fa-arrows-rotate",       keywords: ["fx","revaluation","exchange gain"] },
  { label: "Bank Reconciliation", path: "/reports/bank-recon",           category: "Pages", icon: "fa-scale-balanced",       keywords: ["bank","reconciliation","matching"] },
  { label: "New Bank Reconciliation", path: "/reports/bank-recon/create",    category: "Pages", icon: "fa-plus",                 keywords: ["bank","reconciliation","new","create"] },
  { label: "Clients",             path: "/client/home",                 category: "Pages", icon: "fa-users",               keywords: ["client","customer"] },
  { label: "Staff",               path: "/staff/home",                  category: "Pages", icon: "fa-id-badge",            keywords: ["staff","employee"] },
  { label: "Projects",            path: "/project/home",                category: "Pages", icon: "fa-diagram-project",     keywords: ["project"] },
  { label: "Timesheets",          path: "/timesheet/home",              category: "Pages", icon: "fa-clock",               keywords: ["timesheet","hours"] },
  { label: "Reports & Analytics",      path: "/reports/ledger",              category: "Pages", icon: "fa-chart-line",          keywords: ["report","analytics","ledger statement"] },
  { label: "Ledger Statement",     path: "/reports/ledger/ledger-statement",category: "Pages", icon: "fa-book-open",           keywords: ["ledger statement","account statement"] },
  { label: "Balance Sheet",       path: "/reports/ledger/balance-sheet",category: "Pages", icon: "fa-scale-balanced",      keywords: ["balance sheet"] },
  { label: "Profit & Loss",       path: "/reports/ledger/profit-and-loss",  category: "Pages", icon: "fa-file-lines",          keywords: ["p&l","profit","loss"] },
  { label: "Trial Balance",       path: "/reports/ledger/trial-balance",category: "Pages", icon: "fa-list-check",          keywords: ["trial balance"] },
  { label: "General Ledger",      path: "/reports/ledger/general-ledger", category: "Pages", icon: "fa-book",             keywords: ["general ledger"] },
  { label: "Invoice Aging",       path: "/reports/invoice-aging",          category: "Pages", icon: "fa-clock-rotate-left", keywords: ["aging","receivables","overdue"] },
  { label: "Users",               path: "/users/home",                  category: "Pages", icon: "fa-users-gear",          keywords: ["user","admin"] },
  { label: "Cost Centres",        path: "/cost-centres/home",           category: "Pages", icon: "fa-layer-group",          keywords: ["cost centre","division","access"] },
  { label: "Activity Logs",       path: "/activity-logs",               category: "Pages", icon: "fa-clock-rotate-left",     keywords: ["activity","audit","logs","history"] },
  { label: "Notifications",       path: "/notifications",               category: "Pages", icon: "fa-bell",                  keywords: ["notifications","alerts","activity"] },
  { label: "Lock Periods",        path: "/lock-period/home",            category: "Pages", icon: "fa-calendar-xmark",      keywords: ["lock period"] },
];

const TIMESHEET_PAGE_INDEX = [
  { label: "Timesheets", path: "/timesheet/home", category: "Pages", icon: "fa-clock", keywords: ["timesheet", "hours"] },
  { label: "Log Time", path: "/timesheet/create-timesheet", category: "Pages", icon: "fa-plus", keywords: ["new time", "entry"] },
  { label: "Timesheet Report", path: "/reports/timesheet", category: "Pages", icon: "fa-business-time", keywords: ["report", "hours"] },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmtAmt = (n) => {
  const num = Number(n || 0);
  const abs = Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `(${abs})` : abs;
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const statusColor = (s) => {
  const map = { paid: "#00b196", unpaid: "#f47c7c", partial: "#d97706", draft: "#8b949e", sent: "#3b82f6" };
  return map[(s || "").toLowerCase()] || "#8b949e";
};

/* ─────────────────────────────────────────────
   Highlight match
───────────────────────────────────────────── */
const Highlight = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {String(text).slice(0, idx)}
      <mark>{String(text).slice(idx, idx + query.length)}</mark>
      {String(text).slice(idx + query.length)}
    </>
  );
};

/* ─────────────────────────────────────────────
   RESULT CARDS — rich previews
───────────────────────────────────────────── */
const InvoiceCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-file-invoice-dollar" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.invoice_number} query={query} />
        <span className="sb-gsearch__rich-sub"> · <Highlight text={item.clients_name} query={query} /></span>
      </span>
      <span className="sb-gsearch__rich-meta">
        {fmtDate(item.invoice_date)} · {item.currency} {fmtAmt(item.invoice_amount)}
        <span className="sb-gsearch__status-dot" style={{ background: statusColor(item.status) }} />
        {item.status}
      </span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const JournalCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-book" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.journal_id} query={query} />
        <span className="sb-gsearch__rich-sub"> · {item.journal_type}</span>
      </span>
      <span className="sb-gsearch__rich-meta">
        {fmtDate(item.journal_date)} · {item.journal_currency} · {item.journal_description?.slice(0, 40)}
      </span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const ClientCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-user" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.clients_name} query={query} />
      </span>
      <span className="sb-gsearch__rich-meta">
        ID: {item.clients_id}
        {item.clients_email && <> · {item.clients_email}</>}
        {item.clients_number && <> · {item.clients_number}</>}
      </span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const LedgerCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-book-open" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.ledger_name} query={query} />
      </span>
      <span className="sb-gsearch__rich-meta">
        <Highlight text={String(item.ledger_number)} query={query} />
        {" · "}{item.ledger_sub_class} · {item.ledger_type}
      </span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const ProjectCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-diagram-project" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.project_name} query={query} />
      </span>
      <span className="sb-gsearch__rich-meta">Code: {item.project_code}</span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const AccountCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result sb-gsearch__result--rich" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className="fas fa-wallet" /></span>
    <span className="sb-gsearch__rich-body">
      <span className="sb-gsearch__rich-title">
        <Highlight text={item.type} query={query} />
      </span>
      <span className="sb-gsearch__rich-meta">{item.category} · {item.sub_category}</span>
    </span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

const PageCard = ({ item, query, onClick }) => (
  <button className="sb-gsearch__result" onClick={onClick}>
    <span className="sb-gsearch__result-icon"><i className={`fas ${item.icon}`} /></span>
    <span className="sb-gsearch__result-label"><Highlight text={item.label} query={query} /></span>
    <i className="fas fa-arrow-right sb-gsearch__result-arrow" />
  </button>
);

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
const SearchModal = ({ isDark, onClose, isTimesheetUser, canAdministerUsers, canAccessCostCentres, canViewActivityLogs, isRestrictedCostCenter, canViewDashboard, canViewInvoices, canCreateInvoices, canViewJournals, canCreateJournals, canViewAccounts, canViewLedgers, canCreateLedgers, canViewBanks, canViewRates, canCreateRates, canViewClients, canViewStaff, canCreateStaff, canViewProjects, canViewReportHub, canViewLedgerStatement, canViewGeneralLedger, canViewTrialBalance, canViewProfitLoss, canViewBalanceSheet, canViewInvoiceAging, canViewFx, canViewBankRecon, canCreateBankRecon, canAccessAccountingPeriods, canViewTimesheets, canCreateTimesheets, canViewNotifications }) => {
  const [query,       setQuery]       = useState("");
  const [liveResults, setLiveResults] = useState({});
  const [searching,   setSearching]   = useState(false);
  const inputRef  = useRef(null);
  const debounceRef = useRef(null);
  const navigate  = useNavigate();

  // Stores
  const invoiceStore = useInvoiceStore();
  const journalStore = useJournalStore();
  const clientStore  = useClientStore();
  const ledgerStore  = useLedgerStore();
  const projectStore = useProjectStore();
  const accountStore = useAccountStore();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  /* Static page search */
  const pageMatches = useMemo(() => {
    if (!query.trim() || query.length < 1) return [];
    const q = query.toLowerCase();
    const permittedPages = isTimesheetUser
      ? [
          ...TIMESHEET_PAGE_INDEX.filter((page) => {
            if (page.path === "/timesheet/create-timesheet") return canCreateTimesheets && !isRestrictedCostCenter;
            return canViewTimesheets && !isRestrictedCostCenter;
          }),
          ...(canViewNotifications ? PAGE_INDEX.filter((page) => page.path === "/notifications") : []),
          ...(canAccessCostCentres ? PAGE_INDEX.filter((page) => page.path === "/cost-centres/home") : []),
          ...(canViewActivityLogs ? PAGE_INDEX.filter((page) => page.path === "/activity-logs") : []),
        ]
      : PAGE_INDEX
          .filter((page) => !page.path.startsWith("/users/") || canAdministerUsers)
          .filter((page) => page.path !== "/cost-centres/home" || canAccessCostCentres)
          .filter((page) => page.path !== "/activity-logs" || canViewActivityLogs)
          .filter((page) => !isRestrictedCostCenter || (!page.path.startsWith("/timesheet/") && page.path !== "/reports/timesheet"))
          .filter((page) => page.path !== "/timesheet/home" || (canViewTimesheets && !isRestrictedCostCenter))
          .filter((page) => page.path !== "/timesheet/create-timesheet" || (canCreateTimesheets && !isRestrictedCostCenter))
          .filter((page) => page.path !== "/reports/timesheet" || (canViewTimesheets && !isRestrictedCostCenter))
          .filter((page) => page.path !== "/notifications" || canViewNotifications)
          .filter((page) => page.path !== "/" || canViewDashboard)
          .filter((page) => page.path !== "/invoice/home" || canViewInvoices)
          .filter((page) => page.path !== "/invoice/create" || canCreateInvoices)
          .filter((page) => page.path !== "/journal/home" || canViewJournals)
          .filter((page) => page.path !== "/journal/create" || canCreateJournals)
          .filter((page) => page.path !== "/rate/home" || canViewRates)
          .filter((page) => page.path !== "/rate/create" || canCreateRates)
          .filter((page) => page.path !== "/staff/home" || canViewStaff)
          .filter((page) => page.path !== "/staff/create-staff" || canCreateStaff)
          .filter((page) => page.path !== "/account/home" || canViewAccounts)
          .filter((page) => page.path !== "/ledger/home" || canViewLedgers)
          .filter((page) => page.path !== "/ledger/create" || canCreateLedgers)
          .filter((page) => page.path !== "/banks/home" || canViewBanks)
          .filter((page) => page.path !== "/client/home" || canViewClients)
          .filter((page) => page.path !== "/project/home" || canViewProjects)
          .filter((page) => page.path !== "/reports/ledger" || canViewReportHub)
          .filter((page) => page.path !== "/reports/ledger/ledger-statement" || canViewLedgerStatement)
          .filter((page) => page.path !== "/reports/ledger/general-ledger" || canViewGeneralLedger)
          .filter((page) => page.path !== "/reports/ledger/trial-balance" || canViewTrialBalance)
          .filter((page) => page.path !== "/reports/ledger/profit-and-loss" || canViewProfitLoss)
          .filter((page) => page.path !== "/reports/ledger/balance-sheet" || canViewBalanceSheet)
          .filter((page) => page.path !== "/reports/invoice-aging" || canViewInvoiceAging)
          .filter((page) => page.path !== "/reports/fx-revaluation" || (canViewFx && !isRestrictedCostCenter))
          .filter((page) => page.path !== "/reports/bank-recon" || canViewBankRecon)
          .filter((page) => page.path !== "/reports/bank-recon/create" || canCreateBankRecon)
          .filter((page) => page.path !== "/lock-period/home" || (canAccessAccountingPeriods && !isRestrictedCostCenter));
    return permittedPages
      .filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keywords?.some(k => k.includes(q))
      )
      .slice(0, 4);
  }, [query, isTimesheetUser, canAdministerUsers, canAccessCostCentres, canViewActivityLogs, isRestrictedCostCenter, canViewDashboard, canViewInvoices, canCreateInvoices, canViewJournals, canCreateJournals, canViewAccounts, canViewLedgers, canCreateLedgers, canViewBanks, canViewRates, canCreateRates, canViewClients, canViewStaff, canCreateStaff, canViewProjects, canViewReportHub, canViewLedgerStatement, canViewGeneralLedger, canViewTrialBalance, canViewProfitLoss, canViewBalanceSheet, canViewInvoiceAging, canViewFx, canViewBankRecon, canCreateBankRecon, canAccessAccountingPeriods, canViewTimesheets, canCreateTimesheets, canViewNotifications]);

  /* Live data search — debounced */
  const runLiveSearch = useCallback(async (q) => {
    if (isTimesheetUser || !q || q.length < 2) { setLiveResults({}); setSearching(false); return; }
    setSearching(true);

    // Set search query in all stores simultaneously
    if (canViewInvoices) invoiceStore.setSearchQuery(q);
    if (canViewJournals) journalStore.setSearchQuery(q);
    if (canViewClients) clientStore.setSearchQuery(q);
    if (canViewLedgers) ledgerStore.setSearchQuery(q);
    if (canViewProjects) projectStore.setSearchQuery(q);
    if (canViewAccounts) accountStore.setSearchQuery(q);

    // Fetch all in parallel
    await Promise.allSettled([
      ...(canViewInvoices ? [invoiceStore.fetchData()] : []),
      ...(canViewJournals ? [journalStore.fetchData()] : []),
      ...(canViewClients ? [clientStore.fetchData()] : []),
      ...(canViewLedgers ? [ledgerStore.fetchData()] : []),
      ...(canViewProjects ? [projectStore.fetchData()] : []),
      ...(canViewAccounts ? [accountStore.fetchData()] : []),
    ]);

    setSearching(false);
  }, [isTimesheetUser, canViewInvoices, canViewJournals, canViewAccounts, canViewLedgers, canViewClients, canViewProjects]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (isTimesheetUser) {
      setLiveResults({});
      setSearching(false);
      return;
    }
    if (query.length < 2) {
      setLiveResults({});
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => runLiveSearch(query), 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, isTimesheetUser, runLiveSearch]);

  // Collect live results from stores
  const live = useMemo(() => isTimesheetUser ? ({
    invoices: [], journals: [], clients: [], ledgers: [], projects: [], accounts: [],
  }) : ({
    invoices: canViewInvoices ? (invoiceStore.data || []).slice(0, 3) : [],
    journals: canViewJournals ? (journalStore.data || []).slice(0, 3) : [],
    clients:  canViewClients ? (clientStore.data || []).slice(0, 3) : [],
    ledgers:  canViewLedgers ? (ledgerStore.data  || []).slice(0, 3) : [],
    projects: canViewProjects ? (projectStore.data || []).slice(0, 3) : [],
    accounts: canViewAccounts ? (accountStore.data || []).slice(0, 3) : [],
  }), [
    isTimesheetUser, canViewInvoices, canViewJournals, canViewAccounts, canViewLedgers, canViewClients, canViewProjects,
    invoiceStore.data, journalStore.data, clientStore.data,
    ledgerStore.data, projectStore.data, accountStore.data,
  ]);

  const hasLiveResults = !isTimesheetUser && query.length >= 2 && (
    live.invoices.length + live.journals.length + live.clients.length +
    live.ledgers.length + live.projects.length + live.accounts.length > 0
  );

  const go = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  const handleClose = useCallback(() => {
    // Reset search queries in all stores so list pages aren't filtered
    invoiceStore.setSearchQuery("");
    if (canViewJournals) journalStore.setSearchQuery("");
    clientStore.setSearchQuery("");
    ledgerStore.setSearchQuery("");
    projectStore.setSearchQuery("");
    accountStore.setSearchQuery("");
    onClose();
  }, [onClose, canViewJournals]);

  const hasAnyResults = pageMatches.length > 0 || hasLiveResults;

  return createPortal(
    <div
      className={`sb-gsearch__overlay ${isDark ? "sb-gsearch--dark" : "sb-gsearch--light"}`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog" aria-modal="true" aria-label="Global search"
    >
      <div className="sb-gsearch__modal">

        {/* Input row */}
        <div className="sb-gsearch__input-row">
          <i className={`fas ${searching ? "fa-spinner fa-spin" : "fa-magnifying-glass"} sb-gsearch__search-icon`} />
          <input
            ref={inputRef} type="text"
            className="sb-gsearch__input"
            placeholder={isTimesheetUser ? "Search timesheets and reports…" : "Search pages, clients, ledgers, invoices…"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off" spellCheck={false}
          />
          {query ? (
            <button className="sb-gsearch__clear" onClick={() => setQuery("")} aria-label="Clear">
              <i className="fas fa-xmark" />
            </button>
          ) : (
            <kbd className="sb-gsearch__esc-hint">Esc</kbd>
          )}
        </div>

        {/* Results area */}
        <div className="sb-gsearch__results">

          {/* Live data results */}
          {!isTimesheetUser && query.length >= 2 && (
            <>
              {canViewClients && live.clients.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-users" /> Clients
                    <button className="sb-gsearch__group-more" onClick={() => go("/client/home")}>View all</button>
                  </div>
                  {live.clients.map(c => (
                    <ClientCard key={c.id || c.clients_id} item={c} query={query}
                      onClick={() => go(`/client/view/${c.clients_id}`)} />
                  ))}
                </div>
              )}

              {live.invoices.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-file-invoice-dollar" /> Invoices
                    <button className="sb-gsearch__group-more" onClick={() => go("/invoice/home")}>View all</button>
                  </div>
                  {live.invoices.map(inv => (
                    <InvoiceCard key={inv.id || inv.invoice_number} item={inv} query={query}
                      onClick={() => go(`/invoice/view/${inv.id}`)} />
                  ))}
                </div>
              )}

              {canViewLedgers && live.ledgers.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-book-open" /> Ledgers
                    <button className="sb-gsearch__group-more" onClick={() => go("/ledger/home")}>View all</button>
                  </div>
                  {live.ledgers.map(l => (
                    <LedgerCard key={l.id || l.ledger_number} item={l} query={query}
                      onClick={() => go(`/ledger/view/${l.ledger_number}`)} />
                  ))}
                </div>
              )}

              {canViewJournals && live.journals.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-book" /> Journals
                    <button className="sb-gsearch__group-more" onClick={() => go("/journal/home")}>View all</button>
                  </div>
                  {live.journals.map(j => (
                    <JournalCard key={j.journal_id} item={j} query={query}
                      onClick={() => go(`/journal/view/${j.journal_id}`)} />
                  ))}
                </div>
              )}

              {canViewProjects && live.projects.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-diagram-project" /> Projects
                    <button className="sb-gsearch__group-more" onClick={() => go("/project/home")}>View all</button>
                  </div>
                  {live.projects.map(p => (
                    <ProjectCard key={p.id || p.project_code} item={p} query={query}
                      onClick={() => go(`/project/view/${p.project_code}`)} />
                  ))}
                </div>
              )}

              {canViewAccounts && live.accounts.length > 0 && (
                <div className="sb-gsearch__group">
                  <div className="sb-gsearch__group-label">
                    <i className="fas fa-wallet" /> Account Types
                    <button className="sb-gsearch__group-more" onClick={() => go("/account/home")}>View all</button>
                  </div>
                  {live.accounts.map(a => (
                    <AccountCard key={a.id} item={a} query={query}
                      onClick={() => go(`/account/view/${a.id}`)} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Page navigation results */}
          {pageMatches.length > 0 && (
            <div className="sb-gsearch__group">
              <div className="sb-gsearch__group-label"><i className="fas fa-compass" /> Pages</div>
              {pageMatches.map(p => (
                <PageCard key={p.path} item={p} query={query} onClick={() => go(p.path)} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {query.length >= 2 && !searching && !hasAnyResults && (
            <div className="sb-gsearch__empty">
              <i className="fas fa-magnifying-glass" />
              <p>No results for <strong>"{query}"</strong></p>
              <span>Try a client name, invoice number, ledger number or page name</span>
            </div>
          )}

          {/* Loading state */}
          {searching && query.length >= 2 && !hasAnyResults && (
            <div className="sb-gsearch__empty sb-gsearch__loading-state">
              <i className="fas fa-spinner fa-spin" />
              <p>Searching…</p>
            </div>
          )}

          {/* Default — no query */}
          {!query && (
            <div className="sb-gsearch__suggestions">
              <div className="sb-gsearch__sugg-label">Quick links</div>
              <div className="sb-gsearch__sugg-grid">
                {(isTimesheetUser ? [
                  ...(canViewTimesheets && !isRestrictedCostCenter ? [{ label: "Timesheets", path: "/timesheet/home", icon: "fa-clock" }] : []),
                  ...(canCreateTimesheets && !isRestrictedCostCenter ? [{ label: "Log Time", path: "/timesheet/create-timesheet", icon: "fa-plus" }] : []),
                  ...(canViewTimesheets && !isRestrictedCostCenter ? [{ label: "Reports", path: "/reports/timesheet", icon: "fa-chart-line" }] : []),
                  ...(canViewNotifications ? [{ label: "Notifications", path: "/notifications", icon: "fa-bell" }] : []),
                ] : [
                  ...(canViewDashboard ? [{ label: "Dashboard", path: "/", icon: "fa-gauge-high" }] : []),
                  ...(canViewInvoices ? [{ label: "Invoices", path: "/invoice/home", icon: "fa-file-invoice-dollar" }] : []),
                  ...(canViewJournals ? [{ label: "Journal", path: "/journal/home", icon: "fa-book" }] : []),
                  ...(canViewClients ? [{ label: "Clients", path: "/client/home", icon: "fa-users" }] : []),
                  ...(canViewProjects ? [{ label: "Projects", path: "/project/home", icon: "fa-diagram-project" }] : []),
                  ...(canViewLedgers ? [{ label: "Ledgers", path: "/ledger/home", icon: "fa-book-open" }] : []),
                  ...(canViewRates ? [{ label: "Exchange Rates", path: "/rate/home", icon: "fa-arrow-right-arrow-left" }] : []),
                  ...(canViewStaff ? [{ label: "Staff", path: "/staff/home", icon: "fa-id-badge" }] : []),
                  ...(canViewTimesheets && !isRestrictedCostCenter ? [{ label: "Timesheets", path: "/timesheet/home", icon: "fa-clock" }] : []),
                  ...(canViewNotifications ? [{ label: "Notifications", path: "/notifications", icon: "fa-bell" }] : []),
                  ...(canViewReportHub ? [{ label: "Reports", path: "/reports/ledger", icon: "fa-chart-line" }] : []),
                  ...(canCreateBankRecon ? [{ label: "New Reconciliation", path: "/reports/bank-recon/create", icon: "fa-plus" }] : []),
                ]).map(s => (
                  <button key={s.path} className="sb-gsearch__sugg-item" onClick={() => go(s.path)}>
                    <i className={`fas ${s.icon}`} />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sb-gsearch__footer">
          <span><kbd>↵</kbd> Go</span>
          <span><kbd>Esc</kbd> Close</span>
          <span className="sb-gsearch__footer-tip">
            {isTimesheetUser
              ? `Search Timesheets pages and your reports`
              : (query.length >= 2
                ? `Searching across clients, invoices, ledgers, journals & more`
                : `Type 2+ characters for live results`)}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ─────────────────────────────────────────────
   EXPORTED COMPONENT
───────────────────────────────────────────── */
const GlobalSearch = ({ isDark }) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const isTimesheetUser = isTimesheetOnly(user);
  const isRestrictedCostCenter = String(user?.cost_center_access_mode || 'all').toLowerCase() === 'restricted';
  const canAdministerUsers = canManageUsers(user);
  const canViewDashboard = hasPermission(user, "dashboard.view");
  const canViewInvoices = hasPermission(user, "invoice.view");
  const canCreateInvoices = hasPermission(user, "invoice.create");
  const canViewJournals = hasPermission(user, "journal.view");
  const canCreateJournals = hasPermission(user, "journal.create");
  const canViewAccounts = hasPermission(user, "account.view");
  const canViewLedgers = hasPermission(user, "ledger.view");
  const canCreateLedgers = hasPermission(user, "ledger.create");
  const canViewBanks = hasPermission(user, "bank.view");
  const canViewRates = hasPermission(user, "exchange_rate.view");
  const canCreateRates = hasPermission(user, "exchange_rate.create");
  const canViewClients = hasPermission(user, "client.view");
  const canViewStaff = hasPermission(user, "staff.view");
  const canCreateStaff = hasPermission(user, "staff.create");
  const canViewProjects = hasPermission(user, "project.view");
  const canViewReportHub = hasPermission(user, "report.view");
  const canViewLedgerStatement = hasPermission(user, "ledger_statement.view");
  const canViewGeneralLedger = hasPermission(user, "general_ledger.view");
  const canViewTrialBalance = hasPermission(user, "trial_balance.view");
  const canViewProfitLoss = hasPermission(user, "profit_loss.view");
  const canViewBalanceSheet = hasPermission(user, "balance_sheet.view");
  const canViewInvoiceAging = hasPermission(user, "invoice_aging.view");
  const canViewFx = hasPermission(user, "fx.view");
  const canViewBankRecon = hasPermission(user, "bank_reconciliation.view");
  const canCreateBankRecon = hasPermission(user, "bank_reconciliation.create");
  const canAccessAccountingPeriods = hasAnyPermission(user, ["accounting_period.view", "accounting_period.create", "accounting_period.edit", "accounting_period.lock", "accounting_period.close", "accounting_period.reverse"]);
  const canAccessCostCentres = hasAnyPermission(user, ["cost_centre.view", "cost_centre.create", "cost_centre.edit", "cost_centre.delete"]) && !isRestrictedCostCenter;
  const canViewActivityLogs = hasPermission(user, "activity_log.view") && !isRestrictedCostCenter;
  const canViewTimesheets = hasPermission(user, "timesheet.view");
  const canCreateTimesheets = hasPermission(user, "timesheet.create");
  const canViewNotifications = hasPermission(user, "notification.view");

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        className={`sb-gsearch__trigger ${isDark ? "sb-gsearch__trigger--dark" : "sb-gsearch__trigger--light"}`}
        onClick={() => setOpen(true)} aria-label="Open search"
      >
        <i className="fas fa-magnifying-glass sb-gsearch__trigger-icon" />
        <span className="sb-gsearch__trigger-text">Search anything…</span>
        <kbd className="sb-gsearch__trigger-kbd">⌘K</kbd>
      </button>

      <button
        className={`sb-gsearch__mobile-trigger ${isDark ? "sb-gsearch__trigger--dark" : "sb-gsearch__trigger--light"}`}
        onClick={() => setOpen(true)} aria-label="Open search"
      >
        <i className="fas fa-magnifying-glass" />
      </button>

      {open && <SearchModal isDark={isDark} onClose={() => setOpen(false)} isTimesheetUser={isTimesheetUser} canAdministerUsers={canAdministerUsers} canAccessCostCentres={canAccessCostCentres} canViewActivityLogs={canViewActivityLogs} isRestrictedCostCenter={isRestrictedCostCenter} canViewDashboard={canViewDashboard} canViewInvoices={canViewInvoices} canCreateInvoices={canCreateInvoices} canViewJournals={canViewJournals} canCreateJournals={canCreateJournals} canViewAccounts={canViewAccounts} canViewLedgers={canViewLedgers} canCreateLedgers={canCreateLedgers} canViewBanks={canViewBanks} canViewRates={canViewRates} canCreateRates={canCreateRates} canViewClients={canViewClients} canViewStaff={canViewStaff} canCreateStaff={canCreateStaff} canViewProjects={canViewProjects} canViewReportHub={canViewReportHub} canViewLedgerStatement={canViewLedgerStatement} canViewGeneralLedger={canViewGeneralLedger} canViewTrialBalance={canViewTrialBalance} canViewProfitLoss={canViewProfitLoss} canViewBalanceSheet={canViewBalanceSheet} canViewInvoiceAging={canViewInvoiceAging} canViewFx={canViewFx} canViewBankRecon={canViewBankRecon} canCreateBankRecon={canCreateBankRecon} canAccessAccountingPeriods={canAccessAccountingPeriods} canViewTimesheets={canViewTimesheets} canCreateTimesheets={canCreateTimesheets} canViewNotifications={canViewNotifications} />}
    </>
  );
};

export default GlobalSearch;