import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BankReconAppendModal = ({ recon, onClose, onAppend }) => {
  const [source,  setSource]  = useState('bank');
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null); // { inserted, auto_matched, skipped }

  const handleFile = (e) => setFile(e.target.files?.[0] || null);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await onAppend({ recon_id: recon.id, source, file });
      if (res?.data) setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br-modal-bg" onClick={!loading && !result ? onClose : undefined}>
      <motion.div
        className="br-modal br-modal--wide"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="br-modal-head">
          <div className="br-modal-ico" style={{ background: 'rgba(0,177,150,.12)', color: 'var(--sb-brand,#00b196)' }}>
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : result ? 'fa-check-circle' : 'fa-file-upload'}`} />
          </div>
          <div>
            <h3>Append Statement Lines</h3>
            <p>
              {result
                ? 'Lines appended and auto-matched successfully.'
                : 'Upload a new file — only lines that don\'t already exist will be added. Existing matches and classifications are preserved.'}
            </p>
          </div>
          <button className="br-modal-x" onClick={onClose} disabled={loading}>
            <i className="fas fa-times" />
          </button>
        </div>

        {result ? (
          /* ── Success state ── */
          <div style={{ padding: '24px 28px' }}>
            <div style={{
              background: 'rgba(0,177,150,.06)', border: '1px solid rgba(0,177,150,.2)',
              borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 32,
            }}>
              {[
                { label: 'New lines added', value: result.inserted, color: 'var(--sb-brand,#00b196)', icon: 'fa-plus-circle' },
                { label: 'Auto-matched',    value: result.auto_matched, color: '#6366f1', icon: 'fa-link' },
                { label: 'Already existed', value: result.skipped,  color: '#ca8a04', icon: 'fa-forward' },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                  <i className={`fas ${icon}`} style={{ color, fontSize: 22, marginBottom: 8, display: 'block' }} />
                  <strong style={{ fontSize: 22, color, display: 'block' }}>{value}</strong>
                  <span style={{ fontSize: 11, color: 'var(--sb-text-3,#7aada6)', fontWeight: 600 }}>{label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--sb-text-3,#7aada6)', marginTop: 14 }}>
              <i className="fas fa-info-circle" style={{ marginRight: 6 }} />
              The workspace will reload with the new lines. Unmatched new lines are ready for manual matching or classification.
            </p>
          </div>
        ) : (
          /* ── Form ── */
          <div className="br-modal-form" style={{ padding: '20px 28px', gap: 18 }}>
            {/* Source toggle */}
            <div>
              <label className="br-label" style={{ marginBottom: 8, display: 'block' }}>
                Which statement are you appending to?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { key: 'bank',   label: 'Bank Statement',   icon: 'fa-university' },
                  { key: 'ledger', label: 'Ledger Statement', icon: 'fa-book-open' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSource(key); setFile(null); }}
                    disabled={loading}
                    style={{
                      flex: 1, height: 52, borderRadius: 12, fontWeight: 700, fontSize: 13,
                      border: `2px solid ${source === key ? 'var(--sb-brand,#00b196)' : 'var(--sb-border,#deeee9)'}`,
                      background: source === key ? 'rgba(0,177,150,.07)' : 'var(--sb-surface-2,#f8fcfb)',
                      color: source === key ? 'var(--sb-brand,#00b196)' : 'var(--sb-text-3,#7aada6)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: '.15s',
                    }}
                  >
                    <i className={`fas ${icon}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* File drop */}
            <div>
              <label className="br-label" style={{ marginBottom: 8, display: 'block' }}>
                Upload new {source} statement file
              </label>
              <label
                className={`br-drop ${file ? 'br-drop--ok' : ''}`}
                style={{ minHeight: 90, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleFile}
                  disabled={loading}
                />
                <i className={`fas ${file ? 'fa-check-circle' : 'fa-cloud-upload-alt'} br-drop-icon`}
                   style={{ color: file ? 'var(--sb-brand,#00b196)' : undefined }} />
                <span className="br-drop-name">{file?.name || `Click to upload CSV / XLSX`}</span>
                <span className="br-drop-hint">
                  {source === 'bank'
                    ? 'Date · Description · Debit · Credit · Balance'
                    : 'Date · Description · Debit · Credit · Ledger · Balance'}
                </span>
              </label>
            </div>

            {/* Info callout */}
            <div style={{
              background: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.15)',
              borderRadius: 10, padding: '12px 16px', fontSize: 12,
              color: '#6366f1', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <i className="fas fa-shield-alt" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <strong>Safe to re-upload:</strong> Each line is hashed by date, amount, direction and description.
                Duplicate lines are silently skipped — only genuinely new transactions are added.
                All existing matches and classifications remain intact.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="br-modal-foot">
          {result ? (
            <button className="br-btn-primary" onClick={onClose}>
              <i className="fas fa-check" />Done
            </button>
          ) : (
            <>
              <button className="br-btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button
                className="br-btn-primary"
                onClick={handleSubmit}
                disabled={loading || !file}
              >
                {loading
                  ? <><span className="br-spinner" />Processing…</>
                  : <><i className="fas fa-file-upload" />Append Lines</>}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BankReconAppendModal;
