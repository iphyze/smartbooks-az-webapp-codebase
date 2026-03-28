import React from 'react';

const ErrorState = ({ message }) => (
  <div className="error-state">
    <div className="error-state-content">
      <span className="fas fa-exclamation-circle error-state-icon"></span>
      <p className="error-state-text">Something went wrong</p>
      <p className="error-state-subtext">{message}</p>
    </div>
  </div>
);

export default ErrorState;