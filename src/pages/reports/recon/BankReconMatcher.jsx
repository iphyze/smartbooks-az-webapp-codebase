import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import useBankReconStore from '../../../stores/useBankReconStore';
import {
  MATCH_MODES,
  directionTabsFor,
  directionSortOptionsFor,
  fmtAmt,
  sumSelected,
} from './BankReconUtils';
import { LineCard } from './BankReconCommon';
import BankReconClassifyModal from './BankReconClassifyModal';
import BankReconEditLineModal from './BankReconEditLineModal';

/* ── Status filter tabs ────────────────────────────────────── */
const STATUS_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'unmatched',  label: 'Unmatched' },
  { key: 'matched',    label: 'Matched' },
  { key: 'classified', label: 'Classified' },
];

/* ── Recon classification filter options ──────────────────── */
const CLASS_OPTIONS = [
  { key: 'all',                          label: 'All Classifications',         short: 'All'      },
  { key: 'none',                         label: 'Not Yet Classified',          short: 'Unclassified' },
  { key: "We Debit They Don't Credit",   label: "We Debit They Don't Credit",  short: 'WDTDC'    },
  { key: "They Debit We Don't Credit",   label: "They Debit We Don't Credit",  short: 'TDWDC'    },
  { key: "We Credit They Don't Debit",   label: "We Credit They Don't Debit",  short: 'WCTDD'    },
  { key: "They Credit We Don't Debit",   label: "They Credit We Don't Debit",  short: 'TCWDD'    },
  { key: 'Prior Period Item',            label: 'Prior Period Item',           short: 'Prior'    },
];

