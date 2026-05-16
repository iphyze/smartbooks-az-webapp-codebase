import React, { useEffect, useState } from 'react';
import useBankReconStore from '../../../stores/useBankReconStore';
import { fmtDate, fmtAmt } from './BankReconUtils';

const BankReconHistoryGrid = ({ onOpen }) => {
  const { list, fetchList } = useBankReconStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchList(); }, [fetchList]);

  const filtered = (list.data || []).filter((r) => (
    !search
    || r.recon_number?.includes(search)
    || r.company_name?.toLowerCase().includes(search.toLowerCase())
  ));

  return (
    <div className="br-card br-card--flat">
      <div className="br-flat-head">
        <h3>Recent Reconciliations</h3>
        <div className="br-flat-head-right">
          <div className="form-wrapper br-search-box">
            <input className="form-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search
              ? <button className="br-search-clear" onClick={() => setSearch('')}><i className="fas fa-xmark" /></button>
              : <span className="chevron-input-icon fas fa-search" />}
          </div>
          <button className="br-btn-icon" onClick={() => fetchList()}><i className="fas fa-rotate" /></button>
        </div>
      </div>

      {list.loading ? (
        <div className="br-loader-row"><div className="br-spinner" />Loading…</div>
      ) : (
        <div className="br-history-grid">
          {filtered.length === 0 && <p className="br-empty-text">No reconciliations yet — create one above.</p>}
          {filtered.slice(0, 9).map((r) => {
            const diff = Number(r.unreconciled_difference || 0);
            const ok = Math.abs(diff) < 0.01;
            return (
              <button key={r.id} className="br-hcard" onClick={() => onOpen(r.id)}>
                <div className="br-hcard-top">
                  <span className="br-hcard-ref">{r.recon_number}</span>
                  <span className={`br-hcard-status ${ok ? 'br-status--ok' : 'br-status--warn'}`}>{r.status}</span>
                </div>
                <div className="br-hcard-company">{r.company_name}</div>
                <div className="br-hcard-sub">{[r.bank_name, r.account_number].filter(Boolean).join(' · ')}</div>
                <div className="br-hcard-period">{fmtDate(r.period_from)} – {fmtDate(r.period_to)} · {r.currency}</div>
                <div className={`br-hcard-diff ${ok ? 'br-text-ok' : 'br-text-warn'}`}>
                  {ok ? <><i className="fas fa-circle-check" />Balanced</> : <><i className="fas fa-triangle-exclamation" />Diff: {fmtAmt(diff)}</>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BankReconHistoryGrid;
