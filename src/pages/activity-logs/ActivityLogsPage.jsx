import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../Header";
import NavBar from "../NavBar";
import PageNav from "../../components/PageNav";
import ChartSearchableSelect from "../../components/ChartSearchableSelect";
import TableLoaderComponent from "../../components/TableLoaderComponent";
import EmptyTable from "../../components/EmptyTable";
import useThemeStore from "../../stores/useThemeStore";
import useToastStore from "../../stores/useToastStore";
import useActivityLogsStore from "../../stores/useActivityLogsStore";
import { fadeInUp } from "../../utils/animation";
import "./ActivityLogsPage.css";

const MODULE_ICONS = {
  Journals: "fa-book",
  Invoices: "fa-file-invoice-dollar",
  "Bank Reconciliation": "fa-scale-balanced",
  Banks: "fa-building-columns",
  Ledgers: "fa-book-open",
  "Accounting Controls": "fa-lock",
  Clients: "fa-address-book",
  Projects: "fa-diagram-project",
  Staff: "fa-id-badge",
  Timesheets: "fa-clock",
  "Exchange Rates": "fa-arrow-right-arrow-left",
  "Users & Access": "fa-users-gear",
  Authentication: "fa-shield-halved",
  General: "fa-wave-square",
};

const ACTION_LABELS = {
  login: "Signed in",
  logout: "Signed out",
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  reverse: "Reversed",
  send: "Sent",
  lock: "Locked",
  unlock: "Unlocked",
  activity: "Activity",
};

const toApiDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromApiDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

