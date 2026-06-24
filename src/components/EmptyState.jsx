import React from "react";
import useThemeStore from "../stores/useThemeStore";
import "./EmptyState.css";

const EmptyState = ({
  icon = "fas fa-chart-bar",
  title = "No data available",
  message = "Try selecting a different time period or adjusting the current filters.",
}) => {
  const { theme } = useThemeStore();

  return (
    <div className={`sb-empty-state theme-${theme}`} role="status">
      <div className="sb-empty-state__content">
        <span className="sb-empty-state__icon-wrap" aria-hidden="true">
          <i className={`${icon} sb-empty-state__icon`} />
        </span>
        <div className="sb-empty-state__copy">
          <h3 className="sb-empty-state__title">{title}</h3>
          <p className="sb-empty-state__message">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
