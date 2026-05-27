import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '../Header';
import NavBar from '../NavBar';
import PageNav from '../../components/PageNav';
import TableLoaderComponent from '../../components/TableLoaderComponent';
import { DateInput, parseISO, toISO } from '../../components/DashboardControls';
import useThemeStore from '../../stores/useThemeStore';
import useAccountingPeriodStore from '../../stores/useAccountingPeriodStore';
import '../../components/DashboardControls.css';
import './LockPeriod.css';

const EMPTY_FORM = {
  id: null,
  start_date: '',
  end_date: '',
  is_locked: false,
  is_active: true,
  lock_reason: '',
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const PeriodModal = ({ period, saving, onClose, onSave, theme }) => {
  const [form, setForm] = useState(period || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const editing = Boolean(period?.id);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.start_date) nextErrors.start_date = 'Start date is required';
    if (!form.end_date) nextErrors.end_date = 'End date is required';
    if (form.start_date && form.end_date && form.start_date > form.end_date) nextErrors.end_date = 'Must be after start date';
    if (form.is_locked && !form.lock_reason.trim()) nextErrors.lock_reason = 'State why this period is locked';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const succeeded = await onSave({ ...form, lock_reason: form.lock_reason.trim() });
    if (succeeded) onClose();
  };

  return (
    <motion.div className={`lp-modal-backdrop theme-${theme}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.form className="lp-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} initial={{ y: 18, opacity: 0, scale: .98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 12, opacity: 0 }}>
        <div className="lp-modal__header">
          <div>
            <span className="lp-eyebrow">Accounting control</span>
            <h2>{editing ? 'Manage period' : 'New accounting period'}</h2>
          </div>
          <button className="lp-icon-btn" type="button" onClick={onClose} aria-label="Close"><i className="fas fa-xmark" /></button>
        </div>
        <div className="lp-form-grid">
          <div className="lp-field lp-field--date">
            <span>Start date</span>
            <DateInput
              label="From"
              value={parseISO(form.start_date)}
              onChange={(date) => update('start_date', toISO(date))}
              maxDate={parseISO(form.end_date)}
              invalid={Boolean(errors.start_date)}
              placeholder="Choose start date"
            />
            {errors.start_date && <small>{errors.start_date}</small>}
          </div>
          <div className="lp-field lp-field--date">
            <span>End date</span>
            <DateInput
              label="To"
              value={parseISO(form.end_date)}
              onChange={(date) => update('end_date', toISO(date))}
              minDate={parseISO(form.start_date)}
              invalid={Boolean(errors.end_date)}
              placeholder="Choose end date"
            />
            {errors.end_date && <small>{errors.end_date}</small>}
          </div>
        </div>
        <div className="lp-toggles">
          <label className="lp-switch">
            <input type="checkbox" checked={form.is_locked} onChange={(event) => update('is_locked', event.target.checked)} />
            <span className="lp-switch__track"><span /></span>
            <span><strong>{form.is_locked ? 'Locked' : 'Open'}</strong><small>Prevent postings for this date range</small></span>
          </label>
          <label className="lp-switch">
            <input type="checkbox" checked={form.is_active} onChange={(event) => update('is_active', event.target.checked)} />
            <span className="lp-switch__track"><span /></span>
            <span><strong>{form.is_active ? 'Active' : 'Inactive'}</strong><small>Available for operational controls</small></span>
          </label>
        </div>
        <label className="lp-field lp-field--full">
          <span>Lock reason {form.is_locked && <em>Required</em>}</span>
          <textarea value={form.lock_reason} onChange={(event) => update('lock_reason', event.target.value)} placeholder="e.g. Month-end close completed and approved" className={errors.lock_reason ? 'has-error' : ''} rows="3" />
          {errors.lock_reason && <small>{errors.lock_reason}</small>}
        </label>
        <div className="lp-modal__footer">
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="lp-btn lp-btn--primary" type="submit" disabled={saving}>
            {saving ? <><i className="fas fa-circle-notch fa-spin" /> Saving</> : <><i className={`fas ${form.is_locked ? 'fa-lock' : 'fa-check'}`} /> {editing ? 'Save period' : 'Create period'}</>}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
};

const LockPeriodOverview = () => {
  const [nav, setNav] = useState(false);
  const [modalPeriod, setModalPeriod] = useState(undefined);
  const { theme } = useThemeStore();
  const { periods, loading, saving, error, searchQuery, setSearchQuery, fetchPeriods, createPeriod, updatePeriod } = useAccountingPeriodStore();

  useEffect(() => {
    document.title = 'Smartbooks | Lock Period';
    fetchPeriods();
  }, [fetchPeriods]);

  const stats = useMemo(() => ({
    total: periods.length,
    locked: periods.filter((period) => period.is_locked).length,
    open: periods.filter((period) => !period.is_locked).length,
  }), [periods]);

  const handleSave = async (payload) => payload.id ? updatePeriod(payload) : createPeriod(payload);
  const quickToggleLock = (period) => updatePeriod({
    ...period,
    is_locked: !period.is_locked,
    lock_reason: period.lock_reason || 'Period closed for posting control',
  });

  return (
    <div className={`main-container theme-${theme}`}>
      <Header nav={nav} setNav={setNav} />
      <NavBar nav={nav} setNav={setNav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`lp-root theme-${theme}`}>
          <div className="lp-page">
            <PageNav pageTitle="Lock Period" links={[{ label: 'Home', to: '/', active: true }, { label: 'Lock Period', to: '/lock-period/home', active: false }]} />
            <section className="lp-hero">
              <div>
                <span className="lp-eyebrow">Period controls</span>
                <h1>Accounting period management</h1>
                <p>Close completed periods to protect financial integrity and prevent accidental postings.</p>
              </div>
              <button className="lp-btn lp-btn--primary" onClick={() => setModalPeriod(null)}><i className="fas fa-plus" /> New period</button>
            </section>
            <div className="lp-stat-grid">
              <article><i className="fas fa-calendar-days" /><div><strong>{stats.total}</strong><span>Total periods</span></div></article>
              <article className="locked"><i className="fas fa-lock" /><div><strong>{stats.locked}</strong><span>Locked periods</span></div></article>
              <article className="open"><i className="fas fa-lock-open" /><div><strong>{stats.open}</strong><span>Open periods</span></div></article>
            </div>
            <section className="lp-table-card">
              <div className="lp-table-toolbar">
                <div className="lp-search">
                  <i className="fas fa-search" />
                  <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && fetchPeriods()} placeholder="Search dates or reason" autoComplete="off" />
                </div>
                <button className="lp-btn lp-btn--secondary" onClick={fetchPeriods}><i className="fas fa-rotate" /> Refresh</button>
              </div>
              {loading ? <TableLoaderComponent /> : periods.length === 0 ? (
                <div className="lp-empty">
                  <span><i className="fas fa-calendar-plus" /></span>
                  <h3>No accounting periods yet</h3>
                  <p>Create the first period to control when postings are allowed.</p>
                  <button className="lp-btn lp-btn--primary" onClick={() => setModalPeriod(null)}><i className="fas fa-plus" /> New period</button>
                </div>
              ) : (
                <div className="lp-table-overflow"><table className="lp-table"><thead><tr><th>Period</th><th>Status</th><th>Reason</th><th>Last updated</th><th className="lp-table__actions">Actions</th></tr></thead><tbody>
                  {periods.map((period) => (
                    <tr key={period.id}>
                      <td><strong>{formatDate(period.start_date)}</strong><span className="lp-range">to {formatDate(period.end_date)}</span></td>
                      <td><span className={`lp-pill ${period.is_locked ? 'lp-pill--locked' : 'lp-pill--open'}`}><i className={`fas ${period.is_locked ? 'fa-lock' : 'fa-lock-open'}`} /> {period.is_locked ? 'Locked' : 'Open'}</span></td>
                      <td className="lp-reason">{period.lock_reason || '—'}</td>
                      <td>{period.updated_by || period.created_by || '—'}<span className="lp-range">{period.updated_at ? new Date(period.updated_at).toLocaleDateString('en-GB') : '—'}</span></td>
                      <td className="lp-table__actions"><button className="lp-row-btn" onClick={() => setModalPeriod(period)} title="Edit"><i className="fas fa-pen" /></button><button className={`lp-row-btn ${period.is_locked ? 'unlock' : 'lock'}`} disabled={saving} onClick={() => quickToggleLock(period)} title={period.is_locked ? 'Unlock period' : 'Lock period'}><i className={`fas ${period.is_locked ? 'fa-lock-open' : 'fa-lock'}`} /></button></td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
              {error && <p className="lp-error"><i className="fas fa-circle-exclamation" /> {error}</p>}
            </section>
          </div>
        </div>
      </div>
      <AnimatePresence>{modalPeriod !== undefined && <PeriodModal period={modalPeriod} saving={saving} theme={theme} onClose={() => setModalPeriod(undefined)} onSave={handleSave} />}</AnimatePresence>
    </div>
  );
};

export default LockPeriodOverview;
