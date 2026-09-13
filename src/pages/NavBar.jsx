import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import useNotificationStore from "../stores/useNotificationStore";
import { hasAnyPermission, hasPermission, isTimesheetOnly } from "../utils/permissions";
import { preloadRoute } from "../utils/routePreloader";
import './NavBar.css';

const OPERATIONAL_SUBMENUS = {
  invoices: { basePath: "/invoice", items: [{ path: "/invoice/home", label: "Overview", icon: "fa-list-ul" }, { path: "/invoice/create", label: "Create Invoice", icon: "fa-plus" }] },
  journal: { basePath: "/journal", items: [{ path: "/journal/home", label: "Overview", icon: "fa-list-ul" }, { path: "/journal/create", label: "Create Journal", icon: "fa-plus" }] },
  account: { basePath: "/account", items: [{ path: "/account/home", label: "Overview", icon: "fa-list-ul" }, { path: "/account/create", label: "Create Account", icon: "fa-plus" }] },
  ledgers: { basePath: "/ledger", items: [{ path: "/ledger/home", label: "Overview", icon: "fa-list-ul" }, { path: "/ledger/create", label: "Create Ledger", icon: "fa-plus" }] },
  banks: { basePath: "/banks", items: [{ path: "/banks/home", label: "Overview", icon: "fa-list-ul" }, { path: "/banks/create", label: "Add Bank", icon: "fa-plus" }] },
  rate: { basePath: "/rate", items: [{ path: "/rate/home", label: "Overview", icon: "fa-list-ul" }, { path: "/rate/create", label: "Add Rate", icon: "fa-plus" }] },
  client: { basePath: "/client", items: [{ path: "/client/home", label: "Overview", icon: "fa-list-ul" }, { path: "/client/create", label: "Add Client", icon: "fa-user-plus" }] },
  staff: { basePath: "/staff", items: [{ path: "/staff/home", label: "Overview", icon: "fa-list-ul" }, { path: "/staff/create-staff", label: "Add Staff", icon: "fa-user-plus" }] },
  project: { basePath: "/project", items: [{ path: "/project/home", label: "Overview", icon: "fa-list-ul" }, { path: "/project/create", label: "Create Project", icon: "fa-plus" }] },
  timesheet: { basePath: "/timesheet", items: [{ path: "/timesheet/home", label: "Entries", icon: "fa-list-ul" }, { path: "/timesheet/create-timesheet", label: "Log Time", icon: "fa-plus" }] },
  report: {
    basePath: "/reports",
    items: [
      { path: "/reports/ledger", label: "Report Library", icon: "fa-table-cells-large" },
      { path: "/reports/ledger/ledger-statement", label: "Ledger Statement", icon: "fa-book-open" },
      { path: "/reports/ledger/general-ledger", label: "General Ledger", icon: "fa-table-list" },
      { path: "/reports/ledger/trial-balance", label: "Trial Balance", icon: "fa-scale-balanced" },
      { path: "/reports/ledger/profit-and-loss", label: "Profit & Loss", icon: "fa-chart-line" },
      { path: "/reports/ledger/balance-sheet", label: "Balance Sheet", icon: "fa-building-columns" },
      { path: "/reports/invoice-aging", label: "Invoice Aging", icon: "fa-clock-rotate-left" },
      { path: "/reports/fx-revaluation", label: "FX Gain / Loss", icon: "fa-arrow-trend-up" },
      { path: "/reports/bank-recon", label: "Bank Reconciliation", icon: "fa-scale-unbalanced-flip" },
      { path: "/reports/timesheet", label: "Timesheet Analysis", icon: "fa-business-time" },
    ],
  },
  users: { basePath: "/users", items: [{ path: "/users/home", label: "All Users", icon: "fa-users" }, { path: "/users/create-user", label: "Add User", icon: "fa-user-plus" }] },
};

