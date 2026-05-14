import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import useBankReconStore from '../../../stores/useBankReconStore';
import {
  MATCH_MODES,
  directionLabel,
  fmtAmt,
  sumSelected,
} from './BankReconUtils';
import { FilterBar, LineCard } from './BankReconCommon';
import BankReconClassifyModal from './BankReconClassifyModal';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'unmatched', label: 'Unmatched' },
  { key: 'matched', label: 'Matched' },
  { key: 'classified', label: 'Classified' },
];

const filterLines = (lines, filter, search) => lines.filter((l) => {
  if (filter === 'unmatched' && l.match_status !== 'Unmatched') return false;
  if (filter === 'matched' && l.match_status !== 'Matched') return false;
  if (filter === 'classified' && !['Classified', 'Bank-Only'].includes(l.match_status)) return false;
  if (search && !`${l.description} ${l.amount} ${l.reference || ''} ${l.category_name || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
  return true;
});

const BankReconMatcher = () => {
  const {
    current,
    ui,
    matchLines,
    matchSelectedLines,
    unmatchLines,
    classifyLine,
    classifySelectedLines,
    setUi,
    saving,
  } = useBankReconStore();

  const { bank_lines = [], ledger_lines = [] } = current;
  const { bankFilter = 'unmatched', ledgerFilter = 'unmatched', bankSearch = '', ledgerSearch = '' } = ui;

  const [matchMode, setMatchMode] = useState(MATCH_MODES.BANK_DEBIT_LEDGER_CREDIT.key);
  const mode = MATCH_MODES[matchMode];

  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [classifyTarget, setClassifyTarget] = useState(null);

  const toggleId = (setter) => (id) => setter((ids) => (
    ids.includes(Number(id)) ? ids.filter((x) => x !== Number(id)) : [...ids, Number(id)]
  ));

  const canSelectBank = (line) => line.match_status !== 'Matched' && line.direction === mode.bankDir;
  const canSelectLedger = (line) => line.match_status !== 'Matched' && line.direction === mode.ledgerDir;

  const bankFiltered = useMemo(() => {
    const rows = filterLines(bank_lines, bankFilter, bankSearch);
    return rows.filter((l) => l.match_status === 'Matched' || l.direction === mode.bankDir);
  }, [bank_lines, bankFilter, bankSearch, mode.bankDir]);

  const ledgerFiltered = useMemo(() => {
    const rows = filterLines(ledger_lines, ledgerFilter, ledgerSearch);
    return rows.filter((l) => l.match_status === 'Matched' || l.direction === mode.ledgerDir);
  }, [ledger_lines, ledgerFilter, ledgerSearch, mode.ledgerDir]);

  const bankTotal = sumSelected(bank_lines, selectedBankIds);
  const ledgerTotal = sumSelected(ledger_lines, selectedLedgerIds);
  const tolerance = Number(current.reconciliation?.tolerance_amount ?? current.reconciliation?.match_tolerance_amount ?? 0);
  const matchDiff = Math.abs(bankTotal - ledgerTotal);
  const canBulkMatch = selectedBankIds.length > 0 && selectedLedgerIds.length > 0 && matchDiff <= tolerance;

  const clearSelections = () => {
    setSelectedBankIds([]);
    setSelectedLedgerIds([]);
  };

  const switchMode = (nextMode) => {
    setMatchMode(nextMode);
    clearSelections();
  };

  const openClassifySelected = (source) => {
    const lineIds = source === 'bank' ? selectedBankIds : selectedLedgerIds;
    if (!lineIds.length) return;
    setClassifyTarget({ source, lineIds });
  };

  const submitClassify = async (payload) => {
    if (classifySelectedLines) {
      await classifySelectedLines(payload);
    } else if (classifyLine && payload.lineIds?.length === 1) {
      await classifyLine({ ...payload, lineId: payload.lineIds[0] });
    }

    setClassifyTarget(null);
    if (payload.source === 'bank') setSelectedBankIds([]);
    if (payload.source === 'ledger') setSelectedLedgerIds([]);
  };

  const submitBulkMatch = async () => {
    if (!canBulkMatch) return;

    if (matchSelectedLines) {
      await matchSelectedLines({ bank_line_ids: selectedBankIds, ledger_line_ids: selectedLedgerIds });
    } else if (matchLines && selectedBankIds.length === 1 && selectedLedgerIds.length === 1) {
      await matchLines(selectedBankIds[0], selectedLedgerIds[0]);
    }

    clearSelections();
  };

  return (
    <div className="br-workspace">
      <div className="br-mode-bar">
        <div className="br-mode-copy">
          <strong>Manual matching mode</strong>
          <span>{mode.hint}</span>
        </div>
        <div className="br-mode-switch">
          {Object.values(MATCH_MODES).map((m) => (
            <button
              type="button"
              key={m.key}
              className={`br-mode-btn ${matchMode === m.key ? 'br-mode-btn--active' : ''}`}
              onClick={() => switchMode(m.key)}
            >
              <i className="fas fa-repeat" />{m.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div className={`br-bulk-bar ${(selectedBankIds.length || selectedLedgerIds.length) ? 'br-bulk-bar--active' : ''}`}>
        <div className="br-bulk-metrics">
          <span><strong>{selectedBankIds.length}</strong> {directionLabel('bank', mode.bankDir)} selected · {fmtAmt(bankTotal)}</span>
          <span><strong>{selectedLedgerIds.length}</strong> {directionLabel('ledger', mode.ledgerDir)} selected · {fmtAmt(ledgerTotal)}</span>
          <span className={canBulkMatch ? 'br-text-ok' : 'br-text-warn'}>Difference: {fmtAmt(bankTotal - ledgerTotal)}</span>
        </div>

        <div className="br-bulk-actions">
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('bank')} disabled={!selectedBankIds.length}>
            <i className="fas fa-layer-group" />Categorise Bank
          </button>
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('ledger')} disabled={!selectedLedgerIds.length}>
            <i className="fas fa-layer-group" />Categorise Ledger
          </button>
          <button className="br-btn-primary br-btn-primary--sm" onClick={submitBulkMatch} disabled={!canBulkMatch || saving}>
            <i className="fas fa-link" />Match Selected
          </button>
          <button className="br-btn-ghost-sm" onClick={clearSelections} disabled={!selectedBankIds.length && !selectedLedgerIds.length}>
            <i className="fas fa-xmark" />Clear
          </button>
        </div>
      </div>

      <div className="br-banner">
        <div className="br-banner-inner br-banner-idle">
          <i className="fas fa-circle-info" />
          <span>Showing <strong>{directionLabel('bank', mode.bankDir)}</strong> against <strong>{directionLabel('ledger', mode.ledgerDir)}</strong>. Match activates only when totals balance within tolerance.</span>
          {saving && <><div className="br-spinner br-spinner--sm" />Saving…</>}
        </div>
      </div>

      <div className="br-cols">
        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-university" />Bank Statement · {directionLabel('bank', mode.bankDir)}</span>
            <span className="br-col-cnt">{bankFiltered.length} visible</span>
          </div>
          <FilterBar filterVal={bankFilter} searchVal={bankSearch} tabs={tabs} onFilterChange={(v) => setUi({ bankFilter: v })} onSearchChange={(v) => setUi({ bankSearch: v })} />
          <div className="br-col-scroll">
            {bankFiltered.length === 0 && <div className="br-col-empty">No bank lines match this side. Try switching the mode.</div>}
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
              />
            ))}
          </div>
        </div>

        <div className="br-divider">
          <div className={`br-divider-icon ${canBulkMatch ? 'br-divider-icon--active' : ''}`}>
            <i className={`fas ${canBulkMatch ? 'fa-link' : 'fa-arrows-left-right'}`} />
          </div>
        </div>

        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-book-open" />Ledger · {directionLabel('ledger', mode.ledgerDir)}</span>
            <span className="br-col-cnt">{ledgerFiltered.length} visible</span>
          </div>
          <FilterBar filterVal={ledgerFilter} searchVal={ledgerSearch} tabs={tabs} onFilterChange={(v) => setUi({ ledgerFilter: v })} onSearchChange={(v) => setUi({ ledgerSearch: v })} />
          <div className="br-col-scroll">
            {ledgerFiltered.length === 0 && <div className="br-col-empty">No ledger lines match this side. Try switching the mode.</div>}
            {ledgerFiltered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                side="ledger"
                isSelected={selectedLedgerIds.includes(Number(line.id))}
                canSelect={canSelectLedger(line)}
                onToggleSelect={toggleId(setSelectedLedgerIds)}
                onUnmatch={unmatchLines}
                onClassify={(lineIds, source) => setClassifyTarget({ source, lineIds })}
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
      </AnimatePresence>
    </div>
  );
};

export default BankReconMatcher;
