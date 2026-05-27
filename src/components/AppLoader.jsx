import React from "react";
import useThemeStore from "../stores/useThemeStore";
import LogoLight from "../assets/images/smartbooks/smartbooks.png";
import LogoDark from "../assets/images/smartbooks/smartbooks_dark.png";
import "./AppLoader.css";

const AppLoader = ({ text = "Preparing your secure workspace" }) => {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className={`sb-app-loader theme-${theme}`} role="status" aria-live="polite">
      <div className="sb-app-loader__glow sb-app-loader__glow--one" />
      <div className="sb-app-loader__glow sb-app-loader__glow--two" />
      <div className="sb-app-loader__card">
        <img
          src={isDark ? LogoDark : LogoLight}
          className="sb-app-loader__logo"
          alt="Smartbooks Accounting"
        />
        <div className="sb-app-loader__indicator" aria-hidden="true">
          <span className="sb-app-loader__ring" />
          <span className="sb-app-loader__ring sb-app-loader__ring--inner" />
          <span className="sb-app-loader__mark"><i className="fas fa-chart-line" /></span>
        </div>
        <p className="sb-app-loader__title">{text}</p>
        <p className="sb-app-loader__sub">Smart finances, smarter decisions.</p>
        <div className="sb-app-loader__progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
};

export default AppLoader;
