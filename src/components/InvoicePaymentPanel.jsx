import React from "react";
import { useNavigate } from "react-router-dom";
import "../pages/invoice/InvoiceWorkflow.css";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatRate = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
};

const InvoicePaymentPanel = ({ invoice, onRecordPayment, onReversePayment }) => {
  const navigate = useNavigate();
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  const summary = invoice?.payment_summary || {};
  const invoiceCurrency = String(invoice?.currency || "—").toUpperCase();
  const total = Number(summary.invoice_total ?? invoice?.invoice_amount ?? 0);
  const paid = Number(summary.amount_paid ?? invoice?.paid ?? 0);
  const balance = Number(summary.balance_due ?? Math.max(total - paid, 0));
  const progress = Number(
    summary.payment_progress ?? (total > 0 ? Math.min(100, (paid / total) * 100) : 0)
  );
  const workflowLocked = ["Cancelled", "Void"].includes(invoice?.workflow_status);
  const canRecord = !workflowLocked && balance > 0.009;

  return (
    <section className="invoice-payment-card">
      <header className="invoice-payment-card__header">
        <div>
          <span className="invoice-payment-card__eyebrow">Collections</span>
          <h3>Payments and outstanding balance</h3>
          <p>Receipts may be recorded in a different currency from the invoice and remain visible for audit purposes.</p>
        </div>
        <button type="button" onClick={onRecordPayment} disabled={!canRecord}>
          <span className="fas fa-wallet" aria-hidden="true" />
          <span>{balance <= 0.009 ? "Fully paid" : "Record payment"}</span>
        </button>
      </header>

      <div className="invoice-payment-card__summary-grid">
        <article>
          <span>Invoice total</span>
          <strong><small>{invoiceCurrency}</small>{formatMoney(total)}</strong>
        </article>
        <article className="is-paid">
          <span>Invoice amount settled</span>
          <strong><small>{invoiceCurrency}</small>{formatMoney(paid)}</strong>
        </article>
        <article className={balance > 0.009 ? "is-balance" : "is-settled"}>
          <span>Balance due</span>
          <strong><small>{invoiceCurrency}</small>{formatMoney(balance)}</strong>
        </article>
      </div>

      <div className="invoice-payment-card__progress" aria-label={`${progress}% of invoice paid`}>
        <div className="invoice-payment-card__progress-topline">
          <span>Collection progress</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="invoice-payment-card__progress-track">
          <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </div>

      <div className="invoice-payment-card__history-head">
        <div>
          <h4>Payment register</h4>
          <p>{payments.length} {payments.length === 1 ? "receipt" : "receipts"} recorded</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="invoice-payment-card__empty">
          <span className="fas fa-receipt" aria-hidden="true" />
          <strong>No payments recorded</strong>
          <p>Use Record Payment when a receipt is received from the client.</p>
        </div>
      ) : (
        <div className="invoice-payment-list">
          {payments.map((payment) => {
            const reversed = payment.is_reversed || payment.status === "Reversed";
            const paymentCurrency = String(
              payment.payment_currency || payment.currency || invoiceCurrency
            ).toUpperCase();
            const paymentAmountReceived = Number(
              payment.payment_amount_received ?? payment.amount ?? 0
            );
            const settledCurrency = String(
              payment.invoice_currency || payment.allocation_currency || invoiceCurrency
            ).toUpperCase();
            const invoiceAmountSettled = Number(
              payment.invoice_amount_settled ?? payment.allocated_amount ?? 0
            );
            const mixedCurrency = paymentCurrency !== settledCurrency;
            const journalValidated = Boolean(
              payment.journal_is_validated ||
                String(payment.journal_validation_status || "").toLowerCase() === "validated"
            );
            const journalPending = !reversed && !journalValidated;
            const journalOrigin = String(payment.journal_origin || "");
            const realizedGain = Number(payment.realized_fx_gain_ngn || 0);
            const realizedLoss = Number(payment.realized_fx_loss_ngn || 0);
            const hasSettlementAccounting = payment.settlement_value_ngn !== null && payment.settlement_value_ngn !== undefined;

            return (
              <article
                className={`invoice-payment-item ${reversed ? "is-reversed" : ""}`}
                key={payment.id}
              >
                <div className="invoice-payment-item__icon">
                  <span
                    className={`fas ${reversed ? "fa-rotate-left" : "fa-arrow-down"}`}
                    aria-hidden="true"
                  />
                </div>

                <div className="invoice-payment-item__main">
                  <div className="invoice-payment-item__topline">
                    <div>
                      <strong>{payment.payment_code}</strong>
                      <span
                        className={`invoice-payment-item__status ${
                          reversed
                            ? "is-reversed"
                            : journalPending
                              ? "is-pending"
                              : "is-active"
                        }`}
                      >
                        {reversed
                          ? "Reversed"
                          : journalPending
                            ? "Journal pending"
                            : `${journalOrigin || "Receipt"} journal`}
                      </span>
                    </div>
                    <strong className="invoice-payment-item__amount">
                      <small>{paymentCurrency}</small>{formatMoney(paymentAmountReceived)}
                    </strong>
                  </div>

                  <div className="invoice-payment-item__allocation">
                    <span>
                      <i className="fas fa-file-invoice-dollar" aria-hidden="true" />
                      Clears <strong>{settledCurrency} {formatMoney(invoiceAmountSettled)}</strong>
                    </span>
                    {mixedCurrency && Number(payment.cross_currency_rate || 0) > 0 ? (
                      <span>
                        <i className="fas fa-arrow-right-arrow-left" aria-hidden="true" />
                        1 {settledCurrency} = {formatRate(payment.cross_currency_rate)} {paymentCurrency}
                      </span>
                    ) : null}
                    {payment.payment_rate_date ? (
                      <span>
                        <i className="fas fa-calendar-check" aria-hidden="true" />
                        Rate date {formatDate(payment.payment_rate_date)}
                      </span>
                    ) : null}
                  </div>

                  <div className="invoice-payment-item__meta">
                    <span><i className="fas fa-calendar" aria-hidden="true" />{formatDate(payment.payment_date)}</span>
                    <span><i className="fas fa-money-check-dollar" aria-hidden="true" />{payment.payment_method}</span>
                    {payment.bank_name ? (
                      <span><i className="fas fa-building-columns" aria-hidden="true" />{payment.bank_name} · {payment.account_number}</span>
                    ) : null}
                    {payment.transaction_reference ? (
                      <span><i className="fas fa-hashtag" aria-hidden="true" />{payment.transaction_reference}</span>
                    ) : null}
                  </div>

                  {payment.journal_id ? (
                    <div className="invoice-payment-item__journal-links">
                      <button type="button" onClick={() => navigate(`/journal/view/${payment.journal_id}`)}>
                        <i className="fas fa-book" aria-hidden="true" /> Receipt journal #{payment.journal_id}
                      </button>
                      {payment.reversal_journal_id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/journal/view/${payment.reversal_journal_id}`)}
                        >
                          <i className="fas fa-rotate-left" aria-hidden="true" /> Reversal journal #{payment.reversal_journal_id}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {journalPending ? (
                    <div className="invoice-payment-item__journal-pending-note">
                      <i className="fas fa-circle-info" aria-hidden="true" />
                      <span>The payment is allocated, but its settlement journal has not yet been validated and linked.</span>
                    </div>
                  ) : null}

                  {hasSettlementAccounting ? (
                    <div className="invoice-payment-item__fx-details">
                      <span>
                        <small>Settlement value</small>
                        <strong>NGN {formatMoney(payment.settlement_value_ngn)}</strong>
                        <em>{paymentCurrency} rate {formatRate(payment.payment_currency_rate_ngn || payment.settlement_rate)}</em>
                      </span>
                      <span>
                        <small>Carrying value cleared</small>
                        <strong>NGN {formatMoney(payment.carrying_value_settled_ngn)}</strong>
                        <em>Carrying rate {formatRate(payment.carrying_rate)}</em>
                      </span>
                      {realizedGain > 0 ? (
                        <span className="is-gain">
                          <small>{journalValidated ? "Posted realized FX gain" : "Expected realized FX gain"}</small>
                          <strong>NGN {formatMoney(realizedGain)}</strong>
                          <em>{journalValidated ? `Ledger ${payment.realized_fx_ledger_number}` : "Awaiting validated journal"}</em>
                        </span>
                      ) : realizedLoss > 0 ? (
                        <span className="is-loss">
                          <small>{journalValidated ? "Posted realized FX loss" : "Expected realized FX loss"}</small>
                          <strong>NGN {formatMoney(realizedLoss)}</strong>
                          <em>{journalValidated ? `Ledger ${payment.realized_fx_ledger_number}` : "Awaiting validated journal"}</em>
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {payment.notes ? <p>{payment.notes}</p> : null}
                  {reversed && payment.reversal_reason ? (
                    <div className="invoice-payment-item__reversal-note">
                      <strong>Reversal reason:</strong> {payment.reversal_reason}
                    </div>
                  ) : null}
                  <small className="invoice-payment-item__user">
                    {reversed
                      ? `Reversed by ${payment.reversed_by_email || "—"}`
                      : `Recorded by ${payment.recorded_by_email || "—"}`}
                  </small>
                </div>

                {!reversed ? (
                  <button
                    type="button"
                    className="invoice-payment-item__reverse"
                    onClick={() => onReversePayment(payment)}
                  >
                    <span className="fas fa-rotate-left" aria-hidden="true" />
                    Reverse
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default InvoicePaymentPanel;
