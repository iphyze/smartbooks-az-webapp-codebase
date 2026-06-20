import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fmtAmt, toISO } from './BankReconUtils';
import { Field } from './BankReconCommon';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const parseAmt = (v) => {
  const n = parseFloat(String(v || '0').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? '' : String(n);
};

const BankReconEditLineModal = ({ line, source, onClose, onSave }) => {
  const isLedger = source === 'ledger';
  const isOut    = line.direction === 'OUT';

  // On ledger side, direction is accounting-flipped for display
  const displayDir = isLedger
    ? (isOut ? 'Cr (Credit)' : 'Dr (Debit)')
    : (isOut ? 'Dr (Debit)'  : 'Cr (Credit)');

  const [form, setForm] = useState({
    amount:          String(Math.abs(Number(line.amount || 0))),
    direction:       line.direction || 'OUT',
    txn_date:        line.txn_date ? new Date(`${line.txn_date}T00:00:00`) : new Date(),
    description:     line.description || '',
    reference:       line.reference   || '',
    ledger_name:     line.ledger_name || '',
    running_balance: line.running_balance ? String(Math.abs(Number(line.running_balance))) : '',
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Amount must be greater than zero';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.txn_date) e.txn_date = 'Date is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await onSave({
        line_id:         line.id,
        source,
        amount:          parseFloat(form.amount),
        direction:       form.direction,
        txn_date:        toISO(form.txn_date),
        description:     form.description.trim(),
        reference:       form.reference.trim(),
        ledger_name:     form.ledger_name.trim(),
        running_balance: form.running_balance ? parseFloat(form.running_balance) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const isMatched = line.match_status === 'Matched';

  return (
    <div className="br-modal-bg" onClick={!loading ? onClose : undefined}>
      <motion.div
        className="br-modal br-modal--wide"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="br-modal-head">
          <div className="br-modal-ico" style={{ background: 'rgba(99,102,241,.13)', color: '#6366f1' }}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-edit'}`} />
          </div>
          <div>
            <h3>Edit {isLedger ? 'Ledger' : 'Bank'} Line</h3>
            <p>{loading ? 'Saving correction, please wait…' : 'Correct an erroneous posting. Changes recompute the reconciliation summary.'}</p>
          </div>
          <button className="br-modal-x" onClick={onClose} disabled={loading}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Matched warning */}
        {isMatched && (
          <div style={{
            margin: '14px 24px 0', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(234,179,8,.08)', border: '1px solid rgba(234,179,8,.25)',
            display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5,
            color: '#ca8a04',
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              This line is currently <strong>matched</strong>. Editing it (especially the amount or direction)
              may invalidate the match. Consider unmatching it first if the amounts will change significantly.
            </span>
          </div>
        )}

        {/* Form */}
        <div className={`br-modal-form${loading ? ' br-modal-form--loading' : ''}`}>
          {/* Amount + Direction */}
          <div className="br-modal-row">
            <Field label="Amount">
              <input
                className={`form-input ${errors.amount ? 'input-error' : ''}`}
                value={form.amount}
                onChange={(e) => upd('amount', e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.amount && <span className="br-err-msg"><i className="fas fa-exclamation-circle" />{errors.amount}</span>}
            </Field>

            <Field label="Direction (Side)">
              <div style={{ display: 'flex', gap: 8 }}>
                {['OUT', 'IN'].map((dir) => {
                  const label = isLedger
                    ? (dir === 'OUT' ? 'Cr (Credit)' : 'Dr (Debit)')
                    : (dir === 'OUT' ? 'Dr (Debit)'  : 'Cr (Credit)');
                  const active = form.direction === dir;
                  return (
                    <button
                      key={dir}
                      type="button"
                      disabled={loading}
                      onClick={() => upd('direction', dir)}
                      style={{
                        flex: 1, height: 42, borderRadius: 10, fontWeight: 700, fontSize: 12.5,
                        border: `1.5px solid ${active ? (dir === 'OUT' ? '#f47c7c' : 'var(--sb-brand,#00b196)') : 'var(--sb-border,#deeee9)'}`,
                        background: active
                          ? (dir === 'OUT' ? 'rgba(244,124,124,.08)' : 'rgba(0,177,150,.08)')
                          : 'var(--sb-surface-2,#f8fcfb)',
                        color: active
                          ? (dir === 'OUT' ? '#f47c7c' : 'var(--sb-brand,#00b196)')
                          : 'var(--sb-text-3,#7aada6)',
                        cursor: loading ? 'not-allowed' : 'pointer', transition: '.15s',
                      }}
                    >
                      <i className={`fas ${dir === 'OUT' ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ marginRight: 6 }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          {/* Date + Reference */}
          <div className="br-modal-row">
            <Field label="Transaction Date">
              <div className="form-wrapper">
                <DatePicker
                  selected={form.txn_date}
                  onChange={(d) => upd('txn_date', d)}
                  className={`form-input ${errors.txn_date ? 'input-error' : ''}`}
                  wrapperClassName="input-date-picker"
                  dateFormat="yyyy-MM-dd"
                  showMonthDropdown showYearDropdown dropdownMode="select"
                  disabled={loading}
                />
                <span className="chevron-input-icon fas fa-calendar" />
              </div>
              {errors.txn_date && <span className="br-err-msg"><i className="fas fa-exclamation-circle" />{errors.txn_date}</span>}
            </Field>
            <Field label="Reference">
              <input
                className="form-input"
                value={form.reference}
                onChange={(e) => upd('reference', e.target.value)}
                placeholder="Optional"
                disabled={loading}
              />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <input
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              value={form.description}
              onChange={(e) => upd('description', e.target.value)}
              placeholder="Transaction description"
              disabled={loading}
            />
            {errors.description && <span className="br-err-msg"><i className="fas fa-exclamation-circle" />{errors.description}</span>}
          </Field>

          {/* Ledger name (ledger side only) + Running balance */}
          <div className="br-modal-row">
            {isLedger && (
              <Field label="Ledger / Account Name">
                <input
                  className="form-input"
                  value={form.ledger_name}
                  onChange={(e) => upd('ledger_name', e.target.value)}
                  placeholder="e.g. ZBN Main"
                  disabled={loading}
                />
              </Field>
            )}
            <Field label="Running Balance (optional)">
              <input
                className="form-input"
                value={form.running_balance}
                onChange={(e) => upd('running_balance', e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Leave blank to keep existing"
                disabled={loading}
              />
            </Field>
          </div>
        </div>

        {/* Summary preview */}
        <div className="br-journal-preview" style={{ margin: '6px 24px 0' }}>
          <div className="br-jnl-row">
            <span className="br-jnl-side" style={{ color: '#6366f1', width: 60 }}>Side</span>
            <span className="br-jnl-acct">{isLedger ? 'Ledger' : 'Bank Statement'}</span>
          </div>
          <div className="br-jnl-row">
            <span className="br-jnl-side" style={{ color: '#6366f1', width: 60 }}>Amount</span>
            <span className="br-jnl-acct" style={{ fontWeight: 700 }}>
              {form.amount ? fmtAmt(parseFloat(form.amount) || 0) : '—'}
            </span>
          </div>
          <div className="br-jnl-row">
            <span className="br-jnl-side" style={{ color: '#6366f1', width: 60 }}>Direction</span>
            <span className="br-jnl-acct">
              {isLedger
                ? (form.direction === 'OUT' ? 'Credit (Cr)' : 'Debit (Dr)')
                : (form.direction === 'OUT' ? 'Debit (Dr)'  : 'Credit (Cr)')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="br-modal-foot">
          <button className="br-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="br-btn-primary" onClick={handleSave} disabled={loading}
            style={{ background: '#6366f1', boxShadow: '0 6px 18px rgba(99,102,241,.3)' }}
          >
            {loading ? (
              <><span className="br-spinner" />Saving…</>
            ) : (
              <><i className="fas fa-check" />Save Correction</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BankReconEditLineModal;