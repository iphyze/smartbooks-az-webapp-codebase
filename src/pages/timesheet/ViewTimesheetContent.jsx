import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import { formatDateLong } from "../../utils/helper";
import DownloadTimesheet from "./DownloadTimesheet";
import {
  EntitySummaryCard,
  EntitySummaryGrid,
  EntityViewActions,
  EntityViewDetail,
  EntityViewPanel,
  EntityViewSectionHeading,
  EntityViewShell,
} from "../../components/entity-view/EntityView";

const formatTime = (timeValue) => {
  if (!timeValue) return "Not recorded";
  const [hours, minutes] = String(timeValue).split(":");
  if (hours === undefined || minutes === undefined) return "Not recorded";

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const formatHours = (value) => {
  const hours = Number(value);
  if (!Number.isFinite(hours)) return "Not recorded";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ViewTimesheetContent = ({ timesheet }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!timesheet) return null;

  const { clients_data: clientData, staff_data: staffData } = timesheet;
  const totalHours = formatHours(timesheet.total_hours);
  const timesheetDocument = <DownloadTimesheet timesheet={timesheet} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-clock"
        eyebrow="Smartbooks timesheet entry"
        title={`Timesheet #${timesheet.id || "—"}`}
        subtitle={timesheet.task || "Review the work entry, linked records, and audit information."}
        badges={[
          { label: formatDateLong(timesheet.date), icon: "fa-calendar-day", variant: "brand" },
          { label: totalHours, icon: "fa-hourglass-half", variant: "success" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/timesheet/home")}
            backLabel="Back to timesheets"
            onEdit={() => navigate(`/timesheet/edit/${timesheet.id}`)}
            editLabel="Edit entry"
            pdfDocument={timesheetDocument}
            fileName={`Timesheet-${timesheet.id || "entry"}.pdf`}
            printTitle={`Preparing timesheet #${timesheet.id || ""}`}
          />
        )}
        highlights={[
          { label: "Work date", value: formatDateLong(timesheet.date), icon: "fa-calendar-check" },
          { label: "Total hours", value: totalHours, icon: "fa-business-time" },
          { label: "Staff member", value: timesheet.staff_name || "Not assigned", icon: "fa-user-clock" },
        ]}
      >
        <EntityViewPanel
          icon="fa-list-check"
          title="Entry context"
          description="The work assignment and records connected to this entry."
        >
          <EntityViewDetail icon="fa-hashtag" label="Entry ID" value={timesheet.id ? `#${timesheet.id}` : null} />
          <EntityViewDetail icon="fa-calendar-day" label="Work date" value={formatDateLong(timesheet.date)} />
          <EntityViewDetail
            icon="fa-user-clock"
            label="Staff member"
            value={timesheet.staff_name}
            onClick={timesheet.staff_id ? () => navigate(`/staff/view/${timesheet.staff_id}`) : undefined}
          />
          <EntityViewDetail
            icon="fa-address-book"
            label="Client"
            value={timesheet.clients_name}
            onClick={timesheet.clients_id ? () => navigate(`/client/view/${timesheet.clients_id}`) : undefined}
          />
          <EntityViewDetail icon="fa-diagram-project" label="Project" value={timesheet.project} />
          <EntityViewDetail icon="fa-list-check" label="Task" value={timesheet.task} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={timesheet.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created at" value={formatDateTime(timesheet.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={timesheet.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated at" value={formatDateTime(timesheet.updated_at)} />
        </EntityViewPanel>

        <div className="entity-view-section">
          <EntityViewSectionHeading
            icon="fa-stopwatch"
            title="Recorded time"
            description="The start, finish, and calculated duration for this entry."
          />
          <EntitySummaryGrid>
            <EntitySummaryCard
              title="Time breakdown"
              subtitle={formatDateLong(timesheet.date)}
              icon="fa-clock"
              rows={[
                { label: "Start time", value: formatTime(timesheet.start_time), variant: "brand" },
                { label: "Finish time", value: formatTime(timesheet.finish_time), variant: "brand" },
                { label: "Total hours", value: totalHours, variant: "positive" },
              ]}
            />
          </EntitySummaryGrid>
        </div>

        {(staffData || clientData) && (
          <div className="entity-view-section">
            <EntityViewSectionHeading
              icon="fa-link"
              title="Linked record details"
              description="A quick view of the staff and client information attached to this entry."
              count={(staffData ? 1 : 0) + (clientData ? 1 : 0)}
            />
            <div className="entity-view-content">
              {staffData && (
                <EntityViewPanel
                  icon="fa-id-badge"
                  title="Staff details"
                  description="Linked employee information."
                >
                  <EntityViewDetail icon="fa-user" label="Name" value={staffData.staff_name} />
                  <EntityViewDetail icon="fa-envelope" label="Email" value={staffData.staff_email} />
                </EntityViewPanel>
              )}

              {clientData && (
                <EntityViewPanel
                  icon="fa-address-book"
                  title="Client details"
                  description="Linked customer information."
                >
                  <EntityViewDetail icon="fa-building" label="Name" value={clientData.clients_name} />
                  <EntityViewDetail icon="fa-envelope" label="Email" value={clientData.clients_email} />
                  <EntityViewDetail icon="fa-location-dot" label="Address" value={clientData.clients_address} />
                </EntityViewPanel>
              )}
            </div>
          </div>
        )}
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewTimesheetContent;
