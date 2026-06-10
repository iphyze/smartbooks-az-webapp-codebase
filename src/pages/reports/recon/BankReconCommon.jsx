import React, { useState } from 'react';
import { fmtDate, fmtAmt, safe, entrySide, directionPillClass } from './BankReconUtils';

export const Field = ({ label, required, error, children, className = '' }) => (
  <div className={`br-field ${className}`}>
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>
      {label}{required && <span className="br-req"> *</span>}
    </label>
    {children}
    {error && <span className="br-err-msg"><i className="fas fa-circle-exclamation" />{error}</span>}
  </div>
);

export const FileDrop = ({ label, file, onChange, error, hint }) => (
  <div className="br-upload-wrap">
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label}<span className="br-req"> *</span></label>
    <label className={`br-drop ${file ? 'br-drop--ok' : ''} ${error ? 'br-drop--err' : ''}`}>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <i className={`fas ${file ? 'fa-check-circle' : 'fa-cloud-arrow-up'} br-drop-icon`} />
      <span className="br-drop-name">{file?.name || 'Click to upload CSV/XLSX'}</span>
      <span className="br-drop-hint">{hint}</span>
    </label>
    {error && <span className="br-err-msg"><i className="fas fa-circle-exclamation" />{error}</span>}
  </div>
);

export const CustomDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = options.find((x) => x.id === value);

  return (
    <div className="br-custom-select">
      <button type="button" className="br-custom-select-btn" onClick={() => setOpen((v) => !v)}>
        <span>{current?.label || value}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && (
        <div className="br-custom-select-menu">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={`br-custom-select-option ${value === opt.id ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const StatusPill = ({ status }) => (
  <span className={`br-pill ${status === 'Matched' ? 'br-pill--matched' : ['Classified', 'Bank-Only'].includes(status) ? 'br-pill--bankonly' : 'br-pill--unmatched'}`}>
    {status}
  </span>
);

export const LineCard = ({ line, side, isSelected, canSelect = true, onToggleSelect, onUnmatch, onClassify, onEditLine, onUnclassify }) => {
  const matched    = line.match_status === 'Matched';
  const classified = ['Classified', 'Bank-Only'].includes(line.match_status);
  const isOut      = line.direction === 'OUT';
  // Classified lines are always selectable so the user can bulk re-classify them.
  // Only Matched lines are locked (use the unlink button on those).
  const selectable = !matched && canSelect;

  return (
    <div
      className={[
        'br-line',
        isSelected ? 'br-line--sel' : '',
        matched ? 'br-line--matched' : '',
        // Classified lines get the amber border UNLESS they are currently selected
        classified && !isSelected ? 'br-line--bankonly' : '',
        selectable ? 'br-line--clickable' : '',
        // Only mute lines that are truly locked (not matched, not classified, just disabled)
        !matched && !classified && !canSelect ? 'br-line--muted' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => selectable && onToggleSelect(line.id)}
    >
      <div className="br-line-r1">
        {!matched && (
          <label className="br-check-wrap" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" disabled={!selectable} checked={isSelected} onChange={() => selectable && onToggleSelect(line.id)} />
            <span />
          </label>
        )}

        <span className="br-line-date">{fmtDate(line.txn_date)}</span>
        <span className={`br-dir-badge ${directionPillClass(side, line.direction)}`}>
          <i className={`fas ${isOut ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`} />
          {entrySide(side, line.direction)}
        </span>
        <StatusPill status={line.match_status} />

        {matched && (
          <button
            className="br-unmatch-btn"
            title="Remove this match"
            onClick={(e) => {
              e.stopPropagation();
              onUnmatch(line.match_group);
            }}
          >
            <i className="fas fa-link-slash" />
          </button>
        )}
      </div>

      <p className="br-line-desc">{line.description}</p>
      {line.ledger_name && <p className="br-line-sub"><i className="fas fa-book" />{line.ledger_name}</p>}
      {line.reference && <p className="br-line-sub"><i className="fas fa-hashtag" />{line.reference}</p>}

      <div className="br-line-r2">
        <span className={`br-line-amt ${isOut ? 'br-amt-out' : 'br-amt-in'}`}>
          {isOut ? '−' : '+'} {fmtAmt(line.amount)}
        </span>
        {matched && line.match_group && <span className="br-match-tag"><i className="fas fa-link" />{line.match_group}</span>}
        {classified && <span className="br-type-tag"><i className="fas fa-tag" />{safe(line.category_name || line.bank_only_type)}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {!matched && (
          <button
            className="br-classify-link"
            style={{ margin: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClassify([line.id], side);
            }}
          >
            <i className={`fas ${classified ? 'fa-pencil' : 'fa-layer-group'}`} />
            {classified ? 'Re-classify' : 'Move to Details'}
          </button>
        )}
        {classified && onUnclassify && (
          <button
            className="br-classify-link"
            style={{ margin: 0, color: '#f47c7c' }}
            onClick={(e) => {
              e.stopPropagation();
              onUnclassify(line.id);
            }}
          >
            <i className="fas fa-xmark-circle" />
            Remove from Class
          </button>
        )}
        {onEditLine && (
          <button
            className="br-classify-link"
            style={{ margin: 0, color: '#6366f1' }}
            onClick={(e) => {
              e.stopPropagation();
              onEditLine(line, side);
            }}
          >
            <i className="fas fa-pen-to-square" />
            Edit Line
          </button>
        )}
      </div>
      {/* Bulk re-classify hint */}
      {classified && isSelected && (
        <span style={{ fontSize: 10, color: 'var(--sb-brand, #00b196)', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="fas fa-check-circle" />Selected for bulk re-classify
        </span>
      )}
    </div>
  );
};

export const FilterBar = ({ tabs, filterVal, searchVal, onFilterChange, onSearchChange }) => (
  <div className="br-filter-bar">
    <div className="br-fsearch-wrap">
      <input
        className="form-input br-fsearch"
        placeholder="Search description or amount…"
        value={searchVal}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {searchVal ? (
        <button type="button" className="br-fsearch-icon br-fsearch-clear" onClick={() => onSearchChange('')}>
          <i className="fas fa-xmark" />
        </button>
      ) : (
        <span className="br-fsearch-icon fas fa-search" />
      )}
    </div>
    <div className="br-tabs">
      {tabs.map((t) => (
        <button key={t.key} className={`br-tab ${filterVal === t.key ? 'br-tab--active' : ''}`} onClick={() => onFilterChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  </div>
);
