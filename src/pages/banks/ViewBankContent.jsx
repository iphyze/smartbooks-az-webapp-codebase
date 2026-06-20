import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import DownloadBank from "./DownloadBank";
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

const ViewBankContent = ({ bank, invoices = [], summary = {} }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!bank) return null;

  const currencies = Object.keys(summary || {});
  const bankDocument = <DownloadBank bank={bank} invoices={invoices} summary={summary} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-building-columns"
        eyebrow="Smartbooks bank profile"
        title={bank.account_name || "Bank account"}
        subtitle={bank.bank_name || "Review the bank account information and its linked invoice activity."}
        badges={[
          { label: bank.account_currency || "No currency", icon: "fa-coins", variant: "brand" },
          { label: "Active bank account", icon: "fa-circle-check", variant: "success" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/banks/home")}
            backLabel="Back to banks"
            onEdit={() => navigate(`/banks/edit/${bank.id}`, { state: { bank } })}
            editLabel="Edit bank"
            pdfDocument={bankDocument}
            fileName={`Bank Account Profile - ${bank.account_name || "Bank"}.pdf`}
            printTitle={`Preparing ${bank.account_name || "bank account"} profile`}
          />
        )}
        highlights={[
          { label: "Account number", value: bank.account_number || "Not assigned", icon: "fa-hashtag" },
          { label: "Associated invoices", value: `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`, icon: "fa-file-invoice-dollar" },
          { label: "Currencies tracked", value: currencies.length ? currencies.join(", ") : bank.account_currency || "No activity yet", icon: "fa-money-bill-transfer" },
        ]}
      >
        <EntityViewPanel
          icon="fa-building-columns"
          title="Bank account information"
          description="Core account and institution details."
        >
          <EntityViewDetail icon="fa-user-tag" label="Account name" value={bank.account_name} />
          <EntityViewDetail icon="fa-hashtag" label="Account number" value={bank.account_number} />
          <EntityViewDetail icon="fa-landmark" label="Bank name" value={bank.bank_name} />
          <EntityViewDetail icon="fa-coins" label="Account currency" value={bank.account_currency} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={bank.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(bank.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={bank.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(bank.updated_at)} />
        </EntityViewPanel>

        {currencies.length > 0 && (
          <div className="entity-view-section">
            <EntityViewSectionHeading
              icon="fa-chart-pie"
              title="Invoice summary"
              description="Pending and paid invoice values associated with this account."
              count={currencies.length}
            />
            <EntitySummaryGrid>
              {Object.entries(summary).map(([currency, data]) => (
                <EntitySummaryCard
                  key={currency}
                  title={`${currency} invoices`}
                  subtitle="Account-linked billing"
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
            description="Invoices issued through this bank account."
            count={invoices.length}
          />

          {invoices.length > 0 ? (
            <EntityViewTable
              minWidth={900}
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
              title="No associated invoices"
              description="Invoices linked to this bank account will appear here."
            />
          )}
        </div>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewBankContent;
