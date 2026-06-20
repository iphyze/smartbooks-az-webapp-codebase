import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useBankReconStore from '../../../stores/useBankReconStore';
import { fadeUp, fmtDate } from './BankReconUtils';
import BankReconKpiStrip from './BankReconKpiStrip';
import BankReconMatcher from './BankReconMatcher';
import BankReconClassifiedItemsTable from './BankReconClassifiedItemsTable';
import BankReconAppendModal from './BankReconAppendModal';
import BankReconAddLineModal from './BankReconAddLineModal';
import BankReconHeaderEditModal from './BankReconHeaderEditModal';

const BankReconResultsPanel = ({ id, onClose }) => {
  const { current, fetchSingle, downloadExcel, deleteReconciliation, appendLines, addLine } = useBankReconStore();
  const [showAppend, setShowAppend] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [excelDownloading, setExcelDownloading] = useState(false);
  useEffect(() => { fetchSingle(id); }, [id, fetchSingle]);
  const recon = current.reconciliation;
  const summary = current.summary || {};
  const noMovement = Boolean(summary.noMovementPeriod);
  if (current.loading) return <div className="br-card br-loading"><div className="br-spinner br-spinner-dark" /><span>Loading reconciliation workspace…</span></div>;
  if (!recon) return null;
  const acct = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');
  const remove = async () => {
    if (window.confirm(`Delete reconciliation ${recon.recon_number}? This action cannot be undone.`)) {
      const done = await deleteReconciliation(recon.id);
      if (done) onClose();
    }
  };

  const handleExcelDownload = async () => {
    if (excelDownloading) return;
    setExcelDownloading(true);
    try {
      await downloadExcel(recon.id, recon.recon_number);
    } finally {
      setExcelDownloading(false);
    }
  };

  return (
    <>
      <motion.section className="br-workspace" variants={fadeUp} initial="hidden" animate="show" exit="exit">
        <div className="br-action-bar">
          <div className="br-action-left">
            <span className="br-action-ref"><i className="fas fa-university" />{recon.recon_number}</span>
            <span className="br-action-chip"><i className="fas fa-briefcase" />{recon.company_name}</span>
            <span className="br-action-chip"><i className="fas fa-calendar-alt" />{fmtDate(recon.period_from)} – {fmtDate(recon.period_to)}</span>
            {acct && <span className="br-action-chip"><i className="fas fa-wallet" />{acct}</span>}
          </div>
          <div className="br-action-right">
            <button className="br-btn-ghost" type="button" onClick={() => setShowEdit(true)}><i className="fas fa-edit" />Details</button>
            <button className="br-btn-ghost" type="button" onClick={() => setShowAddLine(true)}><i className="fas fa-plus-circle" />Add line</button>
            <button className="br-btn-ghost" type="button" onClick={() => setShowAppend(true)}><i className="fas fa-file-upload" />Append</button>
            <button
              className={`br-btn-excel ${excelDownloading ? 'br-btn-excel--loading' : ''}`}
              type="button"
              onClick={handleExcelDownload}
              disabled={excelDownloading}
              aria-busy={excelDownloading}
            >
              <i className={`fas ${excelDownloading ? 'fa-spinner fa-spin' : 'fa-file-excel'}`} />
              {excelDownloading ? 'Downloading…' : 'Excel'}
            </button>
            <button className="br-btn-danger" type="button" onClick={remove}><i className="fas fa-trash-alt" /></button>
          </div>
        </div>
        <BankReconKpiStrip recon={recon} summary={current.summary} />
        {noMovement && (
          <div className="br-no-movement-card">
            <span className="br-no-movement-icon"><i className="fas fa-leaf" /></span>
            <div>
              <strong>No movement period</strong>
              <p>No bank or ledger transaction lines were uploaded for this period. The reconciliation is based on the opening and closing balances, and the Excel export will still include clean Bank and Ledger sheets for audit attachment.</p>
            </div>
          </div>
        )}
        <BankReconMatcher />
        <BankReconClassifiedItemsTable />
      </motion.section>
      <AnimatePresence>
        {showEdit && <BankReconHeaderEditModal recon={recon} onClose={() => setShowEdit(false)} />}
        {showAppend && <BankReconAppendModal recon={recon} onClose={() => setShowAppend(false)} onAppend={appendLines} />}
        {showAddLine && <BankReconAddLineModal recon={recon} onClose={() => setShowAddLine(false)} onAdd={addLine} />}
      </AnimatePresence>
    </>
  );
};
export default BankReconResultsPanel;
