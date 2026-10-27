/**
 * TraceIt — Confirm Modal Component
 * ConfirmModal.jsx
 *
 * Prompts user for destructive action confirmation (e.g. Clear All Data, Delete Item).
 */

import React from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  dangerMode = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal modal--sm">
        <div className="modal__header">
          <h2 className="modal__title" id="confirm-modal-title">{title}</h2>
          <button className="modal__close" onClick={onCancel} aria-label="Close dialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal__body">
          <div className="confirm-dialog" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              className="confirm-dialog__icon"
              aria-hidden="true"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: dangerMode ? 'var(--clr-danger-bg)' : 'rgba(var(--clr-primary-rgb), 0.1)',
                color: dangerMode ? 'var(--clr-danger)' : 'var(--clr-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="confirm-dialog__message" style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn ${dangerMode ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
