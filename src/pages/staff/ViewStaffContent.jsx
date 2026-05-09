import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import "../ViewJournal.css";
import "../inputs-styles/Inputs.css";

const ViewStaffContent = ({ staff }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!staff) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const InfoRow = ({ label, value }) => (
    <div className="vc-header-group">
      <div className="vc-header-title">{label}</div>
      <div className="vc-header-text">{value || '—'}</div>
    </div>
  );

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`view-content-box theme-${theme}`}
    >
      <img src={CompanyLogo} alt="Company Logo" className="company-logo" />

      {/* ── Action Buttons ── */}
      <div className="vc-button-box">
        <button
          className="vc-edit-btn"
          onClick={() => navigate(`/staff/edit/${staff.staff_id}`)}
        >
          <span className="fas fa-pen" /> Edit Staff
        </button>
      </div>

      {/* ── Header: Identity + ID Block ── */}
      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <InfoRow label="Staff ID"       value={staff.staff_id} />
          <InfoRow label="Full Name"      value={staff.staff_name} />
          <InfoRow label="Email"          value={staff.staff_email} />
          <InfoRow label="Phone"          value={staff.staff_tel} />
          <InfoRow label="Gender"         value={staff.gender} />
          <InfoRow label="Date of Birth"  value={formatDate(staff.date_of_birth)} />
          <InfoRow label="Address"        value={staff.staff_address} />
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type">{staff.job_title || 'Staff'}</div>
          <div className="vc-voucher-type-number">{staff.staff_id}</div>
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="vc-table" style={{ marginBottom: 30 }}>
        <div className="vc-table-wrapper">

          {/* Employment */}
          <div className="vc-table-flexbox vc-table-header">
            <div className="vc-table-data" style={{ flex: 1 }}>Employment Details</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Job Title</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.job_title || '—'}</div>
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Date Joined</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{formatDate(staff.date_of_joining)}</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Pension Number</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.pension_number || '—'}</div>
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Payee ID</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.payee_id || '—'}</div>
          </div>

          {/* Bank */}
          <div className="vc-table-flexbox vc-table-header" style={{ marginTop: 20 }}>
            <div className="vc-table-data" style={{ flex: 1 }}>Bank Information</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Bank Name</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.bank_name || '—'}</div>
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Account Number</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.bank_account_number || '—'}</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: '25%', fontFamily: 'Montserrat-Medium' }}>Account Name</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{staff.bank_account_name || '—'}</div>
            <div className="vc-table-data" style={{ width: '25%' }} />
            <div className="vc-table-data" style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      {/* ── Audit Trail ── */}
      <div className="vc-summary-table">
        <div className="vc-summary-col">
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created By</div>
            <div className="vc-summary-col-text">{staff.created_by || '—'}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created At</div>
            <div className="vc-summary-col-text">{formatDateTime(staff.created_at)}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated By</div>
            <div className="vc-summary-col-text">{staff.updated_by || '—'}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated At</div>
            <div className="vc-summary-col-text">{formatDateTime(staff.updated_at)}</div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default ViewStaffContent;