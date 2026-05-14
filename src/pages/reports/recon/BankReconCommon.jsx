import React, { useState } from 'react';
import { fmtDate, fmtAmt, safe } from './BankReconUtils';

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

export const LineCard = ({ line, side, isSelected, canSelect = true, onToggleSelect, onUnmatch, onClassify }) => {
  const matched = line.match_status === 'Matched';
  const classified = ['Classified', 'Bank-Only'].includes(line.match_status);
  const isOut = line.direction === 'OUT';
  const selectable = !matched && canSelect;

  return (
    <div
      className={[
        'br-line',
        isSelected ? 'br-line--sel' : '',
        matched ? 'br-line--matched' : '',
        classified ? 'br-line--bankonly' : '',
        selectable ? 'br-line--clickable' : '',
        !matched && !canSelect ? 'br-line--muted' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => selectable && onToggleSelect(line.id)}
    >
      <div className="br-line-r1">
        {!matched && (
          <label className="br-check-wrap" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" disabled={!canSelect} checked={isSelected} onChange={() => canSelect && onToggleSelect(line.id)} />
            <span />
          </label>
        )}

        <span className="br-line-date">{fmtDate(line.txn_date)}</span>
        <span className={`br-dir-badge ${isOut ? 'br-dir-out' : 'br-dir-in'}`}>
          <i className={`fas ${isOut ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`} />
          {isOut ? 'OUT' : 'IN'}
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

      {!matched && (
        <button
          className="br-classify-link"
          onClick={(e) => {
            e.stopPropagation();
            onClassify([line.id], side);
          }}
        >
          <i className={`fas ${classified ? 'fa-pencil' : 'fa-layer-group'}`} />
          {classified ? 'Re-classify' : 'Move to Details'}
        </button>
      )}
    </div>
  );
};

export const FilterBar = ({ tabs, filterVal, searchVal, onFilterChange, onSearchChange }) => (
  <div className="br-filter-bar">
    <div className="form-wrapper br-fsearch-wrap">
      <input className="form-input br-fsearch" placeholder="Search description or amount…" value={searchVal} onChange={(e) => onSearchChange(e.target.value)} />
      {searchVal
        ? <button type="button" className="br-search-clear" onClick={() => onSearchChange('')}><i className="fas fa-xmark" /></button>
        : <span className="chevron-input-icon fas fa-search" />}
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
