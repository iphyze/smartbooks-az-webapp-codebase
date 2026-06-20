import React from 'react';
import { motion } from 'framer-motion';

const pluraliseLine = (count) => `${count} line${count === 1 ? '' : 's'}`;

const BankReconDeleteConfirmModal = ({ target, saving = false, onClose, onConfirm }) => {
  const count = target?.lineIds?.length || 0;
  const isBulk = count > 1;
  const sourceLabel = target?.titleSide || (target?.source === 'bank' ? 'Bank Statement' : 'Ledger');
  const detailLabel = target?.label || '';

  return (
    <motion.div
      className="br-delete-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="br-delete-modal"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="br-delete-modal-title"
      >
        <button
          type="button"
          className="br-delete-modal-close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close delete confirmation"
        >
          <i className="fas fa-xmark" />
        </button>

        <div className="br-delete-modal-icon">
          <i className="fas fa-trash-can" />
        </div>

        <div className="br-delete-modal-content">
          <span className="br-delete-modal-kicker">Confirm deletion</span>
          <h3 id="br-delete-modal-title">
            Delete {isBulk ? `${count} ${target?.sideLabel || ''} lines` : `${target?.sideLabel || ''} line`}?
          </h3>
          <p>
            This will remove the selected {sourceLabel.toLowerCase()} {pluraliseLine(count)} from this reconciliation.
            {` `}If any selected line is already matched, its affected match group will be removed first so the reconciliation stays clean.
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
            {detailLabel && !isBulk && (
              <div className="br-delete-modal-summary-wide">
                <span>Reference / narration</span>
                <strong>{detailLabel}</strong>
              </div>
            )}
          </div>

          <div className="br-delete-modal-note">
            <i className="fas fa-circle-info" />
            <span>Deleted lines cannot be restored from this screen. Re-upload or append the file again if you need to bring them back.</span>
          </div>
        </div>

        <div className="br-delete-modal-actions">
          <button type="button" className="br-delete-modal-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="br-delete-modal-confirm" onClick={onConfirm} disabled={saving || !count}>
            {saving ? <i className="fas fa-spinner" /> : <i className="fas fa-trash-can" />}
            {saving ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BankReconDeleteConfirmModal;
