import React, { useState, useRef, useEffect } from 'react';

const NewLocalSearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  name,
  className = '',
  labelField = 'label', // Allow specifying which field to use as the label
  valueField = 'id'      // Allow specifying which field to use as the value
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Make the filtering more robust by checking if the option exists and has the label field
  const filteredOptions = options.filter((option) => {
    if (!option) return false;
    const optionLabel = option[labelField] || option.name || option.label || '';
    return optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (option) => {
    const optionLabel = option[labelField] || option.name || option.label || '';
    onChange(option[valueField] || option.id || optionLabel);
    setSearchTerm(optionLabel);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowDropdown(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // Keep highlighted option in view
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div className={`login-form-box ${className}`} ref={dropdownRef}>
      {label && (
        <label
          className={`login-form-label ${error ? 'login-error-message' : ''}`}
        >
          {label}
        </label>
      )}

      <div className="login-form-group" style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
            setHighlightedIndex(-1);
            onChange(e.target.value);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`login-form-input login-form-select ${
            error ? 'border-error' : ''
          }`}
        />
        {/* Toggle Dropdown Icon */}
        <span
          className={`select-field-icon fas fa-angle-${showDropdown ? 'up' : 'down'}`}
          onClick={() => setShowDropdown((prev) => !prev)}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {showDropdown && (
        <div className="custom-select-options">
          <div className="select-options-list" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionLabel = option[labelField] || option.name || option.label || '';
                const optionValue = option[valueField] || option.id || optionLabel;
                
                return (
                  <div
                    key={optionValue}
                    className={`select-option
                      ${value === optionValue ? 'selected-option' : ''}
                      ${index === highlightedIndex ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(option)}
                  >
                    {optionLabel}
                  </div>
                );
              })
            ) : (
              <div className="select-no-results">No results found</div>
            )}
          </div>
        </div>
      )}

      {error && <div className="login-error-message">{error}</div>}
    </div>
  );
};

export default NewLocalSearchableSelect;