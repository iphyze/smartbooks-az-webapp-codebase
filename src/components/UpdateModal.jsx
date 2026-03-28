import React from 'react';
import useThemeStore from '../stores/useThemeStore';
// import PropTypes from 'prop-types';

const UpdateModal = ({ onConfirm, onCancel, message, isLoading }) => {
  const { theme } = useThemeStore();

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={handleModalClick}>
        <div className="delete-modal-header">
          <h3>Confirm Update</h3>
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
          <button onClick={onConfirm} className="update-button" disabled={isLoading}>
            {isLoading ? (<><span className="spinner"></span>Updating...</>
            ) : (<><span className="fas fa-pen"></span> Update</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// UpdateModal.propTypes = {
//   onConfirm: PropTypes.func.isRequired,
//   onCancel: PropTypes.func.isRequired,
//   message: PropTypes.string.isRequired,
//   isLoading: PropTypes.bool
// };

// UpdateModal.defaultProps = {
//   isLoading: false
// };

export default UpdateModal;