/* ── Filter + sort pipeline ────────────────────────────────── */
const applyFiltersAndSort = (lines, { statusFilter, dirFilter, classFilter, search, sortKey }) => {
  let result = lines.filter((l) => {
    if (statusFilter === 'unmatched'  && l.match_status !== 'Unmatched') return false;
    if (statusFilter === 'matched'    && l.match_status !== 'Matched')   return false;
    if (statusFilter === 'classified' && !['Classified', 'Bank-Only'].includes(l.match_status)) return false;
    if (dirFilter !== 'all' && l.direction !== dirFilter) return false;
    // Classification filter
    if (classFilter && classFilter !== 'all') {
      if (classFilter === 'none') {
        // Show only lines that are classified/bank-only but have no recon_classification set
        // OR unmatched lines that haven't been classified yet
        const isClassifiable = ['Classified', 'Bank-Only'].includes(l.match_status);
        if (isClassifiable && l.recon_classification) return false;
        if (!isClassifiable) return false; // unmatched/matched don't count as "needing classification"
      } else {
        // Show only lines with this specific recon_classification
        if (l.recon_classification !== classFilter) return false;
      }
    }
    if (search && !`${l.description} ${l.amount} ${l.reference || ''} ${l.category_name || ''} ${l.ledger_name || ''}`
      .toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  switch (sortKey) {
    case 'date_asc':  result = [...result].sort((a, b) => a.txn_date.localeCompare(b.txn_date)); break;
    case 'date_desc': result = [...result].sort((a, b) => b.txn_date.localeCompare(a.txn_date)); break;
    case 'amt_desc':  result = [...result].sort((a, b) => Number(b.amount) - Number(a.amount)); break;
    case 'amt_asc':   result = [...result].sort((a, b) => Number(a.amount) - Number(b.amount)); break;
    case 'dir_out':   result = [...result].sort((a, b) => (a.direction === 'OUT' ? -1 : 1) - (b.direction === 'OUT' ? -1 : 1)); break;
    case 'dir_in':    result = [...result].sort((a, b) => (a.direction === 'IN'  ? -1 : 1) - (b.direction === 'IN'  ? -1 : 1)); break;
    case 'desc_az':   result = [...result].sort((a, b) => a.description.localeCompare(b.description)); break;
    default: break; // default = DB order (date_asc from API)
  }

  return result;
};

/* ── Column toolbar (search + status tabs + dir tabs + sort) ── */
const ColumnToolbar = ({
  side = 'bank',
  search, onSearchChange,
  statusFilter, onStatusChange,
  dirFilter, onDirChange,
  classFilter, onClassChange,
  sortKey, onSortChange,
  totalCount, filteredCount,
  allVisibleSelected, onSelectAll,
  selectedCount,
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const directionTabs = directionTabsFor(side);
  const sortOptions = directionSortOptionsFor(side);
  const currentSort = sortOptions.find((s) => s.key === sortKey);
  const currentClass = CLASS_OPTIONS.find((c) => c.key === classFilter) || CLASS_OPTIONS[0];
  const sortRef  = useRef(null);
  const classRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current  && !sortRef.current.contains(e.target))  setSortOpen(false);
      if (classRef.current && !classRef.current.contains(e.target)) setClassOpen(false);
    };
    if (sortOpen || classOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen, classOpen]);

  return (
    <div className="br-filter-bar" style={{ gap: 6 }}>
      {/* ── Row 1: search ── */}
      <div className="br-fsearch-wrap">
        <input
          className="form-input br-fsearch"
          placeholder="Search description, amount, reference…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search ? (
          <button type="button" className="br-fsearch-icon br-fsearch-clear" onClick={() => onSearchChange('')}>
            <i className="fas fa-xmark" />
          </button>
        ) : (
          <span className="br-fsearch-icon fas fa-search" />
        )}
      </div>

      {/* ── Row 2: status tabs + direction pills + sort ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Status */}
        <div className="br-tabs" style={{ flex: 1 }}>
          {STATUS_TABS.map((t) => (
            <button key={t.key} className={`br-tab ${statusFilter === t.key ? 'br-tab--active' : ''}`} onClick={() => onStatusChange(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Direction filter */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {directionTabs.map((d) => (
            <button
              key={d.key}
              onClick={() => onDirChange(d.key)}
              style={{
                height: 24, padding: '0 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                border: `1px solid ${dirFilter === d.key ? 'var(--sb-brand,#00b196)' : 'var(--sb-border,#deeee9)'}`,
                background: dirFilter === d.key ? 'var(--sb-brand,#00b196)' : 'transparent',
                color: dirFilter === d.key ? '#fff' : 'var(--sb-text-3,#7aada6)',
                cursor: 'pointer', transition: '.14s ease',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Classification filter dropdown */}
        <div ref={classRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setClassOpen((v) => !v)}
            style={{
              height: 24, padding: '0 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              border: `1px solid ${classFilter !== 'all' ? '#6366f1' : 'var(--sb-border,#deeee9)'}`,
              background: classFilter !== 'all' ? 'rgba(99,102,241,.08)' : 'transparent',
              color: classFilter !== 'all' ? '#6366f1' : 'var(--sb-text-3,#7aada6)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: '.14s',
              maxWidth: 110, overflow: 'hidden',
            }}
          >
            <i className="fas fa-tag" style={{ fontSize: 9, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentClass.short}
            </span>
          </button>
          {classOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 60,
              background: 'var(--sb-surface,#fff)', border: '1.5px solid var(--sb-border,#deeee9)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.14)', overflow: 'hidden', minWidth: 220,
            }}
            className="br-sort-menu">
              {CLASS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onClassChange(opt.key); setClassOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans,sans-serif',
                    fontWeight: classFilter === opt.key ? 700 : 500,
                    color: classFilter === opt.key ? '#6366f1' : 'var(--sb-text-2,#3d5752)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: '1px solid var(--sb-border-light,#edf6f3)',
                  }}
                >
                  <i className="fas fa-tag" style={{ width: 14, fontSize: 10, color: classFilter === opt.key ? '#6366f1' : 'var(--sb-text-3,#7aada6)' }} />
                  {opt.label}
                  {classFilter === opt.key && <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: 9, color: '#6366f1' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            style={{
              height: 24, padding: '0 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
              border: `1px solid ${sortKey !== 'date_asc' ? 'var(--sb-brand,#00b196)' : 'var(--sb-border,#deeee9)'}`,
              background: sortKey !== 'date_asc' ? 'rgba(0,177,150,.08)' : 'transparent',
              color: sortKey !== 'date_asc' ? 'var(--sb-brand,#00b196)' : 'var(--sb-text-3,#7aada6)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: '.14s',
            }}
          >
            <i className={`fas ${currentSort?.icon || 'fa-arrow-up-wide-short'}`} style={{ fontSize: 9 }} />
            {currentSort?.label || 'Sort'}
          </button>
          {sortOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
              background: 'var(--sb-surface,#fff)', border: '1.5px solid var(--sb-border,#deeee9)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden', minWidth: 140,
            }}
            className="br-sort-menu">
              {sortOptions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { onSortChange(s.key); setSortOpen(false); }}
                  style={{
                    width: '100%', padding: '8px 12px', textAlign: 'left', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'DM Sans,sans-serif',
                    fontWeight: sortKey === s.key ? 700 : 500,
                    color: sortKey === s.key ? 'var(--sb-brand,#00b196)' : 'var(--sb-text-2,#3d5752)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: '1px solid var(--sb-border-light,#edf6f3)',
                  }}
                >
                  <i className={`fas ${s.icon}`} style={{ width: 14, fontSize: 10, color: sortKey === s.key ? 'var(--sb-brand,#00b196)' : 'var(--sb-text-3,#7aada6)' }} />
                  {s.label}
                  {sortKey === s.key && <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--sb-brand,#00b196)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: select-all + count ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={filteredCount === 0}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0, padding: 0,
            border: `1.5px solid ${allVisibleSelected && filteredCount > 0 ? 'var(--sb-brand,#00b196)' : 'var(--sb-border,#deeee9)'}`,
            background: allVisibleSelected && filteredCount > 0 ? 'var(--sb-brand,#00b196)' : 'var(--sb-surface-2,#f8fcfb)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: filteredCount > 0 ? 'pointer' : 'not-allowed', transition: '.15s',
          }}
        >
          {allVisibleSelected && filteredCount > 0 && (
            <i className="fas fa-check" style={{ fontSize: 8, color: '#fff', pointerEvents: 'none' }} />
          )}
        </button>
        <span style={{ fontSize: 11, color: 'var(--sb-text-3,#7aada6)', fontWeight: 600 }}>
          {selectedCount > 0
            ? <span style={{ color: 'var(--sb-brand,#00b196)' }}>{selectedCount} selected</span>
            : `${filteredCount} of ${totalCount} shown`}
        </span>
        {selectedCount > 0 && filteredCount > 0 && !allVisibleSelected && (
          <button
            type="button"
            onClick={onSelectAll}
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--sb-brand,#00b196)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Select all {filteredCount}
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Main matcher ──────────────────────────────────────────── */
const BankReconMatcher = () => {
  const {
    current, ui,
    matchLines, matchSelectedLines, unmatchLines,
    classifyLine, classifySelectedLines,
    updateLine, unclassifyLines,
    setUi, saving,
  } = useBankReconStore();

  const { bank_lines = [], ledger_lines = [] } = current;

  // Per-column filter/sort state (independent)
  const [bankStatus,  setBankStatus]  = useState('unmatched');
  const [bankDir,     setBankDir]     = useState('all');
  const [bankClass,   setBankClass]   = useState('all');
  const [bankSearch,  setBankSearch]  = useState('');
  const [bankSort,    setBankSort]    = useState('date_asc');

  const [lgStatus,    setLgStatus]    = useState('unmatched');
  const [lgDir,       setLgDir]       = useState('all');
  const [lgClass,     setLgClass]     = useState('all');
  const [lgSearch,    setLgSearch]    = useState('');
  const [lgSort,      setLgSort]      = useState('date_asc');

  const [matchMode,   setMatchMode]   = useState(MATCH_MODES.BANK_DEBIT_LEDGER_CREDIT.key);
  const mode = MATCH_MODES[matchMode];

  const [selectedBankIds,   setSelectedBankIds]   = useState([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [classifyTarget, setClassifyTarget] = useState(null);
  const [editTarget,     setEditTarget]     = useState(null); // { line, source }

  const toggleId = (setter) => (id) => setter((ids) => (
    ids.includes(Number(id)) ? ids.filter((x) => x !== Number(id)) : [...ids, Number(id)]
  ));

  const canSelectBank   = (line) => line.match_status !== 'Matched';
  const canSelectLedger = (line) => line.match_status !== 'Matched';

  // Filtered + sorted views
  const bankFiltered = useMemo(() => applyFiltersAndSort(bank_lines, {
    statusFilter: bankStatus, dirFilter: bankDir, classFilter: bankClass, search: bankSearch, sortKey: bankSort,
  }), [bank_lines, bankStatus, bankDir, bankClass, bankSearch, bankSort]);

  const lgFiltered = useMemo(() => applyFiltersAndSort(ledger_lines, {
    statusFilter: lgStatus, dirFilter: lgDir, classFilter: lgClass, search: lgSearch, sortKey: lgSort,
  }), [ledger_lines, lgStatus, lgDir, lgClass, lgSearch, lgSort]);

  // Select-all: only selectable (non-matched) lines in current filtered view
  const bankSelectableIds  = useMemo(() => bankFiltered.filter(canSelectBank).map((l) => Number(l.id)), [bankFiltered]);
  const lgSelectableIds    = useMemo(() => lgFiltered.filter(canSelectLedger).map((l) => Number(l.id)), [lgFiltered]);

  const allBankSelected   = bankSelectableIds.length > 0 && bankSelectableIds.every((id) => selectedBankIds.includes(id));
  const allLedgerSelected = lgSelectableIds.length > 0   && lgSelectableIds.every((id)  => selectedLedgerIds.includes(id));

  const handleSelectAllBank = useCallback(() => {
    if (allBankSelected) {
      setSelectedBankIds((ids) => ids.filter((id) => !bankSelectableIds.includes(id)));
    } else {
      setSelectedBankIds((ids) => [...new Set([...ids, ...bankSelectableIds])]);
    }
  }, [allBankSelected, bankSelectableIds]);

  const handleSelectAllLedger = useCallback(() => {
    if (allLedgerSelected) {
      setSelectedLedgerIds((ids) => ids.filter((id) => !lgSelectableIds.includes(id)));
    } else {
      setSelectedLedgerIds((ids) => [...new Set([...ids, ...lgSelectableIds])]);
    }
  }, [allLedgerSelected, lgSelectableIds]);

  // Totals & match gate
  const bankTotal    = sumSelected(bank_lines, selectedBankIds);
  const ledgerTotal  = sumSelected(ledger_lines, selectedLedgerIds);
  const tolerance    = Number(current.reconciliation?.tolerance_amount ?? 0);
  const matchDiff    = Math.abs(bankTotal - ledgerTotal);
  const canBulkMatch = selectedBankIds.length > 0 && selectedLedgerIds.length > 0 && matchDiff <= Math.max(tolerance, 0.01);

  const clearSelections = () => { setSelectedBankIds([]); setSelectedLedgerIds([]); };
  const switchMode = (nextMode) => { setMatchMode(nextMode); clearSelections(); };

  const openClassifySelected = (source) => {
    const lineIds = source === 'bank' ? selectedBankIds : selectedLedgerIds;
    if (!lineIds.length) return;
    setClassifyTarget({ source, lineIds });
  };

  const handleEditSave = async (payload) => {
    const res = await updateLine(payload);
    if (res) setEditTarget(null);
  };

  const handleUnclassify = async (source, lineIds) => {
    if (!lineIds?.length) return;
    await unclassifyLines({ source, lineIds });
    // Clear these IDs from selections
    if (source === 'bank')   setSelectedBankIds((ids) => ids.filter((id) => !lineIds.includes(id)));
    if (source === 'ledger') setSelectedLedgerIds((ids) => ids.filter((id) => !lineIds.includes(id)));
  };

  const submitClassify = async (payload) => {
    if (classifySelectedLines) await classifySelectedLines(payload);
    else if (classifyLine && payload.lineIds?.length === 1) await classifyLine({ ...payload, lineId: payload.lineIds[0] });
    setClassifyTarget(null);
    if (payload.source === 'bank')   setSelectedBankIds([]);
    if (payload.source === 'ledger') setSelectedLedgerIds([]);
  };

  const submitBulkMatch = async () => {
    if (!canBulkMatch) return;
    if (matchSelectedLines) await matchSelectedLines({ bank_line_ids: selectedBankIds, ledger_line_ids: selectedLedgerIds });
    else if (matchLines && selectedBankIds.length === 1 && selectedLedgerIds.length === 1) await matchLines(selectedBankIds[0], selectedLedgerIds[0]);
    clearSelections();
  };

  // Column header count badges
  const bankDrCnt = bankFiltered.filter((l) => l.direction === 'OUT').length;
  const bankCrCnt = bankFiltered.filter((l) => l.direction === 'IN').length;
  // Ledger side is presented with normal accounting sides:
  // OUT = Ledger Credit, IN = Ledger Debit.
  const lgDrCnt   = lgFiltered.filter((l) => l.direction === 'IN').length;
  const lgCrCnt   = lgFiltered.filter((l) => l.direction === 'OUT').length;

  return (
    <div className="br-workspace">
      {/* ── Mode bar ── */}
      {/* <div className="br-mode-bar">
        <div className="br-mode-copy">
          <strong>Manual matching mode</strong>
          <span>
            Both debits and credits are visible. Sort and filter each column independently.
            Select lines on both sides, then hit <strong>Match Selected</strong> when totals balance.
          </span>
        </div>
        <div className="br-mode-switch">
          {Object.values(MATCH_MODES).map((m) => (
            <button type="button" key={m.key} className={`br-mode-btn ${matchMode === m.key ? 'br-mode-btn--active' : ''}`} onClick={() => switchMode(m.key)}>
              <i className="fas fa-repeat" />{m.shortLabel}
            </button>
          ))}
        </div>
      </div> */}

      {/* ── Bulk action bar ── */}
      <div className={`br-bulk-bar ${(selectedBankIds.length || selectedLedgerIds.length) ? 'br-bulk-bar--active' : ''}`}>
        <div className="br-bulk-metrics">
          <span><strong>{selectedBankIds.length}</strong> Bank line{selectedBankIds.length !== 1 ? 's' : ''} · {fmtAmt(bankTotal)}</span>
          <span><strong>{selectedLedgerIds.length}</strong> Ledger line{selectedLedgerIds.length !== 1 ? 's' : ''} · {fmtAmt(ledgerTotal)}</span>
          <span className={canBulkMatch ? 'br-text-ok' : 'br-text-warn'}>
            Difference: {fmtAmt(Math.abs(bankTotal - ledgerTotal))}
          </span>
          {saving && <><div className="br-spinner br-spinner--sm" />Saving…</>}
        </div>
        <div className="br-bulk-actions">
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('bank')} disabled={!selectedBankIds.length}>
            <i className="fas fa-layer-group" />
            {selectedBankIds.some((id) => ['Classified','Bank-Only'].includes(bank_lines.find((l) => Number(l.id) === id)?.match_status))
              ? 'Re-classify Bank' : 'Categorise Bank'}
          </button>
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('ledger')} disabled={!selectedLedgerIds.length}>
            <i className="fas fa-layer-group" />
            {selectedLedgerIds.some((id) => ['Classified'].includes(ledger_lines.find((l) => Number(l.id) === id)?.match_status))
              ? 'Re-classify Ledger' : 'Categorise Ledger'}
          </button>
          {/* Unclassify bulk — only show when classified lines are selected */}
          {selectedBankIds.some((id) => ['Classified','Bank-Only'].includes(bank_lines.find((l) => Number(l.id) === id)?.match_status)) && (
            <button className="br-btn-ghost-sm" style={{ color: '#f47c7c', borderColor: '#f47c7c' }}
              onClick={() => handleUnclassify('bank', selectedBankIds.filter((id) => ['Classified','Bank-Only'].includes(bank_lines.find((l) => Number(l.id) === id)?.match_status)))}
              disabled={saving}
            >
              <i className="fas fa-tag-slash" />Remove from Class
            </button>
          )}
          {selectedLedgerIds.some((id) => ['Classified'].includes(ledger_lines.find((l) => Number(l.id) === id)?.match_status)) && (
            <button className="br-btn-ghost-sm" style={{ color: '#f47c7c', borderColor: '#f47c7c' }}
              onClick={() => handleUnclassify('ledger', selectedLedgerIds.filter((id) => ['Classified'].includes(ledger_lines.find((l) => Number(l.id) === id)?.match_status)))}
              disabled={saving}
            >
              <i className="fas fa-tag-slash" />Remove from Class
            </button>
          )}
          <button className="br-btn-primary br-btn-primary--sm" onClick={submitBulkMatch} disabled={!canBulkMatch || saving}>
            <i className="fas fa-link" />Match Selected
          </button>
          <button className="br-btn-ghost-sm" onClick={clearSelections} disabled={!selectedBankIds.length && !selectedLedgerIds.length}>
            <i className="fas fa-xmark" />Clear
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="br-banner">
        <div className="br-banner-inner br-banner-idle">
          <i className="fas fa-circle-info" />
          <span>
            Use filters and sort to find transactions, then use <strong>Select All</strong> in each column to bulk-select the filtered results.
            Match activates when Bank Debit totals equal Ledger Credit totals and Bank Credit totals equal Ledger Debit totals within tolerance.
          </span>
        </div>
      </div>

      {/* ── Two-column workspace ── */}
      <div className="br-cols">

        {/* ── Bank column ── */}
        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-university" />Bank Statement</span>
            <span className="br-col-cnt" style={{ display: 'flex', gap: 4 }}>
              <span className="br-dir-badge br-dir-out">{bankDrCnt} Dr</span>
              <span className="br-dir-badge br-dir-in">{bankCrCnt} Cr</span>
            </span>
          </div>
          <ColumnToolbar
            side="bank"
            search={bankSearch}          onSearchChange={setBankSearch}
            statusFilter={bankStatus}    onStatusChange={setBankStatus}
            dirFilter={bankDir}          onDirChange={setBankDir}
            classFilter={bankClass}      onClassChange={setBankClass}
            sortKey={bankSort}           onSortChange={setBankSort}
            totalCount={bank_lines.length}
            filteredCount={bankFiltered.length}
            selectedCount={selectedBankIds.length}
            allVisibleSelected={allBankSelected}
            onSelectAll={handleSelectAllBank}
          />
          <div className="br-col-scroll">
            {bankFiltered.length === 0 && (
              <div className="br-col-empty">No bank lines match the current filters.</div>
            )}
            {bankFiltered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                side="bank"
                isSelected={selectedBankIds.includes(Number(line.id))}
                canSelect={canSelectBank(line)}
                onToggleSelect={toggleId(setSelectedBankIds)}
                onUnmatch={unmatchLines}
                onClassify={(lineIds, source) => setClassifyTarget({ source, lineIds })}
                onEditLine={(l, s) => setEditTarget({ line: l, source: s })}
                onUnclassify={(lineId) => handleUnclassify('bank', [lineId])}
              />
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="br-divider">
          <div className={`br-divider-icon ${canBulkMatch ? 'br-divider-icon--active' : ''}`}>
            <i className={`fas ${canBulkMatch ? 'fa-link' : 'fa-arrows-left-right'}`} />
          </div>
        </div>

        {/* ── Ledger column ── */}
        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-book-open" />Ledger</span>
            <span className="br-col-cnt" style={{ display: 'flex', gap: 4 }}>
              <span className="br-dir-badge br-dir-out">{lgDrCnt} Dr</span>
              <span className="br-dir-badge br-dir-in">{lgCrCnt} Cr</span>
            </span>
          </div>
          <ColumnToolbar
            side="ledger"
            search={lgSearch}         onSearchChange={setLgSearch}
            statusFilter={lgStatus}   onStatusChange={setLgStatus}
            dirFilter={lgDir}         onDirChange={setLgDir}
            classFilter={lgClass}     onClassChange={setLgClass}
            sortKey={lgSort}          onSortChange={setLgSort}
            totalCount={ledger_lines.length}
            filteredCount={lgFiltered.length}
            selectedCount={selectedLedgerIds.length}
            allVisibleSelected={allLedgerSelected}
            onSelectAll={handleSelectAllLedger}
          />
          <div className="br-col-scroll">
            {lgFiltered.length === 0 && (
              <div className="br-col-empty">No ledger lines match the current filters.</div>
            )}
            {lgFiltered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                side="ledger"
                isSelected={selectedLedgerIds.includes(Number(line.id))}
                canSelect={canSelectLedger(line)}
                onToggleSelect={toggleId(setSelectedLedgerIds)}
                onUnmatch={unmatchLines}
                onClassify={(lineIds, source) => setClassifyTarget({ source, lineIds })}
                onEditLine={(l, s) => setEditTarget({ line: l, source: s })}
                onUnclassify={(lineId) => handleUnclassify('ledger', [lineId])}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {classifyTarget && (
          <BankReconClassifyModal
            target={classifyTarget}
            bankLines={bank_lines}
            ledgerLines={ledger_lines}
            onClose={() => setClassifyTarget(null)}
            onConfirm={submitClassify}
          />
        )}
        {editTarget && (
          <BankReconEditLineModal
            line={editTarget.line}
            source={editTarget.source}
            onClose={() => setEditTarget(null)}
            onSave={handleEditSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankReconMatcher;