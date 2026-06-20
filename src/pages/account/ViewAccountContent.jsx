import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../stores/useThemeStore";
import useAccountStore from "../../stores/useAccountStore";
import { fadeInUp } from "../../utils/animation";
import { formatCurrencyDecimals, formatDateLong } from "../../utils/helper";
import DownloadAccount from "./DownloadAccount";
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

const ViewAccountContent = ({ account }) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const ledgers = useAccountStore((state) => state.singleAccountLedgers) || [];
  const accountSummary = useAccountStore((state) => state.singleAccountSummary) || {};

  if (!account) return null;

  const currencies = Object.keys(accountSummary);
  const accountDocument = (
    <DownloadAccount account={account} ledgers={ledgers} accountSummary={accountSummary} />
  );

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <EntityViewShell
        theme={theme}
        icon="fa-wallet"
        eyebrow="Smartbooks account profile"
        title={account.type || "Account type"}
        subtitle="Review this account classification, its financial position, and the ledgers assigned to it."
        badges={[
          { label: account.category || "Uncategorised", icon: "fa-folder-tree", variant: "brand" },
          { label: account.sub_category || "No sub-category", icon: "fa-tags", variant: "neutral" },
        ]}
        actions={(
          <EntityViewActions
            onBack={() => navigate("/account/home")}
            backLabel="Back to accounts"
            onEdit={() => navigate(`/account/edit/${account.id}`, { state: { account } })}
            editLabel="Edit account"
            pdfDocument={accountDocument}
            fileName={`Account Type - ${account.type || "Account"}.pdf`}
            printTitle={`Preparing ${account.type || "account"} profile`}
          />
        )}
        highlights={[
          { label: "Category ID", value: account.category_id || "Not assigned", icon: "fa-hashtag" },
          { label: "Associated ledgers", value: `${ledgers.length} ledger${ledgers.length === 1 ? "" : "s"}`, icon: "fa-book-open" },
          { label: "Currencies tracked", value: currencies.length ? currencies.join(", ") : "No activity yet", icon: "fa-coins" },
        ]}
      >
        <EntityViewPanel
          icon="fa-sitemap"
          title="Account classification"
          description="How this account is organised within the chart of accounts."
        >
          <EntityViewDetail icon="fa-wallet" label="Account type" value={account.type} />
          <EntityViewDetail icon="fa-hashtag" label="Category ID" value={account.category_id} />
          <EntityViewDetail icon="fa-folder" label="Category" value={account.category} />
          <EntityViewDetail icon="fa-folder-open" label="Sub-category" value={account.sub_category} />
        </EntityViewPanel>

        <EntityViewPanel
          icon="fa-clock-rotate-left"
          title="Record history"
          description="Creation and most recent update information."
        >
          <EntityViewDetail icon="fa-user-plus" label="Created by" value={account.created_by} subtle />
          <EntityViewDetail icon="fa-calendar-plus" label="Created on" value={formatDateLong(account.created_at)} />
          <EntityViewDetail icon="fa-user-pen" label="Updated by" value={account.updated_by} subtle />
          <EntityViewDetail icon="fa-calendar-check" label="Updated on" value={formatDateLong(account.updated_at)} />
        </EntityViewPanel>

        {currencies.length > 0 && (
          <div className="entity-view-section">
            <EntityViewSectionHeading
              icon="fa-chart-pie"
              title="Financial summary"
              description="Debit, credit, and balance totals grouped by currency."
              count={currencies.length}
            />
            <EntitySummaryGrid>
              {Object.entries(accountSummary).map(([currency, data]) => (
                <EntitySummaryCard
                  key={currency}
                  title={`${currency} summary`}
                  subtitle="Account activity"
                  icon="fa-scale-balanced"
                  rows={[
                    { label: "Total debit", value: formatCurrencyDecimals(data.total_debit || 0, currency), variant: "warning" },
                    { label: "Total credit", value: formatCurrencyDecimals(data.total_credit || 0, currency), variant: "positive" },
                    { label: "Balance", value: formatCurrencyDecimals(data.balance || 0, currency), variant: "brand" },
                  ]}
                />
              ))}
            </EntitySummaryGrid>
          </div>
        )}

        <div className="entity-view-section">
          <EntityViewSectionHeading
            icon="fa-book-open"
            title="Associated ledgers"
            description="Ledgers currently grouped under this account type."
            count={ledgers.length}
          />

          {ledgers.length > 0 ? (
            <EntityViewTable
              minWidth={820}
              columns={[
                { key: "sn", label: "S/N" },
                { key: "name", label: "Ledger name" },
                { key: "number", label: "Ledger number" },
                { key: "subclass", label: "Sub-class" },
                { key: "type", label: "Type" },
                { key: "action", label: "Action", align: "right" },
              ]}
            >
              {ledgers.map((ledger, index) => (
                <tr key={ledger.id || ledger.ledger_number || index}>
                  <td>{index + 1}</td>
                  <td className="is-strong">{ledger.ledger_name || "Not available"}</td>
                  <td className="is-brand">{ledger.ledger_number || "—"}</td>
                  <td>{ledger.ledger_sub_class || "—"}</td>
                  <td>{ledger.ledger_type || "—"}</td>
                  <td className="is-right">
                    <EntityTableAction
                      label="View ledger"
                      onClick={() => navigate(`/ledger/view/${ledger.ledger_number}`)}
                    />
                  </td>
                </tr>
              ))}
            </EntityViewTable>
          ) : (
            <EntityViewEmpty
              icon="fa-book-open"
              title="No ledgers assigned"
              description="Ledgers added under this account type will appear here."
            />
          )}
        </div>
      </EntityViewShell>
    </motion.div>
  );
};

export default ViewAccountContent;
