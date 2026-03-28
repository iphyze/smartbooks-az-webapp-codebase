import React, { useRef, useEffect } from 'react';
import useDebounceSearch from '../hooks/useDebounceSearch';

const SearchableSelect = ({
  value,
  onChange,
  onSearch,
  placeholder,
  error,
  label,
  className,
  delay,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { searchTerm, setSearchTerm, results, isLoading } = useDebounceSearch(onSearch, delay);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="login-form-box" ref={dropdownRef}>
      <label className={`login-form-label ${error ? 'login-error-message' : ''}`}>
        {label}
      </label>
      <div className="login-form-group">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={`login-form-input login-form-select ${error ? 'border-error' : ''} ${className}`}
          onFocus={() => setShowDropdown(true)}
        />
        <span className={`select-field-icon fas fa-angle-down`} />
      </div>
      {showDropdown && (
        <div className="custom-select-options">
          <div className="select-options-list">
            {isLoading ? (
              <div className="select-loading">Loading...</div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  className={`select-option ${value === item.value && 'selected-option'}`}
                  onClick={() => {
                    onChange(item.value);
                    setShowDropdown(false);
                  }}
                >
                  {item.label}
                </div>
              ))
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

export default SearchableSelect;