const navigationForOperationalUser = (showUserAdministration, showCostCentres, showActivityLogs, showAccountingPeriods, isRestrictedCostCenter, showDashboard, showJournal, showInvoices, showAccounts, showLedgers, showBanks, showRates, showClients, showStaff, showProjects, showTimesheets, showReports, showNotifications) => [
  ...(showDashboard ? [{ title: "Workspace", items: [{ type: "link", path: "/", label: "Dashboard", icon: "fa-gauge-high", end: true }] }] : []),
  { title: "Finance", items: [
    ...(showInvoices ? [{ type: "submenu", key: "invoices", label: "Invoices", icon: "fa-file-invoice-dollar" }] : []),
    ...(showJournal ? [{ type: "submenu", key: "journal", label: "Journals", icon: "fa-book" }] : []),
    ...(showAccounts ? [{ type: "submenu", key: "account", label: "Accounts", icon: "fa-wallet" }] : []),
    ...(showLedgers ? [{ type: "submenu", key: "ledgers", label: "Ledgers", icon: "fa-book-open" }] : []),
    ...(showBanks ? [{ type: "submenu", key: "banks", label: "Banks", icon: "fa-building-columns" }] : []),
    ...(showRates ? [{ type: "submenu", key: "rate", label: "Exchange Rates", icon: "fa-arrow-right-arrow-left" }] : []),
  ] },
  { title: "Operations", items: [
    ...(showClients ? [{ type: "submenu", key: "client", label: "Clients", icon: "fa-address-book" }] : []),
    ...(showStaff ? [{ type: "submenu", key: "staff", label: "Staff", icon: "fa-id-badge" }] : []),
    ...(showProjects ? [{ type: "submenu", key: "project", label: "Projects", icon: "fa-diagram-project" }] : []),
    ...(showTimesheets && !isRestrictedCostCenter ? [{ type: "submenu", key: "timesheet", label: "Timesheets", icon: "fa-clock" }] : []),
  ] },
  ...(showReports ? [{ title: "Insights", items: [{ type: "submenu", key: "report", label: "Reporting Centre", icon: "fa-chart-simple" }] }] : []),
  { title: "Governance", items: [
    ...(showUserAdministration ? [
      { type: "submenu", key: "users", label: "User Administration", icon: "fa-users-gear" },
    ] : []),
    ...(showCostCentres ? [
      { type: "link", path: "/cost-centres/home", label: "Cost Centres", icon: "fa-layer-group" },
    ] : []),
    ...(showAccountingPeriods && !isRestrictedCostCenter ? [{ type: "link", path: "/lock-period/home", label: "Lock Period", icon: "fa-calendar-xmark" }] : []),
    ...(showNotifications ? [{ type: "link", path: "/notifications", label: "Notifications", icon: "fa-bell", badge: "notifications" }] : []),
    ...(showActivityLogs ? [{ type: "link", path: "/activity-logs", label: "Activity Logs", icon: "fa-clock-rotate-left" }] : []),
    { type: "link", path: "/users/my-profile", label: "My Profile", icon: "fa-circle-user" },
  ] },
];

