import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import useThemeStore from '../../stores/useThemeStore';
import './RefreshErrorModal.css';

const RefreshIcon = ({ className = '' }) => (
  <svg className={`sbr-refresh-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 6v5h-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.35 15.6A7.5 7.5 0 1 1 17.8 7.75L20 11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ConnectionIcon = () => (
  <svg className="sbr-refresh-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5.3 9.6a10.5 10.5 0 0 1 13.4 0M8.35 12.75a6.1 6.1 0 0 1 7.3 0M11 16a1.65 1.65 0 0 1 2 0" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
  </svg>
);

const ReloadIcon = () => (
  <svg className="sbr-refresh-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 8V4m0 0h4M5 4l3.2 3.2A7.5 7.5 0 1 1 4.8 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RefreshErrorModal = ({
  message,
  onRetry,
  loading = false,
  title = "We couldn't load these records",
  eyebrow = 'Connection interrupted',
}) => {
  const { theme } = useThemeStore();
  const retryButtonRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => retryButtonRef.current?.focus(), 80);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleRetry = async () => {
    if (loading || typeof onRetry !== 'function') return;
    await onRetry();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className={`sbr-refresh-backdrop theme-${theme}`} role="presentation">
      <section
        className="sbr-refresh-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sbr-refresh-title"
        aria-describedby="sbr-refresh-description"
      >
        <header className="sbr-refresh-header">
          <div className="sbr-refresh-symbol" aria-hidden="true">
            <ConnectionIcon />
            <span />
          </div>
          <div>
            <small>{eyebrow}</small>
            <h2 id="sbr-refresh-title">{title}</h2>
          </div>
        </header>

        <div className="sbr-refresh-body">
          <p id="sbr-refresh-description">
            {message || 'The latest records could not be retrieved. Check your connection and try again.'}
          </p>
          <div className="sbr-refresh-note">
            <RefreshIcon />
            <span>Your current filters and page settings will be kept when you retry.</span>
          </div>
        </div>

        <footer className="sbr-refresh-footer">
          <button type="button" className="sbr-refresh-secondary" onClick={() => window.location.reload()} disabled={loading}>
            <ReloadIcon />
            <span>Reload page</span>
          </button>
          <button
            ref={retryButtonRef}
            type="button"
            className="sbr-refresh-primary"
            onClick={handleRetry}
            disabled={loading || typeof onRetry !== 'function'}
          >
            {loading ? <span className="sbr-refresh-spinner" aria-hidden="true" /> : <RefreshIcon />}
            <span>{loading ? 'Refreshing…' : 'Refresh data'}</span>
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
};

export default RefreshErrorModal;