const formatDateTime = (value) => {
  if (!value) return { date: "—", time: "" };
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return { date: value, time: "" };
  return {
    date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const deviceLabel = (agent = "") => {
  if (!agent) return "Device not captured";
  const browser = /Edg\//i.test(agent) ? "Edge" : /Chrome\//i.test(agent) ? "Chrome" : /Firefox\//i.test(agent) ? "Firefox" : /Safari\//i.test(agent) ? "Safari" : "Browser";
  const device = /Android|iPhone|iPad|Mobile/i.test(agent) ? "Mobile" : "Desktop";
  return `${device} · ${browser}`;
};

const prettyJson = (value) => {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) return null;
  return JSON.stringify(value, null, 2);
};

const ActivityLogsPage = () => {
  const [nav, setNav] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const { theme } = useThemeStore();
  const { showToast } = useToastStore();
  const {
    items, meta, summary, filterOptions, filters, loading, exporting, error,
    setFilter, setFilters, resetFilters, fetchLogs, exportLogs,
  } = useActivityLogsStore();

  useEffect(() => {
    document.title = "Smartbooks | Activity Logs";
    setSearchInput(filters.search || "");
    fetchLogs().catch(() => {});
  }, []);

  const moduleOptions = useMemo(() => [
    { id: "all", label: "All modules" },
    ...(filterOptions.modules || []).map((module) => ({ id: module, label: module })),
  ], [filterOptions.modules]);

  const actionOptions = useMemo(() => [
    { id: "all", label: "All actions" },
    ...(filterOptions.action_types || []).map((action) => ({ id: action, label: ACTION_LABELS[action] || action })),
  ], [filterOptions.action_types]);

  const userOptions = useMemo(() => [
    { id: 0, label: "All users" },
    ...(filterOptions.users || []).map((user) => ({ id: Number(user.id), label: user.label || `User ${user.id}` })),
  ], [filterOptions.users]);

  const limitOptions = [10, 15, 25, 50, 100].map((value) => ({ id: value, label: String(value) }));
  const hasFilters = Boolean(filters.search || filters.module !== "all" || filters.action_type !== "all" || filters.user_id || filters.date_from || filters.date_to);

  const runSearch = () => {
    setFilters({ search: searchInput.trim(), page: 1 });
    fetchLogs({ search: searchInput.trim(), page: 1 }).catch(() => {});
  };

  const applyFilter = (name, value) => {
    setFilter(name, value);
    fetchLogs({ [name]: value, page: 1 }).catch(() => {});
  };

  const handleReset = () => {
    resetFilters();
    setSearchInput("");
    fetchLogs({
      search: "", module: "all", action_type: "all", user_id: 0,
      date_from: "", date_to: "", page: 1, limit: 15,
    }).catch(() => {});
  };

  const handleExport = async () => {
    try {
      await exportLogs();
      showToast("Activity logs exported successfully.", "success");
    } catch {
      showToast("Unable to export activity logs.", "error");
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > meta.pages || page === meta.page) return;
    setFilter("page", page, false);
    fetchLogs({ page }).catch(() => {});
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.pages, start + 4);
    if (start > 1) pages.push(1, ...(start > 2 ? ["..."] : []));
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < meta.pages) pages.push(...(end < meta.pages - 1 ? ["..."] : []), meta.pages);
    return pages;
  }, [meta.page, meta.pages]);

  return (
    <div className={`main-container theme-${theme}`}>
      <Header setNav={setNav} nav={nav} />
      <NavBar setNav={setNav} nav={nav} />

      <main className={`content-container theme-${theme}`}>
        <div className={`db-root theme-${theme}`}>
          <div className="db-page activity-log-page">
            <PageNav pageTitle="Activity Logs" links={[{ label: "Home", to: "/", active: true }, { label: "Activity Logs", to: "/activity-logs", active: false }]} />

            <motion.section variants={fadeInUp} initial="hidden" animate="show" className="activity-log-hero">
              <div className="activity-log-hero__copy">
                <span className="activity-log-eyebrow"><i className="fas fa-shield-halved" /> Audit trail</span>
                <h2>A clear record of important Smartbooks activity</h2>
                <p>Review who performed an action, where it happened, and the record affected. Audit entries are read-only and cannot be edited or dismissed.</p>
              </div>
              <div className="activity-log-stats">
                <article><span><i className="fas fa-layer-group" /></span><div><strong>{summary.total_all.toLocaleString()}</strong><small>Total events</small></div></article>
                <article><span><i className="fas fa-calendar-day" /></span><div><strong>{summary.today_count.toLocaleString()}</strong><small>Today</small></div></article>
                <article><span><i className="fas fa-users" /></span><div><strong>{summary.active_users.toLocaleString()}</strong><small>Active users · 30d</small></div></article>
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} initial="hidden" animate="show" transition={{ delay: 0.08 }} className="activity-log-workspace">
              <header className="activity-log-toolbar">
                <div className="activity-log-toolbar__heading">
                  <span><i className="fas fa-clock-rotate-left" /></span>
                  <div><h3>System activity</h3><p>{meta.total.toLocaleString()} matching {meta.total === 1 ? "event" : "events"}</p></div>
                </div>
                <button type="button" className="activity-log-export" onClick={handleExport} disabled={exporting || loading}>
                  <i className={`fas ${exporting ? "fa-spinner fa-spin" : "fa-file-csv"}`} />
                  {exporting ? "Preparing export…" : "Export CSV"}
                </button>
              </header>

              <div className="activity-log-filters">
                <div className="activity-log-search">
                  <i className="fas fa-search" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && runSearch()}
                    placeholder="Search actor, action, record or IP address"
                  />
                  <button type="button" onClick={runSearch}>Search</button>
                </div>

                <div className="activity-log-filter-grid">
                  <label><span>Module</span><ChartSearchableSelect options={moduleOptions} value={filters.module} onChange={(value) => applyFilter("module", value)} /></label>
                  <label><span>Action</span><ChartSearchableSelect options={actionOptions} value={filters.action_type} onChange={(value) => applyFilter("action_type", value)} /></label>
                  <label><span>User</span><ChartSearchableSelect options={userOptions} value={Number(filters.user_id || 0)} onChange={(value) => applyFilter("user_id", Number(value))} /></label>
                  <label className="activity-log-date"><span>From</span><div><DatePicker selected={fromApiDate(filters.date_from)} onChange={(date) => applyFilter("date_from", toApiDate(date))} maxDate={fromApiDate(filters.date_to) || new Date()} dateFormat="dd MMM yyyy" placeholderText="Start date" showMonthDropdown showYearDropdown dropdownMode="select" /><i className="fas fa-calendar" /></div></label>
                  <label className="activity-log-date"><span>To</span><div><DatePicker selected={fromApiDate(filters.date_to)} onChange={(date) => applyFilter("date_to", toApiDate(date))} minDate={fromApiDate(filters.date_from) || undefined} maxDate={new Date()} dateFormat="dd MMM yyyy" placeholderText="End date" showMonthDropdown showYearDropdown dropdownMode="select" /><i className="fas fa-calendar" /></div></label>
                  <label><span>Page limit</span><ChartSearchableSelect options={limitOptions} value={Number(filters.limit)} onChange={(value) => applyFilter("limit", Number(value))} /></label>
                </div>

                {hasFilters && <button type="button" className="activity-log-reset" onClick={handleReset}><i className="fas fa-rotate-left" /> Clear filters</button>}
              </div>

              {error && !loading ? <div className="activity-log-error"><i className="fas fa-triangle-exclamation" /><span>{error}</span><button type="button" onClick={() => fetchLogs().catch(() => {})}>Try again</button></div> : null}

              <div className="activity-log-table-shell">
                {loading ? <TableLoaderComponent /> : items.length === 0 ? (
                  <EmptyTable
                    icon="fas fa-clock-rotate-left"
                    message="No activity found"
                    description={hasFilters ? "Try clearing or changing the current filters." : "Recorded Smartbooks activity will appear here."}
                  />
                ) : (
                  <div className="activity-log-table-scroll">
                    <table className="activity-log-table">
                      <thead><tr><th>Date & time</th><th>Actor</th><th>Module</th><th>Action</th><th>Activity</th><th>Origin</th><th aria-label="View details" /></tr></thead>
                      <tbody>
                        {items.map((item) => {
                          const stamp = formatDateTime(item.created_at);
                          return (
                            <tr key={item.id}>
                              <td data-label="Date & time"><strong>{stamp.date}</strong><small>{stamp.time}</small></td>
                              <td data-label="Actor"><div className="activity-log-actor"><span>{(item.actor_name || item.created_by || "S").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><div><strong>{item.actor_name || item.created_by || "System"}</strong><small>{item.actor_role || item.actor_email || "System activity"}</small></div></div></td>
                              <td data-label="Module"><span className="activity-log-module"><i className={`fas ${MODULE_ICONS[item.module] || MODULE_ICONS.General}`} />{item.module}</span></td>
                              <td data-label="Action"><span className={`activity-log-action activity-log-action--${item.action_type}`}>{ACTION_LABELS[item.action_type] || item.action_type}</span></td>
                              <td data-label="Activity"><strong className="activity-log-description">{item.description || item.action}</strong>{item.entity_id ? <small className="activity-log-entity">{item.entity_type || "Record"} · {item.entity_id}</small> : null}</td>
                              <td data-label="Origin"><strong className="activity-log-origin">{item.ip_address || "Not captured"}</strong><small>{deviceLabel(item.user_agent)}</small></td>
                              <td><button type="button" className="activity-log-view" onClick={() => setSelectedLog(item)} title="View activity details"><i className="fas fa-arrow-right" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {!loading && meta.total > 0 && (
                <footer className="activity-log-pagination">
                  <span>Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total.toLocaleString()}</span>
                  <div>
                    <button type="button" onClick={() => goToPage(meta.page - 1)} disabled={meta.page <= 1}><i className="fas fa-chevron-left" /></button>
                    {pageNumbers.map((page, index) => page === "..." ? <span key={`dots-${index}`}>…</span> : <button type="button" key={page} className={page === meta.page ? "is-active" : ""} onClick={() => goToPage(page)}>{page}</button>)}
                    <button type="button" onClick={() => goToPage(meta.page + 1)} disabled={meta.page >= meta.pages}><i className="fas fa-chevron-right" /></button>
                  </div>
                </footer>
              )}
            </motion.section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedLog && (
          <motion.div className="activity-log-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && setSelectedLog(null)}>
            <motion.section className="activity-log-modal" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
              <header><div><span>Audit event #{selectedLog.id}</span><h3>{selectedLog.description || selectedLog.action}</h3></div><button type="button" onClick={() => setSelectedLog(null)} aria-label="Close activity details"><i className="fas fa-times" /></button></header>
              <div className="activity-log-modal__body">
                <div className="activity-log-detail-grid">
                  <article><span>Actor</span><strong>{selectedLog.actor_name || selectedLog.created_by || "System"}</strong><small>{selectedLog.actor_email || selectedLog.actor_role || "—"}</small></article>
                  <article><span>Date & time</span><strong>{formatDateTime(selectedLog.created_at).date}</strong><small>{formatDateTime(selectedLog.created_at).time}</small></article>
                  <article><span>Module</span><strong>{selectedLog.module}</strong><small>{ACTION_LABELS[selectedLog.action_type] || selectedLog.action_type}</small></article>
                  <article><span>Affected record</span><strong>{selectedLog.entity_type || "Not specified"}</strong><small>{selectedLog.entity_id || "—"}</small></article>
                  <article><span>IP address</span><strong>{selectedLog.ip_address || "Not captured"}</strong><small>{deviceLabel(selectedLog.user_agent)}</small></article>
                  <article><span>Request</span><strong>{selectedLog.request_method || "Not captured"}</strong><small>{selectedLog.request_path || "—"}</small></article>
                </div>
                <div className="activity-log-detail-description"><span>Activity description</span><p>{selectedLog.description || selectedLog.action}</p></div>
                {(prettyJson(selectedLog.before_json) || prettyJson(selectedLog.after_json) || prettyJson(selectedLog.metadata_json)) && (
                  <div className="activity-log-json-grid">
                    {prettyJson(selectedLog.before_json) && <article><span>Before</span><pre>{prettyJson(selectedLog.before_json)}</pre></article>}
                    {prettyJson(selectedLog.after_json) && <article><span>After</span><pre>{prettyJson(selectedLog.after_json)}</pre></article>}
                    {prettyJson(selectedLog.metadata_json) && <article><span>Additional context</span><pre>{prettyJson(selectedLog.metadata_json)}</pre></article>}
                  </div>
                )}
              </div>
              <footer><span><i className="fas fa-lock" /> Audit entries are read-only.</span><button type="button" onClick={() => setSelectedLog(null)}>Close</button></footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityLogsPage;
