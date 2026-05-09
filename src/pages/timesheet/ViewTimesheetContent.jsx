import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import CompanyLogo from '../../assets/images/smartbooks/az-logo.png';
import { PDFDownloadLink } from "@react-pdf/renderer";
import DownloadTimesheet from "./DownloadTimesheet"; // Import the PDF component
import "../ViewJournal.css";
import "../inputs-styles/Inputs.css";

const ViewTimesheetContent = ({ timesheet }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!timesheet) return null;

  // Destructure nested data from backend response
  const { clients_data, staff_data } = timesheet;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    // Backend returns "HH:mm:ss" or "HH:mm"
    const parts = timeStr.split(':');
    if (parts.length < 2) return '—';
    
    const date = new Date();
    date.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatHours = (hours) => {
    // Handle null/undefined/0
    if (!hours && hours !== 0) return '—';
    
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    return `${h}h ${m}m`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

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
          onClick={() => navigate(`/timesheet/edit/${timesheet.id}`)}
        >
          <span className="fas fa-pen" /> Edit Entry
        </button>
        
        {/* Download PDF Button */}
        <PDFDownloadLink
          document={<DownloadTimesheet timesheet={timesheet} />}
          fileName={`Timesheet-${timesheet.id}.pdf`}
          className="vc-export-btn"
        >
          {({ loading }) => (
            loading ? 
            <><span className="fas fa-spinner fa-spin"></span> Preparing...</> : 
            <><span className="fas fa-file-pdf"></span> Download PDF</>
          )}
        </PDFDownloadLink>
      </div>

      {/* ── Header ── */}
      <div className="vc-header-flexbox">
        <div className="vc-header-col">

          <div className="vc-header-group">
            <div className="vc-header-title">Entry ID</div>
            <div className="vc-header-text">{timesheet.id}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Work Date</div>
            <div className="vc-header-text">{formatDate(timesheet.date)}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Staff Member</div>
            <div
              className="vc-header-text vc-inv-link"
              style={{ cursor: 'pointer' }}
              onClick={() => timesheet.staff_id && navigate(`/staff/view/${timesheet.staff_id}`)}
            >
              {timesheet.staff_name || '—'}
            </div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Client</div>
            <div
              className="vc-header-text vc-inv-link"
              style={{ cursor: 'pointer' }}
              onClick={() => timesheet.clients_id && navigate(`/client/view/${timesheet.clients_id}`)}
            >
              {timesheet.clients_name || '—'}
            </div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Project</div>
            <div className="vc-header-text">{timesheet.project || '—'}</div>
          </div>

          <div className="vc-header-group">
            <div className="vc-header-title">Task</div>
            <div className="vc-header-text">{timesheet.task || '—'}</div>
          </div>

        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type">Timesheet Entry</div>
          <div className="vc-voucher-type-number">#{timesheet.id}</div>
        </div>
      </div>

      {/* ── Time Table ── */}
      <div className="vc-table">
        <div className="vc-table-wrapper">
          <div className="vc-table-flexbox vc-table-header">
            {/* Using vc-tb-inv classes for better flex sizing in a 3-col layout */}
            <div className="vc-table-data vc-tb-inv-desc">Start Time</div>
            <div className="vc-table-data vc-tb-inv-desc">Finish Time</div>
            <div className="vc-table-data vc-tb-inv-amt">Total Hours</div>
          </div>

          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data vc-tb-inv-desc">{formatTime(timesheet.start_time)}</div>
            <div className="vc-table-data vc-tb-inv-desc">{formatTime(timesheet.finish_time)}</div>
            <div className="vc-table-data vc-tb-inv-amt vc-boldtext">
              {formatHours(parseFloat(timesheet.total_hours))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Staff & Client Detail Cards ── */}
      {(staff_data || clients_data) && (
        <div className="vc-summary-table" style={{ marginTop: 30, marginBottom: 30 }}>

          {/* Staff Card */}
          {staff_data && (
            <div className="vc-summary-col">
              <div className="vc-payment-heading">Staff Details</div>
              <div className="vc-summary-col-flex-box">
                <div className="vc-summary-col-title">Name</div>
                <div className="vc-summary-col-text">{staff_data.staff_name || '—'}</div>
              </div>
              <div className="vc-summary-col-flex-box">
                <div className="vc-summary-col-title">Email</div>
                <div className="vc-summary-col-text">{staff_data.staff_email || '—'}</div>
              </div>
            </div>
          )}

          {/* Client Card */}
          {clients_data && (
            <div className="vc-summary-col">
              <div className="vc-payment-heading">Client Details</div>
              <div className="vc-summary-col-flex-box">
                <div className="vc-summary-col-title">Name</div>
                <div className="vc-summary-col-text">{clients_data.clients_name || '—'}</div>
              </div>
              <div className="vc-summary-col-flex-box">
                <div className="vc-summary-col-title">Email</div>
                <div className="vc-summary-col-text">{clients_data.clients_email || '—'}</div>
              </div>
              <div className="vc-summary-col-flex-box">
                <div className="vc-summary-col-title">Address</div>
                <div className="vc-summary-col-text">{clients_data.clients_address || '—'}</div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Audit Trail ── */}
      <div className="vc-summary-table">
        <div className="vc-summary-col">
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created By</div>
            <div className="vc-summary-col-text">{timesheet.created_by || '—'}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created At</div>
            <div className="vc-summary-col-text">{formatDateTime(timesheet.created_at)}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated By</div>
            <div className="vc-summary-col-text">{timesheet.updated_by || '—'}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated At</div>
            <div className="vc-summary-col-text">{formatDateTime(timesheet.updated_at)}</div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default ViewTimesheetContent;