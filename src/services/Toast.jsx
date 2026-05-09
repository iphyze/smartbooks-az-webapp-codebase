import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import useToastStore from '../stores/useToastStore';
import './Toast.css';

const TOAST_DURATION = 5000;   // ms before auto-dismiss
const CLOSE_ANIMATION = 350;   // ms — must match CSS

const CONFIGS = {
  success: {
    icon: faCircleCheck,
    label: 'Success',
  },
  error: {
    icon: faTriangleExclamation,
    label: 'Error',
  },
  info: {
    icon: faCircleInfo,
    label: 'Info',
  },
};

const ToastItem = ({ toast, onClose }) => {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef(null);
  const config = CONFIGS[toast.type] ?? CONFIGS.info;

  const startClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => onClose(toast.id), CLOSE_ANIMATION);
  };

  useEffect(() => {
    timerRef.current = setTimeout(startClose, TOAST_DURATION);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className={`sb-toast sb-toast--${toast.type} ${closing ? 'sb-toast--out' : 'sb-toast--in'}`}
      role="alert"
      aria-live="polite"
    >
      {/* Accent strip */}
      <div className="sb-toast__strip" />

      {/* Icon */}
      <div className="sb-toast__icon">
        <FontAwesomeIcon icon={config.icon} />
      </div>

      {/* Body */}
      <div className="sb-toast__body">
        <span className="sb-toast__label">{config.label}</span>
        <span className="sb-toast__message">{toast.message}</span>
      </div>

      {/* Close */}
      <button
        className="sb-toast__close"
        onClick={startClose}
        aria-label="Dismiss notification"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>

      {/* Progress bar */}
      <div
        className="sb-toast__progress"
        style={{ animationDuration: `${TOAST_DURATION}ms` }}
      />
    </div>
  );
};

const Toast = () => {
  const { toasts, hideToast } = useToastStore();

  return (
    <div className="sb-toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
      ))}
    </div>
  );
};

export default Toast;