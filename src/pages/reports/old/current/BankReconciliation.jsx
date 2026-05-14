import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
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

const toISO = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const count = (n) => Number(n || 0).toLocaleString('en-US');
const safe = (v) => (v === null || v === undefined || v === '' ? '—' : v);

const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'ZAR', 'GHS', 'KES'].map((c) => ({ value: c, label: c }));
const DIRECTION_OPTIONS = [
  { value: 'all', label: 'All open items' },
  { value: 'payments', label: 'Payments: Bank Debit ↔ Ledger Credit' },
  { value: 'receipts', label: 'Receipts: Bank Credit ↔ Ledger Debit' },
];
const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Date: oldest first' },
  { value: 'date_desc', label: 'Date: newest first' },
  { value: 'amount_asc', label: 'Amount: low to high' },
  { value: 'amount_desc', label: 'Amount: high to low' },
];
const CATEGORY_OPTIONS = [
  'Bank Charges', 'VAT on Bank Charges', 'Stamp Duty', 'LC Commission', 'Interest Income',
  'Direct Debit', 'Direct Credit', 'Unposted Debit', 'Unposted Credit', 'Tax/WHT', 'Correction', 'Other'
].map((x) => ({ value: x, label: x }));

const selectPortalStyle = { menuPortal: (base) => ({ ...base, zIndex: 9999 }) };

const amountValue = (line) => Number(line?.amount || 0);
const debitValue = (line) => Number(line?.debit || 0);
const creditValue = (line) => Number(line?.credit || 0);
const absAmount = (line) => Math.abs(amountValue(line));
const sideLabel = (line, type) => {
  const dr = debitValue(line);
  const cr = creditValue(line);
  if (type === 'bank') return dr > 0 ? 'Bank Debit' : cr > 0 ? 'Bank Credit' : 'Bank Amount';
  return dr > 0 ? 'Ledger Debit' : cr > 0 ? 'Ledger Credit' : 'Ledger Amount';
};
const amountClass = (line, type) => {
  const label = sideLabel(line, type);
  return label.includes('Debit') ? 'br-neg' : 'br-pos';
};

const FormSelect = ({ label, value, onChange, options, error, required, placeholder, creatable = false }) => {
  const [open, setOpen] = useState(false);
  const Component = creatable ? CreatableSelect : Select;
  return (
    <div className="br-field">
      <label className={`br-label ${error ? 'br-label--err' : ''}`}>{label} {required && <span>*</span>}</label>
      <div className="form-wrapper">
        <Component
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`form-input-select ${error ? 'input-error' : ''}`}
          classNamePrefix="form-input-select"
          isClearable={false}
          menuPortalTarget={document.body}
          styles={selectPortalStyle}
          onMenuOpen={() => setOpen(true)}
          onMenuClose={() => setOpen(false)}
          getOptionLabel={(option) => String(option?.label || '')}
          getOptionValue={(option) => String(option?.value || '')}
        />
        <span className={`chevron-input-icon fas fa-chevron-down ${open ? 'chevron-rotate' : ''}`} />
      </div>
      {error && <span className="br-error"><i className="fas fa-circle-exclamation" /> {error}</span>}
    </div>
  );
};

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
  const [currency, setCurrency] = useState(CURRENCY_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo, setDateTo] = useState(new Date());
  const [bankFile, setBankFile] = useState(null);
  const [ledgerFile, setLedgerFile] = useState(null);
  const [balances, setBalances] = useState({
    statement_opening_balance: '', statement_closing_balance: '', ledger_opening_balance: '', ledger_closing_balance: '',
    match_tolerance_days: 3, match_tolerance_amount: 0,
  });
  const [errors, setErrors] = useState({});
  const { createReconciliation, analyzeReconciliation, creating, analyzing } = useBankReconciliationStore();
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
      company_name: companyName.trim(), bank_name: bankName.trim(), account_name: accountName.trim(), account_number: accountNumber.trim(),
      currency: currency?.value || 'NGN', notes: notes.trim(), datefrom: toISO(dateFrom), dateto: toISO(dateTo),
      bank_statement: bankFile, ledger_statement: ledgerFile, ...balances,
    });
    const id = res?.data?.id || res?.id;
    if (id) {
      onCreated(id);
      await analyzeReconciliation(id);
    }
  };

  return (
    <motion.div className="br-panel" variants={fadeUp} initial="hidden" animate="show">
      <div className="br-panel-head">
        <div>
          <h2>New Bank Reconciliation</h2>
          <p>Upload the bank statement and ledger statement. Smartbooks auto-matches equal debit/credit pairs first, then leaves the rest for manual matching or categorisation.</p>
        </div>
        <div className="br-step-pill"><i className="fas fa-wand-magic-sparkles" /> Enterprise Workflow</div>
      </div>

      <div className="br-meta-grid">
        <TextInput label="Company / Client Name" required value={companyName} onChange={setCompanyName} error={errors.companyName} placeholder="e.g. Lambert Electromec Ltd" />
        <TextInput label="Bank Name" value={bankName} onChange={setBankName} placeholder="e.g. Zenith Bank" />
        <TextInput label="Account Name" value={accountName} onChange={setAccountName} placeholder="Optional" />
        <TextInput label="Account Number" value={accountNumber} onChange={setAccountNumber} placeholder="Optional" />
        <FormSelect label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} />
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
          ['statement_opening_balance', 'Bank Opening'], ['statement_closing_balance', 'Bank Closing'], ['ledger_opening_balance', 'Ledger Opening'],
          ['ledger_closing_balance', 'Ledger Closing'], ['match_tolerance_days', 'Date Tolerance (days)'], ['match_tolerance_amount', 'Amount Tolerance'],
        ].map(([key, label]) => <div className="br-field" key={key}><label className="br-label">{label}</label><input className="form-input" value={balances[key]} onChange={(e) => update(key, e.target.value)} placeholder="0.00" /></div>)}
      </div>

      <div className="br-upload-grid">
        <FileDrop label="Bank Statement CSV" file={bankFile} onChange={setBankFile} error={errors.bankFile} help="Accepted columns: Date, Description, Debit, Credit, Balance" />
        <FileDrop label="Ledger Statement CSV" file={ledgerFile} onChange={setLedgerFile} error={errors.ledgerFile} help="Accepted columns: Date, Description, Debit, Credit, Ledger" />
      </div>

      <div className="br-field br-notes-field"><label className="br-label">Notes</label><textarea className="form-input br-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional reviewer notes, assumptions or client context" /></div>
      <div className="br-explain">
        <div><i className="fas fa-circle-info" /> Auto-match compares Bank Debit against Ledger Credit and Bank Credit against Ledger Debit.</div>
        <div><i className="fas fa-circle-info" /> Manual matching supports many-to-one and many-to-many matching until the selected difference is zero.</div>
        <div><i className="fas fa-circle-info" /> Unmatched bank charges, interest, tax and other items can be categorised for later journal posting.</div>
      </div>
      <button className="br-primary-btn" onClick={submit} disabled={creating || analyzing}>{creating || analyzing ? <><div className="br-btn-loader" /> Processing...</> : <><i className="fas fa-scale-balanced" /> Create & Auto-Match Reconciliation</>}</button>
    </motion.div>
  );
};

const Kpis = ({ recon, summary }) => (
  <div className="br-kpi-strip">
    <div className="br-kpi br-kpi--primary"><span>Open Difference</span><strong>{money(summary?.open_difference ?? recon?.unreconciled_difference)}</strong><em>{recon?.status || 'Draft'}</em></div>
    <div className="br-kpi"><span>Bank Lines</span><strong>{count(summary?.bank_total)}</strong><em>{count(summary?.matched_bank)} matched</em></div>
    <div className="br-kpi"><span>Ledger Lines</span><strong>{count(summary?.ledger_total)}</strong><em>{count(summary?.matched_ledger)} matched</em></div>
    <div className="br-kpi"><span>Categorised</span><strong>{count(summary?.classified_total)}</strong><em>ready for journal posting</em></div>
    <div className="br-kpi"><span>Open Items</span><strong>{count((summary?.unmatched_bank || 0) + (summary?.unmatched_ledger || 0))}</strong><em>left to clear</em></div>
  </div>
);

