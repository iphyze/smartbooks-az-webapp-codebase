import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import useClientStore from "../../stores/useClientStore";
import { fadeInUp } from "../../utils/animation";
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import DownloadClient from "./DownloadClient";
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

const ViewClientContent = ({ client }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const invoices = useClientStore((state) => state.singleClientInvoices) || [];
  const summary = useClientStore((state) => state.singleClientSummary) || {};

  if (!client) return null;

  const currencies = Object.keys(summary || {});
  const clientDocument = <DownloadClient client={client} invoices={invoices} summary={summary} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-address-book"
        eyebrow="Smartbooks client profile"
        title={client.clients_name || "Client"}
        subtitle={client.clients_email || "Review this client’s contact information and invoice activity."}
        badges={[
          { label: "Active client", icon: "fa-circle-check", variant: "success" },
          { label: client.clients_id ? `Client #${client.clients_id}` : "Client ID unavailable", icon: "fa-id-badge", variant: "brand" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/client/home")}
            backLabel="Back to clients"
            onEdit={() => navigate(`/client/edit/${client.clients_id}`, { state: { client } })}
            editLabel="Edit client"
            pdfDocument={clientDocument}
            fileName={`Client Profile - ${client.clients_name || "Client"}.pdf`}
            printTitle={`Preparing ${client.clients_name || "client"} profile`}
          />
        )}
        highlights={[
          { label: "Client ID", value: client.clients_id ? `#${client.clients_id}` : "Not assigned", icon: "fa-id-card" },
          { label: "Associated invoices", value: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`, icon: "fa-file-invoice-dollar" },
          { label: "Currencies tracked", value: currencies.length ? currencies.join(", ") : "No activity yet", icon: "fa-coins" },
        ]}
      >
        <EntityViewPanel
          icon="fa-address-card"
          title="Contact information"
          description="Primary client identity and communication details."
        >
          <EntityViewDetail icon="fa-building" label="Client name" value={client.clients_name} />
          <EntityViewDetail icon="fa-envelope" label="Email address" value={client.clients_email} />
          <EntityViewDetail icon="fa-phone" label="Phone number" value={client.clients_number} />
          <EntityViewDetail icon="fa-location-dot" label="Office address" value={client.clients_address} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-id-badge" label="Client ID" value={client.clients_id ? `#${client.clients_id}` : null} />
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={client.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(client.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={client.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(client.updated_at)} />
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
                  subtitle="Client billing position"
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
            description="Invoices generated for this client."
            count={invoices.length}
          />

          {invoices.length > 0 ? (
            <EntityViewTable
              minWidth={900}
              columns={[
                { key: "sn", label: "S/N" },
                { key: "invoice", label: "Invoice #" },
                { key: "date", label: "Date" },
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
                  <td>{formatDateLong(invoice.invoice_date)}</td>
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
              description="Invoices generated for this client will appear here."
            />
          )}
        </div>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewClientContent;
