import React from 'react';
import { fmtAmt } from './BankReconUtils';

const BankReconKpiStrip = ({ recon, summary }) => {
  const diff = Number(summary?.diff ?? recon?.unreconciled_difference ?? 0);
  const noMovement = Boolean(summary?.noMovementPeriod);
  const ok = Math.abs(diff) <= 0.01;
  const matchPct = summary?.bTotal > 0 ? Math.round((summary.bMatched / summary.bTotal) * 100) : (noMovement && ok ? 100 : 0);

  return (
    <>
      <div className="br-kpi-strip">
        <div className={`br-kpi br-kpi--lg ${ok ? 'br-kpi--ok' : 'br-kpi--warn'}`}>
          <i className={`fas ${ok ? 'fa-check-circle' : 'fa-exclamation-triangle'} br-kpi-ico`} />
          <div>
            <span className="br-kpi-lbl">Recon Difference</span>
            <strong className="br-kpi-val">{fmtAmt(diff)}</strong>
            <em className={ok ? 'br-text-ok' : 'br-text-warn'}>{noMovement && ok ? 'No movement · Balanced' : ok ? 'Balanced' : 'Needs review'} · {recon?.currency}</em>
          </div>
        </div>
        <div className="br-kpi"><i className="fas fa-university br-kpi-ico br-ico--blue" /><div><span className="br-kpi-lbl">Bank Lines</span><strong className="br-kpi-val">{summary?.bTotal ?? '—'}</strong><em>{summary?.bMatched ?? 0} matched · {summary?.bUnmatched ?? 0} open</em></div></div>
        <div className="br-kpi"><i className="fas fa-book-open br-kpi-ico br-ico--purple" /><div><span className="br-kpi-lbl">Ledger Lines</span><strong className="br-kpi-val">{summary?.lTotal ?? '—'}</strong><em>{summary?.lMatched ?? 0} matched · {summary?.lUnmatched ?? 0} open</em></div></div>
        <div className="br-kpi"><i className="fas fa-tags br-kpi-ico br-ico--amber" /><div><span className="br-kpi-lbl">Categorised</span><strong className="br-kpi-val">{(summary?.bClassified ?? 0) + (summary?.lClassified ?? 0)}</strong><em>ready for schedules</em></div></div>
        <div className="br-kpi br-kpi--progress"><span className="br-kpi-lbl">Match Rate</span><div className="br-prog-track"><div className="br-prog-fill" style={{ width: `${matchPct}%` }} /></div><strong className="br-kpi-pct">{matchPct}%</strong></div>
      </div>
      <div className="br-summary-grid">
        <div><span>We Debit They Don't Credit</span><strong>{fmtAmt(summary?.weDebitTheyDontCredit)}</strong></div>
        <div><span>They Debit We Don't Credit</span><strong>{fmtAmt(summary?.theyDebitWeDontCredit)}</strong></div>
        <div><span>We Credit They Don't Debit</span><strong>{fmtAmt(summary?.weCreditTheyDontDebit)}</strong></div>
        <div><span>They Credit We Don't Debit</span><strong>{fmtAmt(summary?.theyCreditWeDontDebit)}</strong></div>
      </div>
    </>
  );
};

export default BankReconKpiStrip;
