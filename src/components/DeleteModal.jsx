import React from 'react';
import useThemeStore from '../stores/useThemeStore';
// import PropTypes from 'prop-types';

const DeleteModal = ({ onConfirm, onCancel, message, isLoading }) => {
  const { theme } = useThemeStore();

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={handleModalClick}>
        <div className="delete-modal-header">
          <h3>Confirm Delete</h3>
          <button className="delete-modal-close" onClick={onCancel} disabled={isLoading}>
            <span className="fas fa-times"></span>
          </button>
        </div>

        <div className="delete-modal-content">
          <div className="delete-modal-icon">
            <span className="fas fa-exclamation-triangle"></span>
          </div>
          <p className="delete-modal-message">{message}</p>
        </div>

        <div className="delete-modal-actions">
          <button onClick={onCancel} className="cancel-button" disabled={isLoading}>
            <span className="fas fa-times"></span> Cancel
          </button>
          <button onClick={onConfirm} className="delete-button" disabled={isLoading}>
            {isLoading ? (<><span className="spinner"></span>Deleting...</>
            ) : (<><span className="fas fa-trash-alt"></span> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// DeleteModal.propTypes = {
//   onConfirm: PropTypes.func.isRequired,
//   onCancel: PropTypes.func.isRequired,
//   message: PropTypes.string.isRequired,
//   isLoading: PropTypes.bool
// };

// DeleteModal.defaultProps = {
//   isLoading: false
// };

export default DeleteModal;