import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LogoLight from '../assets/images/smartbooks/smartbooks.png';
import LogoDark from '../assets/images/smartbooks/smartbooks_dark.png';
import useAuthStore from "../stores/useAuthStore";
import useThemeStore from "../stores/useThemeStore";
import useNotificationStore from "../stores/useNotificationStore";
import { defaultRouteForRole } from "../utils/permissions";
import GlobalSearch from "./GlobalSearch";
import NotificationDropdown from "../components/notifications/NotificationDropdown";
import './Header.css';

const NOTIFICATION_POLL_INTERVAL = 60000;

const Header = ({ nav, setNav }) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const {
    counts,
    initialized: notificationsInitialized,
    fetchSummary,
    markSeen,
    reset: resetNotifications,
  } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const Logo = theme === 'dark' ? LogoDark : LogoLight;
  const isDark = theme === 'dark';
  const homePath = defaultRouteForRole(user);

  const handleNavToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setNav((previous) => !previous);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    resetNotifications();
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleNotifications = async () => {
    const opening = !showNotifications;
    setShowNotifications(opening);
    setShowUserMenu(false);

    if (opening) {
      if (!notificationsInitialized) {
        await fetchSummary();
      }
      const unseenIds = useNotificationStore.getState().recent
        .filter((item) => !item.is_seen)
        .map((item) => item.id);
      if (unseenIds.length) {
        markSeen(unseenIds);
      }
    }
  };

  useEffect(() => {
    const handler = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      resetNotifications();
      return undefined;
    }

    fetchSummary({ silent: notificationsInitialized });
    const intervalId = window.setInterval(
      () => fetchSummary({ silent: true }),
      NOTIFICATION_POLL_INTERVAL
    );

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchSummary({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = user
    ? `${user.fname?.[0] || ""}`.toUpperCase() || "U"
    : "U";
  const fullName = user ? `${user.fname || ""} ${user.lname || ""}`.trim() : "User";
  const emailDisplay = user?.email ? user.email.split("@")[0] : "";
  const unreadLabel = counts.unread_count > 99 ? '99+' : String(counts.unread_count);

  return (
    <header className={`sb-header ${isDark ? "sb-header--dark" : "sb-header--light"}`}>
      <div className="sb-header__left">
        <NavLink to={homePath} className="sb-header__logo-link sb-header__logo-link--desktop">
          <img src={Logo} alt="Smartbooks" className="sb-header__logo" />
        </NavLink>

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
        <NavLink to={homePath} className="sb-header__logo-link sb-header__logo-link--mobile">
          <img src={Logo} alt="Smartbooks" className="sb-header__logo" />
        </NavLink>
      </div>

      <div className="sb-header__search-wrap">
        <GlobalSearch isDark={isDark} />
      </div>

      <div className="sb-header__right">
        <button
          className="sb-header__theme-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          type="button"
        >
          <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} />
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>

        <div className="sb-header__notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className={`sb-header__icon-btn sb-header__icon-btn--notif ${showNotifications ? 'sb-header__icon-btn--open' : ''}`}
            aria-label={counts.unread_count > 0 ? `Notifications, ${counts.unread_count} unread` : 'Notifications'}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            onClick={toggleNotifications}
          >
            <i className="fas fa-bell" />
            {counts.unread_count > 0 && (
              <span className="sb-header__notif-badge" aria-hidden="true">{unreadLabel}</span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="sb-header__user-wrap" ref={userMenuRef}>
          <button
            className={`sb-header__user-btn ${showUserMenu ? "sb-header__user-btn--open" : ""}`}
            onClick={() => {
              setShowUserMenu((previous) => !previous);
              setShowNotifications(false);
            }}
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
