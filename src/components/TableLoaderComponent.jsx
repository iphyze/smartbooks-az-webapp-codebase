import React from "react";
import useThemeStore from "../stores/useThemeStore";

const Row = () => (
  <div className="table-loader-row">
    <span className="skel table-loader-check" />
    <span className="skel table-loader-num" />
    <span className="skel table-loader-date" />
    <span className="skel table-loader-name" />
    <span className="skel table-loader-date" />
    <span className="skel table-loader-badge" />
    <span className="skel table-loader-amt" />
    <span className="skel table-loader-btns" />
  </div>
);

const TableLoaderComponent = () => {
  const { theme } = useThemeStore();
  return (
    <div className={`table-loader-wrapper theme-${theme}`}>
      <div className="table-controls-skeleton">
        <span className="skel controls-skel-search" />
        <div style={{ display: "flex", gap: 8 }}>
          <span className="skel controls-skel-filter" />
          <span className="skel controls-skel-filter" style={{ width: 70 }} />
        </div>
      </div>
      <div className="table-loader-header">
        {[40, 60, 80, 120, 80, 70, 90, 70].map((w, i) => (
          <span key={i} className="skel" style={{ width: w, flex: i === 3 ? 1 : "none" }} />
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => <Row key={i} />)}
    </div>
  );
};

export default TableLoaderComponent;
