import React from "react";
import { useNavigate } from "react-router-dom";
import "../pages/invoice/InvoiceWorkflow.css";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
  const currency = invoice?.currency || "—";
  const total = Number(summary.invoice_total ?? invoice?.invoice_amount ?? 0);
  const paid = Number(summary.amount_paid ?? invoice?.paid ?? 0);
  const balance = Number(summary.balance_due ?? Math.max(total - paid, 0));
  const progress = Number(summary.payment_progress ?? (total > 0 ? Math.min(100, (paid / total) * 100) : 0));
  const workflowLocked = ["Cancelled", "Void"].includes(invoice?.workflow_status);
  const canRecord = !workflowLocked && balance > 0.009;

  return (
    <section className="invoice-payment-card">
      <header className="invoice-payment-card__header">
        <div>
          <span className="invoice-payment-card__eyebrow">Collections</span>
          <h3>Payments and outstanding balance</h3>
          <p>Every receipt is allocated to this invoice and remains visible for audit purposes.</p>
        </div>
        <button type="button" onClick={onRecordPayment} disabled={!canRecord}>
          <span className="fas fa-wallet" aria-hidden="true" />
          <span>{balance <= 0.009 ? "Fully paid" : "Record payment"}</span>
        </button>
      </header>

      <div className="invoice-payment-card__summary-grid">
        <article>
          <span>Invoice total</span>
          <strong><small>{currency}</small>{formatMoney(total)}</strong>
        </article>
        <article className="is-paid">
          <span>Amount received</span>
          <strong><small>{currency}</small>{formatMoney(paid)}</strong>
        </article>
        <article className={balance > 0.009 ? "is-balance" : "is-settled"}>
          <span>Balance due</span>
          <strong><small>{currency}</small>{formatMoney(balance)}</strong>
        </article>
      </div>

      <div className="invoice-payment-card__progress" aria-label={`${progress}% of invoice paid`}>
        <div className="invoice-payment-card__progress-topline">
          <span>Collection progress</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="invoice-payment-card__progress-track"><i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>
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
            return (
              <article className={`invoice-payment-item ${reversed ? "is-reversed" : ""}`} key={payment.id}>
                <div className="invoice-payment-item__icon">
                  <span className={`fas ${reversed ? "fa-rotate-left" : "fa-arrow-down"}`} aria-hidden="true" />
                </div>
                <div className="invoice-payment-item__main">
                  <div className="invoice-payment-item__topline">
                    <div>
                      <strong>{payment.payment_code}</strong>
                      <span className={`invoice-payment-item__status ${reversed ? "is-reversed" : "is-active"}`}>{reversed ? "Reversed" : "Allocated"}</span>
                    </div>
                    <strong className="invoice-payment-item__amount"><small>{payment.currency}</small>{formatMoney(payment.allocated_amount || payment.amount)}</strong>
                  </div>
                  <div className="invoice-payment-item__meta">
                    <span><i className="fas fa-calendar" aria-hidden="true" />{formatDate(payment.payment_date)}</span>
                    <span><i className="fas fa-money-check-dollar" aria-hidden="true" />{payment.payment_method}</span>
                    {payment.bank_name ? <span><i className="fas fa-building-columns" aria-hidden="true" />{payment.bank_name} · {payment.account_number}</span> : null}
                    {payment.transaction_reference ? <span><i className="fas fa-hashtag" aria-hidden="true" />{payment.transaction_reference}</span> : null}
                  </div>
                  {payment.journal_id ? (
                    <div className="invoice-payment-item__journal-links">
                      <button type="button" onClick={() => navigate(`/journal/view/${payment.journal_id}`)}>
                        <i className="fas fa-book" aria-hidden="true" /> Receipt journal #{payment.journal_id}
                      </button>
                      {payment.reversal_journal_id ? (
                        <button type="button" onClick={() => navigate(`/journal/view/${payment.reversal_journal_id}`)}>
                          <i className="fas fa-rotate-left" aria-hidden="true" /> Reversal journal #{payment.reversal_journal_id}
                        </button>
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
                  <button type="button" className="invoice-payment-item__reverse" onClick={() => onReversePayment(payment)}>
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
