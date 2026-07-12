import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import ChartSearchableSelect from '../../../components/ChartSearchableSelect';
import useBankReconStore from '../../../stores/useBankReconStore';
import useAuthStore from '../../../stores/useAuthStore';
import { CURRENCY_OPTIONS, toISO } from './BankReconUtils';
import { Field, FileDrop } from './BankReconCommon';

const getCreatedReconId = (response) => {
  const value = response?.data?.id
    ?? response?.data?.recon_id
    ?? response?.id
    ?? response?.recon_id
    ?? response?.data?.data?.id
    ?? response?.data?.data?.recon_id;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const BankReconCreateForm = ({ onCreated }) => {
  const accountingYear = Number(useAuthStore((state) => state.user?.accounting_period) || new Date().getFullYear());
  const [open, setOpen] = useState(true);
  const [errors, setErrors] = useState({});
  const [company, setCo] = useState('');
  const [bankName, setBN] = useState('');
  const [acctName, setAN] = useState('');
  const [acctNo, setANo] = useState('');
  const [currency, setCCY] = useState('NGN');
  const [from, setFrom] = useState(() => new Date(accountingYear, 0, 1));
  const [to, setTo] = useState(() => new Date(accountingYear, 11, 31));
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
      company_name: company.trim(),
      bank_name: bankName.trim(),
      account_name: acctName.trim(),
      account_number: acctNo.trim(),
      currency,
      period_from: toISO(from),
      period_to: toISO(to),
      bank_file: bankFile,
      ledger_file: ledgerFile,
      notes: notes.trim(),
      ...bals,
    });

    const createdId = getCreatedReconId(res);
    if (createdId) {
      setOpen(false);
      onCreated(createdId);
    }
  };

  return (
    <div className={`br-card ${open ? '' : 'br-card--collapsed'}`}>
      <button className="br-card-head" onClick={() => setOpen((o) => !o)}>
        <div className="br-card-head-left">
          <div className="br-card-icon"><i className="fas fa-scale-balanced" /></div>
          <div className="br-card-head-text">
            <h2>New Bank Reconciliation</h2>
            <p>Upload bank and ledger statements, auto-match equal items, then classify remaining reconciling items into the ZBN-style summary.</p>
          </div>
        </div>
        <div className="br-card-chevron"><i className={`fas fa-chevron-${open ? 'up' : 'down'}`} /></div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
            <div className="br-form-body">
              <div className="br-grid br-grid--5">
                <Field label="Company / Client" required error={errors.company}>
                  <input className={`form-input ${errors.company ? 'input-error' : ''}`} value={company} onChange={(e) => { setCo(e.target.value); clearErr('company'); }} placeholder="e.g. Lambert Electromec Ltd" />
                </Field>
                <Field label="Bank Name"><input className="form-input" value={bankName} onChange={(e) => setBN(e.target.value)} placeholder="e.g. Zenith Bank" /></Field>
                <Field label="Account Name"><input className="form-input" value={acctName} onChange={(e) => setAN(e.target.value)} placeholder="Optional" /></Field>
                <Field label="Account Number"><input className="form-input" value={acctNo} onChange={(e) => setANo(e.target.value)} placeholder="Optional" /></Field>
                <Field label="Currency"><div className="filter-wrapper"><ChartSearchableSelect options={CURRENCY_OPTIONS} value={currency} onChange={setCCY} className="box-filter-limit" /></div></Field>
              </div>

              <div className="br-grid br-grid--6">
                <Field label="Period From" required error={errors.from}>
                  <div className="form-wrapper">
                    <DatePicker selected={from} onChange={(d) => { setFrom(d); clearErr('from'); }} className={`form-input ${errors.from ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                    <span className="chevron-input-icon fas fa-calendar" />
                  </div>
                </Field>
                <Field label="Period To" required error={errors.to}>
                  <div className="form-wrapper">
                    <DatePicker selected={to} onChange={(d) => { setTo(d); clearErr('to'); }} minDate={from || undefined} className={`form-input ${errors.to ? 'input-error' : ''}`} wrapperClassName="input-date-picker" dateFormat="yyyy-MM-dd" showMonthDropdown showYearDropdown dropdownMode="select" />
                    <span className="chevron-input-icon fas fa-calendar" />
                  </div>
                </Field>
                {[['bank_opening', 'Bank Opening'], ['bank_closing', 'Bank Closing'], ['ledger_opening', 'Ledger Opening'], ['ledger_closing', 'Ledger Closing']].map(([k, lbl]) => (
                  <Field key={k} label={lbl}><input className="form-input" value={bals[k]} onChange={(e) => upd(k, e.target.value)} placeholder="0.00" /></Field>
                ))}
              </div>

              <div className="br-grid br-grid--4">
                <Field label="Date Tolerance (days)"><input className="form-input" type="number" min={0} max={30} value={bals.tolerance_days} onChange={(e) => upd('tolerance_days', e.target.value)} /></Field>
                <Field label="Amount Tolerance"><input className="form-input" value={bals.tolerance_amount} onChange={(e) => upd('tolerance_amount', e.target.value)} placeholder="0.00" /></Field>
                <FileDrop label="Bank Statement" file={bankFile} onChange={(f) => { setBF(f); clearErr('bankFile'); }} error={errors.bankFile} hint="Date · Description · Debit · Credit · Balance" />
                <FileDrop label="Ledger Statement" file={ledgerFile} onChange={(f) => { setLF(f); clearErr('ledgerFile'); }} error={errors.ledgerFile} hint="Date · Description · Debit · Credit · Ledger · Balance" />
              </div>

              <Field label="Notes"><textarea className="form-input br-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes, assumptions or client context…" /></Field>

              <div className="br-hints">
                <div className="br-hint"><i className="fas fa-wand-magic-sparkles" /><span>Automatic matches disappear from the open matching area but can be unlinked.</span></div>
                <div className="br-hint"><i className="fas fa-arrows-left-right" /><span>Switch between Bank Debits ↔ Ledger Credits and Bank Credits ↔ Ledger Debits during manual matching.</span></div>
                <div className="br-hint"><i className="fas fa-file-excel" /><span>Excel export mirrors the ZBN template: Recon, Details, Bank, Ledger and category extracts.</span></div>
              </div>

              <div className="br-form-actions">
                <button className="br-btn-primary" onClick={submit} disabled={creating}>
                  {creating ? <><div className="br-spinner" />Processing…</> : <><i className="fas fa-scale-balanced" />Create & Auto-Match</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BankReconCreateForm;