const searchableLineText = (line) => [
  line?.transaction_date,
  line?.description,
  line?.ledger_name,
  line?.ledger_number,
  line?.suggested_type,
  line?.match_status,
  line?.debit,
  line?.credit,
  line?.amount,
].filter(Boolean).join(' ').toLowerCase();

const filterLines = (lines, source, direction, sortBy, searchTerm = '') => {
  const needle = String(searchTerm || '').trim().toLowerCase();
  let out = (lines || []).filter((l) => l.match_status !== 'Matched' && l.match_status !== 'Adjustment');
  if (direction === 'payments') out = out.filter((l) => source === 'bank' ? debitValue(l) > 0 : creditValue(l) > 0);
  if (direction === 'receipts') out = out.filter((l) => source === 'bank' ? creditValue(l) > 0 : debitValue(l) > 0);
  if (needle) out = out.filter((l) => searchableLineText(l).includes(needle));
  return [...out].sort((a, b) => {
    if (sortBy === 'amount_asc') return absAmount(a) - absAmount(b);
    if (sortBy === 'amount_desc') return absAmount(b) - absAmount(a);
    if (sortBy === 'date_desc') return String(b.transaction_date).localeCompare(String(a.transaction_date));
    return String(a.transaction_date).localeCompare(String(b.transaction_date));
  });
};

const MatchSearchBox = ({ value, onChange, placeholder, resultCount, totalCount }) => (
  <div className="br-match-search">
    <div className="br-match-search-input">
      <i className="fas fa-search" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search">
          <i className="fas fa-times" />
        </button>
      ) : null}
    </div>
    <span>{count(resultCount)} of {count(totalCount)} shown</span>
  </div>
);

const LineCard = ({ line, source, selected, onToggle }) => (
  <label className={`br-line-pick ${selected ? 'selected' : ''}`}>
    <input type="checkbox" checked={selected} onChange={() => onToggle(line.id)} />
    <div className="br-line-main">
      <div className="br-line-top"><strong>{fmtDate(line.transaction_date)}</strong><span className={amountClass(line, source)}>{sideLabel(line, source)} · {money(absAmount(line))}</span></div>
      <p>{line.description}</p>
      <div className="br-line-foot"><span>Dr {money(line.debit)} · Cr {money(line.credit)}</span><em>{line.suggested_type || line.match_status}</em></div>
    </div>
  </label>
);

