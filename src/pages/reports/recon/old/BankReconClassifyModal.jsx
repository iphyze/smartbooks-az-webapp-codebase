import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AUTO_LEDGERS, CATEGORY_OPTIONS, CLASSIFICATION_OPTIONS, fmtAmt, safe } from './BankReconUtils';
import { Field } from './BankReconCommon';

/* ── Inline BrSelect — styled dropdown matching the br-* design system ── */
const BrSelect = ({ value, options, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((x) => x.id === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="br-select-wrap" ref={ref}>
      <button
        type="button"
        className={`br-select-btn${open ? ' br-select-btn--open' : ''}${disabled ? ' br-select-btn--disabled' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
      >
        <span className="br-select-btn-label">{current?.label || value}</span>
        <i className="fas fa-chevron-down br-select-btn-chevron" />
      </button>
      {open && !disabled && (
        <div className="br-select-menu">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.id}
              className={`br-select-option${value === opt.id ? ' br-select-option--active' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main modal ─────────────────────────────────────────────── */
const BankReconClassifyModal = ({ target, bankLines = [], ledgerLines = [], onClose, onConfirm }) => {
  const source        = target?.source || 'bank';
  const lineIds       = (target?.lineIds || []).map(Number);
  const sourceLines   = source === 'bank' ? bankLines : ledgerLines;
  const selectedLines = sourceLines.filter((x) => lineIds.includes(Number(x.id)));
  const sample        = selectedLines[0] || {};
  const total         = selectedLines.reduce((s, x) => s + Math.abs(Number(x.amount || 0)), 0);

  const [category,       setCategory]       = useState(sample.category_name || sample.bank_only_type || 'Bank Charge');
  const [classification, setClassification] = useState(sample.recon_classification || "They Debit We Don't Credit");
  const [dr,   setDr]   = useState(sample.suggested_dr_ledger || '');
  const [cr,   setCr]   = useState(sample.suggested_cr_ledger || '');
  const [note, setNote] = useState(sample.journal_note || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = AUTO_LEDGERS[category] || {};
    if (!dr) setDr(s.dr || '');
    if (!cr) setCr(s.cr || '');
  }, [category]);

  const hint  = CLASSIFICATION_OPTIONS.find((x) => x.id === classification)?.hint;
  const isOut = sample.direction === 'OUT';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ source, lineIds, category, classification, drLedger: dr, crLedger: cr, note });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br-modal-bg" onClick={!loading ? onClose : undefined}>
      <motion.div
        className="br-modal br-modal--wide"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="br-modal-head">
          <div className="br-modal-ico">
            {loading
              ? <i className="fas fa-spinner fa-spin" />
              : <i className="fas fa-layer-group" />}
          </div>
          <div>
            <h3>Categorise Reconciling Item{selectedLines.length > 1 ? 's' : ''}</h3>
            <p>
              {loading
                ? 'Saving classification, please wait…'
                : `Move ${selectedLines.length} unmatched ${source} line${selectedLines.length === 1 ? '' : 's'} into one Details category.`}
            </p>
          </div>
          <button className="br-modal-x" onClick={onClose} disabled={loading}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        {/* ── Transaction preview ── */}
        <div className="br-modal-preview">
          <span className="br-modal-prev-date">
            {selectedLines.length} item{selectedLines.length === 1 ? '' : 's'}
          </span>
          <span className="br-modal-prev-desc">
            {selectedLines.length === 1
              ? sample.description
              : `${safe(sample.description)}${selectedLines.length > 1 ? ` +${selectedLines.length - 1} more` : ''}`}
          </span>
          <span className={`br-modal-prev-amt ${isOut ? 'br-amt-out' : 'br-amt-in'}`}>
            {isOut ? '−' : '+'} {fmtAmt(total)}
          </span>
        </div>

        {/* ── Form ── */}
        <div className={`br-modal-form${loading ? ' br-modal-form--loading' : ''}`}>
          <div className="br-modal-row">
            <Field label="Category / Extract Sheet">
              <BrSelect value={category} options={CATEGORY_OPTIONS} onChange={setCategory} disabled={loading} />
              <input
                className="form-input br-inline-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type a custom category…"
                disabled={loading}
              />
            </Field>

            <Field label="Recon Classification">
              <BrSelect value={classification} options={CLASSIFICATION_OPTIONS} onChange={setClassification} disabled={loading} />
              {hint && <small className="br-help-text">{hint}</small>}
            </Field>
          </div>

          <div className="br-modal-row">
            <Field label="Debit Ledger (Dr)">
              <input
                className="form-input"
                value={dr}
                onChange={(e) => setDr(e.target.value)}
                placeholder="e.g. Bank Charges & Commission"
                disabled={loading}
              />
            </Field>
            <Field label="Credit Ledger (Cr)">
              <input
                className="form-input"
                value={cr}
                onChange={(e) => setCr(e.target.value)}
                placeholder="e.g. Bank Ledger"
                disabled={loading}
              />
            </Field>
          </div>

          <Field label="Remarks / Journal Note">
            <input
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the journal entry…"
              disabled={loading}
            />
          </Field>
        </div>

        {/* ── Live journal preview ── */}
        <div className="br-journal-preview">
          <div className="br-jnl-row">
            <span className="br-jnl-side">Dr</span>
            <span className="br-jnl-acct">{dr || <em style={{ opacity: 0.45 }}>Debit ledger</em>}</span>
          </div>
          <div className="br-jnl-row">
            <span className="br-jnl-side">Cr</span>
            <span className="br-jnl-acct">{cr || <em style={{ opacity: 0.45 }}>Credit ledger</em>}</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="br-modal-foot">
          <button className="br-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="br-btn-primary" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="br-spinner" />
                Saving…
              </>
            ) : (
              <>
                <i className="fas fa-check" /> Move Selected to Details
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BankReconClassifyModal;