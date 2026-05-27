import React, { useState, useRef, useEffect } from "react";

const ChartSearchableSelect = ({ options, value, onChange, className = "", reserveMenuSpace = false, isDisabled = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (isDisabled) return;
    onChange(option.id);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (isDisabled) return;
    if (!showDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowDropdown(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < options.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : options.length - 1
      );
    }

    if (e.key === "Enter" && highlightIndex >= 0) {
      handleSelect(options[highlightIndex]);
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div
      className={`chart-select-wrapper ${reserveMenuSpace && showDropdown ? "chart-select-wrapper--reserve-menu" : ""} ${isDisabled ? "disabled" : ""} ${className}`.trim()}
      ref={dropdownRef}
      tabIndex={isDisabled ? -1 : 0} // make it keyboard focusable unless disabled
      aria-disabled={isDisabled}
      onKeyDown={handleKeyDown}
    >
      {/* Display box */}
      <div
        className="chart-select-display"
        onClick={() => !isDisabled && setShowDropdown(prev => !prev)}
      >
        {options.find(opt => opt.id === value)?.label || "Select"}
        <span className={`chart-select-icon fas fa-angle-${showDropdown ? "up" : "down"}`}></span>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="chart-select-dropdown">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`chart-select-option
                ${value === option.id ? "active-option" : ""}
                ${highlightIndex === index ? "highlight-option" : ""}
              `}
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartSearchableSelect;
