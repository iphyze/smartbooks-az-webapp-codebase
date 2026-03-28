import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleInfo, faCircleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import useToastStore from '../stores/useToastStore';
import './Toast.css';

const Toast = () => {
  const { toasts, hideToast } = useToastStore();
  const [closingToasts, setClosingToasts] = useState(new Set());

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return faCircleCheck;
      case 'error':
        return faCircleExclamation;
      case 'info':
      default:
        return faCircleInfo;
    }
  };


  const handleClose = (id) => {
    // Add the toast to closing set
    setClosingToasts(prev => new Set([...prev, id]));
    
    // Wait for animation to complete before removing
    setTimeout(() => {
      hideToast(id);
      setClosingToasts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300); // Match this with CSS animation duration
  };


  // Listen for auto-remove events
  useEffect(() => {
    const handleAutoRemove = (event) => {
      const { id } = event.detail;
      handleClose(id);
    };

    window.addEventListener('hideToast', handleAutoRemove);
    
    return () => {
      window.removeEventListener('hideToast', handleAutoRemove);
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type} ${closingToasts.has(toast.id) ? 'toast-closing' : ''}`}>
          <div className="toast-icon"><FontAwesomeIcon icon={getIcon(toast.type)} /></div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close" onClick={() => handleClose(toast.id)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;