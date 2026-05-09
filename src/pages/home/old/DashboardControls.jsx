import React, { useState, useRef, useEffect } from "react";

/* ── Helpers ── */
const today    = () => new Date();
const yearStart = () => { const d = new Date(); d.setMonth(0); d.setDate(1); return d; };
const toISO = (d) => {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const parseISO = (s) => s ? new Date(s + "T00:00:00") : null;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ══════════════════════════════════════
   Mini Calendar
══════════════════════════════════════ */
const MiniCalendar = ({ value, onChange, minDate, maxDate, onClose }) => {
  const initial = value || today();
  const [viewYear, setViewYear]   = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (d) => {
    if (!d || !value) return false;
    return value.getDate() === d && value.getMonth() === viewMonth && value.getFullYear() === viewYear;
  };
  const isToday = (d) => {
    if (!d) return false;
    const t = today();
    return t.getDate() === d && t.getMonth() === viewMonth && t.getFullYear() === viewYear;
  };
  const isDisabled = (d) => {
    if (!d) return true;
    const dt = new Date(viewYear, viewMonth, d);
    if (minDate && dt < minDate) return true;
    if (maxDate && dt > maxDate) return true;
    return false;
  };

  const handleDay = (d) => {
    if (!d || isDisabled(d)) return;
    onChange(new Date(viewYear, viewMonth, d));
    onClose?.();
  };

  return (
    <div className="db-cal">
      <div className="db-cal__nav">
        <button className="db-cal__arrow" onClick={prevMonth}><i className="fas fa-chevron-left" /></button>
        <span className="db-cal__heading">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="db-cal__arrow" onClick={nextMonth}><i className="fas fa-chevron-right" /></button>
      </div>
      <div className="db-cal__grid">
        {DAYS.map(d => <div key={d} className="db-cal__dow">{d}</div>)}
        {cells.map((d, i) => (
          <button
            key={i}
            className={`db-cal__day
              ${!d ? "db-cal__day--empty" : ""}
              ${isSelected(d) ? "db-cal__day--sel" : ""}
              ${isToday(d) ? "db-cal__day--today" : ""}
              ${isDisabled(d) ? "db-cal__day--dis" : ""}
            `}
            onClick={() => handleDay(d)}
            disabled={isDisabled(d)}
          >{d || ""}</button>
        ))}
      </div>
      <div className="db-cal__footer">
        <button className="db-cal__today-btn" onClick={() => { onChange(today()); onClose?.(); }}>Today</button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   Date Input
══════════════════════════════════════ */
const DateInput = ({ label, value, onChange, minDate, maxDate }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = value
    ? `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`
    : "Select date";

  return (
    <div className="db-date-input" ref={ref}>
      <button className="db-date-input__btn" onClick={() => setOpen(p => !p)}>
        <i className="fas fa-calendar-days db-date-input__icon" />
        <span className="db-date-input__label">{label}</span>
        <span className={`db-date-input__val ${!value ? "db-date-input__val--empty" : ""}`}>{display}</span>
        <i className={`fas fa-chevron-down db-date-input__chevron ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="db-date-input__pop">
          <MiniCalendar
            value={value}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   DashboardControls
══════════════════════════════════════ */
const DashboardControls = ({
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  onApply, onClear, isFiltered,
  activeCur, onCurChange,
}) => {
  const maxTo = dateFrom ? (() => { const m = new Date(dateFrom); m.setFullYear(m.getFullYear()+1); return m; })() : today();

  return (
    <div className="db-controls">
      <div className="db-controls__dates">
        <DateInput
          label="From"
          value={dateFrom}
          onChange={onDateFromChange}
          maxDate={dateTo || today()}
        />
        <span className="db-controls__sep">
          <i className="fas fa-arrow-right" />
        </span>
        <DateInput
          label="To"
          value={dateTo}
          onChange={onDateToChange}
          minDate={dateFrom}
          maxDate={maxTo}
        />
        <button className="db-controls__apply" onClick={onApply}>
          <i className="fas fa-filter" />
          <span>Apply</span>
        </button>
        {isFiltered && (
          <button className="db-controls__clear" onClick={onClear} title="Reset to year-to-date">
            <i className="fas fa-rotate-left" />
          </button>
        )}
        <span className="db-controls__hint">
          <i className="fas fa-circle-info" /> Max 1-year range
        </span>
      </div>

      <div className="db-cur-tabs db-controls__cur">
        {["NGN","USD","GBP","EUR"].map(c => (
          <button
            key={c}
            className={`db-cur-btn ${activeCur === c ? "active" : ""}`}
            onClick={() => onCurChange(c)}
          >{c}</button>
        ))}
      </div>
    </div>
  );
};

export default DashboardControls;
export { toISO, today, yearStart, parseISO };