const NavBar = ({ nav, setNav }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const unreadNotifications = useNotificationStore((state) => state.counts.unread_count);
  const navRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const isTimesheetUser = isTimesheetOnly(user);
  const canViewDashboard = hasPermission(user, 'dashboard.view');
  const canViewUsers = hasPermission(user, 'user.view');
  const canCreateUsers = hasPermission(user, 'user.create');
  const canViewJournals = hasPermission(user, 'journal.view');
  const canCreateJournals = hasPermission(user, 'journal.create');
  const canViewInvoices = hasPermission(user, 'invoice.view');
  const canCreateInvoices = hasPermission(user, 'invoice.create');
  const canViewAccounts = hasPermission(user, 'account.view');
  const canCreateAccounts = hasPermission(user, 'account.create');
  const canViewLedgers = hasPermission(user, 'ledger.view');
  const canCreateLedgers = hasPermission(user, 'ledger.create');
  const canViewBanks = hasPermission(user, 'bank.view');
  const canCreateBanks = hasPermission(user, 'bank.create');
  const canViewRates = hasPermission(user, 'exchange_rate.view');
  const canCreateRates = hasPermission(user, 'exchange_rate.create');
  const canViewStaff = hasPermission(user, 'staff.view');
  const canCreateStaff = hasPermission(user, 'staff.create');
  const canViewClients = hasPermission(user, 'client.view');
  const canCreateClients = hasPermission(user, 'client.create');
  const canViewProjects = hasPermission(user, 'project.view');
  const canCreateProjects = hasPermission(user, 'project.create');
  const canViewReportHub = hasPermission(user, 'report.view');
  const canViewLedgerStatement = hasPermission(user, 'ledger_statement.view');
  const canViewGeneralLedger = hasPermission(user, 'general_ledger.view');
  const canViewTrialBalance = hasPermission(user, 'trial_balance.view');
  const canViewProfitLoss = hasPermission(user, 'profit_loss.view');
  const canViewBalanceSheet = hasPermission(user, 'balance_sheet.view');
  const canViewInvoiceAging = hasPermission(user, 'invoice_aging.view');
  const canViewFx = hasPermission(user, 'fx.view');
  const canViewBankRecon = hasPermission(user, 'bank_reconciliation.view');
  const canCreateBankRecon = hasPermission(user, 'bank_reconciliation.create');
  const canAccessAccountingPeriods = hasAnyPermission(user, ['accounting_period.view', 'accounting_period.create', 'accounting_period.edit', 'accounting_period.lock', 'accounting_period.close', 'accounting_period.reverse']);
  const canAccessCostCentres = hasAnyPermission(user, ['cost_centre.view', 'cost_centre.create', 'cost_centre.edit', 'cost_centre.delete']);
  const canViewActivityLogs = hasPermission(user, 'activity_log.view');
  const canViewTimesheets = hasPermission(user, 'timesheet.view');
  const canCreateTimesheets = hasPermission(user, 'timesheet.create');
  const canViewNotifications = hasPermission(user, 'notification.view');
  const isRestrictedCostCenter = String(user?.cost_center_access_mode || 'all').toLowerCase() === 'restricted';
  const showCostCentres = canAccessCostCentres && !isRestrictedCostCenter;
  const showActivityLogs = canViewActivityLogs && !isRestrictedCostCenter;

  const { menus, categories } = useMemo(() => {
    const userAdminItems = [
      ...(canViewUsers ? [{ path: "/users/home", label: "All Users", icon: "fa-users" }] : []),
      ...(canCreateUsers ? [{ path: "/users/create-user", label: "Add User", icon: "fa-user-plus" }] : []),
    ];

    const journalItems = [
      ...(canViewJournals ? [{ path: "/journal/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateJournals ? [{ path: "/journal/create", label: "Create Journal", icon: "fa-plus" }] : []),
    ];
    const showJournal = journalItems.length > 0;
    const invoiceItems = [
      ...(canViewInvoices ? [{ path: "/invoice/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateInvoices ? [{ path: "/invoice/create", label: "Create Invoice", icon: "fa-plus" }] : []),
    ];
    const showInvoices = invoiceItems.length > 0;
    const accountItems = [
      ...(canViewAccounts ? [{ path: "/account/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateAccounts ? [{ path: "/account/create", label: "Create Account", icon: "fa-plus" }] : []),
    ];
    const showAccounts = accountItems.length > 0;
    const ledgerItems = [
      ...(canViewLedgers ? [{ path: "/ledger/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateLedgers ? [{ path: "/ledger/create", label: "Create Ledger", icon: "fa-plus" }] : []),
    ];
    const showLedgers = ledgerItems.length > 0;
    const bankItems = [
      ...(canViewBanks ? [{ path: "/banks/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateBanks ? [{ path: "/banks/create", label: "Add Bank", icon: "fa-plus" }] : []),
    ];
    const showBanks = bankItems.length > 0;
    const rateItems = [
      ...(canViewRates ? [{ path: "/rate/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateRates ? [{ path: "/rate/create", label: "Add Rate", icon: "fa-plus" }] : []),
    ];
    const showRates = rateItems.length > 0;
    const clientItems = [
      ...(canViewClients ? [{ path: "/client/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateClients ? [{ path: "/client/create", label: "Add Client", icon: "fa-user-plus" }] : []),
    ];
    const showClients = clientItems.length > 0;
    const staffItems = [
      ...(canViewStaff ? [{ path: "/staff/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateStaff ? [{ path: "/staff/create-staff", label: "Add Staff", icon: "fa-user-plus" }] : []),
    ];
    const showStaff = staffItems.length > 0;
    const projectItems = [
      ...(canViewProjects ? [{ path: "/project/home", label: "Overview", icon: "fa-list-ul" }] : []),
      ...(canCreateProjects ? [{ path: "/project/create", label: "Create Project", icon: "fa-plus" }] : []),
    ];
    const showProjects = projectItems.length > 0;
    const timesheetItems = [
      ...(canViewTimesheets ? [{ path: "/timesheet/home", label: "Entries", icon: "fa-list-ul" }] : []),
      ...(canCreateTimesheets ? [{ path: "/timesheet/create-timesheet", label: "Log Time", icon: "fa-plus" }] : []),
    ];
    const showTimesheets = timesheetItems.length > 0 && !isRestrictedCostCenter;
    const migratedReportItems = [
      ...(canViewReportHub ? [{ path: "/reports/ledger", label: "Report Library", icon: "fa-table-cells-large" }] : []),
      ...(canViewLedgerStatement ? [{ path: "/reports/ledger/ledger-statement", label: "Ledger Statement", icon: "fa-book-open" }] : []),
      ...(canViewGeneralLedger ? [{ path: "/reports/ledger/general-ledger", label: "General Ledger", icon: "fa-table-list" }] : []),
      ...(canViewTrialBalance ? [{ path: "/reports/ledger/trial-balance", label: "Trial Balance", icon: "fa-scale-balanced" }] : []),
      ...(canViewProfitLoss ? [{ path: "/reports/ledger/profit-and-loss", label: "Profit & Loss", icon: "fa-chart-line" }] : []),
      ...(canViewBalanceSheet ? [{ path: "/reports/ledger/balance-sheet", label: "Balance Sheet", icon: "fa-building-columns" }] : []),
      ...(canViewInvoiceAging ? [{ path: "/reports/invoice-aging", label: "Invoice Aging", icon: "fa-clock-rotate-left" }] : []),
      ...(canViewFx && !isRestrictedCostCenter ? [{ path: "/reports/fx-revaluation", label: "FX Gain / Loss", icon: "fa-arrow-trend-up" }] : []),
      ...(canViewBankRecon ? [{ path: "/reports/bank-recon", label: "Bank Reconciliation", icon: "fa-scale-unbalanced-flip" }] : []),
      ...(canCreateBankRecon ? [{ path: "/reports/bank-recon/create", label: "New Reconciliation", icon: "fa-plus" }] : []),
      ...(canViewTimesheets && !isRestrictedCostCenter ? [{ path: "/reports/timesheet", label: "Timesheet Analysis", icon: "fa-business-time" }] : []),
    ];
    const reportItems = migratedReportItems;
    const showReports = reportItems.length > 0;

    if (isTimesheetUser) {
      const personalMenus = {
        ...(showTimesheets ? { timesheet: { ...OPERATIONAL_SUBMENUS.timesheet, items: timesheetItems } } : {}),
        ...(canViewTimesheets && !isRestrictedCostCenter
          ? { report: { basePath: "/reports/timesheet", items: [{ path: "/reports/timesheet", label: "My Report", icon: "fa-chart-simple" }] } }
          : {}),
      };
      return {
        menus: personalMenus,
        categories: [
          { title: "My Workspace", items: [
            ...(showTimesheets ? [{ type: "submenu", key: "timesheet", label: "Timesheets", icon: "fa-clock" }] : []),
            ...(canViewTimesheets && !isRestrictedCostCenter ? [{ type: "submenu", key: "report", label: "Reporting", icon: "fa-chart-simple" }] : []),
            ...(canViewNotifications ? [{ type: "link", path: "/notifications", label: "Notifications", icon: "fa-bell", badge: "notifications" }] : []),
            ...(showCostCentres ? [{ type: "link", path: "/cost-centres/home", label: "Cost Centres", icon: "fa-layer-group" }] : []),
            ...(showActivityLogs ? [{ type: "link", path: "/activity-logs", label: "Activity Logs", icon: "fa-clock-rotate-left" }] : []),
            { type: "link", path: "/users/my-profile", label: "My Profile", icon: "fa-circle-user" },
          ] },
        ],
      };
    }

    const baseMenus = {
      ...OPERATIONAL_SUBMENUS,
      invoices: { ...OPERATIONAL_SUBMENUS.invoices, items: invoiceItems },
      journal: { ...OPERATIONAL_SUBMENUS.journal, items: journalItems },
      account: { ...OPERATIONAL_SUBMENUS.account, items: accountItems },
      ledgers: { ...OPERATIONAL_SUBMENUS.ledgers, items: ledgerItems },
      banks: { ...OPERATIONAL_SUBMENUS.banks, items: bankItems },
      rate: { ...OPERATIONAL_SUBMENUS.rate, items: rateItems },
      users: { ...OPERATIONAL_SUBMENUS.users, items: userAdminItems },
      client: { ...OPERATIONAL_SUBMENUS.client, items: clientItems },
      staff: { ...OPERATIONAL_SUBMENUS.staff, items: staffItems },
      project: { ...OPERATIONAL_SUBMENUS.project, items: projectItems },
      timesheet: { ...OPERATIONAL_SUBMENUS.timesheet, items: timesheetItems },
      report: { ...OPERATIONAL_SUBMENUS.report, items: reportItems },
    };
    if (!showAccounts) delete baseMenus.account;
    if (!showLedgers) delete baseMenus.ledgers;
    if (!showBanks) delete baseMenus.banks;
    if (!showRates) delete baseMenus.rate;
    if (!showStaff) delete baseMenus.staff;
    if (!showTimesheets) delete baseMenus.timesheet;
    if (!showReports) delete baseMenus.report;
    return {
      menus: baseMenus,
      categories: navigationForOperationalUser(userAdminItems.length > 0, showCostCentres, showActivityLogs, canAccessAccountingPeriods, isRestrictedCostCenter, canViewDashboard, showJournal, showInvoices, showAccounts, showLedgers, showBanks, showRates, showClients, showStaff, showProjects, showTimesheets, showReports, canViewNotifications),
    };
  }, [canAccessAccountingPeriods, canCreateAccounts, canCreateBanks, canCreateClients, canCreateInvoices, canCreateJournals, canCreateLedgers, canCreateProjects, canCreateRates, canCreateStaff, canCreateUsers, canViewAccounts, canViewBalanceSheet, canViewBankRecon, canCreateBankRecon, canViewBanks, canViewClients, canViewDashboard, canViewFx, canViewGeneralLedger, canViewInvoiceAging, canViewInvoices, canViewJournals, canViewLedgerStatement, canViewLedgers, canViewProfitLoss, canViewProjects, canViewRates, canViewReportHub, canViewStaff, canViewTrialBalance, canViewUsers, canViewTimesheets, canCreateTimesheets, canViewNotifications, isRestrictedCostCenter, isTimesheetUser, showActivityLogs, showCostCentres]);

  useEffect(() => {
    const active = Object.entries(menus).find(([, menu]) => location.pathname.startsWith(menu.basePath));
    setOpenSubmenu(active?.[0] || null);
    const timer = window.setTimeout(() => {
      navRef.current?.querySelector('.sb-nav__sub-item--active, .sb-nav__item--active')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, menus]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!nav || window.innerWidth > 960) return;
      if (document.querySelector('.sb-header__nav-toggle')?.contains(event.target)) return;
      if (navRef.current && !navRef.current.contains(event.target)) setNav(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [nav, setNav]);

  const initials = `${user?.fname?.[0] || ''}${user?.lname?.[0] || ''}`.toUpperCase() || 'U';
  const preloadProps = (path) => ({
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
    onTouchStart: () => preloadRoute(path),
  });

  return (
    <>
      {nav && <div className="sb-nav__backdrop" onClick={() => setNav(false)} />}
      <nav ref={navRef} className={`sb-nav sb-nav--${theme} ${nav ? 'sb-nav--open' : ''}`} aria-label="Primary navigation">
        <div className="sb-nav__workspace">
          <span className="sb-nav__workspace-icon"><i className="fas fa-layer-group" /></span>
          <div><strong>Smartbooks</strong><small>{isTimesheetUser ? 'Personal time workspace' : 'Accounting workspace'}</small></div>
        </div>
        <div className="sb-nav__scroll">
          {categories.map((category) => (
            <section key={category.title} className="sb-nav__group">
              <span className="sb-nav__group-label">{category.title}</span>
              {category.items.map((item) => {
                if (item.type === 'link') {
                  return (
                    <NavLink key={item.path} to={item.path} end={item.end} {...preloadProps(item.path)} onClick={() => setNav(false)} className={({ isActive }) => `sb-nav__item ${isActive ? 'sb-nav__item--active' : ''}`}>
                      <span className="sb-nav__item-icon"><i className={`fas ${item.icon}`} /></span>
                      <span>{item.label}</span>
                      {item.badge === 'notifications' && unreadNotifications > 0 && (
                        <span className="sb-nav__item-badge" aria-label={`${unreadNotifications} unread notifications`}>
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                      )}
                    </NavLink>
                  );
                }
                const menu = menus[item.key];
                const isOpen = openSubmenu === item.key;
                const isActive = location.pathname.startsWith(menu.basePath);
                return (
                  <div className="sb-nav__menu" key={item.key}>
                    <button type="button" onClick={() => setOpenSubmenu((value) => value === item.key ? null : item.key)} className={`sb-nav__item sb-nav__item--trigger ${isActive ? 'sb-nav__item--active' : ''}`} aria-expanded={isOpen}>
                      <span className="sb-nav__item-icon"><i className={`fas ${item.icon}`} /></span><span>{item.label}</span><i className={`fas fa-chevron-down sb-nav__chevron ${isOpen ? 'open' : ''}`} />
                    </button>
                    <div className={`sb-nav__submenu ${isOpen ? 'open' : ''}`} style={{ maxHeight: isOpen ? `${menu.items.length * 43 + 9}px` : 0 }}>
                      {menu.items.map((sub) => (
                        <NavLink key={sub.path} to={sub.path} end {...preloadProps(sub.path)} onClick={() => setNav(false)} className={({ isActive: active }) => `sb-nav__sub-item ${active ? 'sb-nav__sub-item--active' : ''}`}>
                          <i className={`fas ${sub.icon}`} />{sub.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
        {user && (
          <NavLink to="/users/my-profile" {...preloadProps('/users/my-profile')} className="sb-nav__footer" onClick={() => setNav(false)}>
            <span className="sb-nav__avatar">{initials}</span>
            <span className="sb-nav__identity"><strong>{user.fname} {user.lname}</strong><small>{user.integrity}</small></span>
            <i className="fas fa-chevron-right" />
          </NavLink>
        )}
      </nav>
    </>
  );
};

export default NavBar;
