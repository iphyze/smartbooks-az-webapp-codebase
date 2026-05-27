import React from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../stores/useThemeStore";
import useAuthStore from "../stores/useAuthStore";
import { defaultRouteForRole } from "../utils/permissions";
import LogoLight from "../assets/images/smartbooks/smartbooks.png";
import LogoDark from "../assets/images/smartbooks/smartbooks_dark.png";
import "./NotFound.css";

const NotFound = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const isDark = theme === "dark";
  const destination = isAuthenticated ? defaultRouteForRole(user) : "/login";
  const destinationLabel = isAuthenticated ? "Return to workspace" : "Back to sign in";

  return (
    <main className={`sb-notfound theme-${theme}`}>
      <header className="sb-notfound__header">
        <img src={isDark ? LogoDark : LogoLight} alt="Smartbooks Accounting" className="sb-notfound__logo" />
        <button
          className="sb-notfound__theme"
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} />
          <span>{isDark ? "Light" : "Dark"} mode</span>
        </button>
      </header>

      <section className="sb-notfound__content">
        <div className="sb-notfound__graphic" aria-hidden="true">
          <span className="sb-notfound__orbit" />
          <span className="sb-notfound__number">404</span>
          <span className="sb-notfound__badge"><i className="fas fa-compass" /></span>
        </div>
        <p className="sb-notfound__eyebrow">Page not found</p>
        <h1>This page has moved or does not exist.</h1>
        <p className="sb-notfound__message">
          We could not find <strong>{location.pathname}</strong>. Return to a safe Smartbooks page and continue your work.
        </p>
        <div className="sb-notfound__actions">
          <Link to={destination} className="sb-notfound__primary">
            <i className="fas fa-arrow-left" /> {destinationLabel}
          </Link>
          {isAuthenticated && (
            <Link to="/users/my-profile" className="sb-notfound__secondary">
              <i className="fas fa-circle-user" /> My Profile
            </Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default NotFound;
