import React from "react";
import useThemeStore from "../../stores/useThemeStore";
import useAccountStore from "../../stores/useAccountStore";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import "../inputs-styles/Inputs.css";
import "../ViewJournal.css";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import { useNavigate } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadAccount from "./DownloadAccount"; 

const ViewAccountContent = ({ account }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  
  // Pull ledgers and summary directly from the store
  const ledgers = useAccountStore((state) => state.singleAccountLedgers) || [];
  const accountSummary = useAccountStore((state) => state.singleAccountSummary) || {};

  if (!account) {
    return null; 
  }

  const handleEditAccount = () => {
    navigate(`/account/edit/${account.id}`, { state: { account } });
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
        <button className="vc-edit-btn" onClick={handleEditAccount}>
          <span className="fas fa-pen"></span> Edit Account Type
        </button>
        <PDFDownloadLink
          document={<DownloadAccount account={account} ledgers={ledgers} accountSummary={accountSummary}/>} 
          className="vc-export-btn" 
          fileName={`Account Type - ${account?.type || 'Account'}.pdf`}
        >
          <span className="fas fa-file-pdf"></span> Download Pdf
        </PDFDownloadLink>
      </div>

      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <div className="vc-header-group">
            <div className="vc-header-title">Account Type:</div>
            <div className="vc-header-text">{account.type || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Category ID:</div>
            <div className="vc-header-text">{account.category_id || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Category:</div>
            <div className="vc-header-text">{account.category || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Sub Category:</div>
            <div className="vc-header-text">{account.sub_category || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created By:</div>
            <div className="vc-header-text">{account.created_by || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Created On:</div>
            <div className="vc-header-text">{formatDateLong(account.created_at)}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Updated By:</div>
            <div className="vc-header-text">{account.updated_by || 'N/A'}</div>
          </div>
          <div className="vc-header-group">
            <div className="vc-header-title">Updated On:</div>
            <div className="vc-header-text">{formatDateLong(account.updated_at)}</div>
          </div>
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type vc-inv-type">CATEGORY ID #</div>
          <div className="vc-voucher-type-number vc-inv-type-number">{account.category_id || 'N/A'}</div>
        </div>
      </div>

      {/* ── FINANCIAL SUMMARY CARDS ── */}
      {accountSummary && Object.keys(accountSummary).length > 0 && (
        <div className="vc-client-summary-section">
          <div className="vc-payment-heading">Financial Summary by currency</div>
          <div className="vc-client-summary-grid">
            {Object.entries(accountSummary).map(([currency, data]) => (
              <div key={currency} className={`vc-client-summary-card theme-${theme}`}>
                <div className="vc-card-header">{currency} Summary</div>
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
                    <span>Balance</span>
                    <span>{formatCurrencyDecimals(data.balance || 0, currency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LEDGERS TABLE ── */}
      <div className="vc-payment-heading" style={{ marginTop: '30px', marginBottom: '20px' }}>Associated Ledgers ({ledgers.length})</div>
      
      {ledgers.length > 0 ? (
        <div className="vc-table">
          <div className="vc-table-wrapper">
            <div className="vc-table-flexbox vc-table-header vc-inv-table">
                <div className="vc-table-data vc-tb-inv-sn">S/N</div>
                <div className="vc-table-data vc-tb-inv-desc">Ledger Name</div>
                <div className="vc-table-data vc-tb-inv-desc">Ledger Number</div>
                {/* <div className="vc-table-data vc-tb-inv-disc">Class</div> */}
                <div className="vc-table-data vc-tb-inv-disc">Sub Class</div>
                <div className="vc-table-data vc-tb-inv-disc">Type</div>
            </div>

            {ledgers.map((ledger, index) => (
              <div className="vc-table-flexbox vc-table-body vc-inv-table" key={ledger.id || index}>
                <div className="vc-table-data vc-tb-inv-sn">{index + 1}</div>
                <div className="vc-table-data vc-tb-inv-desc">{ledger.ledger_name || 'N/A'}</div>
                <div className="vc-table-data vc-tb-inv-desc">{ledger.ledger_number || 'N/A'}</div>
                {/* <div className="vc-table-data vc-tb-inv-disc">{ledger.ledger_class || 'N/A'}</div> */}
                <div className="vc-table-data vc-tb-inv-disc">{ledger.ledger_sub_class || 'N/A'}</div>
                <div className="vc-table-data vc-tb-inv-disc">{ledger.ledger_type || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="vc-no-invoices-message">
          No ledgers have been created for this account type yet.
        </div>
      )}

    </motion.div>
  );
};

export default ViewAccountContent;