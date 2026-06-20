import React, { useEffect, useState } from "react";
import api from "../services/api";
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

const iconForType = (type) => {
  switch (type) {
    case "email": return "fa-envelope-circle-check";
    case "error": return "fa-triangle-exclamation";
    case "payment": return "fa-coins";
    case "reminder": return "fa-bell";
    case "reminder-error": return "fa-bell-slash";
    case "reminder-cancelled": return "fa-calendar-xmark";
    case "reminder-scheduled": return "fa-calendar-check";
    default: return "fa-arrows-rotate";
  }
};

const InvoiceActivityTimeline = ({ invoiceNumber, initialActivities = [], initialMeta = {} }) => {
  const [activities, setActivities] = useState(initialActivities);
  const [meta, setMeta] = useState({ page: 1, limit: 8, total: initialActivities.length, has_more: false, ...initialMeta });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setActivities(initialActivities);
    setMeta({ page: 1, limit: 8, total: initialActivities.length, has_more: false, ...initialMeta });
    setLoadError("");
  }, [invoiceNumber, initialActivities, initialMeta]);

  const loadOlderActivity = async () => {
    if (!invoiceNumber || isLoadingMore || !meta.has_more) return;
    setIsLoadingMore(true);
    setLoadError("");
    try {
      const nextPage = Number(meta.page || 1) + 1;
      const response = await api.get(`/invoice/activity?invoice_number=${encodeURIComponent(invoiceNumber)}&page=${nextPage}&limit=${meta.limit || 8}`);
      const rows = response.data?.data || [];
      setActivities((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...rows.filter((item) => !seen.has(item.id))];
      });
      setMeta(response.data?.meta || { ...meta, page: nextPage, has_more: false });
    } catch (error) {
      setLoadError(error.response?.data?.message || "Older activity could not be loaded.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <section className="invoice-activity-card">
      <header className="invoice-activity-card__header">
        <div>
          <span className="invoice-activity-card__eyebrow">Invoice trail</span>
          <h3>Activity and delivery history</h3>
          <p>The newest activity is shown first. Older entries load only when requested.</p>
        </div>
        <span className="invoice-activity-card__count">{meta.total || activities.length} {(meta.total || activities.length) === 1 ? "event" : "events"}</span>
      </header>

      {activities.length === 0 ? (
        <div className="invoice-activity-card__empty">
          <span className="fas fa-clock-rotate-left" aria-hidden="true" />
          <p>No invoice activity has been recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="invoice-activity-list">
            {activities.map((activity) => {
              const note = String(activity.note || "");
              const compactNote = note.length > 240 ? `${note.slice(0, 237)}…` : note;
              return (
                <article className={`invoice-activity-item invoice-activity-item--${activity.type}`} key={activity.id}>
                  <span className={`invoice-activity-item__icon fas ${iconForType(activity.type)}`} aria-hidden="true" />
                  <div className="invoice-activity-item__content">
                    <div className="invoice-activity-item__topline">
                      <strong>{activity.title}</strong>
                      <time>{formatDateTime(activity.date)}</time>
                    </div>
                    <p>{activity.description}</p>
                    {compactNote ? <small title={note}>{compactNote}</small> : null}
                    {activity.user ? <span className="invoice-activity-item__user">By {activity.user}</span> : null}
                  </div>
                </article>
              );
            })}
          </div>

          {meta.has_more ? (
            <div className="invoice-activity-card__load-more">
              <button type="button" onClick={loadOlderActivity} disabled={isLoadingMore}>
                <span className={`fas ${isLoadingMore ? "fa-spinner fa-spin" : "fa-clock-rotate-left"}`} aria-hidden="true" />
                {isLoadingMore ? "Loading older activity…" : `Show older activity (${Math.max(Number(meta.total || 0) - activities.length, 0)} remaining)`}
              </button>
            </div>
          ) : activities.length > 0 ? (
            <div className="invoice-activity-card__end">You have reached the beginning of this invoice trail.</div>
          ) : null}
          {loadError ? <div className="invoice-activity-card__load-error">{loadError}</div> : null}
        </>
      )}
    </section>
  );
};

export default InvoiceActivityTimeline;
