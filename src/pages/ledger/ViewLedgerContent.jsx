import React from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadLedger from "./DownloadLedger"; 

const ViewLedgerContent = ({ ledger, journalEntries = [], summary = {} }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!ledger) {
    return null; 
  }

  const handleEditLedger = () => {
    navigate(`/ledger/edit/${ledger.ledger_number}`, { state: { ledger } });
  };

  const handleViewJournal = (journalId) => {
    navigate(`/journal/view/${journalId}`);
  };

  return (
    <motion.div 
      variants={fadeInUp} 
      initial="hidden" 
      animate="show" 
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }} 
      className={`view-content-box theme-${theme}`}
    >
      <img src={CompanyLogo} alt="Company Logo" className="company-logo"/>

      <div className="vc-button-box">
        <button className="vc-edit-btn" onClick={handleEditLedger}>
          <span className="fas fa-pen"></span> Edit Ledger
        </button>
        <PDFDownloadLink
          document={<DownloadLedger ledger={ledger} journalEntries={journalEntries} summary={summary}/>} 
          className="vc-export-btn" 
          fileName={`Ledger - ${ledger?.ledger_name || 'Ledger'}.pdf`}
        >
          <span className="fas fa-file-pdf"></span> Download Pdf
        </PDFDownloadLink>
      </div>

      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <div className="vc-header-group">
            <div className="vc-header-title">Ledger Name:</div>
            <div className="vc-header-text">{ledger.ledger_name || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Ledger Number:</div>
            <div className="vc-header-text">{ledger.ledger_number || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Ledger Class:</div>
            <div className="vc-header-text">{ledger.ledger_class || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Class Code:</div>
            <div className="vc-header-text">{ledger.ledger_class_code || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Sub Class:</div>
            <div className="vc-header-text">{ledger.ledger_sub_class || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Ledger Type:</div>
            <div className="vc-header-text">{ledger.ledger_type || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created By:</div>
            <div className="vc-header-text">{ledger.created_by || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created On:</div>
            <div className="vc-header-text">{formatDateLong(ledger.created_at)}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Updated By:</div>
            <div className="vc-header-text">{ledger.updated_by || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Updated On:</div>
            <div className="vc-header-text">{formatDateLong(ledger.updated_at)}</div>
          </div>
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type vc-inv-type">LEDGER NUMBER #</div>
          <div className="vc-voucher-type-number vc-inv-type-number">{ledger.ledger_number || 'N/A'}</div>
        </div>
      </div>

      {/* ── FINANCIAL SUMMARY CARDS ── */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="vc-client-summary-section">
          <div className="vc-payment-heading">Financial Summary by currency</div>
          <div className="vc-client-summary-grid">
            {Object.entries(summary).map(([currency, data]) => (
              <div key={currency} className={`vc-client-summary-card theme-${theme}`}>
                <div className="vc-card-header">{currency} Summary ({data.entry_count || 0} Entries)</div>
                <div className="vc-card-body">
                  <div className="vc-card-row pending">
                    <span>Total Debit</span>
                    <span>{formatCurrencyDecimals(data.total_debit || 0, currency)}</span>
                  </div>
                  <div className="vc-card-row paid">
                    <span>Total Credit</span>
                    <span>{formatCurrencyDecimals(data.total_credit || 0, currency)}</span>
                  </div>
                  <div className="vc-card-row vc-card-row-two">
                    <span>Net Balance</span>
                    <span>{formatCurrencyDecimals(data.net_balance || 0, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── JOURNAL ENTRIES TABLE ── */}
      <div className="vc-payment-heading">{journalEntries.length} Recent Journal Entries</div>
      
      {journalEntries.length > 0 ? (
        <div className="vc-table">
          <div className="vc-table-wrapper">
            <div className="vc-table-flexbox vc-table-header vc-inv-table">
                <div className="vc-table-data vc-tb-inv-sn">S/N</div>
                <div className="vc-table-data vc-tb-inv-disc">Journal ID</div>
                <div className="vc-table-data vc-tb-inv-disc">Date</div>
                <div className="vc-table-data vc-tb-inv-desc">Description</div>
                <div className="vc-table-data vc-tb-inv-disc">Type</div>
                {/* <div className="vc-table-data vc-tb-inv-disc">Currency</div> */}
                <div className="vc-table-data vc-tb-inv-amt">Debit</div>
                <div className="vc-table-data vc-tb-inv-amt">Credit</div>
                <div className="vc-table-data vc-tb-inv-side">Action</div>
            </div>

            {journalEntries.map((entry, index) => (
              <div className="vc-table-flexbox vc-table-body vc-inv-table" key={entry.id || index}>
                <div className="vc-table-data vc-tb-inv-sn">{index + 1}</div>
                <div className="vc-table-data vc-tb-inv-disc">{entry.journal_id || 'N/A'}</div>
                <div className="vc-table-data vc-tb-inv-disc">{entry.journal_date}</div>
                <div className="vc-table-data vc-tb-inv-desc">{entry.journal_description || 'N/A'}</div>
                <div className="vc-table-data vc-tb-inv-disc">{entry.journal_type || 'N/A'}</div>
                {/* <div className="vc-table-data vc-tb-inv-disc">{entry.journal_currency || 'N/A'}</div> */}
                <div className="vc-table-data vc-tb-inv-amt vc-boldtext">{formatCurrencyDecimals(entry.debit_ngn || 0, entry.journal_currency)}</div>
                <div className="vc-table-data vc-tb-inv-amt vc-boldtext">{formatCurrencyDecimals(entry.credit_ngn || 0, entry.journal_currency)}</div>
                <div className="vc-table-data vc-tb-inv-side">
                  <button className="btn-edit" title="View Journal" onClick={() => handleViewJournal(entry.journal_id)}>
                    <span className="fas fa-eye"></span> 
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="vc-no-invoices-message">
          No journal entries have been posted to this ledger yet.
        </div>
      )}

    </motion.div>
  );
};

export default ViewLedgerContent;