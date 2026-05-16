import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import useBankReconStore from '../../../stores/useBankReconStore';
import DownloadBankRecon from '../DownloadBankRecon';
import { fadeUp, fmtDate } from './BankReconUtils';
import BankReconKpiStrip from './BankReconKpiStrip';
import BankReconMatcher from './BankReconMatcher';
import BankReconClassifiedItemsTable from './BankReconClassifiedItemsTable';

const BankReconResultsPanel = ({ id }) => {
  const { current, fetchSingle, downloadExcel } = useBankReconStore();

  useEffect(() => { fetchSingle(id); }, [id, fetchSingle]);

  const recon = current.reconciliation;
  const pdfDoc = useMemo(
    () => <DownloadBankRecon recon={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />,
    [recon, current.bank_lines, current.ledger_lines]
  );

  if (current.loading) return <div className="br-card br-card--flat br-loading"><div className="br-spinner" /><span>Loading reconciliation…</span></div>;
  if (!recon) return null;

  const acctSub = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="br-action-bar">
        <div className="br-action-left">
          <span className="br-action-ref"><i className="fas fa-building-columns" />{recon.recon_number}</span>
          <span className="br-action-chip"><i className="fas fa-briefcase" />{recon.company_name}</span>
          <span className="br-action-chip"><i className="fas fa-calendar-days" />{fmtDate(recon.period_from)} – {fmtDate(recon.period_to)}</span>
          {acctSub && <span className="br-action-chip"><i className="fas fa-wallet" />{acctSub}</span>}
        </div>
        <div className="br-action-right">
          <button className="br-btn-excel" onClick={() => downloadExcel(recon.id, recon.recon_number)}><i className="fas fa-file-excel" />Excel</button>
          <PDFDownloadLink document={pdfDoc} fileName={`${recon.recon_number}.pdf`}>
            {({ loading }) => <button className="br-btn-pdf" disabled={loading}><i className="fas fa-file-pdf" />{loading ? 'PDF…' : 'PDF'}</button>}
          </PDFDownloadLink>
        </div>
      </div>
      <BankReconKpiStrip recon={recon} summary={current.summary} />
      <BankReconMatcher />
      <BankReconClassifiedItemsTable />
    </motion.div>
  );
};

export default BankReconResultsPanel;
