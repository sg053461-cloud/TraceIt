/**
 * TraceIt — Toast Notification Component
 * Toast.jsx
 *
 * Renders non-blocking alert toasts at the bottom/top of the screen.
 * Automatically dismisses after duration or on click of close button.
 */

import React, { useEffect } from 'react';

/**
 * @param {Object} props
 * @param {{ message: string, type?: 'info'|'success'|'warning'|'error', duration?: number }|null} props.toast
 * @param {() => void} props.onClose
 */
export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;

    // Automatically dismiss after the specified duration (default: 4000ms)
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const type = toast.type || 'info';

  // SVGs matching the original ui.js toast icons
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <span style={{ color: 'var(--clr-success)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        );
      case 'error':
        return (
          <span style={{ color: 'var(--clr-danger)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        );
      case 'warning':
        return (
          <span style={{ color: 'var(--clr-warning)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        );
      default:
        return (
          <span style={{ color: 'var(--clr-info)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
        );
    }
  };

  return (
    <div id="toast-container" aria-live="polite">
      <div className={`toast toast--${type}`} role="status">
        <div className="toast__icon" aria-hidden="true">
          {renderIcon()}
        </div>
        <div className="toast__content">
          <p className="toast__message">{toast.message}</p>
        </div>
        <button
          className="toast__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
