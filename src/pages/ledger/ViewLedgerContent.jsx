import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import { fadeInUp } from "../../utils/animation";
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import DownloadLedger from "./DownloadLedger";
import {
  EntityViewActions,
  EntityViewDetail,
  EntityViewEmpty,
  EntityViewPanel,
  EntityViewSectionHeading,
  EntityViewShell,
  EntityViewTable,
  EntitySummaryCard,
  EntitySummaryGrid,
  EntityTableAction,
} from "../../components/entity-view/EntityView";

const ViewLedgerContent = ({ ledger, journalEntries = [], summary = {} }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  if (!ledger) return null;

  const currencies = Object.keys(summary || {});
  const ledgerDocument = <DownloadLedger ledger={ledger} journalEntries={journalEntries} summary={summary} />;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-book-open"
        eyebrow="Smartbooks ledger profile"
        title={ledger.ledger_name || "Ledger"}
        subtitle="Review the ledger classification, balances, and recent journal activity in one place."
        badges={[
          { label: ledger.ledger_class || "No class", icon: "fa-layer-group", variant: "brand" },
          { label: ledger.ledger_type || "No type", icon: "fa-tag", variant: "neutral" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/ledger/home")}
            backLabel="Back to ledgers"
            onEdit={() => navigate(`/ledger/edit/${ledger.ledger_number}`, { state: { ledger } })}
            editLabel="Edit ledger"
            pdfDocument={ledgerDocument}
            fileName={`Ledger - ${ledger.ledger_name || "Ledger"}.pdf`}
            printTitle={`Preparing ${ledger.ledger_name || "ledger"} profile`}
          />
        )}
        highlights={[
          { label: "Ledger number", value: ledger.ledger_number || "Not assigned", icon: "fa-hashtag" },
          { label: "Recent entries", value: `${journalEntries.length} entr${journalEntries.length === 1 ? "y" : "ies"}`, icon: "fa-receipt" },
          { label: "Currencies tracked", value: currencies.length ? currencies.join(", ") : "No activity yet", icon: "fa-coins" },
        ]}
      >
        <EntityViewPanel
          icon="fa-sitemap"
          title="Ledger classification"
          description="The chart-of-accounts structure assigned to this ledger."
        >
          <EntityViewDetail icon="fa-book" label="Ledger name" value={ledger.ledger_name} />
          <EntityViewDetail icon="fa-hashtag" label="Ledger number" value={ledger.ledger_number} />
          <EntityViewDetail icon="fa-layer-group" label="Ledger class" value={ledger.ledger_class} />
          <EntityViewDetail icon="fa-code" label="Class code" value={ledger.ledger_class_code} />
          <EntityViewDetail icon="fa-folder-tree" label="Sub-class" value={ledger.ledger_sub_class} />
          <EntityViewDetail icon="fa-tag" label="Ledger type" value={ledger.ledger_type} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={ledger.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(ledger.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={ledger.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(ledger.updated_at)} />
        </EntityViewPanel>

        {currencies.length > 0 && (
          <div className="entity-view-section">
            <EntityViewSectionHeading
              icon="fa-chart-line"
              title="Financial summary"
              description="Debit, credit, and net balance totals grouped by currency."
              count={currencies.length}
            />
            <EntitySummaryGrid>
              {Object.entries(summary).map(([currency, data]) => (
                <EntitySummaryCard
                  key={currency}
                  title={`${currency} summary`}
                  subtitle={`${data.entry_count || 0} journal entr${Number(data.entry_count) === 1 ? "y" : "ies"}`}
                  icon="fa-scale-balanced"
                  rows={[
                    { label: "Total debit", value: formatCurrencyDecimals(data.total_debit || 0, currency), variant: "warning" },
                    { label: "Total credit", value: formatCurrencyDecimals(data.total_credit || 0, currency), variant: "positive" },
                    { label: "Net balance", value: formatCurrencyDecimals(data.net_balance || 0, currency), variant: "brand" },
                  ]}
                />
              ))}
            </EntitySummaryGrid>
          </div>
        )}

        <div className="entity-view-section">
          <EntityViewSectionHeading
            icon="fa-receipt"
            title="Recent journal entries"
            description="The latest postings recorded against this ledger."
            count={journalEntries.length}
          />

          {journalEntries.length > 0 ? (
            <EntityViewTable
              minWidth={980}
              columns={[
                { key: "sn", label: "S/N" },
                { key: "journal", label: "Journal ID" },
                { key: "date", label: "Date" },
                { key: "description", label: "Description" },
                { key: "type", label: "Type" },
                { key: "debit", label: "Debit", align: "right" },
                { key: "credit", label: "Credit", align: "right" },
                { key: "action", label: "Action", align: "right" },
              ]}
            >
              {journalEntries.map((entry, index) => (
                <tr key={entry.id || `${entry.journal_id}-${index}`}>
                  <td>{index + 1}</td>
                  <td className="is-brand">{entry.journal_id || "—"}</td>
                  <td>{formatDateLong(entry.journal_date)}</td>
                  <td className="is-strong">{entry.journal_description || "Not available"}</td>
                  <td>{entry.journal_type || "—"}</td>
                  <td className="is-right is-strong">{formatCurrencyDecimals(entry.debit_ngn || 0, entry.journal_currency || "NGN")}</td>
                  <td className="is-right is-strong">{formatCurrencyDecimals(entry.credit_ngn || 0, entry.journal_currency || "NGN")}</td>
                  <td className="is-right">
                    <EntityTableAction
                      label="View journal"
                      onClick={() => navigate(`/journal/view/${entry.journal_id}`)}
                    />
                  </td>
                </tr>
              ))}
            </EntityViewTable>
          ) : (
            <EntityViewEmpty
              icon="fa-receipt"
              title="No journal activity"
              description="Journal entries posted to this ledger will appear here."
            />
          )}
        </div>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewLedgerContent;
