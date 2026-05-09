import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import LogoLight from '../assets/images/smartbooks/smartbooks.png';
import LogoDark from '../assets/images/smartbooks/smartbooks_dark.png';
import './NavBar.css';

const NavBar = ({ nav, setNav }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const navRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const Logo = theme === 'dark' ? LogoDark : LogoLight;
  const isDark = theme === 'dark';

  // ... (submenus and navCategories definitions remain the same) ...
  
  const submenus = {
    invoices: {
      basePath: "/invoice",
      items: [
        { path: "/invoice/home",   label: "Overview",       icon: "fa-list-ul" },
        { path: "/invoice/create", label: "Create Invoice", icon: "fa-plus" },
      ]
    },
    journal: {
      basePath: "/journal",
      items: [
        { path: "/journal/home",   label: "Overview",       icon: "fa-list-ul" },
        { path: "/journal/create", label: "Create Journal", icon: "fa-plus" },
      ]
    },
    account: {
      basePath: "/account",
      items: [
        { path: "/account/home",   label: "Overview",        icon: "fa-list-ul" },
        { path: "/account/create", label: "Create Account",  icon: "fa-plus" },
      ]
    },
    ledgers: {
      basePath: "/ledger",
      items: [
        { path: "/ledger/home",   label: "Overview",       icon: "fa-list-ul" },
        { path: "/ledger/create", label: "Create Ledger",  icon: "fa-plus" },
      ]
    },
    client: {
      basePath: "/client",
      items: [
        { path: "/client/home",   label: "Overview",   icon: "fa-list-ul" },
        { path: "/client/create", label: "Add Client", icon: "fa-user-plus" },
      ]
    },
    staff: {
      basePath: "/staff",
      items: [
        { path: "/staff/home",          label: "Overview",  icon: "fa-list-ul" },
        { path: "/staff/create-staff",  label: "Add Staff", icon: "fa-user-plus" },
      ]
    },
    project: {
      basePath: "/project",
      items: [
        { path: "/project/home",   label: "Overview",       icon: "fa-list-ul" },
        { path: "/project/create", label: "Create Project", icon: "fa-plus" },
      ]
    },
    timesheet: {
      basePath: "/timesheet",
      items: [
        { path: "/timesheet/home",              label: "Overview",  icon: "fa-list-ul" },
        { path: "/timesheet/create-timesheet",  label: "Log Time",  icon: "fa-plus" },
      ]
    },
    report: {
      basePath: "/reports",
      items: [
        { path: "/reports/ledger",             label: "Ledger Reports",            icon: "fa-file-lines" },
        { path: "/reports/fx-revaluation",     label: "Exchange Rate Gain/Loss",   icon: "fa-file-lines" },
      ]
    },
    users: {
      basePath: "/users",
      items: [
        { path: "/users/home",        label: "Overview",  icon: "fa-list-ul" },
        { path: "/users/create-user", label: "Add User",  icon: "fa-user-plus" },
        { path: "/users/roles",       label: "Roles",     icon: "fa-shield-halved" },
      ]
    },
    settings: {
      basePath: "/settings",
      items: [
        { path: "/settings/general",  label: "General",  icon: "fa-sliders" },
        { path: "/settings/profile",  label: "Profile",  icon: "fa-circle-user" },
        { path: "/settings/security", label: "Security", icon: "fa-lock" },
      ]
    },
    banks: {
      basePath: "/banks",
      items: [
        { path: "/banks/home",   label: "Overview", icon: "fa-list-ul" },
        { path: "/banks/create", label: "Add Bank", icon: "fa-plus" },
      ]
    },
    rate: {
      basePath: "/rate",
      items: [
        { path: "/rate/home",    label: "Overview",        icon: "fa-list-ul" },
        { path: "/rate/create",  label: "Add Rate",        icon: "fa-plus" },
      ]
    },
    lockperiod: {
      basePath: "/lock-period",
      items: [
        { path: "/lock-period/home",   label: "Overview",     icon: "fa-list-ul" },
        { path: "/lock-period/create", label: "Create Lock",  icon: "fa-lock" },
      ]
    },
  };

  const navCategories = [
    {
      title: "General",
      items: [
        { type: "link", path: "/", label: "Dashboard", icon: "fa-gauge-high", end: true },
      ]
    },
    {
      title: "Accounting",
      items: [
        { type: "submenu", key: "invoices",  label: "Invoices",        icon: "fa-file-invoice-dollar" },
        { type: "submenu", key: "journal",   label: "Journal",         icon: "fa-book" },
        { type: "submenu", key: "account",   label: "Accounts",        icon: "fa-wallet" },
        { type: "submenu", key: "ledgers",   label: "Ledgers",         icon: "fa-book-open" },
        { type: "submenu", key: "banks",     label: "Banks",           icon: "fa-building-columns" },
        { type: "submenu", key: "rate",      label: "Exchange Rates",  icon: "fa-arrow-right-arrow-left" },
      ]
    },
    {
      title: "Management",
      items: [
        { type: "submenu", key: "client",    label: "Clients",     icon: "fa-users" },
        { type: "submenu", key: "staff",     label: "Staff",       icon: "fa-id-badge" },
        { type: "submenu", key: "project",   label: "Projects",    icon: "fa-diagram-project" },
        { type: "submenu", key: "timesheet", label: "Timesheets",  icon: "fa-clock" },
      ]
    },
    {
      title: "Analytics",
      items: [
        { type: "submenu", key: "report", label: "Reports", icon: "fa-chart-line" },
      ]
    },
    {
      title: "System",
      items: [
        { type: "submenu", key: "users",      label: "Users",        icon: "fa-users-gear" },
        { type: "submenu", key: "settings",   label: "Settings",     icon: "fa-gear" },
        { type: "submenu", key: "lockperiod", label: "Lock Period",  icon: "fa-calendar-xmark" },
      ]
    },
  ];

  const isInSubmenu = (submenu, currentPath) => {
    if (!submenu) return false;
    return currentPath.startsWith(submenu.basePath);
  };

  useEffect(() => {
    const currentPath = location.pathname;
    let activeKey = null;

    // 1. Find which submenu should be open
    Object.entries(submenus).forEach(([key, submenu]) => {
      if (isInSubmenu(submenu, currentPath)) {
        activeKey = key;
      }
    });

    // 2. Open the submenu
    setOpenSubmenu(activeKey);

    // 3. Scroll to the active element
    // We use a timeout to wait for the submenu to expand and the DOM to update
    const timer = setTimeout(() => {
      if (navRef.current) {
        // Find the currently active element by the classes applied in the render logic
        const activeElement = navRef.current.querySelector('.sb-nav__sub-item--active, .sb-nav__item--active');
        
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Centers the item in the view
          });
        }
      }
    }, 100); // 100ms delay allows the max-height transition to start

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const toggleSubmenu = (menuName) => {
    setOpenSubmenu(prev => prev === menuName ? null : menuName);
  };

  // Close nav on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const toggleBtn = document.querySelector('.sb-header__nav-toggle');
      if (toggleBtn && toggleBtn.contains(event.target)) return;
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNav(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNav]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {nav && <div className="sb-nav__backdrop" onClick={() => setNav(false)} />}

      <nav
        ref={navRef}
        className={`sb-nav ${nav ? "sb-nav--open" : ""} ${isDark ? "sb-nav--dark" : "sb-nav--light"}`}
      >
        {/* Logo area */}
        <div className="sb-nav__logo-wrap">
          <NavLink to="/" className="sb-nav__logo-link">
            <img src={Logo} alt="Smartbooks" className="sb-nav__logo" />
          </NavLink>
        </div>

        {/* Scrollable nav body */}
        <div className="sb-nav__scroll">
          <div className="sb-nav__inner">
            {navCategories.map((category, catIdx) => (
              <div key={catIdx} className="sb-nav__group">
                <span className="sb-nav__group-label">{category.title}</span>

                {category.items.map((item) => {
                  if (item.type === "link") {
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          `sb-nav__item ${isActive ? "sb-nav__item--active" : ""}`
                        }
                        onClick={() => setNav(false)}
                      >
                        <span className="sb-nav__item-icon-wrap">
                          <i className={`fas ${item.icon}`} />
                        </span>
                        <span className="sb-nav__item-label">{item.label}</span>
                        <span className="sb-nav__item-active-bar" />
                      </NavLink>
                    );
                  }

                  if (item.type === "submenu") {
                    const submenu = submenus[item.key];
                    const isParentActive = isInSubmenu(submenu, location.pathname);
                    const isOpen = openSubmenu === item.key;

                    return (
                      <div key={item.key} className="sb-nav__submenu-wrap">
                        <button
                          className={`sb-nav__item sb-nav__item--trigger ${isParentActive ? "sb-nav__item--active" : ""}`}
                          onClick={() => toggleSubmenu(item.key)}
                          aria-expanded={isOpen}
                        >
                          <span className="sb-nav__item-icon-wrap">
                            <i className={`fas ${item.icon}`} />
                          </span>
                          <span className="sb-nav__item-label">{item.label}</span>
                          <i className={`fas fa-chevron-right sb-nav__chevron ${isOpen ? "sb-nav__chevron--open" : ""}`} />
                          <span className="sb-nav__item-active-bar" />
                        </button>

                        <div
                          className={`sb-nav__submenu ${isOpen ? "sb-nav__submenu--open" : ""}`}
                          style={{
                            maxHeight: isOpen ? `${submenu.items.length * 44}px` : "0px"
                          }}
                        >
                          {submenu.items.map((sub) => (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              className={({ isActive }) =>
                                `sb-nav__sub-item ${isActive ? "sb-nav__sub-item--active" : ""}`
                              }
                              onClick={() => setNav(false)}
                            >
                              <i className={`fas ${sub.icon} sb-nav__sub-icon`} />
                              {sub.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer — user info */}
        {user && (
          <div className="sb-nav__footer">
            <div className="sb-nav__footer-avatar">
              {(user.fname?.[0] || "U").toUpperCase()}
            </div>
            <div className="sb-nav__footer-info">
              <span className="sb-nav__footer-name">
                {user.fname} {user.lname}
              </span>
              <span className="sb-nav__footer-role">{user.integrity || "Administrator"}</span>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default NavBar;