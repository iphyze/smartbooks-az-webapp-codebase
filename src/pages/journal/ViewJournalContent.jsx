import React from "react";
import useThemeStore from "../../stores/useThemeStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong, formatWithDecimals } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadJournal from "./DownloadJournal";

const ViewJournalContent = ({ journal }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  // Helper for voucher type
  const voucherType = (type) => {
    switch (type){
      case 'Sales':
        return 'SV';
      case 'Payment':
        return 'PV';
      case 'Journal':
        return 'JV';
      case 'Receipt':
        return 'RV';
      case 'Expenses':
        return 'EV';
      default:
        return 'V';
    }
  };

  // Defensive check: if journal is null/undefined, render nothing or a placeholder
  if (!journal) {
    return null; 
  }

  const handleEditJournal = (journal) => {
    navigate(`/journal/edit/${journal.journal_id}`, { state: { journal } });
  };

  const handleNavigateToLedger = (ledger_number) => {
    navigate(`/ledger/view/${ledger_number}`);
  }

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
          <button className="vc-edit-btn" onClick={() => handleEditJournal(journal)}><span className="fas fa-pen"></span> Edit Journal</button>
          <PDFDownloadLink
            document={<DownloadJournal journal={journal}/>} 
            className="vc-export-btn" 
            fileName={`${journal?.journal_type} Voucher ${journal?.journal_id}.pdf`}
          >
            <span className="fas fa-file-pdf"></span> Download Pdf
          </PDFDownloadLink>
      </div>

      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <div className="vc-header-group">
            <div className="vc-header-title">Transaction Date:</div>
            <div className="vc-header-text">{formatDateLong(journal.journal_date) || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Journal Reference:</div>
            <div className="vc-header-text">{journal.journal_id || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Journal Type</div>
            <div className="vc-header-text">{journal.journal_type || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Journal Currency</div>
            <div className="vc-header-text">{journal.journal_currency || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Transaction Type</div>
            {/* You had journal_type here again, assuming this is correct based on your original code */}
            <div className="vc-header-text">{journal.transaction_type || 'N/A'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Description</div>
            <div className="vc-header-text">{journal.journal_description || 'N/A'}</div>
          </div>
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type">{journal.journal_type || ''} Voucher</div>
          <div className="vc-voucher-type-number">{voucherType(journal.journal_type)}-{journal.journal_id || ''}</div>
        </div>
      </div>


      <div className="vc-table">
        <div className="vc-table-wrapper">
          
          <div className="vc-table-flexbox vc-table-header">
              <div className="vc-table-data vc-tb-num">Number</div>
              <div className="vc-table-data vc-tb-name">Ledger Name</div>
              <div className="vc-table-data vc-tb-desc">Description</div>
              <div className="vc-table-data vc-tb-side">D/C</div>
              <div className="vc-table-data vc-tb-cur">Currency</div>
              <div className="vc-table-data vc-tb-amt">Amount</div>
          </div>

          {journal?.items.length !== "" &&

            journal?.items.map((rows, index) => {
              const {
                cost_center, created_at, created_by, credit, credit_ngn, debit, debit_ngn,
                eur_rate, gbp_rate, ngn_rate, usd_rate, id, journal_currency, journal_date, journal_description,
                journal_id, ledger_class, ledger_class_code, ledger_name, ledger_number, ledger_sub_class,
                ledger_type, rate, rate_date, transaction_type, updated_at, updated_by
              } = rows;

              const amount = debit === "0" ? credit : debit;
              const sides = debit === "0" ? "C" : "D";

              return(
                  <div className="vc-table-flexbox vc-table-body" key={id}>
                    <div className="vc-table-data vc-tb-num">{ledger_number || ''}</div>
                    <div className="vc-table-data vc-tb-name" onClick={() => handleNavigateToLedger(ledger_number)} style={{cursor: 'pointer'}}>{ledger_name || ''}</div>
                    <div className="vc-table-data vc-tb-desc">{journal_description || ''}</div>
                    <div className="vc-table-data vc-tb-side vc-boldtext">{sides || ''}</div>
                    <div className="vc-table-data vc-tb-cur">{journal_currency || ''}</div>
                    <div className="vc-table-data vc-tb-amt vc-boldtext">{formatWithDecimals(amount)}</div>
                  </div>
              );

            })

          }

        </div>
      </div>

      <div className="vc-summary-table">
          
          <div className="vc-summary-col">
            <div className="vc-summary-col-flex-box">
              <div className="vc-summary-col-title">Prepared By:</div>
              <div className="vc-summary-col-text">{journal.created_by}</div>
            </div>
            <div className="vc-summary-col-flex-box">
              <div className="vc-summary-col-title">Updated By:</div>
              <div className="vc-summary-col-text">{journal.updated_by}</div>
            </div>
            <div className="vc-summary-col-flex-box">
              <div className="vc-summary-col-title">Approved By:</div>
              <div className="vc-summary-col-text">__________________________________</div>
            </div>
          </div>

          <div className="invoice-totals journal-summary-grid vc-summary-grid">
              {/* NGN Balance */}
              <div className="journal-summary-col">
                <div className="invoice-total-row-header">NGN</div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Debit</div>
                  <div className="invoice-total-value">
                    {formatWithDecimals(journal.debit_ngn)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Credit</div>
                  <div className="invoice-total-value">
                    {formatWithDecimals(journal.credit_ngn)}
                  </div>
                </div>
              </div>

              {/* Other Currency */}
              <div className="journal-summary-col">
                <div className="invoice-total-row-header">FCY</div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Debit</div>
                  <div className="invoice-total-value">
                    {formatWithDecimals(journal.debit_others)}
                  </div>
                </div>
                <div className="invoice-total-row">
                  <div className="invoice-total-label">Credit</div>
                  <div className="invoice-total-value">
                    {formatWithDecimals(journal.credit_others)}
                  </div>
                </div>
              </div>

            </div>

      </div>

    </motion.div>
  );
};

export default ViewJournalContent;