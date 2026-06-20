import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import useProjectStore from "../../stores/useProjectStore";
import { fadeInUp } from "../../utils/animation";
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import DownloadProject from "./DownloadProject";
import {
  EntityStatusBadge,
  EntitySummaryCard,
  EntitySummaryGrid,
  EntityTableAction,
  EntityViewActions,
  EntityViewDetail,
  EntityViewEmpty,
  EntityViewPanel,
  EntityViewSectionHeading,
  EntityViewShell,
  EntityViewTable,
} from "../../components/entity-view/EntityView";

const ViewProjectContent = ({ project }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const invoices = useProjectStore((state) => state.singleProjectInvoices) || [];
  const summary = useProjectStore((state) => state.singleProjectSummary) || {};

  if (!project) return null;

  const currencies = Object.keys(summary || {});
  const projectDocument = <DownloadProject project={project} invoices={invoices} summary={summary} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-diagram-project"
        eyebrow="Smartbooks project profile"
        title={project.project_name || "Project"}
        subtitle="Review the project identity, billing position, and invoices associated with this record."
        badges={[
          { label: project.code || "No code tag", icon: "fa-tag", variant: "brand" },
          { label: project.project_code ? `Project #${project.project_code}` : "Project code unavailable", icon: "fa-hashtag", variant: "neutral" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/project/home")}
            backLabel="Back to projects"
            onEdit={() => navigate(`/project/edit/${project.project_code}`, { state: { project } })}
            editLabel="Edit project"
            pdfDocument={projectDocument}
            fileName={`Project Profile - ${project.project_name || "Project"}.pdf`}
            printTitle={`Preparing ${project.project_name || "project"} profile`}
          />
        )}
        highlights={[
          { label: "Project code", value: project.project_code || "Not assigned", icon: "fa-hashtag" },
          { label: "Associated invoices", value: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`, icon: "fa-file-invoice-dollar" },
          { label: "Currencies tracked", value: currencies.length ? currencies.join(", ") : "No activity yet", icon: "fa-coins" },
        ]}
      >
        <EntityViewPanel
          icon="fa-diagram-project"
          title="Project information"
          description="Primary identifiers used across Smartbooks."
        >
          <EntityViewDetail icon="fa-diagram-project" label="Project name" value={project.project_name} />
          <EntityViewDetail icon="fa-hashtag" label="Project code" value={project.project_code} />
          <EntityViewDetail icon="fa-tag" label="Code tag" value={project.code} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={project.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(project.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={project.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(project.updated_at)} />
        </EntityViewPanel>

        {currencies.length > 0 && (
          <div className="entity-view-section">
            <EntityViewSectionHeading
              icon="fa-chart-pie"
              title="Financial summary"
              description="Pending and paid invoice values grouped by currency."
              count={currencies.length}
            />
            <EntitySummaryGrid>
              {Object.entries(summary).map(([currency, data]) => (
                <EntitySummaryCard
                  key={currency}
                  title={`${currency} invoices`}
                  subtitle="Project billing position"
                  icon="fa-file-invoice-dollar"
                  rows={[
                    { label: `Pending (${data.pending_count || 0})`, value: formatCurrencyDecimals(data.pending_total || 0, currency), variant: "warning" },
                    { label: `Paid (${data.paid_count || 0})`, value: formatCurrencyDecimals(data.paid_total || 0, currency), variant: "positive" },
                  ]}
                />
              ))}
            </EntitySummaryGrid>
          </div>
        )}

        <div className="entity-view-section">
          <EntityViewSectionHeading
            icon="fa-file-invoice-dollar"
            title="Associated invoices"
            description="Invoices generated for this project."
            count={invoices.length}
          />

          {invoices.length > 0 ? (
            <EntityViewTable
              minWidth={920}
              columns={[
                { key: "sn", label: "S/N" },
                { key: "invoice", label: "Invoice #" },
                { key: "client", label: "Client" },
                { key: "currency", label: "Currency" },
                { key: "amount", label: "Amount", align: "right" },
                { key: "status", label: "Status", align: "center" },
                { key: "action", label: "Action", align: "right" },
              ]}
            >
              {invoices.map((invoice, index) => (
                <tr key={invoice.id || invoice.invoice_number || index}>
                  <td>{index + 1}</td>
                  <td className="is-brand">AZ-{invoice.invoice_number || "—"}</td>
                  <td className="is-strong">{invoice.clients_name || "Not available"}</td>
                  <td>{invoice.currency || "—"}</td>
                  <td className="is-right is-strong">{formatCurrencyDecimals(invoice.invoice_amount || 0, invoice.currency || "NGN")}</td>
                  <td className="is-center"><EntityStatusBadge status={invoice.status} /></td>
                  <td className="is-right">
                    <EntityTableAction
                      label="View invoice"
                      onClick={() => navigate(`/invoice/view/${invoice.invoice_number}`)}
                    />
                  </td>
                </tr>
              ))}
            </EntityViewTable>
          ) : (
            <EntityViewEmpty
              icon="fa-file-invoice"
              title="No invoices yet"
              description="Invoices generated for this project will appear here."
            />
          )}
        </div>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewProjectContent;
