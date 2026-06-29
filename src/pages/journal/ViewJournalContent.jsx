import React, { useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CompanyLogo from "../../assets/images/smartbooks/az-logo.png";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import { fadeInUp } from "../../utils/animation";
import {
  formatCurrencyDecimals,
  formatDateLong,
  formatWithDecimals,
} from "../../utils/helper";
import printPdfDocument from "../../utils/printPdfDocument";
import DownloadJournal from "./DownloadJournal";
import "./JournalView.css";

const PAGE_SIZE = 10;

const voucherCode = (type) => {
  switch (type) {
    case "Sales":
      return "SV";
    case "Payment":
      return "PV";
    case "Journal":
      return "JV";
    case "Receipt":
      return "RV";
    case "Expenses":
      return "EV";
    case "General":
      return "GV";
    default:
      return "V";
  }
};

const toNumber = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
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

const AuditItem = ({ icon, label, value }) => (
  <div className="journal-view-audit-item">
    <span className="journal-view-audit-item__icon" aria-hidden="true">
      <i className={`fas ${icon}`} />
    </span>
    <span className="journal-view-audit-item__copy">
      <span>{label}</span>
      <strong>{value || "Not recorded"}</strong>
    </span>
  </div>
);

const ViewJournalContent = ({ journal }) => {
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();
  const [isPrinting, setIsPrinting] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(PAGE_SIZE);

  const items = useMemo(
    () => (Array.isArray(journal?.items) ? journal.items : []),
    [journal?.items]
  );

  if (!journal) return null;

  const ngnDebit = toNumber(journal.debit_ngn);
  const ngnCredit = toNumber(journal.credit_ngn);
  const fcyDebit = toNumber(journal.debit_others);
  const fcyCredit = toNumber(journal.credit_others);
  const ngnDifference = Math.abs(ngnDebit - ngnCredit);
  const fcyDifference = Math.abs(fcyDebit - fcyCredit);
  const isBalanced = ngnDifference <= 0.01 && fcyDifference <= 0.01;
  const reference = `${voucherCode(journal.journal_type)}-${journal.journal_id || ""}`;
  const visibleItems = items.slice(0, visibleLineCount);
  const hasMoreLines = visibleLineCount < items.length;

  const handlePrintJournal = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    try {
      await printPdfDocument(
        <DownloadJournal journal={journal} />,
        `Preparing ${journal?.journal_type || "journal"} voucher`
      );
    } catch (error) {
      showToast(
        error?.message || "The journal PDF could not be prepared for printing.",
        "error"
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const handleLedgerNavigation = (ledgerNumber) => {
    if (!ledgerNumber) return;
    navigate(`/ledger/view/${ledgerNumber}`);
  };

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`journal-view-card theme-${theme}`}
    >
      <div className="journal-view-card__glow" aria-hidden="true" />

      <header className="journal-view-hero">
        <div className="journal-view-identity">
          <div className="journal-view-logo-wrap">
            <img src={CompanyLogo} alt="A to Z Consultancy" />
          </div>

          <div className="journal-view-identity__copy">
            <span className="journal-view-eyebrow">
              <i className="fas fa-book-open" aria-hidden="true" />
              Journal voucher
            </span>
            <h2>{journal.journal_type || "Journal"} Voucher</h2>
            <p>{journal.journal_description || "No journal description was provided."}</p>

            <div className="journal-view-badges">
              <span className="journal-view-badge journal-view-badge--brand">
                <i className="fas fa-hashtag" aria-hidden="true" />
                {reference}
              </span>
              <span
                className={`journal-view-badge ${
                  isBalanced
                    ? "journal-view-badge--success"
                    : "journal-view-badge--danger"
                }`}
              >
                <i
                  className={`fas ${isBalanced ? "fa-circle-check" : "fa-triangle-exclamation"}`}
                  aria-hidden="true"
                />
                {isBalanced ? "Balanced" : "Out of balance"}
              </span>
              <span className="journal-view-badge journal-view-badge--neutral">
                <i className="fas fa-coins" aria-hidden="true" />
                {journal.journal_currency || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="journal-view-actions" aria-label="Journal actions">
          <button
            type="button"
            className="journal-view-action journal-view-action--secondary"
            onClick={() => navigate("/journal/home")}
          >
            <i className="fas fa-arrow-left" aria-hidden="true" />
            <span>Back to journals</span>
          </button>

          <button
            type="button"
            className="journal-view-action journal-view-action--primary"
            onClick={() =>
              navigate(`/journal/edit/${journal.journal_id}`, { state: { journal } })
            }
          >
            <i className="fas fa-pen-to-square" aria-hidden="true" />
            <span>Edit journal</span>
          </button>

          <button
            type="button"
            className="journal-view-action journal-view-action--duplicate"
            onClick={() => navigate(`/journal/create?duplicate=${encodeURIComponent(journal.journal_id)}`)}
          >
            <i className="fas fa-copy" aria-hidden="true" />
            <span>Duplicate journal</span>
          </button>

          <button
            type="button"
            className="journal-view-action journal-view-action--print"
            onClick={handlePrintJournal}
            disabled={isPrinting}
          >
            <i
              className={`fas ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`}
              aria-hidden="true"
            />
            <span>{isPrinting ? "Preparing…" : "Print PDF"}</span>
          </button>

          <PDFDownloadLink
            document={<DownloadJournal journal={journal} />}
            className="journal-view-action journal-view-action--download"
            fileName={`${journal?.journal_type || "Journal"} Voucher ${journal?.journal_id || ""}.pdf`}
          >
            <i className="fas fa-file-pdf" aria-hidden="true" />
            <span>Download PDF</span>
          </PDFDownloadLink>
        </div>
      </header>

      <div className="journal-view-highlight-grid">
        <article className="journal-view-highlight">
          <span className="journal-view-highlight__icon">
            <i className="fas fa-calendar-day" aria-hidden="true" />
          </span>
          <div>
            <span>Transaction date</span>
            <strong>{formatDateLong(journal.journal_date) || "Not recorded"}</strong>
          </div>
        </article>

        <article className="journal-view-highlight">
          <span className="journal-view-highlight__icon">
            <i className="fas fa-money-bill-transfer" aria-hidden="true" />
          </span>
          <div>
            <span>Transaction type</span>
            <strong>{journal.transaction_type || "Not recorded"}</strong>
          </div>
        </article>

        <article className="journal-view-highlight">
          <span className="journal-view-highlight__icon">
            <i className="fas fa-briefcase" aria-hidden="true" />
          </span>
          <div>
            <span>Cost centre</span>
            <strong>{journal.cost_center || "Not assigned"}</strong>
          </div>
        </article>

        <article className="journal-view-highlight">
          <span className="journal-view-highlight__icon">
            <i className="fas fa-list" aria-hidden="true" />
          </span>
          <div>
            <span>Journal lines</span>
            <strong>{items.length} {items.length === 1 ? "entry" : "entries"}</strong>
          </div>
        </article>
      </div>

      <section className="journal-view-section journal-view-lines-section">
        <div className="journal-view-section-heading">
          <div className="journal-view-section-heading__copy">
            <span className="journal-view-section-heading__icon">
              <i className="fas fa-table-list" aria-hidden="true" />
            </span>
            <div>
              <h3>Journal entries</h3>
              <p>Debit and credit postings recorded against this voucher.</p>
            </div>
          </div>
          <span className="journal-view-section-heading__count">
            Showing {Math.min(visibleLineCount, items.length)} of {items.length}
          </span>
        </div>

        <div className="journal-view-table-shell">
          <div className="journal-view-table-scroll">
            <table className="journal-view-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Ledger</th>
                  <th scope="col">Description</th>
                  <th scope="col">Posting date</th>
                  <th scope="col">D / C</th>
                  <th scope="col">Currency</th>
                  <th scope="col" className="is-numeric">Amount</th>
                  <th scope="col" className="is-numeric">NGN equivalent</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="journal-view-table__empty">
                      No journal lines were returned for this voucher.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map((row, index) => {
                    const debitFcy = toNumber(row.debit);
                    const creditFcy = toNumber(row.credit);
                    const debitNgn = toNumber(row.debit_ngn);
                    const creditNgn = toNumber(row.credit_ngn);
                    const hasForeignAmount = debitFcy > 0 || creditFcy > 0;
                    const debitAmount = hasForeignAmount ? debitFcy : debitNgn;
                    const creditAmount = hasForeignAmount ? creditFcy : creditNgn;
                    const side = debitAmount > 0 ? "D" : "C";
                    const amount = debitAmount > 0 ? debitAmount : creditAmount;
                    const ngnAmount = debitNgn > 0 ? debitNgn : creditNgn;
                    const currency = row.journal_currency || journal.journal_currency || "NGN";

                    return (
                      <tr key={row.id || `${row.ledger_number}-${index}`}>
                        <td className="journal-view-table__index">{index + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="journal-view-ledger-link"
                            onClick={() => handleLedgerNavigation(row.ledger_number)}
                            disabled={!row.ledger_number}
                          >
                            <strong>{row.ledger_name || "Unnamed ledger"}</strong>
                            <span>
                              {row.ledger_number || "No number"}
                              {row.ledger_type ? ` · ${row.ledger_type}` : ""}
                            </span>
                          </button>
                        </td>
                        <td className="journal-view-table__description">
                          {row.journal_description || journal.journal_description || "—"}
                        </td>
                        <td>
                          <span className="journal-view-date-cell">
                            <strong>{formatDateLong(row.journal_date || journal.journal_date) || "—"}</strong>
                            {row.rate_date && (
                              <span>Rate: {formatDateLong(row.rate_date) || row.rate_date}</span>
                            )}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`journal-view-side journal-view-side--${
                              side === "D" ? "debit" : "credit"
                            }`}
                          >
                            {side}
                          </span>
                        </td>
                        <td>
                          <span className="journal-view-currency-chip">{currency}</span>
                        </td>
                        <td className="is-numeric journal-view-table__amount">
                          {formatCurrencyDecimals(amount, currency)}
                        </td>
                        <td className="is-numeric journal-view-table__amount">
                          {formatCurrencyDecimals(ngnAmount, "NGN")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {hasMoreLines && (
            <div className="journal-view-table-footer">
              <button
                type="button"
                className="journal-view-load-more"
                onClick={() => setVisibleLineCount((count) => count + PAGE_SIZE)}
              >
                <i className="fas fa-chevron-down" aria-hidden="true" />
                Show more entries
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="journal-view-bottom-grid">
        <section className="journal-view-panel">
          <div className="journal-view-panel__heading">
            <span className="journal-view-panel__heading-icon">
              <i className="fas fa-scale-balanced" aria-hidden="true" />
            </span>
            <div>
              <h3>Financial summary</h3>
              <p>Compact debit and credit totals for the voucher.</p>
            </div>
          </div>

          <div className="journal-view-financial-grid">
            <article className="journal-view-total-card">
              <span>NGN debit</span>
              <strong>{formatWithDecimals(ngnDebit)}</strong>
            </article>
            <article className="journal-view-total-card">
              <span>NGN credit</span>
              <strong>{formatWithDecimals(ngnCredit)}</strong>
            </article>
            <article className="journal-view-total-card">
              <span>FCY debit</span>
              <strong>{formatWithDecimals(fcyDebit)}</strong>
            </article>
            <article className="journal-view-total-card">
              <span>FCY credit</span>
              <strong>{formatWithDecimals(fcyCredit)}</strong>
            </article>
          </div>

          <div
            className={`journal-view-balance-bar ${
              isBalanced ? "is-balanced" : "is-unbalanced"
            }`}
          >
            <span className="journal-view-balance-bar__icon" aria-hidden="true">
              <i className={`fas ${isBalanced ? "fa-check" : "fa-triangle-exclamation"}`} />
            </span>
            <div>
              <strong>{isBalanced ? "Journal is balanced" : "Journal requires review"}</strong>
              <span>
                NGN difference: {formatWithDecimals(ngnDifference)} · FCY difference:{" "}
                {formatWithDecimals(fcyDifference)}
              </span>
            </div>
          </div>
        </section>

        <section className="journal-view-panel">
          <div className="journal-view-panel__heading">
            <span className="journal-view-panel__heading-icon">
              <i className="fas fa-clock-rotate-left" aria-hidden="true" />
            </span>
            <div>
              <h3>Journal history</h3>
              <p>Only the key creation and update details are shown.</p>
            </div>
          </div>

          <div className="journal-view-audit-grid">
            <AuditItem
              icon="fa-user-plus"
              label="Prepared by"
              value={journal.created_by}
            />
            <AuditItem
              icon="fa-calendar-plus"
              label="Created at"
              value={formatDateTime(journal.created_at)}
            />
            <AuditItem
              icon="fa-user-pen"
              label="Last updated by"
              value={journal.updated_by}
            />
            <AuditItem
              icon="fa-calendar-check"
              label="Last updated at"
              value={formatDateTime(journal.updated_at)}
            />
          </div>
        </section>
      </div>
    </motion.section>
  );
};

export default ViewJournalContent;
