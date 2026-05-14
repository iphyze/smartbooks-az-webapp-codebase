import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { PDFDownloadLink } from '@react-pdf/renderer';
import 'react-datepicker/dist/react-datepicker.css';
import NavBar from '../NavBar';
import Header from '../Header';
import PageNav from '../../components/PageNav';
import ChartSearchableSelect from '../../components/ChartSearchableSelect';
import useThemeStore from '../../stores/useThemeStore';
import useBankReconStore from '../../stores/useBankReconStore';
import DownloadBankRecon from './DownloadBankRecon';
import './BankReconciliation.css';

const toISO = (d) => (!d ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
const fmtDate = (s) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtAmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const safe = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));
const amountOf = (line) => Math.abs(Number(line?.amount || 0));
const sumSelected = (lines, ids) =>
  lines
    .filter((x) => ids.includes(Number(x.id)))
    .reduce((s, x) => s + amountOf(x), 0);

const CustomDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="br-custom-select">
      <button type="button" className="br-custom-select-btn" onClick={() => setOpen((v) => !v)}>
        <span>{value}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>

      {open && (
        <div className="br-custom-select-menu">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={`br-custom-select-option ${value === opt.id ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.id);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } }, exit: { opacity: 0, y: -8 } };

const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES'].map((c) => ({ id: c, label: c }));
const CATEGORY_OPTIONS = ['Bank Charge', 'Bank Interest', 'Stamp Duty', 'VAT on Bank Charges', 'LC Commission', 'LC/Trade Finance', 'WHT Remittance', 'Direct Debit', 'Direct Credit', 'Unposted Debit', 'Unposted Credit', 'Reversal', 'Correction', 'Other'].map((x) => ({ id: x, label: x }));
const CLASSIFICATION_OPTIONS = [
  { id: "We Debit They Don't Credit", label: "We Debit They Don't Credit", hint: 'Debited in ledger, not credited in bank. Adds to adjusted bank.' },
  { id: "They Debit We Don't Credit", label: "They Debit We Don't Credit", hint: 'Debited in bank, not credited in ledger. Deducts from adjusted ledger.' },
  { id: "We Credit They Don't Debit", label: "We Credit They Don't Debit", hint: 'Credited in ledger, not debited in bank. Deducts from adjusted bank.' },
  { id: "They Credit We Don't Debit", label: "They Credit We Don't Debit", hint: 'Credited in bank, not debited in ledger. Adds to adjusted ledger.' },
];
const AUTO_LEDGERS = {
  'Bank Charge': { dr: 'Bank Charges & Commission', cr: 'Bank Ledger' },
  'Bank Interest': { dr: 'Bank Ledger', cr: 'Interest Income' },
  'Unreconciled DR': { dr: 'Ledger', cr: 'Bank' },
  'Unreconciled CR': { dr: 'Bank', cr: 'Ledger' },
  'Unposted DR': { dr: 'Bank', cr: 'Ledger' },
  'Unposted CR': { dr: 'Ledger', cr: 'Bank' },
  'Stamp Duty': { dr: 'Stamp Duty Expense', cr: 'Bank Ledger' },
  'VAT on Bank Charges': { dr: 'Input VAT / VAT Receivable', cr: 'Bank Ledger' },
  'LC Commission': { dr: 'LC Commission / Bank Charges', cr: 'Bank Ledger' },
  'LC/Trade Finance': { dr: 'Trade Finance Charges', cr: 'Bank Ledger' },
  'WHT Remittance': { dr: 'WHT Payable', cr: 'Bank Ledger' },
  Other: { dr: 'Suspense', cr: 'Bank Ledger' },
};

const Field = ({ label, required, error, children, className = '' }) => (
  <div className={`br-field ${className}`}>
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label}{required && <span className="br-req"> *</span>}</label>
    {children}
    {error && <span className="br-err-msg"><i className="fas fa-circle-exclamation" />{error}</span>}
  </div>
);

const FileDrop = ({ label, file, onChange, error, hint }) => (
  <div className="br-upload-wrap">
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label}<span className="br-req"> *</span></label>
    <label className={`br-drop ${file ? 'br-drop--ok' : ''} ${error ? 'br-drop--err' : ''}`}>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <i className={`fas ${file ? 'fa-check-circle' : 'fa-cloud-arrow-up'} br-drop-icon`} />
      <span className="br-drop-name">{file?.name || 'Click to upload CSV/XLSX'}</span>
      <span className="br-drop-hint">{hint}</span>
    </label>
    {error && <span className="br-err-msg"><i className="fas fa-circle-exclamation" />{error}</span>}
  </div>
);

const CreateForm = ({ onCreated }) => {
  const [open, setOpen] = useState(true);
  const [errors, setErrors] = useState({});
  const [company, setCo] = useState('');
  const [bankName, setBN] = useState('');
  const [acctName, setAN] = useState('');
  const [acctNo, setANo] = useState('');
  const [currency, setCCY] = useState('NGN');
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [to, setTo] = useState(new Date());
  const [bankFile, setBF] = useState(null);
  const [ledgerFile, setLF] = useState(null);
  const [bals, setBals] = useState({ bank_opening: '', bank_closing: '', ledger_opening: '', ledger_closing: '', tolerance_days: 7, tolerance_amount: 0 });
  const [notes, setNotes] = useState('');
  const { creating, createReconciliation } = useBankReconStore();
  const upd = (k, v) => setBals((s) => ({ ...s, [k]: v }));
  const clearErr = (key) => setErrors((s) => { const n = { ...s }; delete n[key]; return n; });

  const validate = () => {
    const e = {};
    if (!company.trim()) e.company = 'Required';
    if (!from) e.from = 'Required';
    if (!to) e.to = 'Required';
    if (from && to && from > to) e.to = 'Must be after Period From';
    if (!bankFile) e.bankFile = 'Required';
    if (!ledgerFile) e.ledgerFile = 'Required';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await createReconciliation({
      company_name: company.trim(), bank_name: bankName.trim(), account_name: acctName.trim(), account_number: acctNo.trim(),
      currency, period_from: toISO(from), period_to: toISO(to), bank_file: bankFile, ledger_file: ledgerFile, notes: notes.trim(), ...bals,
    });
    if (res?.data?.id) { setOpen(false); onCreated(res.data.id); }
  };

  return (
    <div className={`br-card ${open ? '' : 'br-card--collapsed'}`}>
      <button className="br-card-head" onClick={() => setOpen((o) => !o)}>
        <div className="br-card-head-left"><div className="br-card-icon"><i className="fas fa-scale-balanced" /></div><div className="br-card-head-text"><h2>New Bank Reconciliation</h2><p>Upload bank and ledger statements, auto-match equal items, then classify remaining reconciling items into the ZBN-style summary.</p></div></div>
        <div className="br-card-chevron"><i className={`fas fa-chevron-${open ? 'up' : 'down'}`} /></div>
      </button>
      <AnimatePresence>{open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
          <div className="br-form-body">
            <div className="br-grid br-grid--5">
              <Field label="Company / Client" required error={errors.company}><input className={`form-input ${errors.company ? 'input-error' : ''}`} value={company} onChange={(e) => { setCo(e.target.value); clearErr('company'); }} placeholder="e.g. Lambert Electromec Ltd" /></Field>
              <Field label="Bank Name"><input className="form-input" value={bankName} onChange={(e) => setBN(e.target.value)} placeholder="e.g. Zenith Bank" /></Field>
              <Field label="Account Name"><input className="form-input" value={acctName} onChange={(e) => setAN(e.target.value)} placeholder="Optional" /></Field>
              <Field label="Account Number"><input className="form-input" value={acctNo} onChange={(e) => setANo(e.target.value)} placeholder="Optional" /></Field>
              <Field label="Currency"><div className="filter-wrapper"><ChartSearchableSelect options={CURRENCY_OPTIONS} value={currency} onChange={setCCY} className="box-filter-limit" /></div></Field>
            </div>
            <div className="br-grid br-grid--6">
              <Field label="Period From" required error={errors.from}><div className="form-wrapper"><DatePicker selected={from} onChange={(d) => { setFrom(d); clearErr('from'); }} className={`form-input ${errors.from ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" /><span className="chevron-input-icon fas fa-calendar" /></div></Field>
              <Field label="Period To" required error={errors.to}><div className="form-wrapper"><DatePicker selected={to} onChange={(d) => { setTo(d); clearErr('to'); }} minDate={from || undefined} className={`form-input ${errors.to ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" /><span className="chevron-input-icon fas fa-calendar" /></div></Field>
              {[['bank_opening', 'Bank Opening'], ['bank_closing', 'Bank Closing'], ['ledger_opening', 'Ledger Opening'], ['ledger_closing', 'Ledger Closing']].map(([k, lbl]) => <Field key={k} label={lbl}><input className="form-input" value={bals[k]} onChange={(e) => upd(k, e.target.value)} placeholder="0.00" /></Field>)}
            </div>
            <div className="br-grid br-grid--4">
              <Field label="Date Tolerance (days)"><input className="form-input" type="number" min={0} max={30} value={bals.tolerance_days} onChange={(e) => upd('tolerance_days', e.target.value)} /></Field>
              <Field label="Amount Tolerance"><input className="form-input" value={bals.tolerance_amount} onChange={(e) => upd('tolerance_amount', e.target.value)} placeholder="0.00" /></Field>
              <FileDrop label="Bank Statement" file={bankFile} onChange={(f) => { setBF(f); clearErr('bankFile'); }} error={errors.bankFile} hint="Date · Description · Debit · Credit · Balance" />
              <FileDrop label="Ledger Statement" file={ledgerFile} onChange={(f) => { setLF(f); clearErr('ledgerFile'); }} error={errors.ledgerFile} hint="Date · Description · Debit · Credit · Ledger · Balance" />
            </div>
            <Field label="Notes"><textarea className="form-input br-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes, assumptions or client context…" /></Field>
            <div className="br-hints"><div className="br-hint"><i className="fas fa-wand-magic-sparkles" /><span>Automatic matches disappear from the open matching area but can be unlinked.</span></div><div className="br-hint"><i className="fas fa-layer-group" /><span>Classified unmatched items feed the four reconciling categories in the Excel summary.</span></div><div className="br-hint"><i className="fas fa-file-excel" /><span>Excel export mirrors the ZBN template: Recon, Details, Bank, Ledger and category extracts.</span></div></div>
            <div className="br-form-actions"><button className="br-btn-primary" onClick={submit} disabled={creating}>{creating ? <><div className="br-spinner" />Processing…</> : <><i className="fas fa-scale-balanced" />Create & Auto-Match</>}</button></div>
          </div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
};

const HistoryGrid = ({ onOpen }) => {
  const { list, fetchList } = useBankReconStore();
  const [search, setSearch] = useState('');
  useEffect(() => { fetchList(); }, []);
  const filtered = (list.data || []).filter((r) => !search || r.recon_number?.includes(search) || r.company_name?.toLowerCase().includes(search.toLowerCase()));
  return <div className="br-card br-card--flat"><div className="br-flat-head"><h3>Recent Reconciliations</h3><div className="br-flat-head-right"><div className="form-wrapper br-search-box"><input className="form-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />{search ? <button className="br-search-clear" onClick={() => setSearch('')}><i className="fas fa-xmark" /></button> : <span className="chevron-input-icon fas fa-search" />}</div><button className="br-btn-icon" onClick={() => fetchList()}><i className="fas fa-rotate" /></button></div></div>{list.loading ? <div className="br-loader-row"><div className="br-spinner" />Loading…</div> : <div className="br-history-grid">{filtered.length === 0 && <p className="br-empty-text">No reconciliations yet — create one above.</p>}{filtered.slice(0, 9).map((r) => { const diff = Number(r.unreconciled_difference || 0), ok = Math.abs(diff) < 0.01; return <button key={r.id} className="br-hcard" onClick={() => onOpen(r.id)}><div className="br-hcard-top"><span className="br-hcard-ref">{r.recon_number}</span><span className={`br-hcard-status ${ok ? 'br-status--ok' : 'br-status--warn'}`}>{r.status}</span></div><div className="br-hcard-company">{r.company_name}</div><div className="br-hcard-sub">{[r.bank_name, r.account_number].filter(Boolean).join(' · ')}</div><div className="br-hcard-period">{fmtDate(r.period_from)} – {fmtDate(r.period_to)} · {r.currency}</div><div className={`br-hcard-diff ${ok ? 'br-text-ok' : 'br-text-warn'}`}>{ok ? <><i className="fas fa-circle-check" />Balanced</> : <><i className="fas fa-triangle-exclamation" />Diff: {fmtAmt(diff)}</>}</div></button>; })}</div>}</div>;
};

const KpiStrip = ({ recon, summary }) => {
  const diff = Number(summary?.diff ?? recon?.unreconciled_difference ?? 0);
  const ok = Math.abs(diff) < 0.01;
  const matchPct = summary?.bTotal > 0 ? Math.round((summary.bMatched / summary.bTotal) * 100) : 0;
  return <><div className="br-kpi-strip"><div className={`br-kpi br-kpi--lg ${ok ? 'br-kpi--ok' : 'br-kpi--warn'}`}><i className={`fas ${ok ? 'fa-circle-check' : 'fa-triangle-exclamation'} br-kpi-ico`} /><div><span className="br-kpi-lbl">Recon Difference</span><strong className="br-kpi-val">{fmtAmt(diff)}</strong><em className={ok ? 'br-text-ok' : 'br-text-warn'}>{ok ? 'Balanced' : 'Needs review'} · {recon?.currency}</em></div></div><div className="br-kpi"><i className="fas fa-university br-kpi-ico br-ico--blue" /><div><span className="br-kpi-lbl">Bank Lines</span><strong className="br-kpi-val">{summary?.bTotal ?? '—'}</strong><em>{summary?.bMatched ?? 0} matched · {summary?.bUnmatched ?? 0} open</em></div></div><div className="br-kpi"><i className="fas fa-book-open br-kpi-ico br-ico--purple" /><div><span className="br-kpi-lbl">Ledger Lines</span><strong className="br-kpi-val">{summary?.lTotal ?? '—'}</strong><em>{summary?.lMatched ?? 0} matched · {summary?.lUnmatched ?? 0} open</em></div></div><div className="br-kpi"><i className="fas fa-tags br-kpi-ico br-ico--amber" /><div><span className="br-kpi-lbl">Categorised</span><strong className="br-kpi-val">{(summary?.bClassified ?? 0) + (summary?.lClassified ?? 0)}</strong><em>ready for schedules</em></div></div><div className="br-kpi br-kpi--progress"><span className="br-kpi-lbl">Match Rate</span><div className="br-prog-track"><div className="br-prog-fill" style={{ width: `${matchPct}%` }} /></div><strong className="br-kpi-pct">{matchPct}%</strong></div></div><div className="br-summary-grid"><div><span>We Debit They Don't Credit</span><strong>{fmtAmt(summary?.weDebitTheyDontCredit)}</strong></div><div><span>They Debit We Don't Credit</span><strong>{fmtAmt(summary?.theyDebitWeDontCredit)}</strong></div><div><span>We Credit They Don't Debit</span><strong>{fmtAmt(summary?.weCreditTheyDontDebit)}</strong></div><div><span>They Credit We Don't Debit</span><strong>{fmtAmt(summary?.theyCreditWeDontDebit)}</strong></div></div></>;
};

const StatusPill = ({ status }) => <span className={`br-pill ${status === 'Matched' ? 'br-pill--matched' : ['Classified', 'Bank-Only'].includes(status) ? 'br-pill--bankonly' : 'br-pill--unmatched'}`}>{status}</span>;

const LineCard = ({ line, side, isSelected, onToggleSelect, onUnmatch, onClassify }) => {
  const matched = line.match_status === 'Matched';
  const classified = ['Classified', 'Bank-Only'].includes(line.match_status);
  const isOut = line.direction === 'OUT';
  const canSelect = !matched;

  return (
    <div
      className={[
        'br-line',
        isSelected ? 'br-line--sel' : '',
        matched ? 'br-line--matched' : '',
        classified ? 'br-line--bankonly' : '',
        canSelect ? 'br-line--clickable' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => canSelect && onToggleSelect(line.id)}
    >
      <div className="br-line-r1">
        {canSelect && (
          <label className="br-check-wrap" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(line.id)} />
            <span />
          </label>
        )}

        <span className="br-line-date">{fmtDate(line.txn_date)}</span>

        <span className={`br-dir-badge ${isOut ? 'br-dir-out' : 'br-dir-in'}`}>
          <i className={`fas ${isOut ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`} />
          {isOut ? 'OUT' : 'IN'}
        </span>

        <StatusPill status={line.match_status} />

        {matched && (
          <button
            className="br-unmatch-btn"
            title="Remove this match"
            onClick={(e) => {
              e.stopPropagation();
              onUnmatch(line.match_group);
            }}
          >
            <i className="fas fa-link-slash" />
          </button>
        )}
      </div>

      <p className="br-line-desc">{line.description}</p>

      {line.ledger_name && <p className="br-line-sub"><i className="fas fa-book" />{line.ledger_name}</p>}
      {line.reference && <p className="br-line-sub"><i className="fas fa-hashtag" />{line.reference}</p>}

      <div className="br-line-r2">
        <span className={`br-line-amt ${isOut ? 'br-amt-out' : 'br-amt-in'}`}>
          {isOut ? '−' : '+'} {fmtAmt(line.amount)}
        </span>

        {matched && line.match_group && <span className="br-match-tag"><i className="fas fa-link" />{line.match_group}</span>}
        {classified && <span className="br-type-tag"><i className="fas fa-tag" />{safe(line.category_name || line.bank_only_type)}</span>}
      </div>

      {!matched && (
        <button
          className="br-classify-link"
          onClick={(e) => {
            e.stopPropagation();
            onClassify([line.id], side);
          }}
        >
          <i className={`fas ${classified ? 'fa-pencil' : 'fa-layer-group'}`} />
          {classified ? 'Re-classify' : 'Move to Details'}
        </button>
      )}
    </div>
  );
};

const ClassifyModal = ({ target, bankLines = [], ledgerLines = [], onClose, onConfirm }) => {
  const source = target?.source || 'bank';
  const lineIds = (target?.lineIds || []).map(Number);
  const sourceLines = source === 'bank' ? bankLines : ledgerLines;
  const selectedLines = sourceLines.filter((x) => lineIds.includes(Number(x.id)));
  const sample = selectedLines[0] || {};
  const total = selectedLines.reduce((s, x) => s + Math.abs(Number(x.amount || 0)), 0);

  const [category, setCategory] = useState(sample.category_name || sample.bank_only_type || 'Bank Charge');
  const [classification, setClassification] = useState(sample.recon_classification || "They Debit We Don't Credit");
  const [dr, setDr] = useState(sample.suggested_dr_ledger || '');
  const [cr, setCr] = useState(sample.suggested_cr_ledger || '');
  const [note, setNote] = useState(sample.journal_note || '');

  useEffect(() => {
    const s = AUTO_LEDGERS[category] || {};
    if (!dr) setDr(s.dr || '');
    if (!cr) setCr(s.cr || '');
  }, [category]);

  const hint = CLASSIFICATION_OPTIONS.find((x) => x.id === classification)?.hint;

  return (
    <div className="br-modal-bg" onClick={onClose}>
      <motion.div
        className="br-modal br-modal--wide"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="br-modal-head">
          <div className="br-modal-ico"><i className="fas fa-layer-group" /></div>
          <div>
            <h3>Categorise Reconciling Item{selectedLines.length > 1 ? 's' : ''}</h3>
            <p>Move {selectedLines.length} unmatched {source} line{selectedLines.length === 1 ? '' : 's'} into one Details category.</p>
          </div>
          <button className="br-modal-x" onClick={onClose}><i className="fas fa-xmark" /></button>
        </div>

        <div className="br-modal-preview">
          <span className="br-modal-prev-date">{selectedLines.length} item{selectedLines.length === 1 ? '' : 's'}</span>
          <span className="br-modal-prev-desc">
            {selectedLines.length === 1
              ? sample.description
              : `${safe(sample.description)}${selectedLines.length > 1 ? ` +${selectedLines.length - 1} more` : ''}`}
          </span>
          <span className="br-modal-prev-amt">{fmtAmt(total)}</span>
        </div>

        <div className="br-modal-form">
          <div className="br-modal-row">
            <Field label="Category / Extract Sheet">
              <CustomDropdown value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
              <input
                className="form-input br-inline-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type a custom category"
              />
            </Field>

            <Field label="Recon Classification">
              <CustomDropdown value={classification} options={CLASSIFICATION_OPTIONS} onChange={setClassification} />
              {hint && <small className="br-help-text">{hint}</small>}
            </Field>
          </div>

          <div className="br-modal-row">
            <Field label="Debit Ledger (Dr)">
              <input className="form-input" value={dr} onChange={(e) => setDr(e.target.value)} />
            </Field>
            <Field label="Credit Ledger (Cr)">
              <input className="form-input" value={cr} onChange={(e) => setCr(e.target.value)} />
            </Field>
          </div>

          <Field label="Remarks / Journal Note">
            <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>

        <div className="br-modal-foot">
          <button className="br-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="br-btn-primary"
            onClick={() => onConfirm({ source, lineIds, category, classification, drLedger: dr, crLedger: cr, note })}
          >
            <i className="fas fa-check" />Move Selected to Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const FilterBar = ({ tabs, filterVal, searchVal, onFilterChange, onSearchChange }) => <div className="br-filter-bar"><div className="form-wrapper br-fsearch-wrap"><input className="form-input br-fsearch" placeholder="Search description or amount…" value={searchVal} onChange={(e) => onSearchChange(e.target.value)} />{searchVal ? <button type="button" className="br-search-clear" onClick={() => onSearchChange('')}><i className="fas fa-xmark" /></button> : <span className="chevron-input-icon fas fa-search" />}</div><div className="br-tabs">{tabs.map((t) => <button key={t.key} className={`br-tab ${filterVal === t.key ? 'br-tab--active' : ''}`} onClick={() => onFilterChange(t.key)}>{t.label}</button>)}</div></div>;

const Matcher = () => {
  const {
    current,
    ui,
    matchLines,
    matchSelectedLines,
    unmatchLines,
    classifyLine,
    classifySelectedLines,
    setUi,
    saving,
  } = useBankReconStore();

  const { bank_lines = [], ledger_lines = [] } = current;
  const { bankFilter, ledgerFilter, bankSearch, ledgerSearch } = ui;

  const [selectedBankIds, setSelectedBankIds] = useState([]);
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
  const [classifyTarget, setClassifyTarget] = useState(null);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'unmatched', label: 'Unmatched' },
    { key: 'matched', label: 'Matched' },
    { key: 'classified', label: 'Classified' },
  ];

  const toggleId = (setter) => (id) =>
    setter((ids) => ids.includes(Number(id)) ? ids.filter((x) => x !== Number(id)) : [...ids, Number(id)]);

  const filterLines = (lines, filter, search) => lines.filter((l) => {
    if (filter === 'unmatched' && l.match_status !== 'Unmatched') return false;
    if (filter === 'matched' && l.match_status !== 'Matched') return false;
    if (filter === 'classified' && !['Classified', 'Bank-Only'].includes(l.match_status)) return false;
    if (search && !`${l.description} ${l.amount} ${l.reference || ''} ${l.category_name || ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const bankFiltered = useMemo(() => filterLines(bank_lines, bankFilter, bankSearch), [bank_lines, bankFilter, bankSearch]);
  const ledgerFiltered = useMemo(() => filterLines(ledger_lines, ledgerFilter, ledgerSearch), [ledger_lines, ledgerFilter, ledgerSearch]);

  const bankTotal = sumSelected(bank_lines, selectedBankIds);
  const ledgerTotal = sumSelected(ledger_lines, selectedLedgerIds);
  const tolerance = Number(current.reconciliation?.tolerance_amount ?? current.reconciliation?.match_tolerance_amount ?? 0);
  const matchDiff = Math.abs(bankTotal - ledgerTotal);
  const canBulkMatch = selectedBankIds.length > 0 && selectedLedgerIds.length > 0 && matchDiff <= tolerance;

  const clearSelections = () => {
    setSelectedBankIds([]);
    setSelectedLedgerIds([]);
  };

  const openClassifySelected = (source) => {
    const lineIds = source === 'bank' ? selectedBankIds : selectedLedgerIds;
    if (!lineIds.length) return;
    setClassifyTarget({ source, lineIds });
  };

  const submitClassify = async (payload) => {
    if (classifySelectedLines) {
      await classifySelectedLines(payload);
    } else if (classifyLine && payload.lineIds?.length === 1) {
      await classifyLine({ ...payload, lineId: payload.lineIds[0] });
    }

    setClassifyTarget(null);

    if (payload.source === 'bank') setSelectedBankIds([]);
    if (payload.source === 'ledger') setSelectedLedgerIds([]);
  };

  const submitBulkMatch = async () => {
    if (!canBulkMatch) return;

    if (matchSelectedLines) {
      await matchSelectedLines({ bank_line_ids: selectedBankIds, ledger_line_ids: selectedLedgerIds });
    } else if (matchLines && selectedBankIds.length === 1 && selectedLedgerIds.length === 1) {
      await matchLines(selectedBankIds[0], selectedLedgerIds[0]);
    }

    clearSelections();
  };

  return (
    <div className="br-workspace">
      <div className={`br-bulk-bar ${(selectedBankIds.length || selectedLedgerIds.length) ? 'br-bulk-bar--active' : ''}`}>
        <div className="br-bulk-metrics">
          <span><strong>{selectedBankIds.length}</strong> bank selected · {fmtAmt(bankTotal)}</span>
          <span><strong>{selectedLedgerIds.length}</strong> ledger selected · {fmtAmt(ledgerTotal)}</span>
          <span className={canBulkMatch ? 'br-text-ok' : 'br-text-warn'}>Difference: {fmtAmt(bankTotal - ledgerTotal)}</span>
        </div>

        <div className="br-bulk-actions">
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('bank')} disabled={!selectedBankIds.length}>
            <i className="fas fa-layer-group" />Categorise Bank
          </button>
          <button className="br-btn-ghost-sm" onClick={() => openClassifySelected('ledger')} disabled={!selectedLedgerIds.length}>
            <i className="fas fa-layer-group" />Categorise Ledger
          </button>
          <button className="br-btn-primary br-btn-primary--sm" onClick={submitBulkMatch} disabled={!canBulkMatch || saving}>
            <i className="fas fa-link" />Match Selected
          </button>
          <button className="br-btn-ghost-sm" onClick={clearSelections} disabled={!selectedBankIds.length && !selectedLedgerIds.length}>
            <i className="fas fa-xmark" />Clear
          </button>
        </div>
      </div>

      <div className="br-banner">
        <div className="br-banner-inner br-banner-idle">
          <i className="fas fa-circle-info" />
          <span>Select multiple unmatched bank and ledger lines. <strong>Match Selected</strong> activates only when the totals balance within tolerance.</span>
          {saving && <><div className="br-spinner br-spinner--sm" />Saving…</>}
        </div>
      </div>

      <div className="br-cols">
        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-university" />Bank Statement</span>
            <span className="br-col-cnt">{bank_lines.length} lines</span>
          </div>

          <FilterBar
            filterVal={bankFilter}
            searchVal={bankSearch}
            tabs={tabs}
            onFilterChange={(v) => setUi({ bankFilter: v })}
            onSearchChange={(v) => setUi({ bankSearch: v })}
          />

          <div className="br-col-scroll">
            {bankFiltered.length === 0 && <div className="br-col-empty">No lines match this filter.</div>}
            {bankFiltered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                side="bank"
                isSelected={selectedBankIds.includes(Number(line.id))}
                onToggleSelect={toggleId(setSelectedBankIds)}
                onUnmatch={unmatchLines}
                onClassify={(lineIds, source) => setClassifyTarget({ source, lineIds })}
              />
            ))}
          </div>
        </div>

        <div className="br-divider">
          <div className={`br-divider-icon ${canBulkMatch ? 'br-divider-icon--active' : ''}`}>
            <i className={`fas ${canBulkMatch ? 'fa-link' : 'fa-arrows-left-right'}`} />
          </div>
        </div>

        <div className="br-col">
          <div className="br-col-hd">
            <span className="br-col-title"><i className="fas fa-book-open" />Ledger</span>
            <span className="br-col-cnt">{ledger_lines.length} lines</span>
          </div>

          <FilterBar
            filterVal={ledgerFilter}
            searchVal={ledgerSearch}
            tabs={tabs}
            onFilterChange={(v) => setUi({ ledgerFilter: v })}
            onSearchChange={(v) => setUi({ ledgerSearch: v })}
          />

          <div className="br-col-scroll">
            {ledgerFiltered.length === 0 && <div className="br-col-empty">No lines match this filter.</div>}
            {ledgerFiltered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                side="ledger"
                isSelected={selectedLedgerIds.includes(Number(line.id))}
                onToggleSelect={toggleId(setSelectedLedgerIds)}
                onUnmatch={unmatchLines}
                onClassify={(lineIds, source) => setClassifyTarget({ source, lineIds })}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {classifyTarget && (
          <ClassifyModal
            target={classifyTarget}
            bankLines={bank_lines}
            ledgerLines={ledger_lines}
            onClose={() => setClassifyTarget(null)}
            onConfirm={submitClassify}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ClassifiedItemsTable = () => {
  const { current } = useBankReconStore();
  const items = [...(current.bank_lines || []).filter((l) => ['Classified', 'Bank-Only'].includes(l.match_status)).map((l) => ({ ...l, source: 'Bank' })), ...(current.ledger_lines || []).filter((l) => l.match_status === 'Classified').map((l) => ({ ...l, source: 'Ledger' }))];
  if (!items.length) return null;
  return <div className="br-card br-card--flat"><div className="br-flat-head"><h3><i className="fas fa-receipt" />Details / Classification Schedule</h3><span className="br-badge-pill">{items.length} items</span></div><div className="br-tbl-wrap"><table className="br-tbl"><thead><tr><th>Source</th><th>Date</th><th>Description</th><th>Category</th><th>Recon Classification</th><th className="num">Amount</th><th>Dr Ledger</th><th>Cr Ledger</th><th>Note</th></tr></thead><tbody>{items.map((l) => <tr key={`${l.source}-${l.id}`}><td>{l.source}</td><td style={{ whiteSpace: 'nowrap' }}>{fmtDate(l.txn_date)}</td><td style={{ maxWidth: 280 }}>{l.description}</td><td><span className="br-type-tag">{safe(l.category_name || l.bank_only_type)}</span></td><td>{safe(l.recon_classification)}</td><td className="num"><span className={l.direction === 'OUT' ? 'br-amt-out' : 'br-amt-in'}>{fmtAmt(l.amount)}</span></td><td><code>{safe(l.suggested_dr_ledger)}</code></td><td><code>{safe(l.suggested_cr_ledger)}</code></td><td style={{ color: 'var(--sb-text-3)', fontSize: 12 }}>{safe(l.journal_note)}</td></tr>)}</tbody></table></div></div>;
};

const ResultsPanel = ({ id }) => {
  const { current, fetchSingle, downloadExcel } = useBankReconStore();
  useEffect(() => { fetchSingle(id); }, [id]);
  const recon = current.reconciliation;
  const pdfDoc = useMemo(() => <DownloadBankRecon recon={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />, [recon, current.bank_lines, current.ledger_lines]);
  if (current.loading) return <div className="br-card br-card--flat br-loading"><div className="br-spinner" /><span>Loading reconciliation…</span></div>;
  if (!recon) return null;
  const acctSub = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');
  return <motion.div variants={fadeUp} initial="hidden" animate="show"><div className="br-action-bar"><div className="br-action-left"><span className="br-action-ref"><i className="fas fa-building-columns" />{recon.recon_number}</span><span className="br-action-chip"><i className="fas fa-briefcase" />{recon.company_name}</span><span className="br-action-chip"><i className="fas fa-calendar-days" />{fmtDate(recon.period_from)} – {fmtDate(recon.period_to)}</span>{acctSub && <span className="br-action-chip"><i className="fas fa-wallet" />{acctSub}</span>}</div><div className="br-action-right"><button className="br-btn-excel" onClick={() => downloadExcel(recon.id, recon.recon_number)}><i className="fas fa-file-excel" />Excel</button><PDFDownloadLink document={pdfDoc} fileName={`${recon.recon_number}.pdf`}>{({ loading }) => <button className="br-btn-pdf" disabled={loading}><i className="fas fa-file-pdf" />{loading ? 'PDF…' : 'PDF'}</button>}</PDFDownloadLink></div></div><KpiStrip recon={recon} summary={current.summary} /><Matcher /><ClassifiedItemsTable /></motion.div>;
};

const BankReconciliation = () => {
  const [nav, setNav] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { theme } = useThemeStore();
  useEffect(() => { document.title = 'Smartbooks | Bank Reconciliation'; }, []);
  const links = [{ label: 'Home', to: '/', active: true }, { label: 'Reports', to: '/reports/ledger', active: true }, { label: 'Bank Reconciliation', to: '/reports/bank-reconciliation', active: false }];
  const handleCreated = (id) => { setActiveId(id); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 300); };
  return <div className={`main-container theme-${theme}`}><Header setNav={setNav} nav={nav} /><NavBar setNav={setNav} nav={nav} /><div className={`content-container theme-${theme}`}><div className={`br-root theme-${theme}`}><div className="br-page"><PageNav pageTitle="Bank Reconciliation" links={links} /><CreateForm onCreated={handleCreated} /><HistoryGrid onOpen={setActiveId} /><AnimatePresence mode="wait">{activeId && <ResultsPanel key={activeId} id={activeId} />}</AnimatePresence></div></div></div></div>;
};

export default BankReconciliation;
