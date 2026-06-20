import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const metricItems = [
  ['evaluated', 'Lines evaluated'],
  ['newly_categorized', 'Newly categorised'],
  ['reclassified', 'Reclassified'],
  ['unchanged', 'Unchanged'],
  ['uncategorized', 'Uncategorised'],
  ['manual_protected', 'Manual protected'],
  ['matched_skipped', 'Matched protected'],
  ['cleared', 'Old categories cleared'],
];

const BankReconApplyRulesModal = ({
  saving = false,
  overrideManual = false,
  result = null,
  onOverrideManualChange,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const closeFromOverlay = () => {
    if (!saving) onClose?.();
  };

  return (
    <motion.div
      className="br-rules-apply-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={closeFromOverlay}
    >
      <motion.div
        className="br-rules-apply-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="br-rules-apply-title"
      >
        <button
          type="button"
          className="br-rules-apply-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close rule application confirmation"
        >
          <i className="fas fa-xmark" />
        </button>

        <div className="br-rules-apply-hero">
          <div className={`br-rules-apply-icon ${result ? 'br-rules-apply-icon--success' : ''}`}>
            <i className={result ? 'fas fa-check' : 'fas fa-wand-magic-sparkles'} />
          </div>
          <div>
            <span className="br-rules-apply-kicker">Auto-categorisation</span>
            <h3 id="br-rules-apply-title">{result ? 'Active rules have been reapplied' : 'Reapply active rules to this reconciliation?'}</h3>
            <p>
              {result
                ? 'The current bank and ledger lines were refreshed using the latest rule priority, learned patterns and default detection.'
                : 'This will re-evaluate all eligible unmatched bank and ledger lines, not only lines that are currently uncategorised.'}
            </p>
          </div>
        </div>

        {result ? (
          <div className="br-rules-apply-result">
            <div className="br-rules-apply-metrics">
              {metricItems.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{Number(result?.[key] || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>

            <div className="br-rules-apply-result-note">
              <i className="fas fa-circle-check" />
              <span>
                Matched lines remained untouched. {Number(result?.manual_protected || 0) > 0
                  ? `${Number(result.manual_protected).toLocaleString()} manual classification${Number(result.manual_protected) === 1 ? '' : 's'} remained protected.`
                  : 'No protected manual classifications were changed.'}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="br-rules-apply-scope">
              <div>
                <i className="fas fa-building-columns" />
                <span>Scope</span>
                <strong>Bank and ledger</strong>
              </div>
              <div>
                <i className="fas fa-link" />
                <span>Matched lines</span>
                <strong>Always protected</strong>
              </div>
              <div>
                <i className="fas fa-arrow-down-1-9" />
                <span>Rule order</span>
                <strong>Priority first</strong>
              </div>
            </div>

            <div className="br-rules-apply-info">
              <i className="fas fa-circle-info" />
              <div>
                <strong>What will happen</strong>
                <p>
                  Previous rule-generated categories will be checked again. The highest-priority active rule wins, followed by approved learned patterns and the existing default detection. Lines that no longer match any pattern return to Unmatched.
                </p>
              </div>
            </div>

            <label className={`br-rules-override-option ${overrideManual ? 'br-rules-override-option--active' : ''}`}>
              <input
                type="checkbox"
                checked={overrideManual}
                onChange={(event) => onOverrideManualChange?.(event.target.checked)}
                disabled={saving}
              />
              <span className="br-rules-override-box"><i className="fas fa-check" /></span>
              <span>
                <strong>Override manual classifications</strong>
                <small>Off by default. Enable only when active rules should replace categories deliberately selected by a user.</small>
              </span>
            </label>

            {overrideManual && (
              <div className="br-rules-apply-warning">
                <i className="fas fa-triangle-exclamation" />
                <span>Manual categories may be replaced or cleared where no active rule, learned pattern or default category matches.</span>
              </div>
            )}
          </>
        )}

        <div className="br-rules-apply-actions">
          {result ? (
            <button type="button" className="br-rules-apply-confirm" onClick={onClose}>
              <i className="fas fa-check" />Done
            </button>
          ) : (
            <>
              <button type="button" className="br-rules-apply-cancel" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="br-rules-apply-confirm" onClick={onConfirm} disabled={saving}>
                <i className={saving ? 'fas fa-spinner' : 'fas fa-wand-magic-sparkles'} />
                {saving ? 'Applying rules…' : 'Apply active rules'}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BankReconApplyRulesModal;
