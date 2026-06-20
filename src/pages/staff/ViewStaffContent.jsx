import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import { formatDateLong } from "../../utils/helper";
import {
  EntityViewActions,
  EntityViewDetail,
  EntityViewPanel,
  EntityViewShell,
} from "../../components/entity-view/EntityView";

const ViewStaffContent = ({ staff }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!staff) return null;

  const hasBankDetails = Boolean(staff.bank_name || staff.bank_account_number || staff.bank_account_name);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-id-badge"
        eyebrow="Smartbooks staff profile"
        title={staff.staff_name || "Staff member"}
        subtitle={staff.staff_email || "Review this staff member’s personal, employment, and payment information."}
        badges={[
          { label: staff.job_title || "No job title", icon: "fa-briefcase", variant: "brand" },
          { label: staff.gender || "Gender not provided", icon: "fa-user", variant: "neutral" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/staff/home")}
            backLabel="Back to staff"
            onEdit={() => navigate(`/staff/edit/${staff.staff_id}`)}
            editLabel="Edit staff"
          />
        )}
        highlights={[
          { label: "Staff ID", value: staff.staff_id ? `#${staff.staff_id}` : "Not assigned", icon: "fa-id-card" },
          { label: "Date joined", value: formatDateLong(staff.date_of_joining), icon: "fa-calendar-check" },
          { label: "Bank setup", value: hasBankDetails ? "Payment details configured" : "Not configured", icon: "fa-building-columns" },
        ]}
      >
        <EntityViewPanel
          icon="fa-user"
          title="Personal information"
          description="Identity and contact details for this staff profile."
        >
          <EntityViewDetail icon="fa-user" label="Full name" value={staff.staff_name} />
          <EntityViewDetail icon="fa-envelope" label="Email address" value={staff.staff_email} />
          <EntityViewDetail icon="fa-phone" label="Phone number" value={staff.staff_tel} />
          <EntityViewDetail icon="fa-venus-mars" label="Gender" value={staff.gender} />
          <EntityViewDetail icon="fa-cake-candles" label="Date of birth" value={formatDateLong(staff.date_of_birth)} />
          <EntityViewDetail icon="fa-location-dot" label="Address" value={staff.staff_address} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-briefcase"
          title="Employment information"
          description="Role, joining date, and statutory identifiers."
        >
          <EntityViewDetail icon="fa-user-tie" label="Job title" value={staff.job_title} />
          <EntityViewDetail icon="fa-calendar-day" label="Date joined" value={formatDateLong(staff.date_of_joining)} />
          <EntityViewDetail icon="fa-shield-halved" label="Pension number" value={staff.pension_number} />
          <EntityViewDetail icon="fa-receipt" label="PAYE ID" value={staff.payee_id} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-building-columns"
          title="Bank information"
          description="Payment account details associated with this staff member."
        >
          <EntityViewDetail icon="fa-landmark" label="Bank name" value={staff.bank_name} />
          <EntityViewDetail icon="fa-hashtag" label="Account number" value={staff.bank_account_number} />
          <EntityViewDetail icon="fa-user-tag" label="Account name" value={staff.bank_account_name} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={staff.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(staff.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={staff.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(staff.updated_at)} />
        </EntityViewPanel>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewStaffContent;
