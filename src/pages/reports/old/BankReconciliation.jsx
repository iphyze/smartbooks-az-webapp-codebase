import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../NavBar';
import Header from '../Header';
import PageNav from '../../components/PageNav';
import useThemeStore from '../../stores/useThemeStore';
import useBankReconciliationStore from '../../stores/useBankReconciliationStore';
import DownloadBankReconciliation from './DownloadBankReconciliation';
import './BankReconciliation.css';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, y: -8 },
};

const toISO = (d) => (
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''
);
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const count = (n) => Number(n || 0).toLocaleString('en-US');
const safe = (v) => (v === null || v === undefined || v === '' ? '—' : v);
const amountClass = (n) => Number(n || 0) < 0 ? 'br-neg' : 'br-pos';
const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES'];
const ADJUSTMENT_TYPES = ['Bank Charge', 'Bank Interest', 'Direct Debit', 'Direct Credit', 'Correction', 'Other'];

const TextInput = ({ label, required, value, onChange, error, placeholder, type = 'text' }) => (
  <div className="br-field">
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label} {required && <span>*</span>}</label>
    <input type={type} className={`form-input ${error ? 'input-error' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    {error && <span className="br-error"><i className="fas fa-circle-exclamation" /> {error}</span>}
  </div>
);

const FileDrop = ({ label, file, onChange, error, help }) => (
  <div className="br-upload-card">
    <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label} <span>*</span></label>
    <label className={`br-file-box ${error ? 'br-file-box--err' : ''}`}>
      <input type="file" accept=".csv" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <i className="fas fa-cloud-arrow-up" />
      <strong>{file?.name || 'Choose CSV file'}</strong>
      <small>{help}</small>
    </label>
    {error && <span className="br-error"><i className="fas fa-circle-exclamation" /> {error}</span>}
  </div>
);

const CreatePanel = ({ onCreated }) => {
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [notes, setNotes] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState(new Date());
  const [bankFile, setBankFile] = useState(null);
  const [ledgerFile, setLedgerFile] = useState(null);
  const [balances, setBalances] = useState({
    statement_opening_balance: '',
    statement_closing_balance: '',
    ledger_opening_balance: '',
    ledger_closing_balance: '',
    match_tolerance_days: 3,
    match_tolerance_amount: 0,
  });
  const [errors, setErrors] = useState({});
  const { createReconciliation, analyzeReconciliation, fetchSingleReconciliation, creating, analyzing } = useBankReconciliationStore();

  const update = (key, value) => setBalances((s) => ({ ...s, [key]: value }));

  const validate = () => {
    const e = {};
    if (!companyName.trim()) e.companyName = 'Required';
    if (!dateFrom) e.dateFrom = 'Required';
    if (!dateTo) e.dateTo = 'Required';
    if (dateFrom && dateTo && dateFrom > dateTo) e.dateTo = 'Date To must be after Date From';
    if (!bankFile) e.bankFile = 'Required';
    if (!ledgerFile) e.ledgerFile = 'Required';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const res = await createReconciliation({
      company_name: companyName.trim(),
      bank_name: bankName.trim(),
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      currency,
      notes: notes.trim(),
      datefrom: toISO(dateFrom),
      dateto: toISO(dateTo),
      bank_statement: bankFile,
      ledger_statement: ledgerFile,
      ...balances,
    });

    const id = res?.data?.id || res?.id;
    if (id) {
      onCreated(id);
      await analyzeReconciliation(id);
      await fetchSingleReconciliation(id);
    }
  };

  return (
    <motion.div className="br-panel" variants={fadeUp} initial="hidden" animate="show">
      <div className="br-panel-head">
        <div>
          <h2>New Bank Reconciliation</h2>
          <p>Upload a bank statement and ledger statement for any client or company. Smartbooks will auto-match first, then you can manually clear outstanding items side by side.</p>
        </div>
        <div className="br-step-pill"><i className="fas fa-wand-magic-sparkles" /> Consultancy Workflow</div>
      </div>

      <div className="br-meta-grid">
        <TextInput label="Company / Client Name" required value={companyName} onChange={setCompanyName} error={errors.companyName} placeholder="e.g. Lambert Electromec Ltd" />
        <TextInput label="Bank Name" value={bankName} onChange={setBankName} placeholder="e.g. Zenith Bank" />
        <TextInput label="Account Name" value={accountName} onChange={setAccountName} placeholder="Optional" />
        <TextInput label="Account Number" value={accountNumber} onChange={setAccountNumber} placeholder="Optional" />
        <div className="br-field">
          <label className="br-label">Currency</label>
          <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="br-grid br-grid--period">
        <div className="br-field">
          <label className={`br-label ${errors.dateFrom ? 'br-label--err' : ''}`}>Date From <span>*</span></label>
          <div className="form-wrapper"><DatePicker selected={dateFrom} onChange={setDateFrom} className={`form-input ${errors.dateFrom ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" /><span className="chevron-input-icon fas fa-calendar" /></div>
          {errors.dateFrom && <span className="br-error"><i className="fas fa-circle-exclamation" /> {errors.dateFrom}</span>}
        </div>
        <div className="br-field">
          <label className={`br-label ${errors.dateTo ? 'br-label--err' : ''}`}>Date To <span>*</span></label>
          <div className="form-wrapper"><DatePicker selected={dateTo} onChange={setDateTo} className={`form-input ${errors.dateTo ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" minDate={dateFrom} /><span className="chevron-input-icon fas fa-calendar" /></div>
          {errors.dateTo && <span className="br-error"><i className="fas fa-circle-exclamation" /> {errors.dateTo}</span>}
        </div>
      </div>

      <div className="br-balance-grid">
        {[
          ['statement_opening_balance', 'Bank Opening'],
          ['statement_closing_balance', 'Bank Closing'],
          ['ledger_opening_balance', 'Ledger Opening'],
          ['ledger_closing_balance', 'Ledger Closing'],
          ['match_tolerance_days', 'Date Tolerance (days)'],
          ['match_tolerance_amount', 'Amount Tolerance'],
        ].map(([key, label]) => <div className="br-field" key={key}><label className="br-label">{label}</label><input className="form-input" value={balances[key]} onChange={(e) => update(key, e.target.value)} placeholder="0.00" /></div>)}
      </div>

      <div className="br-upload-grid">
        <FileDrop label="Bank Statement CSV" file={bankFile} onChange={setBankFile} error={errors.bankFile} help="Columns accepted: Date, Description, Debit, Credit, Balance" />
        <FileDrop label="Ledger Statement CSV" file={ledgerFile} onChange={setLedgerFile} error={errors.ledgerFile} help="Columns accepted: Date, Description, Debit, Credit, Ledger" />
      </div>

      <div className="br-field br-notes-field"><label className="br-label">Notes</label><textarea className="form-input br-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional reviewer notes, assumptions or client context" /></div>

      <div className="br-explain">
        <div><i className="fas fa-circle-info" /> Auto-match runs first. You can then manually match bank lines against ledger lines until the selected difference is zero.</div>
        <div><i className="fas fa-circle-info" /> Bank charges, tax, interest and direct debits can be classified as adjustments instead of matched to ledger lines.</div>
        <div><i className="fas fa-circle-info" /> Ledger-only receipts/payments remain outstanding deposits or outstanding payments.</div>
      </div>

      <button className="br-primary-btn" onClick={submit} disabled={creating || analyzing}>{creating || analyzing ? <><div className="br-btn-loader" /> Processing...</> : <><i className="fas fa-scale-balanced" /> Create & Analyze Reconciliation</>}</button>
    </motion.div>
  );
};

const Kpis = ({ recon, summary }) => (
  <div className="br-kpi-strip">
    <div className="br-kpi br-kpi--primary"><span>Difference</span><strong>{money(recon?.unreconciled_difference)}</strong><em>{recon?.status || 'Draft'}</em></div>
    <div className="br-kpi"><span>Bank Lines</span><strong>{count(summary?.bank_total)}</strong><em>{count(summary?.matched_bank)} matched</em></div>
    <div className="br-kpi"><span>Ledger Lines</span><strong>{count(summary?.ledger_total)}</strong><em>{count(summary?.unmatched_ledger)} unmatched</em></div>
    <div className="br-kpi"><span>Suggestions</span><strong>{count(summary?.suggested_bank)}</strong><em>charges / interest / tax</em></div>
    <div className="br-kpi"><span>Adjusted Bank</span><strong>{money(recon?.adjusted_bank_balance)}</strong><em>{safe(recon?.currency)}</em></div>
  </div>
);

const MiniLine = ({ line, selected, onToggle, type }) => (
  <label className={`br-line-pick ${selected ? 'selected' : ''} ${line.match_status === 'Matched' ? 'matched' : ''}`}>
    <input type="checkbox" checked={selected} disabled={line.match_status === 'Matched'} onChange={() => onToggle(line.id)} />
    <div className="br-line-main">
      <div className="br-line-top"><strong>{fmtDate(line.transaction_date)}</strong><span className={amountClass(line.amount)}>{money(line.amount)}</span></div>
      <p>{line.description}</p>
      <div className="br-line-foot">
        <span>{type === 'bank' ? `Dr ${money(line.debit)} · Cr ${money(line.credit)}` : `${safe(line.ledger_name || line.ledger_number)} · Dr ${money(line.debit)} · Cr ${money(line.credit)}`}</span>
        <em>{line.match_status}{line.suggested_type && line.suggested_type !== 'Unknown' ? ` · ${line.suggested_type}` : ''}</em>
      </div>
    </div>
  </label>
);

const ManualMatchPanel = ({ reconciliation, bankLines, ledgerLines }) => {
  const [selectedBank, setSelectedBank] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState([]);
  const [adjustmentType, setAdjustmentType] = useState('Bank Charge');
  const [notes, setNotes] = useState('');
  const { manualMatchLines, classifyBankAdjustment, manualMatching, classifying } = useBankReconciliationStore();

  const openBank = useMemo(() => (bankLines || []).filter((l) => l.match_status !== 'Matched'), [bankLines]);
  const openLedger = useMemo(() => (ledgerLines || []).filter((l) => l.match_status !== 'Matched'), [ledgerLines]);
  const bankTotal = useMemo(() => selectedBank.reduce((sum, id) => sum + Number((bankLines || []).find((l) => l.id === id)?.amount || 0), 0), [selectedBank, bankLines]);
  const ledgerTotal = useMemo(() => selectedLedger.reduce((sum, id) => sum + Number((ledgerLines || []).find((l) => l.id === id)?.amount || 0), 0), [selectedLedger, ledgerLines]);
  const difference = Number((bankTotal - ledgerTotal).toFixed(2));
  const canMatch = selectedBank.length > 0 && selectedLedger.length > 0 && Math.abs(difference) <= Number(reconciliation?.match_tolerance_amount || 0);

  const toggleBank = (id) => setSelectedBank((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleLedger = (id) => setSelectedLedger((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const clearSelection = () => { setSelectedBank([]); setSelectedLedger([]); setNotes(''); };

  const saveMatch = async () => {
    const res = await manualMatchLines({ reconciliation_id: reconciliation.id, bank_line_ids: selectedBank, ledger_line_ids: selectedLedger, notes });
    if (res) clearSelection();
  };

  const saveAdjustment = async () => {
    const res = await classifyBankAdjustment({ reconciliation_id: reconciliation.id, bank_line_ids: selectedBank, adjustment_type: adjustmentType, notes });
    if (res) clearSelection();
  };

  return (
    <div className="br-manual-card">
      <div className="br-manual-head">
        <div>
          <h3>Manual Matching Workspace</h3>
          <p>Auto-matches are already cleared. Select one or more bank statement lines and one or more ledger lines where the values offset each other. For bank charges, interest, tax or direct debits, select only the bank line and classify it as an adjustment.</p>
        </div>
        <div className={`br-diff-pill ${Math.abs(difference) <= Number(reconciliation?.match_tolerance_amount || 0) ? 'ok' : 'warn'}`}>Selected Difference: {money(difference)}</div>
      </div>

      <div className="br-selected-summary">
        <div><span>Bank selected</span><strong>{money(bankTotal)}</strong></div>
        <div><span>Ledger selected</span><strong>{money(ledgerTotal)}</strong></div>
        <div><span>Tolerance</span><strong>{money(reconciliation?.match_tolerance_amount)}</strong></div>
        <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional matching note" />
      </div>

      <div className="br-manual-actions">
        <button className="br-primary-btn br-primary-btn--small" onClick={saveMatch} disabled={!canMatch || manualMatching}>{manualMatching ? 'Saving...' : 'Match Selected Lines'}</button>
        <select className="form-input br-adjust-select" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value)}>{ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <button className="br-soft-btn" onClick={saveAdjustment} disabled={selectedBank.length === 0 || classifying}>{classifying ? 'Classifying...' : 'Classify Selected Bank Line(s)'}</button>
        <button className="br-clear-btn" onClick={clearSelection}>Clear</button>
      </div>

      <div className="br-side-by-side">
        <div className="br-match-column">
          <div className="br-match-title"><h4>Bank Statement</h4><span>Debit / credit figures from bank CSV</span></div>
          <div className="br-line-list">{openBank.length === 0 ? <div className="br-empty-state">All bank lines cleared.</div> : openBank.map((line) => <MiniLine key={line.id} line={line} selected={selectedBank.includes(line.id)} onToggle={toggleBank} type="bank" />)}</div>
        </div>
        <div className="br-match-column">
          <div className="br-match-title"><h4>Ledger Statement</h4><span>Debit / credit figures from ledger CSV</span></div>
          <div className="br-line-list">{openLedger.length === 0 ? <div className="br-empty-state">All ledger lines cleared.</div> : openLedger.map((line) => <MiniLine key={line.id} line={line} selected={selectedLedger.includes(line.id)} onToggle={toggleLedger} type="ledger" />)}</div>
        </div>
      </div>
    </div>
  );
};

const ResultsPanel = ({ id }) => {
  const { current, fetchSingleReconciliation, analyzeReconciliation, downloadReconciliationExcel, analyzing } = useBankReconciliationStore();

  useEffect(() => { if (id) fetchSingleReconciliation(id); }, [id, fetchSingleReconciliation]);

  const recon = current.reconciliation;
  const pdfDoc = useMemo(() => <DownloadBankReconciliation reconciliation={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} adjustments={current.adjustments || []} />, [recon, current.bank_lines, current.ledger_lines, current.adjustments]);

  const rerun = async () => {
    if (!id) return;
    await analyzeReconciliation(id);
    fetchSingleReconciliation(id);
  };

  if (!recon) return null;

  const unmatchedBank = (current.bank_lines || []).filter((l) => l.match_status !== 'Matched');
  const unmatchedLedger = (current.ledger_lines || []).filter((l) => l.match_status !== 'Matched');
  const accountLabel = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="br-action-bar">
        <div className="br-action-left">
          <div className="br-badge"><i className="fas fa-building-columns" /> {recon.reconciliation_number}</div>
          <div className="br-meta"><i className="fas fa-briefcase" /> {recon.company_name}</div>
          <div className="br-meta"><i className="fas fa-calendar" /> {fmtDate(recon.date_from)} - {fmtDate(recon.date_to)}</div>
          {accountLabel && <div className="br-meta"><i className="fas fa-wallet" /> {accountLabel}</div>}
        </div>
        <div className="br-action-right">
          <button className="br-soft-btn" onClick={rerun} disabled={analyzing}>{analyzing ? 'Analyzing...' : 'Re-run Auto Match'}</button>
          <button className="br-excel-btn" onClick={() => downloadReconciliationExcel(recon.id, recon.reconciliation_number)}><i className="fas fa-file-excel" /> Excel</button>
          <PDFDownloadLink document={pdfDoc} fileName={`${recon.reconciliation_number}.pdf`}>{({ loading }) => <button className="br-pdf-btn" disabled={loading}><i className="fas fa-file-pdf" /> {loading ? 'PDF...' : 'PDF'}</button>}</PDFDownloadLink>
        </div>
      </div>

      <Kpis recon={recon} summary={current.summary} />
      <ManualMatchPanel reconciliation={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />

      <div className="br-report-paper">
        <div className="br-report-head"><h2>Reconciliation Analysis</h2><p>Matched items are cleared. Remaining items are either timing differences or proposed accounting adjustments.</p></div>
        <div className="br-columns">
          <div className="br-table-card"><h3>Suggested Adjustments</h3><table className="br-table"><thead><tr><th>Type</th><th>Narration</th><th className="num">Amount</th><th>Status</th></tr></thead><tbody>{(current.adjustments || []).length === 0 ? <tr><td colSpan="4" className="empty">No suggested adjustments.</td></tr> : current.adjustments.map((a) => <tr key={a.id}><td><span className="br-tag br-tag--warn">{a.adjustment_type}</span></td><td>{a.narration}</td><td className="num">{money(a.amount)}</td><td>{a.journal_status}</td></tr>)}</tbody></table></div>
          <div className="br-table-card"><h3>Open Bank Lines</h3><table className="br-table"><thead><tr><th>Date</th><th>Description</th><th className="num">Amount</th><th>Class</th></tr></thead><tbody>{unmatchedBank.length === 0 ? <tr><td colSpan="4" className="empty">No open bank lines.</td></tr> : unmatchedBank.slice(0, 80).map((l) => <tr key={l.id}><td>{fmtDate(l.transaction_date)}</td><td>{l.description}</td><td className="num">{money(l.amount)}</td><td>{l.suggested_type}</td></tr>)}</tbody></table></div>
          <div className="br-table-card br-table-card--wide"><h3>Open Ledger Lines / Timing Differences</h3><table className="br-table"><thead><tr><th>Date</th><th>Description</th><th>Ledger</th><th className="num">Amount</th><th>Class</th></tr></thead><tbody>{unmatchedLedger.length === 0 ? <tr><td colSpan="5" className="empty">No open ledger lines.</td></tr> : unmatchedLedger.slice(0, 120).map((l) => <tr key={l.id}><td>{fmtDate(l.transaction_date)}</td><td>{l.description}</td><td>{safe(l.ledger_name || l.ledger_number)}</td><td className="num">{money(l.amount)}</td><td>{l.suggested_type}</td></tr>)}</tbody></table></div>
        </div>
      </div>
    </motion.div>
  );
};

const HistoryPanel = ({ onOpen }) => {
  const { reconciliations, fetchReconciliations } = useBankReconciliationStore();
  useEffect(() => { fetchReconciliations(); }, [fetchReconciliations]);
  return <div className="br-history"><div className="br-history-head"><h3>Recent Reconciliations</h3><button onClick={() => fetchReconciliations()}><i className="fas fa-rotate" /> Refresh</button></div><div className="br-history-list">{(reconciliations.data || []).slice(0, 6).map((r) => <button key={r.id} onClick={() => onOpen(r.id)}><strong>{r.reconciliation_number}</strong><span>{r.company_name || 'External Client'}</span><em>{r.status} · {r.currency || ''} difference {money(r.unreconciled_difference)}</em></button>)}</div></div>;
};

const BankReconciliation = () => {
  const [nav, setNav] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const { theme } = useThemeStore();
  useEffect(() => { document.title = 'Smartbooks | Bank Reconciliation'; }, []);
  const links = [{ label: 'Home', to: '/', active: true }, { label: 'Reports', to: '/reports/ledger', active: true }, { label: 'Bank Reconciliation', to: '/reports/bank-reconciliation', active: false }];
  return <div className={`main-container theme-${theme}`}><Header setNav={setNav} nav={nav} /><NavBar setNav={setNav} nav={nav} /><div className={`content-container theme-${theme}`}><div className={`br-root theme-${theme}`}><div className="br-page"><PageNav pageTitle="Bank Reconciliation" links={links} /><CreatePanel onCreated={setActiveId} /><HistoryPanel onOpen={setActiveId} /><AnimatePresence mode="wait">{activeId && <ResultsPanel id={activeId} />}</AnimatePresence></div></div></div></div>;
};

export default BankReconciliation;
