import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LogoLight from '../assets/images/smartbooks/smartbooks.png';
import LogoDark from '../assets/images/smartbooks/smartbooks_dark.png';
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import GlobalSearch from "./GlobalSearch";
import './Header.css';

const Header = ({ nav, setNav }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const Logo = theme === 'dark' ? LogoDark : LogoLight;
  const isDark = theme === 'dark';

  const handleNavToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNav(prev => !prev);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user
    ? `${user.fname?.[0] || ""}`.toUpperCase() || "U"
    // ? `${user.fname?.[0] || ""}${user.lname?.[0] || ""}`.toUpperCase() || "U"
    : "U";
  const fullName = user ? `${user.fname || ""} ${user.lname || ""}`.trim() : "User";

  // Show only the username part before @
  const emailDisplay = user?.email
    ? user.email.split("@")[0]
    : "";

  return (
    <header className={`sb-header ${isDark ? "sb-header--dark" : "sb-header--light"}`}>

      {/* ── Left: hamburger (mobile) OR logo (desktop) ── */}
      <div className="sb-header__left">
        {/* Desktop logo — hidden on mobile */}
        <NavLink to="/" className="sb-header__logo-link sb-header__logo-link--desktop">
          <img src={Logo} alt="Smartbooks" className="sb-header__logo" />
        </NavLink>

        {/* Mobile: hamburger + logo */}
        <button
          className={`sb-header__nav-toggle sb-header__nav-toggle--mobile ${nav ? "sb-header__nav-toggle--open" : ""}`}
          onClick={handleNavToggle}
          aria-label={nav ? "Close navigation" : "Open navigation"}
          aria-expanded={nav}
        >
          <span className="sb-header__hamburger">
            <span /><span /><span />
          </span>
        </button>
        <NavLink to="/" className="sb-header__logo-link sb-header__logo-link--mobile">
          <img src={Logo} alt="Smartbooks" className="sb-header__logo" />
        </NavLink>
      </div>

      {/* ── Centre: search ── */}
      <div className="sb-header__search-wrap">
        <GlobalSearch isDark={isDark} />
      </div>

      {/* ── Right: actions ── */}
      <div className="sb-header__right">

        {/* Theme toggle — pill style */}
        <button
          className="sb-header__theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className={`sb-header__theme-track ${isDark ? "sb-header__theme-track--dark" : ""}`}>
            <span className="sb-header__theme-thumb">
              <i className={`fas ${isDark ? "fa-moon" : "fa-sun"}`} />
            </span>
          </span>
        </button>

        {/* Notifications */}
        <button className="sb-header__icon-btn sb-header__icon-btn--notif" aria-label="Notifications">
          <i className="fas fa-bell" />
          <span className="sb-header__notif-dot" />
        </button>

        {/* User menu */}
        <div className="sb-header__user-wrap" ref={userMenuRef}>
          <button
            className={`sb-header__user-btn ${showUserMenu ? "sb-header__user-btn--open" : ""}`}
            onClick={() => setShowUserMenu(prev => !prev)}
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            <span className="sb-header__avatar">{initials}</span>
            <span className="sb-header__user-info">
              <span className="sb-header__user-name">{fullName}</span>
              <span className="sb-header__user-role">{user?.integrity || "Administrator"}</span>
            </span>
            <i className={`fas fa-chevron-down sb-header__user-chevron ${showUserMenu ? "sb-header__user-chevron--open" : ""}`} />
          </button>

          {showUserMenu && (
            <div className="sb-header__dropdown" role="menu">
              <div className="sb-header__dropdown-header">
                <span className="sb-header__dropdown-avatar">{initials}</span>
                <div className="sb-header__dropdown-user-info">
                  <div className="sb-header__dropdown-name">{fullName}</div>
                  {/* Only the part before @ */}
                  <div className="sb-header__dropdown-email">
                    <i className="fas fa-at" />
                    {emailDisplay}
                  </div>
                </div>
              </div>
              <div className="sb-header__dropdown-divider" />
              <NavLink to="/users/my-profile" className="sb-header__dropdown-item" onClick={() => setShowUserMenu(false)}>
                <i className="fas fa-circle-user" /><span>My Profile</span>
              </NavLink>
              <div className="sb-header__dropdown-divider" />
              <button className="sb-header__dropdown-item sb-header__dropdown-item--danger" onClick={handleLogout}>
                <i className="fas fa-arrow-right-from-bracket" /><span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;