const MatchedItems = ({ matches, bankLines, ledgerLines }) => {
  const banks = useMemo(() => Object.fromEntries((bankLines || []).map((l) => [Number(l.id), l])), [bankLines]);
  const ledgers = useMemo(() => Object.fromEntries((ledgerLines || []).map((l) => [Number(l.id), l])), [ledgerLines]);
  const grouped = useMemo(() => {
    const map = {};
    (matches || []).forEach((m) => {
      const key = m.match_group || `M-${m.id}`;
      if (!map[key]) map[key] = { group: key, type: m.match_type, confidence: m.confidence, bank: [], ledger: [] };
      if (m.bank_line_id && banks[Number(m.bank_line_id)]) map[key].bank.push(banks[Number(m.bank_line_id)]);
      if (m.ledger_line_id && ledgers[Number(m.ledger_line_id)]) map[key].ledger.push(ledgers[Number(m.ledger_line_id)]);
    });
    return Object.values(map).slice(0, 60);
  }, [matches, banks, ledgers]);
  return (
    <div className="br-table-card br-table-card--wide">
      <h3>Matched Items</h3>
      <table className="br-table">
        <thead><tr><th>Match Group</th><th>Bank Side</th><th>Ledger Side</th><th className="num">Bank Total</th><th className="num">Ledger Total</th><th>Type</th></tr></thead>
        <tbody>{grouped.length === 0 ? <tr><td colSpan="6" className="empty">No matched items yet.</td></tr> : grouped.map((g) => {
          const bankTotal = g.bank.reduce((s, l) => s + Math.abs(amountValue(l)), 0);
          const ledgerTotal = g.ledger.reduce((s, l) => s + Math.abs(amountValue(l)), 0);
          return <tr key={g.group}><td>{g.group}</td><td>{g.bank.map((l) => `${fmtDate(l.transaction_date)} · ${money(absAmount(l))}`).join(' | ')}</td><td>{g.ledger.map((l) => `${fmtDate(l.transaction_date)} · ${money(absAmount(l))}`).join(' | ')}</td><td className="num">{money(bankTotal)}</td><td className="num">{money(ledgerTotal)}</td><td>{g.type}</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
};

const ManualMatchWorkspace = ({ reconciliation, bankLines, ledgerLines }) => {
  const [selectedBank, setSelectedBank] = useState([]);
  const [selectedLedger, setSelectedLedger] = useState([]);
  const [direction, setDirection] = useState(DIRECTION_OPTIONS[0]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const { manualMatchLines, classifyLines, manualMatching, classifying } = useBankReconciliationStore();

  const allVisibleBank = useMemo(() => filterLines(bankLines, 'bank', direction.value, sortBy.value), [bankLines, direction, sortBy]);
  const allVisibleLedger = useMemo(() => filterLines(ledgerLines, 'ledger', direction.value, sortBy.value), [ledgerLines, direction, sortBy]);
  const visibleBank = useMemo(() => filterLines(bankLines, 'bank', direction.value, sortBy.value, bankSearch), [bankLines, direction, sortBy, bankSearch]);
  const visibleLedger = useMemo(() => filterLines(ledgerLines, 'ledger', direction.value, sortBy.value, ledgerSearch), [ledgerLines, direction, sortBy, ledgerSearch]);
  const bankSelectedLines = useMemo(() => (bankLines || []).filter((l) => selectedBank.includes(Number(l.id))), [bankLines, selectedBank]);
  const ledgerSelectedLines = useMemo(() => (ledgerLines || []).filter((l) => selectedLedger.includes(Number(l.id))), [ledgerLines, selectedLedger]);
  const bankTotal = bankSelectedLines.reduce((sum, line) => sum + amountValue(line), 0);
  const ledgerTotal = ledgerSelectedLines.reduce((sum, line) => sum + amountValue(line), 0);
  const difference = Number((bankTotal - ledgerTotal).toFixed(2));
  const tolerance = Number(reconciliation?.match_tolerance_amount || 0);
  const canMatch = selectedBank.length > 0 && selectedLedger.length > 0 && Math.abs(difference) <= tolerance;

  const toggle = (setter) => (id) => setter((s) => s.includes(Number(id)) ? s.filter((x) => x !== Number(id)) : [...s, Number(id)]);
  const clear = () => { setSelectedBank([]); setSelectedLedger([]); setNotes(''); };
  const clearFilters = () => { setBankSearch(''); setLedgerSearch(''); };
  const saveMatch = async () => { const res = await manualMatchLines({ reconciliation_id: reconciliation.id, bank_line_ids: selectedBank, ledger_line_ids: selectedLedger, notes }); if (res) clear(); };
  const classifyBank = async () => { const res = await classifyLines({ reconciliation_id: reconciliation.id, source: 'Bank', line_ids: selectedBank, category: category?.value || '', notes }); if (res) clear(); };
  const classifyLedger = async () => { const res = await classifyLines({ reconciliation_id: reconciliation.id, source: 'Ledger', line_ids: selectedLedger, category: category?.value || '', notes }); if (res) clear(); };

  return (
    <div className="br-manual-card">
      <div className="br-manual-head">
        <div>
          <h3>Manual Matching Workspace</h3>
          <p>Select transactions side by side. When selected Bank Debit equals selected Ledger Credit, or Bank Credit equals Ledger Debit, the selected difference becomes zero and you can match them. Items that will never match can be classified into categories for Excel posting schedules.</p>
        </div>
        <div className={`br-diff-pill ${Math.abs(difference) <= tolerance ? 'ok' : 'warn'}`}>Selected Difference: {money(difference)}</div>
      </div>

      <div className="br-workflow-controls">
        <FormSelect label="Matching View" value={direction} onChange={(opt) => { setDirection(opt); clear(); clearFilters(); }} options={DIRECTION_OPTIONS} />
        <FormSelect label="Sort Open Items" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
        <FormSelect label="Classification Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} creatable placeholder="Type a category e.g. Bank Charges" />
        <TextInput label="Notes" value={notes} onChange={setNotes} placeholder="Optional match/classification note" />
      </div>

      <div className="br-selected-summary">
        <div><span>Bank selected</span><strong>{money(Math.abs(bankTotal))}</strong></div>
        <div><span>Ledger selected</span><strong>{money(Math.abs(ledgerTotal))}</strong></div>
        <div><span>Tolerance</span><strong>{money(tolerance)}</strong></div>
        <div><span>Rule</span><strong>Bank Dr ↔ Ledger Cr / Bank Cr ↔ Ledger Dr</strong></div>
      </div>

      <div className="br-manual-actions">
        <button className="br-primary-btn br-primary-btn--small" onClick={saveMatch} disabled={!canMatch || manualMatching}>{manualMatching ? 'Saving...' : 'Match Selected Lines'}</button>
        <button className="br-soft-btn" onClick={classifyBank} disabled={selectedBank.length === 0 || classifying}>{classifying ? 'Classifying...' : 'Classify Selected Bank Line(s)'}</button>
        <button className="br-soft-btn" onClick={classifyLedger} disabled={selectedLedger.length === 0 || classifying}>{classifying ? 'Classifying...' : 'Classify Selected Ledger Line(s)'}</button>
        <button className="br-clear-btn" onClick={clear}>Clear</button>
      </div>

      <div className="br-side-by-side">
        <div className="br-match-column">
          <div className="br-match-title"><h4>Bank Statement</h4><span>Debit and credit figures from uploaded bank CSV</span></div>
          <MatchSearchBox
            value={bankSearch}
            onChange={setBankSearch}
            placeholder="Search bank lines by date, amount, description..."
            resultCount={visibleBank.length}
            totalCount={allVisibleBank.length}
          />
          <div className="br-line-list">{visibleBank.length === 0 ? <div className="br-empty-state">No open bank lines match this search/view.</div> : visibleBank.map((line) => <LineCard key={line.id} line={line} source="bank" selected={selectedBank.includes(Number(line.id))} onToggle={toggle(setSelectedBank)} />)}</div>
        </div>
        <div className="br-match-column">
          <div className="br-match-title"><h4>Ledger Statement</h4><span>Debit and credit figures from uploaded ledger CSV</span></div>
          <MatchSearchBox
            value={ledgerSearch}
            onChange={setLedgerSearch}
            placeholder="Search ledger lines by ledger, date, amount, description..."
            resultCount={visibleLedger.length}
            totalCount={allVisibleLedger.length}
          />
          <div className="br-line-list">{visibleLedger.length === 0 ? <div className="br-empty-state">No open ledger lines match this search/view.</div> : visibleLedger.map((line) => <LineCard key={line.id} line={line} source="ledger" selected={selectedLedger.includes(Number(line.id))} onToggle={toggle(setSelectedLedger)} />)}</div>
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
  const rerun = async () => { if (!id) return; await analyzeReconciliation(id); };
  if (!recon) return null;
  const accountLabel = [recon.bank_name, recon.account_name, recon.account_number].filter(Boolean).join(' · ');
  const openBank = (current.bank_lines || []).filter((l) => l.match_status !== 'Matched' && l.match_status !== 'Adjustment');
  const openLedger = (current.ledger_lines || []).filter((l) => l.match_status !== 'Matched' && l.match_status !== 'Adjustment');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show">
      <div className="br-action-bar">
        <div className="br-action-left"><div className="br-badge"><i className="fas fa-building-columns" /> {recon.reconciliation_number}</div><div className="br-meta"><i className="fas fa-briefcase" /> {recon.company_name}</div><div className="br-meta"><i className="fas fa-calendar" /> {fmtDate(recon.date_from)} - {fmtDate(recon.date_to)}</div>{accountLabel && <div className="br-meta"><i className="fas fa-wallet" /> {accountLabel}</div>}</div>
        <div className="br-action-right"><button className="br-soft-btn" onClick={rerun} disabled={analyzing}>{analyzing ? 'Analyzing...' : 'Re-run Auto Match'}</button><button className="br-excel-btn" onClick={() => downloadReconciliationExcel(recon.id, recon.reconciliation_number)}><i className="fas fa-file-excel" /> Excel</button><PDFDownloadLink document={pdfDoc} fileName={`${recon.reconciliation_number}.pdf`}>{({ loading }) => <button className="br-pdf-btn" disabled={loading}><i className="fas fa-file-pdf" /> {loading ? 'PDF...' : 'PDF'}</button>}</PDFDownloadLink></div>
      </div>
      <Kpis recon={recon} summary={current.summary} />
      <ManualMatchWorkspace reconciliation={recon} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />
      <div className="br-report-paper"><div className="br-report-head"><h2>Reconciliation Analysis</h2><p>Open items are the transactions still left after auto-match, manual matching and category clearing.</p></div><div className="br-columns">
        <MatchedItems matches={current.matches || []} bankLines={current.bank_lines || []} ledgerLines={current.ledger_lines || []} />
        <div className="br-table-card"><h3>Classified / Posting Schedule</h3><table className="br-table"><thead><tr><th>Category</th><th>Narration</th><th className="num">Amount</th><th>Source</th></tr></thead><tbody>{(current.adjustments || []).length === 0 ? <tr><td colSpan="4" className="empty">No classified items yet.</td></tr> : current.adjustments.map((a) => <tr key={a.id}><td><span className="br-tag br-tag--warn">{a.adjustment_type}</span></td><td>{a.narration}</td><td className="num">{money(a.amount)}</td><td>{a.source_line_type}</td></tr>)}</tbody></table></div>
        <div className="br-table-card"><h3>Open Bank Lines</h3><table className="br-table"><thead><tr><th>Date</th><th>Description</th><th className="num">Debit</th><th className="num">Credit</th><th>Class</th></tr></thead><tbody>{openBank.length === 0 ? <tr><td colSpan="5" className="empty">No open bank lines.</td></tr> : openBank.slice(0, 120).map((l) => <tr key={l.id}><td>{fmtDate(l.transaction_date)}</td><td>{l.description}</td><td className="num">{money(l.debit)}</td><td className="num">{money(l.credit)}</td><td>{l.suggested_type}</td></tr>)}</tbody></table></div>
        <div className="br-table-card br-table-card--wide"><h3>Open Ledger Lines</h3><table className="br-table"><thead><tr><th>Date</th><th>Description</th><th>Ledger</th><th className="num">Debit</th><th className="num">Credit</th><th>Class</th></tr></thead><tbody>{openLedger.length === 0 ? <tr><td colSpan="6" className="empty">No open ledger lines.</td></tr> : openLedger.slice(0, 160).map((l) => <tr key={l.id}><td>{fmtDate(l.transaction_date)}</td><td>{l.description}</td><td>{safe(l.ledger_name || l.ledger_number)}</td><td className="num">{money(l.debit)}</td><td className="num">{money(l.credit)}</td><td>{l.suggested_type}</td></tr>)}</tbody></table></div>
      </div></div>
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
