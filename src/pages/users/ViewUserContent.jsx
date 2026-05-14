import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp } from "../../utils/animation";
import useThemeStore from "../../stores/useThemeStore";
import useAuthStore from "../../stores/useAuthStore";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import "../ViewJournal.css";
import "../inputs-styles/Inputs.css";

const ROLE_COLORS = {
  Admin:      { color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
  Controller: { color: "#0891b2", bg: "rgba(8,145,178,0.12)" },
  User:       { color: "#059669", bg: "rgba(5,150,105,0.12)" },
};

const ViewUserContent = ({ user }) => {
  const { theme } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = currentUser?.integrity === "Admin";

  const formatDateTime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return `${dt.toLocaleDateString("en-GB")} ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const InfoRow = ({ label, value }) => (
    <div className="vc-header-group">
      <div className="vc-header-title">{label}</div>
      <div className="vc-header-text">{value || "—"}</div>
    </div>
  );

  const roleStyle = ROLE_COLORS[user.integrity] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.01, delay: 0.02, ease: "easeInOut" }}
      className={`view-content-box theme-${theme}`}
    >
      <img src={CompanyLogo} alt="Company Logo" className="company-logo" />

      {isAdmin && (
        <div className="vc-button-box">
          <button
            className="vc-edit-btn"
            onClick={() => navigate(`/users/edit/${user.user_id}`, { state: { user } })}
          >
            <span className="fas fa-pen" /> Edit User
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="vc-header-flexbox">
        <div className="vc-header-col">
          <InfoRow label="User ID"    value={user.user_id} />
          <InfoRow label="First Name" value={user.fname} />
          <InfoRow label="Last Name"  value={user.lname} />
          <InfoRow label="Email"      value={user.email} />
          <InfoRow label="Phone"      value={user.phone} />
        </div>

        <div className="vc-header-col vc-header-col-two">
          <div className="vc-voucher-type">
            <span style={{
              display: "inline-block", padding: "4px 16px", borderRadius: 20,
              fontSize: 13, fontFamily: "Montserrat-SemiBold",
              color: roleStyle.color, background: roleStyle.bg,
            }}>
              {user.integrity || "User"}
            </span>
          </div>
          <div className="vc-voucher-type-number">#{user.user_id}</div>
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="vc-table" style={{ marginBottom: 30 }}>
        <div className="vc-table-wrapper">
          <div className="vc-table-flexbox vc-table-header">
            <div className="vc-table-data" style={{ flex: 1 }}>Account Details</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: "25%", fontFamily: "Montserrat-Medium" }}>Role</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{user.integrity || "—"}</div>
            <div className="vc-table-data" style={{ width: "25%", fontFamily: "Montserrat-Medium" }}>Status</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{user.status || "Active"}</div>
          </div>
          <div className="vc-table-flexbox vc-table-body">
            <div className="vc-table-data" style={{ width: "25%", fontFamily: "Montserrat-Medium" }}>Email</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{user.email || "—"}</div>
            <div className="vc-table-data" style={{ width: "25%", fontFamily: "Montserrat-Medium" }}>Phone</div>
            <div className="vc-table-data" style={{ flex: 1 }}>{user.phone || "—"}</div>
          </div>
        </div>
      </div>

      {/* ── Audit Trail ── */}
      <div className="vc-summary-table">
        <div className="vc-summary-col">
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created By</div>
            <div className="vc-summary-col-text">{user.created_by || "—"}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Created At</div>
            <div className="vc-summary-col-text">{formatDateTime(user.created_at)}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated By</div>
            <div className="vc-summary-col-text">{user.updated_by || "—"}</div>
          </div>
          <div className="vc-summary-col-flex-box">
            <div className="vc-summary-col-title">Updated At</div>
            <div className="vc-summary-col-text">{formatDateTime(user.updated_at)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewUserContent;
