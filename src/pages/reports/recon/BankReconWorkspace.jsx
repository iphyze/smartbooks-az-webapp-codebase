import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import NavBar from '../../NavBar';
import Header from '../../Header';
import useThemeStore from '../../../stores/useThemeStore';
import PageNav from '../../../components/PageNav';
import useBankReconStore from '../../../stores/useBankReconStore';
import { fadeUp, fmtDate } from '../recon/BankReconUtils';
import BankReconKpiStrip from '../recon/BankReconKpiStrip';
import BankReconAppendModal from '../recon/BankReconAppendModal';
import BankReconAddLineModal from '../recon/BankReconAddLineModal';
import BankReconMatcher from '../recon/BankReconMatcher';
import BankReconClassifiedItemsTable from '../recon/BankReconClassifiedItemsTable';
import DownloadBankRecon from '../DownloadBankRecon';
import '../recon/BankReconciliation.css';

const BankReconWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [nav, setNav] = useState(false);

  const { fetchSingle, downloadExcel, resetCurrent, appendLines, addLine } = useBankReconStore();
  const downloadingExcelId = useBankReconStore((s) => s.downloadingExcelId);
  const [showAppend,  setShowAppend]  = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const current = useBankReconStore((s) => s.current);
  const recon   = current.reconciliation;

  useEffect(() => {
    document.title = 'Smartbooks | Bank Reconciliation Workspace';
    if (id) fetchSingle(parseInt(id, 10));
    return () => resetCurrent();
  }, [id]);

  const links = [
    { label: 'Home', to: '/', active: true },
    { label: 'Reports & Analytics', to: '/reports/ledger', active: true },
    { label: 'Bank Reconciliations', to: '/reports/bank-recon', active: true },
    { label: recon?.recon_number || 'Workspace', to: `/reports/bank-recon/workspace/${id}`, active: false },
  ];

  if (current.loading) return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} /><NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`br-root theme-${theme}`}><div className="br-page">
          <PageNav pageTitle="Workspace" links={links} />
          <div className="br-card br-card--flat br-loading"><div className="br-spinner" /><span>Loading reconciliation…</span></div>
        </div></div>
      </div>
    </div>
  );

  if (!recon) return null;

  const acctSub = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');
  const excelLoading = downloadingExcelId === String(recon.id);
  // const pdfDoc  = <DownloadBankRecon recon={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />;

  return (
    <>
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`br-root theme-${theme}`}>
          <div className="br-page">
            <PageNav pageTitle="Reconciliation Workspace" links={links} />

            <motion.div variants={fadeUp} initial="hidden" animate="show">
              {/* ── Action bar ── */}
              <div className="br-action-bar">
                <div className="br-action-left">
                  <span className="br-action-ref"><i className="fas fa-building-columns" />{recon.recon_number}</span>
                  <span className="br-action-chip"><i className="fas fa-briefcase" />{recon.company_name}</span>
                  <span className="br-action-chip"><i className="fas fa-calendar-days" />{fmtDate(recon.period_from)} – {fmtDate(recon.period_to)}</span>
                  {acctSub && <span className="br-action-chip"><i className="fas fa-wallet" />{acctSub}</span>}
                  <button
                    className="br-btn-ghost"
                    style={{ height: 34, padding: '0 14px', fontSize: 12 }}
                    onClick={() => navigate(`/reports/bank-recon/edit/${id}`)}
                  >
                    <i className="fas fa-pen" /> Edit Header
                  </button>
                </div>
                <div className="br-action-right">
                  <button className="br-btn-ghost" style={{ height: 34, padding: '0 14px', fontSize: 12 }} onClick={() => setShowAddLine(true)}>
                    <i className="fas fa-plus-circle" />Add Line
                  </button>
                  <button className="br-btn-ghost" style={{ height: 34, padding: '0 14px', fontSize: 12 }} onClick={() => setShowAppend(true)}>
                    <i className="fas fa-file-arrow-up" />Append Lines
                  </button>
                  <button
                    className={`br-btn-excel${excelLoading ? ' br-btn-loading' : ''}`}
                    onClick={() => downloadExcel(recon.id, recon.recon_number)}
                    disabled={excelLoading}
                    aria-busy={excelLoading}
                  >
                    {excelLoading ? (
                      <>
                        <span className="br-spinner br-spinner--sm" aria-hidden="true" />
                        Preparing Excel…
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-excel" />
                        Excel
                      </>
                    )}
                  </button>
                  {/* <PDFDownloadLink document={pdfDoc} fileName={`${recon.recon_number}.pdf`}>
                    {({ loading }) => (
                      <button className="br-btn-pdf" disabled={loading}>
                        <i className="fas fa-file-pdf" />{loading ? 'PDF…' : 'PDF'}
                      </button>
                    )}
                  </PDFDownloadLink> */}
                </div>
              </div>

              <BankReconKpiStrip recon={recon} summary={current.summary} />
              <BankReconMatcher />
              <BankReconClassifiedItemsTable />
            </motion.div>
          </div>
        </div>
      </div>
    </div>

      <AnimatePresence>
        {showAppend && (
          <BankReconAppendModal
            recon={recon}
            onClose={() => setShowAppend(false)}
            onAppend={appendLines}
          />
        )}
        {showAddLine && (
          <BankReconAddLineModal
            recon={recon}
            onClose={() => setShowAddLine(false)}
            onAdd={addLine}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BankReconWorkspace;
