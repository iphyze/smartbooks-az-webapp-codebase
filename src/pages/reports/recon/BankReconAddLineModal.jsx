import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import { fmtAmt, toISO } from './BankReconUtils';
import { Field } from './BankReconCommon';
import 'react-datepicker/dist/react-datepicker.css';

const BankReconAddLineModal = ({ recon, onClose, onAdd }) => {
  const [source,      setSource]      = useState('bank');
  const [txnDate,     setTxnDate]     = useState(new Date());
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [direction,   setDirection]   = useState('OUT');
  const [reference,   setReference]   = useState('');
  const [ledgerName,  setLedgerName]  = useState('');
  const [runningBal,  setRunningBal]  = useState('');

  // Optional closing balance updates
  const [updateBankBal,   setUpdateBankBal]   = useState(false);
  const [updateLedgerBal, setUpdateLedgerBal] = useState(false);
  const [newBankClosing,   setNewBankClosing]  = useState(String(recon?.bank_closing   ?? ''));
  const [newLedgerClosing, setNewLedgerClosing]= useState(String(recon?.ledger_closing ?? ''));

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const isLedger = source === 'ledger';

  const validate = () => {
    const e = {};
    if (!description.trim()) e.description = 'Required';
    if (!amount || parseFloat(amount) === 0) e.amount = 'Must be non-zero';
    if (!txnDate) e.txnDate = 'Required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const payload = {
        source,
        txn_date:      toISO(txnDate),
        description:   description.trim(),
        amount:        parseFloat(amount),
        direction,
        reference:     reference.trim(),
        ledger_name:   ledgerName.trim(),
        running_balance: runningBal ? parseFloat(runningBal) : undefined,
        new_bank_closing:   updateBankBal   ? parseFloat(newBankClosing)   : undefined,
        new_ledger_closing: updateLedgerBal ? parseFloat(newLedgerClosing) : undefined,
      };
      const res = await onAdd(payload);
      if (res) onClose();
    } finally {
      setLoading(false);
    }
  };

  const dirLabel = (dir) => isLedger
    ? (dir === 'OUT' ? 'Cr (Credit — money paid out)' : 'Dr (Debit — money received)')
    : (dir === 'OUT' ? 'Dr (Debit — money out)'       : 'Cr (Credit — money in)');

  return (
    <div className="br-modal-bg" onClick={!loading ? onClose : undefined}>
      <motion.div
        className="br-modal br-modal--wide"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 580 }}
      >
        {/* ── Header ── */}
        <div className="br-modal-head">
          <div className="br-modal-ico" style={{ background: 'rgba(0,177,150,.12)', color: 'var(--sb-brand,#00b196)' }}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-plus-circle'}`} />
          </div>
          <div>
            <h3>Add Transaction Line</h3>
            <p>Add a single posted transaction that's missing from the statement.</p>
          </div>
          <button className="br-modal-x" onClick={onClose} disabled={loading}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className={`br-modal-form${loading ? ' br-modal-form--loading' : ''}`}>

          {/* ── Source toggle ── */}
          <div>
            <label className="br-label" style={{ display: 'block', marginBottom: 8 }}>Adding to which side?</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { key: 'bank',   icon: 'fa-university',  label: 'Bank Statement' },
                { key: 'ledger', icon: 'fa-book-open',   label: 'Ledger' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key} type="button" disabled={loading}
                  onClick={() => { setSource(key); setErrors({}); }}
                  style={{
                    flex: 1, height: 44, borderRadius: 10, fontWeight: 700, fontSize: 12,
                    border: `2px solid ${source === key ? 'var(--sb-brand,#00b196)' : 'var(--sb-border,#deeee9)'}`,
                    background: source === key ? 'rgba(0,177,150,.07)' : 'var(--sb-surface-2,#f8fcfb)',
                    color: source === key ? 'var(--sb-brand,#00b196)' : 'var(--sb-text-3,#7aada6)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: '.15s',
                  }}
                >
                  <i className={`fas ${icon}`} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Date + Reference ── */}
          <div className="br-modal-row">
            <Field label="Transaction Date" required error={errors.txnDate}>
              <div className="form-wrapper">
                <DatePicker
                  selected={txnDate}
                  onChange={setTxnDate}
                  className={`form-input ${errors.txnDate ? 'input-error' : ''}`}
                  wrapperClassName="input-date-picker"
                  dateFormat="yyyy-MM-dd"
                  showMonthDropdown showYearDropdown dropdownMode="select"
                  disabled={loading}
                />
                <span className="chevron-input-icon fas fa-calendar" />
              </div>
            </Field>
            <Field label="Reference">
              <input className="form-input" value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder="Optional" disabled={loading} />
            </Field>
          </div>

          {/* ── Description ── */}
          <Field label="Description" required error={errors.description}>
            <input
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              value={description} onChange={(e) => { setDescription(e.target.value); setErrors((s) => ({ ...s, description: '' })); }}
              placeholder="Transaction narration as it appears in the statement"
              disabled={loading}
            />
          </Field>

          {/* ── Amount + Direction ── */}
          <div className="br-modal-row">
            <Field label="Amount" required error={errors.amount}>
              <input
                className={`form-input ${errors.amount ? 'input-error' : ''}`}
                value={amount}
                onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setErrors((s) => ({ ...s, amount: '' })); }}
                placeholder="0.00" disabled={loading}
              />
            </Field>
            <Field label="Direction">
              <div style={{ display: 'flex', gap: 8 }}>
                {['OUT', 'IN'].map((dir) => (
                  <button
                    key={dir} type="button" disabled={loading}
                    onClick={() => setDirection(dir)}
                    style={{
                      flex: 1, height: 42, borderRadius: 10, fontWeight: 700, fontSize: 11,
                      border: `1.5px solid ${direction === dir ? (dir === 'OUT' ? '#f47c7c' : 'var(--sb-brand,#00b196)') : 'var(--sb-border,#deeee9)'}`,
                      background: direction === dir
                        ? (dir === 'OUT' ? 'rgba(244,124,124,.08)' : 'rgba(0,177,150,.08)')
                        : 'var(--sb-surface-2,#f8fcfb)',
                      color: direction === dir
                        ? (dir === 'OUT' ? '#f47c7c' : 'var(--sb-brand,#00b196)')
                        : 'var(--sb-text-3,#7aada6)',
                      cursor: loading ? 'not-allowed' : 'pointer', transition: '.15s',
                    }}
                  >
                    <i className={`fas ${dir === 'OUT' ? 'fa-arrow-up-right' : 'fa-arrow-down-left'}`} style={{ marginRight: 4 }} />
                    {isLedger ? (dir === 'OUT' ? 'Cr' : 'Dr') : (dir === 'OUT' ? 'Dr' : 'Cr')}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--sb-text-3,#7aada6)', marginTop: 4 }}>
                {dirLabel(direction)}
              </p>
            </Field>
          </div>

          {/* ── Ledger name (ledger only) + Running balance ── */}
          <div className="br-modal-row">
            {isLedger && (
              <Field label="Ledger / Account Name">
                <input className="form-input" value={ledgerName} onChange={(e) => setLedgerName(e.target.value)}
                  placeholder="e.g. ZBN Main" disabled={loading} />
              </Field>
            )}
            <Field label="Running Balance (optional)">
              <input className="form-input" value={runningBal}
                onChange={(e) => setRunningBal(e.target.value.replace(/[^0-9.\-]/g, ''))}
                placeholder="Balance after this transaction" disabled={loading} />
            </Field>
          </div>

          {/* ── Closing balance updates ── */}
          <div style={{
            background: 'var(--sb-surface-2,#f8fcfb)', border: '1px solid var(--sb-border,#deeee9)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--sb-text-2,#3d5752)', marginBottom: 10 }}>
              <i className="fas fa-balance-scale" style={{ marginRight: 8, color: 'var(--sb-brand,#00b196)' }} />
              Update Closing Balances (optional)
            </p>
            <p style={{ fontSize: 11, color: 'var(--sb-text-3,#7aada6)', marginBottom: 12 }}>
              If this new posting changes the closing balance, update it here so the reconciliation summary stays accurate.
            </p>

            {/* Bank closing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <label className="br-checkbox-wrap" style={{ flexShrink: 0, minWidth: 150 }}>
                <input type="checkbox" checked={updateBankBal} onChange={(e) => setUpdateBankBal(e.target.checked)} disabled={loading} />
                <span className="br-checkbox-label">New Bank Closing</span>
              </label>
              <input
                className="form-input"
                style={{ flex: 1, opacity: updateBankBal ? 1 : 0.45, transition: '.2s' }}
                value={newBankClosing}
                onChange={(e) => setNewBankClosing(e.target.value)}
                disabled={!updateBankBal || loading}
                placeholder={`Current: ${fmtAmt(recon?.bank_closing ?? 0)}`}
              />
            </div>

            {/* Ledger closing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="br-checkbox-wrap" style={{ flexShrink: 0, minWidth: 150 }}>
                <input type="checkbox" checked={updateLedgerBal} onChange={(e) => setUpdateLedgerBal(e.target.checked)} disabled={loading} />
                <span className="br-checkbox-label">New Ledger Closing</span>
              </label>
              <input
                className="form-input"
                style={{ flex: 1, opacity: updateLedgerBal ? 1 : 0.45, transition: '.2s' }}
                value={newLedgerClosing}
                onChange={(e) => setNewLedgerClosing(e.target.value)}
                disabled={!updateLedgerBal || loading}
                placeholder={`Current: ${fmtAmt(recon?.ledger_closing ?? 0)}`}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="br-modal-foot">
          <button className="br-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="br-btn-primary" onClick={handleSave} disabled={loading}
            style={{ background: 'var(--sb-brand,#00b196)' }}
          >
            {loading
              ? <><span className="br-spinner" />Adding…</>
              : <><i className="fas fa-plus-circle" />Add Line</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BankReconAddLineModal;