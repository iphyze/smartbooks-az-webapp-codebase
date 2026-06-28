import React from 'react';
import { motion } from 'framer-motion';
import useThemeStore from '../../../stores/useThemeStore';

const pluraliseLine = (count) => `${count} line${count === 1 ? '' : 's'}`;

const BankReconUnclassifyConfirmModal = ({ target, saving = false, onClose, onConfirm }) => {
  const { theme } = useThemeStore();
  const count = target?.lineIds?.length || 0;
  const sourceLabel = target?.titleSide || (target?.source === 'bank' ? 'Bank Statement' : 'Ledger');
  const detailLabel = target?.label || '';

  return (
    <motion.div
      className={`br-delete-modal-overlay theme-${theme}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="br-delete-modal br-delete-modal--unclassify"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="br-unclassify-modal-title"
      >
        <button
          type="button"
          className="br-delete-modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close classification removal confirmation"
        >
          <i className="fas fa-xmark" />
        </button>

        <div className="br-delete-modal-icon">
          <i className="fas fa-tags" />
        </div>

        <div className="br-delete-modal-content">
          <span className="br-delete-modal-kicker">Confirm classification removal</span>
          <h3 id="br-unclassify-modal-title">
            Remove {pluraliseLine(count)} from class?
          </h3>
          <p>
            The selected {sourceLabel.toLowerCase()} {pluraliseLine(count)} will return to Unmatched.
            Its current category, reconciliation classification, suggested ledgers and note will be cleared.
          </p>

          <div className="br-delete-modal-summary">
            <div>
              <span>Source</span>
              <strong>{sourceLabel}</strong>
            </div>
            <div>
              <span>Selected</span>
              <strong>{pluraliseLine(count)}</strong>
            </div>
            {detailLabel && count === 1 && (
              <div className="br-delete-modal-summary-wide">
                <span>Reference / narration</span>
                <strong>{detailLabel}</strong>
              </div>
            )}
          </div>

          <div className="br-delete-modal-note">
            <i className="fas fa-circle-info" />
            <span>No statement line will be deleted. You can classify the line again at any time.</span>
          </div>
        </div>

        <div className="br-delete-modal-actions">
          <button type="button" className="br-delete-modal-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="br-delete-modal-confirm br-delete-modal-confirm--unclassify"
            onClick={onConfirm}
            disabled={saving || !count}
          >
            {saving ? <i className="fas fa-spinner" /> : <i className="fas fa-tags" />}
            {saving ? 'Removing…' : 'Yes, remove from class'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BankReconUnclassifyConfirmModal;
