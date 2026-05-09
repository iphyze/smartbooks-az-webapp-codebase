import React from "react";
import useThemeStore from "../stores/useThemeStore";

const EditLoaderComponent = ({ text = "Loading..." }) => {
  const { theme } = useThemeStore();
  return (
    <div className={`edit-loader-wrapper theme-${theme}`}>
      <div className="edit-loader-card">
        <div className="edit-loader-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="edit-loader-field">
              <span className="skel edit-loader-label" />
              <span className="skel edit-loader-input" />
            </div>
          ))}
        </div>
        <span className="skel edit-loader-table-header" />
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className="skel edit-loader-table-row" />
        ))}
      </div>
      <p className="edit-loader-text">{text}</p>
    </div>
  );
};

export default EditLoaderComponent;
