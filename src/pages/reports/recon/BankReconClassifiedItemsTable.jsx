import React from 'react';
import useBankReconStore from '../../../stores/useBankReconStore';
import { fmtDate, fmtAmt, safe } from './BankReconUtils';

const BankReconClassifiedItemsTable = () => {
  const { current } = useBankReconStore();
  const items = [
    ...(current.bank_lines || []).filter((l) => ['Classified', 'Bank-Only'].includes(l.match_status)).map((l) => ({ ...l, source: 'Bank' })),
    ...(current.ledger_lines || []).filter((l) => l.match_status === 'Classified').map((l) => ({ ...l, source: 'Ledger' })),
  ];

  if (!items.length) return null;

  return (
    <div className="br-card br-card--flat">
      <div className="br-flat-head">
        <h3><i className="fas fa-receipt" />Details / Classification Schedule</h3>
        <span className="br-badge-pill">{items.length} items</span>
      </div>
      <div className="br-tbl-wrap">
        <table className="br-tbl">
          <thead>
            <tr>
              <th>Source</th><th>Date</th><th>Description</th><th>Category</th><th>Recon Classification</th><th className="num">Amount</th><th>Dr Ledger</th><th>Cr Ledger</th><th>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={`${l.source}-${l.id}`}>
                <td>{l.source}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.txn_date)}</td>
                <td style={{ maxWidth: 280 }}>{l.description}</td>
                <td><span className="br-type-tag">{safe(l.category_name || l.bank_only_type)}</span></td>
                <td>{safe(l.recon_classification)}</td>
                <td className="num"><span className={l.direction === 'OUT' ? 'br-amt-out' : 'br-amt-in'}>{fmtAmt(l.amount)}</span></td>
                <td><code>{safe(l.suggested_dr_ledger)}</code></td>
                <td><code>{safe(l.suggested_cr_ledger)}</code></td>
                <td style={{ color: 'var(--sb-text-3)', fontSize: 12 }}>{safe(l.journal_note)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankReconClassifiedItemsTable;
