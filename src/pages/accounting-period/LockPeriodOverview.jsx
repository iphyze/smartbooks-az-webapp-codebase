import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import NavBar from '../NavBar';
import PageNav from '../../components/PageNav';
import TableLoaderComponent from '../../components/TableLoaderComponent';
import { DateInput, parseISO, toISO } from '../../components/DashboardControls';
import useThemeStore from '../../stores/useThemeStore';
import useAccountingPeriodStore from '../../stores/useAccountingPeriodStore';
import '../../components/DashboardControls.css';
import './LockPeriod.css';

const RETAINED_EARNINGS_LEDGER = 11000001;
const EMPTY_PERIOD = {
  id: null,
  start_date: '',
  end_date: '',
  is_locked: false,
  is_active: true,
  lock_reason: '',
};

const money = (value) => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const fiscalDefaults = () => {
  const year = new Date().getFullYear() - 1;
  return {
    period_start: `${year}-01-01`,
    period_end: `${year}-12-31`,
    retained_earnings_ledger_number: RETAINED_EARNINGS_LEDGER,
  };
};

const ModalShell = ({ theme, title, eyebrow, children, footer, onClose, size = 'standard' }) => (
  <motion.div
    className={`lp-modal-backdrop theme-${theme}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={onClose}
  >
    <motion.section
      className={`lp-modal lp-modal--${size}`}
      onMouseDown={(event) => event.stopPropagation()}
      initial={{ y: 18, opacity: 0, scale: 0.985 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 12, opacity: 0, scale: 0.99 }}
    >
      <div className="lp-modal__header">
        <div>
          <span className="lp-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button className="lp-icon-btn" type="button" onClick={onClose} aria-label="Close">
          <i className="fas fa-xmark" />
        </button>
      </div>
      <div className="lp-modal__body">{children}</div>
      {footer && <div className="lp-modal__footer">{footer}</div>}
    </motion.section>
  </motion.div>
);

const NoticeList = ({ items = [], type = 'warning', emptyText = '' }) => {
  if (!items.length) return emptyText ? <p className="lp-muted-copy">{emptyText}</p> : null;
  return (
    <div className={`lp-notice-list lp-notice-list--${type}`}>
      {items.map((item, index) => (
        <div key={`${item.code || type}-${index}`}>
          <i className={`fas ${type === 'danger' ? 'fa-circle-xmark' : 'fa-triangle-exclamation'}`} />
          <span><strong>{item.code ? item.code.replace(/_/g, ' ') : type}</strong>{item.message}</span>
        </div>
      ))}
    </div>
  );
};

const JournalLinesTable = ({ lines = [], showBalance = false, compact = false }) => (
  <div className="lp-table-overflow">
    <table className={`lp-table lp-journal-table ${compact ? 'is-compact' : ''}`}>
      <thead>
        <tr>
          <th>Ledger</th>
          {showBalance && <th className="number">Balance before close</th>}
          <th className="number">Debit NGN</th>
          <th className="number">Credit NGN</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr key={`${line.ledger_number || 'line'}-${index}`}>
            <td>
              <strong>{line.ledger_name || 'Unknown ledger'}</strong>
              <span className="lp-range">{line.ledger_number || '—'} · {line.ledger_class || '—'}</span>
            </td>
            {showBalance && <td className="number">{line.balance_before_close_ngn !== undefined ? money(line.balance_before_close_ngn) : '—'}</td>}
            <td className="number">{Number(line.debit_ngn || 0) ? money(line.debit_ngn) : '—'}</td>
            <td className="number">{Number(line.credit_ngn || 0) ? money(line.credit_ngn) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PeriodModal = ({ period, saving, onClose, onSave, theme }) => {
  const [form, setForm] = useState(period ? { ...period } : { ...EMPTY_PERIOD });
  const [errors, setErrors] = useState({});
  const editing = Boolean(period?.id);
  const locked = Boolean(period?.is_locked);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.start_date) nextErrors.start_date = 'Start date is required.';
    if (!form.end_date) nextErrors.end_date = 'End date is required.';
    if (form.start_date && form.end_date && form.start_date > form.end_date) nextErrors.end_date = 'End date must be after the start date.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const succeeded = await onSave({ ...form, is_locked: Boolean(form.is_locked) });
    if (succeeded) onClose();
  };

  return (
    <ModalShell
      theme={theme}
      eyebrow="Accounting period"
      title={editing ? 'Edit accounting period' : 'Create accounting period'}
      onClose={onClose}
      footer={locked ? (
        <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Close</button>
      ) : (
        <>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="lp-btn lp-btn--primary" type="submit" form="lp-period-form" disabled={saving}>
            {saving ? <><i className="fas fa-circle-notch fa-spin" /> Saving</> : <><i className="fas fa-check" /> {editing ? 'Save changes' : 'Create open period'}</>}
          </button>
        </>
      )}
    >
      <form id="lp-period-form" onSubmit={submit}>
        {locked && (
          <div className="lp-inline-alert lp-inline-alert--warning">
            <i className="fas fa-lock" />
            <span>Locked periods are audit-controlled. Unlock this period before changing its dates or active status.</span>
          </div>
        )}
        <div className="lp-form-grid">
          <div className="lp-field lp-field--date">
            <span>Start date</span>
            {locked ? (
              <div className="lp-readonly-value"><i className="fas fa-calendar-days" /> {formatDate(form.start_date)}</div>
            ) : (
              <DateInput
                label="From"
                value={parseISO(form.start_date)}
                onChange={(date) => update('start_date', toISO(date))}
                maxDate={parseISO(form.end_date)}
                invalid={Boolean(errors.start_date)}
                placeholder="Choose start date"
              />
            )}
            {errors.start_date && <small>{errors.start_date}</small>}
          </div>
          <div className="lp-field lp-field--date">
            <span>End date</span>
            {locked ? (
              <div className="lp-readonly-value"><i className="fas fa-calendar-days" /> {formatDate(form.end_date)}</div>
            ) : (
              <DateInput
                label="To"
                value={parseISO(form.end_date)}
                onChange={(date) => update('end_date', toISO(date))}
                minDate={parseISO(form.start_date)}
                invalid={Boolean(errors.end_date)}
                placeholder="Choose end date"
              />
            )}
            {errors.end_date && <small>{errors.end_date}</small>}
          </div>
        </div>
        <label className={`lp-switch lp-switch--card ${locked ? 'is-disabled' : ''}`}>
          <input
            type="checkbox"
            checked={Boolean(form.is_active)}
            onChange={(event) => update('is_active', event.target.checked)}
            disabled={locked}
          />
          <span className="lp-switch__track"><span /></span>
          <span>
            <strong>{form.is_active ? 'Active period' : 'Inactive period'}</strong>
            <small>Only active periods can be locked and included in a fiscal-year close.</small>
          </span>
        </label>
        <div className="lp-process-note">
          <i className="fas fa-shield-halved" />
          <div>
            <strong>Periods are created open.</strong>
            <p>Locking is a separate preview-and-confirm action. An ordinary period lock does not transfer profit or loss to Retained Earnings.</p>
          </div>
        </div>
      </form>
    </ModalShell>
  );
};

const DiagnosticsPanel = ({ diagnostics = {} }) => {
  const sections = [
    ['Unbalanced journals', diagnostics.unbalanced_journals || [], 'danger'],
    ['Orphan journal headers', diagnostics.orphan_headers || [], 'danger'],
    ['Orphan journal lines', diagnostics.orphan_lines || [], 'danger'],
    ['Header/line differences', diagnostics.header_line_mismatches || [], 'warning'],
  ].filter(([, rows]) => rows.length);

  if (!sections.length) {
    return (
      <div className="lp-clean-check">
        <i className="fas fa-circle-check" />
        <div><strong>Journal integrity checks passed</strong><span>No unbalanced or incomplete journal records were found in this period.</span></div>
      </div>
    );
  }

  return (
    <div className="lp-diagnostics">
      {sections.map(([title, rows, severity]) => (
        <details key={title} open={severity === 'danger'}>
          <summary><span>{title}</span><b>{rows.length}</b></summary>
          <div className="lp-diagnostic-rows">
            {rows.map((row, index) => (
              <div key={`${row.journal_id}-${index}`}>
                <span>Journal #{row.journal_id || '—'} · {formatDate(row.journal_date)}</span>
                {row.difference_ngn !== undefined && <strong>{money(row.difference_ngn)}</strong>}
                {row.header_debit_ngn !== undefined && (
                  <strong>Header {money(row.header_debit_ngn)} / Lines {money(row.line_debit_ngn)}</strong>
                )}
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
};

const LockPreviewModal = ({ period, preview, loading, locking, theme, onClose, onConfirm, onRefresh }) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const validReason = reason.trim().length >= 5 && reason.trim().length <= 500;
  const canSubmit = Boolean(preview?.can_lock && preview?.preview_token && validReason && confirmed && !locking);
  const summary = preview?.diagnostics?.summary || {};

  return (
    <ModalShell
      theme={theme}
      eyebrow="Controlled close"
      title={`Review lock: ${formatDate(period.start_date)} – ${formatDate(period.end_date)}`}
      onClose={onClose}
      size="wide"
      footer={(
        <>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onRefresh} disabled={loading || locking}><i className="fas fa-rotate" /> Refresh preview</button>
          <button className="lp-btn lp-btn--danger" type="button" disabled={!canSubmit} onClick={() => onConfirm(reason.trim())}>
            {locking ? <><i className="fas fa-circle-notch fa-spin" /> Locking</> : <><i className="fas fa-lock" /> Lock period</>}
          </button>
        </>
      )}
    >
      {loading ? (
        <div className="lp-modal-loading"><i className="fas fa-circle-notch fa-spin" /><span>Checking journal integrity and preparing the lock preview…</span></div>
      ) : !preview ? (
        <div className="lp-inline-alert lp-inline-alert--danger"><i className="fas fa-circle-exclamation" /><span>The lock preview could not be prepared.</span></div>
      ) : (
        <>
          <div className={`lp-readiness ${preview.can_lock ? 'is-ready' : 'is-blocked'}`}>
            <i className={`fas ${preview.can_lock ? 'fa-shield-circle-check' : 'fa-shield-circle-exclamation'}`} />
            <div>
              <strong>{preview.can_lock ? 'Ready to lock' : 'Locking is blocked'}</strong>
              <span>{preview.can_lock ? 'The exact journal data below will be confirmed again when you lock the period.' : 'Resolve every blocker and generate a new preview.'}</span>
            </div>
          </div>
          <div className="lp-summary-grid lp-summary-grid--four">
            <article><span>Journals</span><strong>{summary.journal_count || 0}</strong></article>
            <article><span>Journal lines</span><strong>{summary.line_count || 0}</strong></article>
            <article><span>Total debit</span><strong>{money(summary.total_debit_ngn)}</strong></article>
            <article><span>Total credit</span><strong>{money(summary.total_credit_ngn)}</strong></article>
          </div>
          <NoticeList items={preview.blockers || []} type="danger" />
          <NoticeList items={preview.warnings || []} type="warning" />
          <DiagnosticsPanel diagnostics={preview.diagnostics} />
          <label className="lp-field lp-field--full">
            <span>Lock reason <em>Required</em></span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows="3"
              maxLength="500"
              placeholder="State why the accounting period is ready to be locked"
            />
            <small className={validReason || !reason ? 'lp-help' : ''}>{reason.length}/500 · Enter at least 5 characters.</small>
          </label>
          <label className="lp-confirm-check">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span><i className="fas fa-check" /></span>
            <div>
              <strong>I reviewed this preview</strong>
              <small>I understand that postings and changes dated inside this period will be blocked after locking.</small>
            </div>
          </label>
        </>
      )}
    </ModalShell>
  );
};

const UnlockModal = ({ period, theme, unlocking, onClose, onConfirm, onOpenClosures }) => {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5 && reason.trim().length <= 500;
  const blockedByClose = Boolean(period.has_active_fiscal_close);

  return (
    <ModalShell
      theme={theme}
      eyebrow="Controlled reopen"
      title={`Unlock ${formatDate(period.start_date)} – ${formatDate(period.end_date)}`}
      onClose={onClose}
      footer={(
        <>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="lp-btn lp-btn--primary" type="button" disabled={!valid || unlocking || blockedByClose} onClick={() => onConfirm(reason.trim())}>
            {unlocking ? <><i className="fas fa-circle-notch fa-spin" /> Unlocking</> : <><i className="fas fa-lock-open" /> Unlock period</>}
          </button>
        </>
      )}
    >
      {blockedByClose ? (
        <div className="lp-inline-alert lp-inline-alert--danger">
          <i className="fas fa-scale-balanced" />
          <span>
            This period belongs to active fiscal-year closure <strong>{period.closure_code}</strong>. Reverse that closure before unlocking the period.
            <button type="button" className="lp-text-btn" onClick={onOpenClosures}>Open fiscal-year closures</button>
          </span>
        </div>
      ) : (
        <div className="lp-inline-alert lp-inline-alert--warning">
          <i className="fas fa-triangle-exclamation" />
          <span>Unlocking reopens historical dates for posting. The reason will be stored in the accounting-period audit trail.</span>
        </div>
      )}
      <label className="lp-field lp-field--full">
        <span>Unlock reason <em>Required</em></span>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="4" maxLength="500" placeholder="Explain why this period must be reopened" />
        <small className={valid || !reason ? 'lp-help' : ''}>{reason.length}/500 · Enter at least 5 characters.</small>
      </label>
    </ModalShell>
  );
};

const FiscalClosePreview = ({ preview, confirmed, setConfirmed, description, setDescription, posting, onPost, onOpenFx, onOpenPeriods }) => {
  const diagnostics = preview.diagnostics || {};
  const fxItems = preview.fx_readiness?.items || [];
  const canPost = Boolean(preview.can_post && preview.preview_token && confirmed && description.trim().length >= 5 && !posting);
  const needsFx = (preview.blockers || []).some((item) => item.code === 'FX_REVALUATION_REQUIRED');
  const needsPeriods = (preview.blockers || []).some((item) => ['NO_PERIODS', 'PERIOD_GAP', 'OVERLAPPING_PERIODS', 'UNLOCKED_PERIOD', 'INACTIVE_PERIOD', 'START_NOT_PERIOD_BOUNDARY', 'END_NOT_PERIOD_BOUNDARY'].includes(item.code));

  return (
    <section className="lp-close-preview">
      <div className={`lp-readiness ${preview.can_post ? 'is-ready' : 'is-blocked'}`}>
        <i className={`fas ${preview.can_post ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
        <div>
          <strong>{preview.can_post ? 'Closing journal is ready for approval' : 'Fiscal-year close is blocked'}</strong>
          <span>{formatDate(preview.period_start)} to {formatDate(preview.period_end)} · Closing date {formatDate(preview.closing_date)}</span>
        </div>
      </div>
      <div className="lp-result-strip">
        <article className={preview.result === 'Profit' ? 'is-profit' : preview.result === 'Loss' ? 'is-loss' : ''}>
          <span>Net result</span>
          <strong>{preview.result}</strong>
          <small>{money(Math.abs(preview.net_profit_loss_ngn || 0))}</small>
        </article>
        <article><span>Closing debit</span><strong>{money(preview.total_debit_ngn)}</strong></article>
        <article><span>Closing credit</span><strong>{money(preview.total_credit_ngn)}</strong></article>
        <article><span>Journal lines</span><strong>{preview.journal_lines?.length || 0}</strong></article>
      </div>
      <NoticeList items={preview.blockers || []} type="danger" />
      <NoticeList items={preview.warnings || []} type="warning" />
      {(needsFx || needsPeriods) && (
        <div className="lp-resolution-actions">
          {needsPeriods && <button type="button" className="lp-btn lp-btn--secondary" onClick={onOpenPeriods}><i className="fas fa-calendar-check" /> Review accounting periods</button>}
          {needsFx && <button type="button" className="lp-btn lp-btn--secondary" onClick={onOpenFx}><i className="fas fa-arrow-trend-up" /> Open FX revaluation</button>}
        </div>
      )}

      <div className="lp-preview-section">
        <div className="lp-section-heading">
          <div><span className="lp-eyebrow">Coverage</span><h3>Locked accounting periods</h3></div>
          <span className="lp-count-badge">{preview.covered_periods?.length || 0}</span>
        </div>
        <div className="lp-period-coverage">
          {(preview.covered_periods || []).map((period) => (
            <article key={period.id}>
              <i className={`fas ${period.is_locked ? 'fa-lock' : 'fa-lock-open'}`} />
              <div><strong>{formatDate(period.start_date)} – {formatDate(period.end_date)}</strong><span>{period.is_active ? 'Active' : 'Inactive'} · {period.is_locked ? 'Locked' : 'Open'}</span></div>
            </article>
          ))}
        </div>
      </div>

      <div className="lp-preview-section">
        <div className="lp-section-heading">
          <div><span className="lp-eyebrow">Foreign currency</span><h3>Year-end FX readiness</h3></div>
          <span className={`lp-pill ${preview.fx_readiness?.is_ready ? 'lp-pill--open' : 'lp-pill--locked'}`}>
            {preview.fx_readiness?.is_ready ? 'Ready' : 'Action required'}
          </span>
        </div>
        <div className="lp-table-overflow">
          <table className="lp-table lp-fx-readiness-table">
            <thead><tr><th>Currency</th><th>Open ledgers</th><th>Closing rate</th><th>Pending adjustment</th><th>Status</th></tr></thead>
            <tbody>
              {fxItems.map((item) => (
                <tr key={item.currency}>
                  <td><strong>{item.currency}</strong><span className="lp-range">Rate date {formatDate(item.rate_date)}</span></td>
                  <td>{item.open_ledger_count || 0}</td>
                  <td>{item.closing_rate ? Number(item.closing_rate).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '—'}</td>
                  <td>{money(item.pending_net_ngn)}</td>
                  <td><span className={`lp-pill ${item.is_ready ? 'lp-pill--open' : 'lp-pill--locked'}`}>{item.is_ready ? 'Ready' : `${item.pending_adjustment_count} pending`}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lp-preview-section">
        <div className="lp-section-heading">
          <div><span className="lp-eyebrow">Journal preview</span><h3>Profit and loss closing entries</h3></div>
          <span className="lp-balance-badge"><i className="fas fa-scale-balanced" /> Balanced</span>
        </div>
        <JournalLinesTable lines={preview.journal_lines || []} showBalance />
      </div>

      <div className="lp-preview-section">
        <div className="lp-section-heading"><div><span className="lp-eyebrow">Integrity</span><h3>Underlying journal diagnostics</h3></div></div>
        <div className="lp-summary-grid lp-summary-grid--four">
          <article><span>Journals</span><strong>{diagnostics.summary?.journal_count || 0}</strong></article>
          <article><span>Journal lines</span><strong>{diagnostics.summary?.line_count || 0}</strong></article>
          <article><span>Total debit</span><strong>{money(diagnostics.summary?.total_debit_ngn)}</strong></article>
          <article><span>Total credit</span><strong>{money(diagnostics.summary?.total_credit_ngn)}</strong></article>
        </div>
        <DiagnosticsPanel diagnostics={diagnostics} />
      </div>

      <div className="lp-approval-panel">
        <label className="lp-field lp-field--full">
          <span>Closing journal description <em>Required</em></span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="3" maxLength="1000" />
        </label>
        <label className="lp-confirm-check">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          <span><i className="fas fa-check" /></span>
          <div>
            <strong>I approve the exact closing journal shown above</strong>
            <small>This will zero the listed P&amp;L balances and transfer the net result to Retained Earnings through the normal journal structure.</small>
          </div>
        </label>
        <button type="button" className="lp-btn lp-btn--danger lp-post-close-btn" disabled={!canPost} onClick={onPost}>
          {posting ? <><i className="fas fa-circle-notch fa-spin" /> Posting fiscal close</> : <><i className="fas fa-book" /> Post fiscal-year close</>}
        </button>
      </div>
    </section>
  );
};

const FiscalReversalModal = ({ closure, preview, loading, reversing, theme, onClose, onConfirm, onRefresh }) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const validReason = reason.trim().length >= 5 && reason.trim().length <= 500;
  const canReverse = Boolean(preview?.can_reverse && preview?.preview_token && validReason && confirmed && !reversing);

  return (
    <ModalShell
      theme={theme}
      eyebrow="Fiscal close reversal"
      title={`Reverse ${closure.closure_code}`}
      size="wide"
      onClose={onClose}
      footer={(
        <>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="lp-btn lp-btn--secondary" type="button" onClick={onRefresh} disabled={loading || reversing}><i className="fas fa-rotate" /> Refresh preview</button>
          <button className="lp-btn lp-btn--danger" type="button" disabled={!canReverse} onClick={() => onConfirm(reason.trim())}>
            {reversing ? <><i className="fas fa-circle-notch fa-spin" /> Reversing</> : <><i className="fas fa-rotate-left" /> Post reversal journal</>}
          </button>
        </>
      )}
    >
      {loading ? (
        <div className="lp-modal-loading"><i className="fas fa-circle-notch fa-spin" /><span>Verifying the original closing journal…</span></div>
      ) : !preview ? (
        <div className="lp-inline-alert lp-inline-alert--danger"><i className="fas fa-circle-exclamation" /><span>The reversal preview could not be prepared.</span></div>
      ) : (
        <>
          <div className={`lp-readiness ${preview.can_reverse ? 'is-ready' : 'is-blocked'}`}>
            <i className={`fas ${preview.can_reverse ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
            <div>
              <strong>{preview.can_reverse ? 'Exact reversal journal is ready' : 'This closure cannot be reversed'}</strong>
              <span>Original Journal #{preview.closure?.journal_id} · Reversal date {formatDate(preview.reversal_date)}</span>
            </div>
          </div>
          <NoticeList items={preview.blockers || []} type="danger" />
          <div className="lp-summary-grid lp-summary-grid--three">
            <article><span>Integrity match</span><strong>{preview.journal_integrity?.matching_line_count || 0}/{preview.journal_integrity?.expected_line_count || 0}</strong></article>
            <article><span>Reversal debit</span><strong>{money(preview.total_debit_ngn)}</strong></article>
            <article><span>Reversal credit</span><strong>{money(preview.total_credit_ngn)}</strong></article>
          </div>
          <JournalLinesTable lines={preview.journal_lines || []} compact />
          <label className="lp-field lp-field--full">
            <span>Reversal reason <em>Required</em></span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="3" maxLength="500" placeholder="Explain why the fiscal-year close must be reversed" />
            <small className={validReason || !reason ? 'lp-help' : ''}>{reason.length}/500 · Enter at least 5 characters.</small>
          </label>
          <label className="lp-confirm-check">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span><i className="fas fa-check" /></span>
            <div><strong>I reviewed the exact reversal</strong><small>The original journal is not deleted; a balanced opposite journal will be posted for the audit trail.</small></div>
          </label>
        </>
      )}
    </ModalShell>
  );
};

const LockPeriodOverview = () => {
  const [nav, setNav] = useState(false);
  const [activeTab, setActiveTab] = useState('periods');
  const [modalPeriod, setModalPeriod] = useState(undefined);
  const [lockTarget, setLockTarget] = useState(null);
  const [unlockTarget, setUnlockTarget] = useState(null);
  const [reversalTarget, setReversalTarget] = useState(null);
  const [fiscalForm, setFiscalForm] = useState(fiscalDefaults);
  const [fiscalConfirmed, setFiscalConfirmed] = useState(false);
  const [journalDescription, setJournalDescription] = useState('');
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const store = useAccountingPeriodStore();
  const {
    periods, closures, loading, closuresLoading, saving, lockPreviewLoading, locking, unlocking,
    fiscalPreviewLoading, fiscalPosting, reversalPreviewLoading, reversing, error, searchQuery,
    lockPreview, fiscalPreview, reversalPreview, setSearchQuery, fetchPeriods, fetchClosures,
    createPeriod, updatePeriod, previewLockPeriod, lockPeriod, unlockPeriod, clearLockPreview,
    previewFiscalYearClose, postFiscalYearClose, clearFiscalPreview,
    previewFiscalYearCloseReversal, reverseFiscalYearClose, clearReversalPreview,
  } = store;

  useEffect(() => {
    document.title = 'Smartbooks | Accounting Periods';
    fetchPeriods();
    fetchClosures();
  }, [fetchPeriods, fetchClosures]);

  const stats = useMemo(() => ({
    total: periods.length,
    locked: periods.filter((period) => period.is_locked).length,
    open: periods.filter((period) => !period.is_locked).length,
    fiscal: closures.filter((closure) => closure.status === 'Posted').length,
  }), [periods, closures]);

  const handleSave = async (payload) => (payload.id ? updatePeriod(payload) : createPeriod(payload));

  const openLockPreview = async (period) => {
    setLockTarget(period);
    clearLockPreview();
    await previewLockPeriod(period.id);
  };

  const confirmLock = async (reason) => {
    const succeeded = await lockPeriod({ period: lockTarget, previewToken: lockPreview?.preview_token, lockReason: reason });
    if (succeeded) setLockTarget(null);
  };

  const confirmUnlock = async (reason) => {
    const succeeded = await unlockPeriod({ period: unlockTarget, reason });
    if (succeeded) setUnlockTarget(null);
  };

  const updateFiscalField = (key, value) => {
    setFiscalForm((current) => ({ ...current, [key]: value }));
    setFiscalConfirmed(false);
    clearFiscalPreview();
  };

  const handleFiscalPreview = async () => {
    setFiscalConfirmed(false);
    const preview = await previewFiscalYearClose(fiscalForm);
    if (preview) {
      setJournalDescription(`Year-end closing transfer to Retained Earnings for ${fiscalForm.period_start} to ${fiscalForm.period_end}`);
    }
  };

  const handleFiscalPost = async () => {
    const result = await postFiscalYearClose({
      ...fiscalForm,
      preview_token: fiscalPreview?.preview_token,
      journal_description: journalDescription.trim(),
    });
    if (result) {
      setFiscalConfirmed(false);
      setJournalDescription('');
    }
  };

  const openReversal = async (closure) => {
    setReversalTarget(closure);
    clearReversalPreview();
    await previewFiscalYearCloseReversal(closure.id);
  };

  const confirmReversal = async (reason) => {
    const result = await reverseFiscalYearClose({
      closureId: reversalTarget.id,
      previewToken: reversalPreview?.preview_token,
      reason,
    });
    if (result) setReversalTarget(null);
  };

  return (
    <div className={`main-container theme-${theme}`}>
      <Header nav={nav} setNav={setNav} />
      <NavBar nav={nav} setNav={setNav} />
      <div className={`content-container theme-${theme}`}>
        <div className={`lp-root theme-${theme}`}>
          <div className="lp-page">
            <PageNav pageTitle="Accounting Periods" links={[{ label: 'Home', to: '/', active: true }, { label: 'Accounting Periods', to: '/lock-period/home', active: false }]} />
            <section className="lp-hero">
              <div>
                <span className="lp-eyebrow">Period controls</span>
                <h1>Accounting period and fiscal close</h1>
                <p>Lock completed periods after preview, then use the separate fiscal-year close to transfer the annual P&amp;L result to Retained Earnings.</p>
              </div>
              {activeTab === 'periods' && (
                <button className="lp-btn lp-btn--primary" onClick={() => setModalPeriod(null)}><i className="fas fa-plus" /> New period</button>
              )}
            </section>

            <div className="lp-stat-grid lp-stat-grid--four">
              <article><i className="fas fa-calendar-days" /><div><strong>{stats.total}</strong><span>Total periods</span></div></article>
              <article className="locked"><i className="fas fa-lock" /><div><strong>{stats.locked}</strong><span>Locked periods</span></div></article>
              <article className="open"><i className="fas fa-lock-open" /><div><strong>{stats.open}</strong><span>Open periods</span></div></article>
              <article className="fiscal"><i className="fas fa-scale-balanced" /><div><strong>{stats.fiscal}</strong><span>Active fiscal closes</span></div></article>
            </div>

            <div className="lp-tabs" role="tablist" aria-label="Accounting period controls">
              <button type="button" className={activeTab === 'periods' ? 'active' : ''} onClick={() => setActiveTab('periods')}>
                <i className="fas fa-calendar-check" /> Accounting periods
              </button>
              <button type="button" className={activeTab === 'fiscal' ? 'active' : ''} onClick={() => setActiveTab('fiscal')}>
                <i className="fas fa-book" /> Fiscal-year close
              </button>
            </div>

            {activeTab === 'periods' ? (
              <section className="lp-table-card">
                <div className="lp-table-toolbar">
                  <div>
                    <span className="lp-eyebrow">Operational lock</span>
                    <h2>Accounting periods</h2>
                    <p>Creating or editing a period does not lock it. Use the lock action to review journal integrity first.</p>
                  </div>
                  <div className="lp-toolbar-actions">
                    <div className="lp-search">
                      <i className="fas fa-search" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && fetchPeriods()}
                        placeholder="Search dates, reason or closure"
                        autoComplete="off"
                      />
                    </div>
                    <button className="lp-btn lp-btn--secondary" onClick={fetchPeriods}><i className="fas fa-rotate" /> Refresh</button>
                  </div>
                </div>
                {loading ? <TableLoaderComponent /> : periods.length === 0 ? (
                  <div className="lp-empty">
                    <span><i className="fas fa-calendar-plus" /></span>
                    <h3>No accounting periods yet</h3>
                    <p>Create the first open period, then preview it before locking.</p>
                    <button className="lp-btn lp-btn--primary" onClick={() => setModalPeriod(null)}><i className="fas fa-plus" /> New period</button>
                  </div>
                ) : (
                  <div className="lp-table-overflow">
                    <table className="lp-table">
                      <thead><tr><th>Period</th><th>Status</th><th>Lock audit</th><th>Fiscal close</th><th>Last updated</th><th className="lp-table__actions">Actions</th></tr></thead>
                      <tbody>
                        {periods.map((period) => (
                          <tr key={period.id}>
                            <td><strong>{formatDate(period.start_date)}</strong><span className="lp-range">to {formatDate(period.end_date)}</span></td>
                            <td>
                              <span className={`lp-pill ${period.is_locked ? 'lp-pill--locked' : 'lp-pill--open'}`}><i className={`fas ${period.is_locked ? 'fa-lock' : 'fa-lock-open'}`} /> {period.is_locked ? 'Locked' : 'Open'}</span>
                              {!period.is_active && <span className="lp-pill lp-pill--inactive">Inactive</span>}
                            </td>
                            <td className="lp-reason">
                              {period.is_locked
                                ? (period.lock_reason || 'No lock reason recorded')
                                : (period.lock_reason ? `Previous lock: ${period.lock_reason}` : 'No prior lock reason')}
                              <span className="lp-range">{period.is_locked ? `${period.locked_by_email || '—'} · ${formatDateTime(period.locked_at)}` : 'Not locked'}</span>
                            </td>
                            <td>
                              {period.has_active_fiscal_close ? (
                                <span className="lp-closure-link"><i className="fas fa-book" /> {period.closure_code}<small>Journal #{period.closing_journal_id}</small></span>
                              ) : '—'}
                            </td>
                            <td>{period.updated_by || period.created_by || '—'}<span className="lp-range">{formatDateTime(period.updated_at || period.created_at)}</span></td>
                            <td className="lp-table__actions">
                              <button className="lp-row-btn" onClick={() => setModalPeriod(period)} title={period.is_locked ? 'View locked period' : 'Edit period'}><i className={`fas ${period.is_locked ? 'fa-eye' : 'fa-pen'}`} /></button>
                              {period.is_locked ? (
                                <button className="lp-row-btn unlock" disabled={unlocking} onClick={() => setUnlockTarget(period)} title="Unlock period"><i className="fas fa-lock-open" /></button>
                              ) : (
                                <button className="lp-row-btn lock" disabled={locking || lockPreviewLoading || !period.is_active} onClick={() => openLockPreview(period)} title={period.is_active ? 'Preview and lock period' : 'Activate the period before locking'}><i className="fas fa-lock" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {error && <p className="lp-error"><i className="fas fa-circle-exclamation" /> {error}</p>}
              </section>
            ) : (
              <div className="lp-fiscal-layout">
                <section className="lp-fiscal-card">
                  <div className="lp-section-heading lp-section-heading--top">
                    <div>
                      <span className="lp-eyebrow">Annual close</span>
                      <h2>Prepare fiscal-year closing journal</h2>
                      <p>All accounting periods in the range must be active, continuously covered, locked and fully revalued for foreign currency.</p>
                    </div>
                  </div>
                  <div className="lp-fiscal-form">
                    <div className="lp-field lp-field--date">
                      <span>Fiscal-year start</span>
                      <DateInput
                        label="From"
                        value={parseISO(fiscalForm.period_start)}
                        onChange={(date) => updateFiscalField('period_start', toISO(date))}
                        maxDate={parseISO(fiscalForm.period_end)}
                      />
                    </div>
                    <div className="lp-field lp-field--date">
                      <span>Fiscal-year end</span>
                      <DateInput
                        label="To"
                        value={parseISO(fiscalForm.period_end)}
                        onChange={(date) => updateFiscalField('period_end', toISO(date))}
                        minDate={parseISO(fiscalForm.period_start)}
                      />
                    </div>
                    <label className="lp-field">
                      <span>Retained Earnings ledger</span>
                      <input
                        type="number"
                        value={fiscalForm.retained_earnings_ledger_number}
                        onChange={(event) => updateFiscalField('retained_earnings_ledger_number', Number(event.target.value))}
                        min="1"
                      />
                    </label>
                    <button
                      type="button"
                      className="lp-btn lp-btn--primary lp-preview-action"
                      onClick={handleFiscalPreview}
                      disabled={fiscalPreviewLoading || !fiscalForm.period_start || !fiscalForm.period_end}
                    >
                      {fiscalPreviewLoading ? <><i className="fas fa-circle-notch fa-spin" /> Preparing</> : <><i className="fas fa-magnifying-glass-chart" /> Preview fiscal close</>}
                    </button>
                  </div>
                  <div className="lp-process-note">
                    <i className="fas fa-circle-info" />
                    <div><strong>Standard procedure</strong><p>Locking normal periods only prevents further postings. The P&amp;L transfer happens here as a separate balanced year-end journal after approval.</p></div>
                  </div>
                  {fiscalPreview && (
                    <FiscalClosePreview
                      preview={fiscalPreview}
                      confirmed={fiscalConfirmed}
                      setConfirmed={setFiscalConfirmed}
                      description={journalDescription}
                      setDescription={setJournalDescription}
                      posting={fiscalPosting}
                      onPost={handleFiscalPost}
                      onOpenPeriods={() => setActiveTab('periods')}
                      onOpenFx={() => navigate('/reports/fx-revaluation')}
                    />
                  )}
                </section>

                <section className="lp-fiscal-card">
                  <div className="lp-section-heading lp-section-heading--top">
                    <div><span className="lp-eyebrow">Audit trail</span><h2>Fiscal-year closures</h2><p>Posted closures remain visible. Reversals create an exact opposite journal rather than deleting history.</p></div>
                    <button className="lp-btn lp-btn--secondary" onClick={fetchClosures}><i className="fas fa-rotate" /> Refresh</button>
                  </div>
                  {closuresLoading ? <TableLoaderComponent /> : closures.length === 0 ? (
                    <div className="lp-empty lp-empty--small"><span><i className="fas fa-book-open" /></span><h3>No fiscal-year closures</h3><p>Approved year-end closes will appear here.</p></div>
                  ) : (
                    <div className="lp-table-overflow">
                      <table className="lp-table lp-closures-table">
                        <thead><tr><th>Closure</th><th>Result</th><th>Closing journal</th><th>Status</th><th>Posted by</th><th className="lp-table__actions">Actions</th></tr></thead>
                        <tbody>
                          {closures.map((closure) => (
                            <tr key={closure.id}>
                              <td><strong>{closure.closure_code}</strong><span className="lp-range">{formatDate(closure.period_start)} – {formatDate(closure.period_end)}</span></td>
                              <td><strong className={closure.result === 'Profit' ? 'lp-profit-text' : closure.result === 'Loss' ? 'lp-loss-text' : ''}>{closure.result}</strong><span className="lp-range">{money(Math.abs(closure.net_profit_loss_ngn))}</span></td>
                              <td><button className="lp-journal-link" type="button" onClick={() => navigate(`/journal/view/${closure.journal_id}`)}>Journal #{closure.journal_id}</button>{closure.reversal_journal_id && <button className="lp-journal-link is-reversal" type="button" onClick={() => navigate(`/journal/view/${closure.reversal_journal_id}`)}>Reversal #{closure.reversal_journal_id}</button>}</td>
                              <td><span className={`lp-pill ${closure.status === 'Posted' ? 'lp-pill--locked' : 'lp-pill--inactive'}`}>{closure.status}</span>{closure.reversal_reason && <span className="lp-range">{closure.reversal_reason}</span>}</td>
                              <td>{closure.posted_by_email || '—'}<span className="lp-range">{formatDateTime(closure.posted_at)}</span></td>
                              <td className="lp-table__actions">
                                {closure.status === 'Posted' && !closure.reversal_journal_id ? (
                                  <button className="lp-row-btn lock" onClick={() => openReversal(closure)} disabled={reversalPreviewLoading || reversing} title="Preview reversal"><i className="fas fa-rotate-left" /></button>
                                ) : <span className="lp-complete-icon" title="Closure reversed"><i className="fas fa-check" /></span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalPeriod !== undefined && (
          <PeriodModal period={modalPeriod} saving={saving} theme={theme} onClose={() => setModalPeriod(undefined)} onSave={handleSave} />
        )}
        {lockTarget && (
          <LockPreviewModal
            period={lockTarget}
            preview={lockPreview}
            loading={lockPreviewLoading}
            locking={locking}
            theme={theme}
            onClose={() => { setLockTarget(null); clearLockPreview(); }}
            onConfirm={confirmLock}
            onRefresh={() => previewLockPeriod(lockTarget.id)}
          />
        )}
        {unlockTarget && (
          <UnlockModal
            period={unlockTarget}
            theme={theme}
            unlocking={unlocking}
            onClose={() => setUnlockTarget(null)}
            onConfirm={confirmUnlock}
            onOpenClosures={() => { setUnlockTarget(null); setActiveTab('fiscal'); }}
          />
        )}
        {reversalTarget && (
          <FiscalReversalModal
            closure={reversalTarget}
            preview={reversalPreview}
            loading={reversalPreviewLoading}
            reversing={reversing}
            theme={theme}
            onClose={() => { setReversalTarget(null); clearReversalPreview(); }}
            onConfirm={confirmReversal}
            onRefresh={() => previewFiscalYearCloseReversal(reversalTarget.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LockPeriodOverview;
