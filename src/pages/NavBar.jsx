import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import { canManageUsers, isTimesheetOnly } from "../utils/permissions";
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
  report: { basePath: "/reports", items: [{ path: "/reports/ledger", label: "Reports & Analytics", icon: "fa-file-lines" }, { path: "/reports/fx-revaluation", label: "FX Gain / Loss", icon: "fa-arrow-trend-up" }, { path: "/reports/invoice-aging", label: "Invoice Aging", icon: "fa-clock-rotate-left" }, { path: "/reports/timesheet", label: "Timesheet Report", icon: "fa-business-time" }, { path: "/reports/bank-recon", label: "Bank Reconciliation", icon: "fa-scale-balanced" }] },
  users: { basePath: "/users", items: [{ path: "/users/home", label: "All Users", icon: "fa-users" }, { path: "/users/create-user", label: "Add User", icon: "fa-user-plus" }] },
};

const navigationForOperationalUser = (isAdmin) => [
  { title: "Workspace", items: [{ type: "link", path: "/", label: "Dashboard", icon: "fa-gauge-high", end: true }] },
  { title: "Finance", items: [
    { type: "submenu", key: "invoices", label: "Invoices", icon: "fa-file-invoice-dollar" },
    { type: "submenu", key: "journal", label: "Journals", icon: "fa-book" },
    { type: "submenu", key: "account", label: "Accounts", icon: "fa-wallet" },
    { type: "submenu", key: "ledgers", label: "Ledgers", icon: "fa-book-open" },
    { type: "submenu", key: "banks", label: "Banks", icon: "fa-building-columns" },
    { type: "submenu", key: "rate", label: "Exchange Rates", icon: "fa-arrow-right-arrow-left" },
  ] },
  { title: "Operations", items: [
    { type: "submenu", key: "client", label: "Clients", icon: "fa-address-book" },
    { type: "submenu", key: "staff", label: "Staff", icon: "fa-id-badge" },
    { type: "submenu", key: "project", label: "Projects", icon: "fa-diagram-project" },
    { type: "submenu", key: "timesheet", label: "Timesheets", icon: "fa-clock" },
  ] },
  { title: "Insights", items: [{ type: "submenu", key: "report", label: "Reports & Analytics", icon: "fa-chart-simple" }] },
  { title: "Governance", items: [
    ...(isAdmin ? [{ type: "submenu", key: "users", label: "User Administration", icon: "fa-users-gear" }] : []),
    { type: "link", path: "/lock-period/home", label: "Lock Period", icon: "fa-calendar-xmark" },
    { type: "link", path: "/users/my-profile", label: "My Profile", icon: "fa-circle-user" },
  ] },
];

const NavBar = ({ nav, setNav }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const navRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const isTimesheetUser = isTimesheetOnly(user);
  const isAdmin = canManageUsers(user);

  const { menus, categories } = useMemo(() => {
    if (isTimesheetUser) {
      return {
        menus: {
          timesheet: OPERATIONAL_SUBMENUS.timesheet,
          report: { basePath: "/reports/timesheet", items: [{ path: "/reports/timesheet", label: "My Report", icon: "fa-chart-simple" }] },
        },
        categories: [
          { title: "My Workspace", items: [
            { type: "submenu", key: "timesheet", label: "Timesheets", icon: "fa-clock" },
            { type: "submenu", key: "report", label: "Reporting", icon: "fa-chart-simple" },
            { type: "link", path: "/users/my-profile", label: "My Profile", icon: "fa-circle-user" },
          ] },
        ],
      };
    }
    return { menus: OPERATIONAL_SUBMENUS, categories: navigationForOperationalUser(isAdmin) };
  }, [isAdmin, isTimesheetUser]);

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
                    <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setNav(false)} className={({ isActive }) => `sb-nav__item ${isActive ? 'sb-nav__item--active' : ''}`}>
                      <span className="sb-nav__item-icon"><i className={`fas ${item.icon}`} /></span><span>{item.label}</span>
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
                        <NavLink key={sub.path} to={sub.path} onClick={() => setNav(false)} className={({ isActive: active }) => `sb-nav__sub-item ${active ? 'sb-nav__sub-item--active' : ''}`}>
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
          <NavLink to="/users/my-profile" className="sb-nav__footer" onClick={() => setNav(false)}>
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
