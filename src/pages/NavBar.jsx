import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import LogoLight from '../assets/images/smartbooks/smartbooks.png';
import LogoDark from '../assets/images/smartbooks/smartbooks_dark.png';
import Male_User from '../assets/images/avarter-image-male.jpg';

const NavBar = ({ nav, setNav }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navRef = useRef(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const Logo = theme === 'dark' ? LogoDark : LogoLight;

  // Submenu configurations (Same as before)
  const submenus = {
    invoices: {
      basePath: "/invoice",
      items: [
        { path: "/invoice/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/invoice/create", label: "Create Invoice", icon: "fas fa-plus-circle" },
        // { path: "/invoice/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    journal: {
      basePath: "/journal",
      items: [
        { path: "/journal/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/journal/create", label: "Create Journal", icon: "fas fa-plus-circle" },
        // { path: "/journal/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    account: {
      basePath: "/account",
      items: [
        { path: "/account/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/account/create", label: "Create Account", icon: "fas fa-plus-circle" },
        // { path: "/account/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    ledgers: {
      basePath: "/ledgers",
      items: [
        { path: "/ledgers/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/ledgers/create-ledger", label: "Create Ledger", icon: "fas fa-plus-circle" },
        // { path: "/ledgers/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    client: {
      basePath: "/client",
      items: [
        { path: "/client/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/client/create", label: "Add Client", icon: "fas fa-user-plus" },
        // { path: "/client/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    staff: {
      basePath: "/staff",
      items: [
        { path: "/staff/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/staff/create-staff", label: "Add Staff", icon: "fas fa-user-plus" },
        // { path: "/staff/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    project: {
      basePath: "/project",
      items: [
        { path: "/project/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/project/create-project", label: "Create Project", icon: "fas fa-plus-circle" },
        // { path: "/project/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    timesheet: {
      basePath: "/timesheet",
      items: [
        { path: "/timesheet/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/timesheet/create-timesheet", label: "Log Time", icon: "fas fa-plus-circle" },
        // { path: "/timesheet/report", label: "Report", icon: "fas fa-chart-bar" }
      ]
    },
    report: {
      basePath: "/reports",
      items: [
        { path: "/reports", label: "Home", icon: "fas fa-list-alt" },
        { path: "/reports/financial", label: "Financial", icon: "fas fa-file-alt" },
        { path: "/reports/invoice", label: "Invoice Report", icon: "fas fa-file-invoice" },
        { path: "/reports/payroll", label: "Payroll", icon: "fas fa-money-bill" },
      ]
    },
    users: {
      basePath: "/users",
      items: [
        { path: "/users/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/users/create-user", label: "Add User", icon: "fas fa-user-plus" },
        { path: "/users/roles", label: "Roles", icon: "fas fa-shield-alt" }
      ]
    },
    settings: {
      basePath: "/settings",
      items: [
        { path: "/settings/general", label: "General", icon: "fas fa-sliders-h" },
        { path: "/settings/profile", label: "Profile", icon: "fas fa-user-cog" },
        { path: "/settings/security", label: "Security", icon: "fas fa-lock" }
      ]
    },
    banks: {
      basePath: "/banks",
      items: [
        { path: "/banks/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/banks/add-bank", label: "Add Bank", icon: "fas fa-plus-circle" },
        { path: "/banks/transactions", label: "Transactions", icon: "fas fa-exchange-alt" }
      ]
    },
    rate: {
      basePath: "/rate",
      items: [
        { path: "/rate/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/rate/add-rate", label: "Add Rate", icon: "fas fa-plus-circle" },
        { path: "/rate/rates", label: "Exchange Rates", icon: "fas fa-chart-line" }
      ]
    },
    lockperiod: {
      basePath: "/lock-period",
      items: [
        { path: "/lock-period/home", label: "Overview", icon: "fas fa-list-alt" },
        { path: "/lock-period/create", label: "Create Lock", icon: "fas fa-lock" }
      ]
    },
  };

  // NEW: Nav items organized by Category
  const navCategories = [
    {
      title: "General",
      items: [
        { type: "link", path: "/", label: "Home", icon: "fas fa-home", end: true },
      ]
    },
    {
      title: "Accounting",
      items: [
        { type: "submenu", key: "invoices", label: "Invoice", icon: "fas fa-file-invoice" },
        { type: "submenu", key: "journal", label: "Journal", icon: "fas fa-book" },
        { type: "submenu", key: "account", label: "Account", icon: "fas fa-clipboard-list" },
        { type: "submenu", key: "ledgers", label: "Ledgers", icon: "fas fa-book-open" },
        { type: "submenu", key: "banks", label: "Banks", icon: "fas fa-university" },
        { type: "submenu", key: "rate", label: "Exchange Rates", icon: "fas fa-dollar-sign" },
      ]
    },
    {
      title: "Management",
      items: [
        { type: "submenu", key: "client", label: "Client", icon: "fas fa-user-friends" },
        { type: "submenu", key: "staff", label: "Staff", icon: "fas fa-id-badge" },
        { type: "submenu", key: "project", label: "Project", icon: "fas fa-rocket" },
        { type: "submenu", key: "timesheet", label: "Timesheet", icon: "fas fa-clock" },
      ]
    },
    {
      title: "Reports",
      items: [
        { type: "submenu", key: "report", label: "Report", icon: "fas fa-chart-line" },
      ]
    },
    {
      title: "System",
      items: [
        { type: "submenu", key: "users", label: "Users", icon: "fas fa-users-cog" },
        { type: "submenu", key: "settings", label: "Settings", icon: "fas fa-cog" },
        { type: "submenu", key: "lockperiod", label: "Lock Period", icon: "fas fa-calendar-times" },
      ]
    }
  ];

  // Check if current path matches any submenu items
  const isInSubmenu = (submenu, currentPath) => {
    if (!submenu) return false;
    return currentPath.startsWith(submenu.basePath);
  };

  // Set initial submenu state based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    Object.entries(submenus).forEach(([key, submenu]) => {
      if (isInSubmenu(submenu, currentPath)) {
        setOpenSubmenu(key);
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = (menuName) => {
    setOpenSubmenu(openSubmenu === menuName ? null : menuName);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const toggleButton = document.querySelector('.toggle-nav');
      if (toggleButton && toggleButton.contains(event.target)) return;
      if (navRef.current && !navRef.current.contains(event.target)) {
        setNav(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setNav]);

  return (
    <nav ref={navRef} className={`navbar ${nav ? "open-nav" : ""} theme-${theme}`}>
      <div className="navbar-overlay" />
      <NavLink to='/' className="navbar-logo navbar-logo-full">
        <img src={Logo} alt="logo" className="nav-dashboard-logo nav-dashboard-logo-full" />
      </NavLink>

      <div className="navbar-overflow-box">
        <div className="navbar-inner">
          
          {navCategories.map((category, catIndex) => (
            <div key={catIndex} className="navbar-category">
              {/* Category Header */}
              <div className={`navbar-category-header theme-${theme}`}>
                {category.title}
              </div>
              
              {/* Category Items */}
              {category.items.map((item, itemIndex) => {
                if (item.type === "link") {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      className={({ isActive }) =>
                        `navbar-link ${isActive ? 'active-nav-link' : ''} theme-${theme}`
                      }
                    >
                      <div className="navbar-licon-hold">
                        <span className={`${item.icon} navbar-licon`}></span>
                      </div>
                      <span className="navbarlink-text">{item.label}</span>
                    </NavLink>
                  );
                }

                if (item.type === "submenu") {
                  const submenu = submenus[item.key];
                  return (
                    <div key={item.key} className={`navbar-item theme-${theme}`}>
                      <div
                        className={`navbar-link ${isInSubmenu(submenu, location.pathname) ? 'active-nav-link' : ''} theme-${theme}`}
                        onClick={() => toggleSubmenu(item.key)}
                      >
                        <div className="navbar-licon-hold">
                          <span className={`${item.icon} navbar-licon`}></span>
                        </div>
                        <span className="navbarlink-text">{item.label}</span>
                        <span className={`fas fa-caret-right navbar-chevron ${openSubmenu === item.key ? 'active-chevron' : ''}`}></span>
                      </div>
                      <div className={`submenu ${openSubmenu === item.key ? 'open' : ''} theme-${theme}`}>
                        {submenu.items.map((subItem) => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            className={({ isActive }) =>
                              `submenu-link ${isActive ? 'active-submenu-link' : ''} theme-${theme}`
                            }
                          >
                            <span className={`${subItem.icon} submenuicon ${location.pathname.startsWith(subItem.path) ? 'active-submenu-icon' : ''}`}></span>
                            {subItem.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {/* Divider line between categories (optional, last one hidden via CSS) */}
              <div className="navbar-category-divider"></div>
            </div>
          ))}

        </div>
      </div>

    </nav>
  );
};

export default NavBar;