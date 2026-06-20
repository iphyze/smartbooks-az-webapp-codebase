import React, { useMemo, useState } from "react";
import api from "../services/api";
import useToastStore from "../stores/useToastStore";
import "../pages/invoice/InvoiceWorkflow.css";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InvoiceReminderPanel = ({ invoice, onCreateReminder, onRefresh }) => {
  const { showToast } = useToastStore();
  const [cancellingId, setCancellingId] = useState(null);
  const reminders = Array.isArray(invoice?.reminders) ? invoice.reminders : [];
  const scheduled = useMemo(
    () => reminders.filter((item) => item.delivery_status === "Scheduled"),
    [reminders]
  );
  const recent = useMemo(
    () => reminders.filter((item) => item.delivery_status !== "Scheduled").slice(0, 3),
    [reminders]
  );
  const workflowLocked = ["Cancelled", "Void"].includes(invoice?.workflow_status);
  const balance = Number(invoice?.payment_summary?.balance_due ?? Math.max(Number(invoice?.invoice_amount || 0) - Number(invoice?.paid || 0), 0));
  const canRemind = !workflowLocked && balance > 0.009;

  const cancelReminder = async (reminder) => {
    if (cancellingId) return;
    setCancellingId(reminder.id);
    try {
      const response = await api.post("/invoice/cancel-reminder", {
        reminder_id: reminder.id,
        reason: "Cancelled from the invoice view.",
      });
      showToast(response.data?.message || "Reminder cancelled", "success");
      await onRefresh?.();
    } catch (error) {
      showToast(error.response?.data?.message || "The reminder could not be cancelled.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section className="invoice-reminder-card">
      <header className="invoice-reminder-card__header">
        <div className="invoice-reminder-card__heading">
          <span className="invoice-reminder-card__icon fas fa-bell" aria-hidden="true" />
          <div>
            <span className="invoice-reminder-card__eyebrow">Payment follow-up</span>
            <h3>Client payment reminders</h3>
            <p>Send a professional reminder now or schedule one for later.</p>
          </div>
        </div>
        <button type="button" onClick={onCreateReminder} disabled={!canRemind}>
          <span className="fas fa-bell" aria-hidden="true" />
          <span>{balance <= 0.009 ? "Fully paid" : "New reminder"}</span>
        </button>
      </header>

      <div className="invoice-reminder-card__summary">
        <article>
          <span>Client email</span>
          <strong>{invoice?.clients_data?.clients_email || "Not provided"}</strong>
        </article>
        <article>
          <span>Scheduled</span>
          <strong>{scheduled.length}</strong>
        </article>
        <article>
          <span>Last reminder</span>
          <strong>{recent[0] ? formatDateTime(recent[0].sent_at || recent[0].updated_at) : "None yet"}</strong>
        </article>
      </div>

      {scheduled.length > 0 ? (
        <div className="invoice-reminder-card__scheduled">
          <div className="invoice-reminder-card__section-title">
            <div>
              <h4>Upcoming reminders</h4>
              <p>Scheduled reminders are sent by the Smartbooks reminder task.</p>
            </div>
          </div>
          <div className="invoice-reminder-list">
            {scheduled.map((reminder) => (
              <article key={reminder.id} className="invoice-reminder-item">
                <span className="invoice-reminder-item__icon fas fa-calendar-check" aria-hidden="true" />
                <div>
                  <strong>{reminder.reminder_kind} reminder</strong>
                  <span>{formatDateTime(reminder.scheduled_for)} · {reminder.recipient_email}</span>
                  <small>{reminder.subject}</small>
                </div>
                <button type="button" onClick={() => cancelReminder(reminder)} disabled={cancellingId === reminder.id}>
                  <span className={`fas ${cancellingId === reminder.id ? "fa-spinner fa-spin" : "fa-times"}`} aria-hidden="true" />
                  Cancel
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="invoice-reminder-card__empty">
          <span className="fas fa-clock" aria-hidden="true" />
          <div>
            <strong>No reminder is currently scheduled</strong>
            <p>Create one when the invoice is approaching or has passed its due date.</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default InvoiceReminderPanel;
